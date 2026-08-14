const fs = require('fs');
const fsp = fs.promises;
const os = require('os');
const path = require('path');
const { ZipArchive } = require('archiver');
const Batch = require('../models/Batch');
const Registration = require('../models/Registration');
const WorkflowService = require('./workflowService');
const AuditLog = require('../models/AuditLog');
const { resolveUploadPathFromPublicPath } = require('../config/storage');
const logger = require('../utils/logger');

class BatchService {
  static async createBatch(batchData, userId) {
    try {
      const batchId = await Batch.create({
        ...batchData,
        created_by: userId
      });

      // Log batch creation
      await AuditLog.create({
        action: 'BATCH_CREATED',
        entity_type: 'batch',
        entity_id: batchId,
        user_id: userId,
        user_type: 'staff',
        new_value: batchData
      });

      logger.info(`Batch ${batchId} created by user ${userId}`);
      return batchId;
    } catch (error) {
      logger.error(`Failed to create batch: ${error.message}`);
      throw error;
    }
  }

  static async addRegistrationsToBatch(batchId, registrationIds, userId) {
    try {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        throw new Error('Batch not found');
      }

      if (batch.status !== 'SENT') {
        throw new Error('Can only add registrations to batches with SENT status');
      }

      let addedCount = 0;
      const errors = [];

      for (const registrationId of registrationIds) {
        try {
          const registration = await Registration.findById(registrationId);
          
          if (!registration) {
            errors.push({ registrationId, error: 'Registration not found' });
            continue;
          }

          if (registration.status !== 'APPROVED') {
            errors.push({ registrationId, error: `Registration status is ${registration.status}, must be APPROVED` });
            continue;
          }

          // Add to batch
          await Batch.addRegistration(batchId, registrationId);
          
          // Update registration status
          await WorkflowService.batchRegistration(registrationId, batchId, userId);

          addedCount++;
        } catch (error) {
          errors.push({ registrationId, error: error.message });
        }
      }

      // Log batch update
      await AuditLog.create({
        action: 'BATCH_UPDATED',
        entity_type: 'batch',
        entity_id: batchId,
        user_id: userId,
        user_type: 'staff',
        new_value: {
          added_registrations: addedCount,
          total_requested: registrationIds.length,
          errors: errors
        }
      });

      logger.info(`Added ${addedCount} registrations to batch ${batchId} by user ${userId}`);
      
      return {
        batchId,
        addedCount,
        totalRequested: registrationIds.length,
        errors
      };
    } catch (error) {
      logger.error(`Failed to add registrations to batch: ${error.message}`);
      throw error;
    }
  }

  static async createBatchWithRegistrations(batchData, registrationIds, userId) {
    try {
      // Create batch
      const batchId = await this.createBatch(batchData, userId);
      
      // Add registrations
      const result = await this.addRegistrationsToBatch(batchId, registrationIds, userId);
      
      return {
        batchId,
        ...result
      };
    } catch (error) {
      logger.error(`Failed to create batch with registrations: ${error.message}`);
      throw error;
    }
  }

  static async getBatchStatistics() {
    try {
      logger.info('=== BatchService.getBatchStatistics() starting ===');
      logger.info('Calling Batch.getAll()...');
      const allBatches = await Batch.getAll();
      logger.info(`Batch.getAll() returned ${allBatches.length} batches`);
      
      const stats = {
        total: allBatches.length,
        sent: allBatches.filter(b => b.status === 'SENT').length,
        printed: allBatches.filter(b => b.status === 'PRINTED').length,
        received: allBatches.filter(b => b.status === 'RECEIVED').length,
        totalRegistrations: allBatches.reduce((sum, batch) => sum + (batch.registration_count || 0), 0)
      };
      logger.info('Batch statistics calculated: ', stats);
      
      logger.info('=== BatchService.getBatchStatistics() complete ===');
      return stats;
    } catch (error) {
      logger.error(`Failed to get batch statistics: ${error.message}`, error.stack);
      throw error;
    }
  }

  static async updateBatchStatus(batchId, newStatus, userId) {
    try {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        throw new Error('Batch not found');
      }

      const validStatuses = ['SENT', 'PRINTED', 'RECEIVED'];
      if (!validStatuses.includes(newStatus)) {
        throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
      }

      const oldStatus = batch.status;
      await Batch.updateStatus(batchId, newStatus);

      // If batch is marked as printed, update all registrations
      if (newStatus === 'PRINTED') {
        const registrations = await Batch.getRegistrations(batchId);
        for (const registration of registrations) {
          await WorkflowService.markAsPrinted(registration.id, userId);
        }
      }

      // If batch is marked as received, update all registrations as ready for collection
      if (newStatus === 'RECEIVED') {
        const registrations = await Batch.getRegistrations(batchId);
        for (const registration of registrations) {
          await WorkflowService.markAsReadyForCollection(registration.id, userId);
        }
      }

      // Log status change
      await AuditLog.create({
        action: 'BATCH_STATUS_CHANGE',
        entity_type: 'batch',
        entity_id: batchId,
        user_id: userId,
        user_type: 'staff',
        old_value: { status: oldStatus },
        new_value: { status: newStatus }
      });

      logger.info(`Batch ${batchId} status changed from ${oldStatus} to ${newStatus} by user ${userId}`);
      
      return { success: true, oldStatus, newStatus };
    } catch (error) {
      logger.error(`Failed to update batch status: ${error.message}`);
      throw error;
    }
  }

  static async filterRegistrationsForBatching(filters = {}) {
    try {
      const { faculty, department, level, status = 'APPROVED' } = filters;

      let query = `
        SELECT r.*, s.matric_no, s.first_name, s.last_name, s.email, s.phone, 
               s.faculty, s.department, s.level
        FROM id_registrations r
        JOIN students s ON r.student_id = s.id
        WHERE r.status = ?
      `;
      
      const params = [status];

      if (faculty) {
        query += ' AND s.faculty = ?';
        params.push(faculty);
      }

      if (department) {
        query += ' AND s.department = ?';
        params.push(department);
      }

      if (level) {
        query += ' AND s.level = ?';
        params.push(level);
      }

      query += ' ORDER BY s.faculty, s.department, s.last_name';

      const pool = require('../config/database');
      const [rows] = await pool.execute(query, params);

      return rows;
    } catch (error) {
      logger.error(`Failed to filter registrations for batching: ${error.message}`);
      throw error;
    }
  }

  static async generateBatchReport(batchId) {
    try {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        throw new Error('Batch not found');
      }

      const registrations = await Batch.getRegistrations(batchId);

      return {
        batch: {
          id: batch.id,
          name: batch.batch_name,
          description: batch.description,
          created_at: batch.created_at,
          status: batch.status,
          total_count: registrations.length,
          created_by: batch.created_by_name
        },
        registrations: registrations.map(reg => ({
          matric_no: reg.matric_no,
          name: `${reg.last_name}, ${reg.first_name}`,
          faculty: reg.faculty,
          department: reg.department,
          level: reg.level,
          email: reg.email,
          phone: reg.phone,
          photo_path: reg.photo_path
        })),
        summary: {
          by_faculty: this.groupByField(registrations, 'faculty'),
          by_department: this.groupByField(registrations, 'department'),
          by_level: this.groupByField(registrations, 'level')
        }
      };
    } catch (error) {
      logger.error(`Failed to generate batch report: ${error.message}`);
      throw error;
    }
  }

  static async createBatchPhotoPackage(batchId) {
    try {
      const batch = await Batch.findById(batchId);
      if (!batch) {
        throw new Error('Batch not found');
      }

      const registrations = await Batch.getRegistrations(batchId);
      const report = await this.generateBatchReport(batchId);
      const sanitizedBatchName = this.sanitizeFileName(batch.batch_name || `batch-${batchId}`);
      const tempRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'batch-package-'));
      const batchFolderPath = path.join(tempRoot, sanitizedBatchName);
      const zipPath = path.join(tempRoot, `${sanitizedBatchName}.zip`);

      await fsp.mkdir(batchFolderPath, { recursive: true });
      await fsp.writeFile(
        path.join(batchFolderPath, `${sanitizedBatchName}-report.json`),
        JSON.stringify(report, null, 2),
        'utf8'
      );

      let copiedPhotos = 0;

      for (const registration of registrations) {
        if (!registration.photo_path) {
          continue;
        }

        const sourcePath = resolveUploadPathFromPublicPath(registration.photo_path);

        if (!sourcePath || !fs.existsSync(sourcePath)) {
          logger.error(`Photo file not found for registration ${registration.id}: ${sourcePath}`);
          continue;
        }

        const extension = path.extname(sourcePath) || '.jpg';
        const targetFileName = `${this.sanitizeFileName(registration.matric_no || `registration-${registration.id}`)}${extension.toLowerCase()}`;
        const targetPath = path.join(batchFolderPath, targetFileName);

        await fsp.copyFile(sourcePath, targetPath);
        copiedPhotos++;
      }

      if (copiedPhotos === 0) {
        throw new Error('No student photos were found for this batch');
      }

      await this.createZipArchive(batchFolderPath, zipPath);

      return {
        zipPath,
        tempRoot,
        downloadName: `${sanitizedBatchName}.zip`
      };
    } catch (error) {
      logger.error(`Failed to create batch photo package: ${error.message}`);
      throw error;
    }
  }

  static sanitizeFileName(value) {
    return String(value || 'file')
      .replace(/[<>:"/\\|?*]+/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/\.+$/, '') || 'file';
  }

  static async createZipArchive(sourceFolderPath, zipPath) {
    await new Promise((resolve, reject) => {
      const output = fs.createWriteStream(zipPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });

      output.on('close', resolve);
      output.on('error', reject);
      archive.on('error', reject);

      archive.pipe(output);
      archive.directory(sourceFolderPath, false);
      archive.finalize();
    });
  }

  static groupByField(items, field) {
    return items.reduce((acc, item) => {
      const key = item[field];
      if (!acc[key]) {
        acc[key] = 0;
      }
      acc[key]++;
      return acc;
    }, {});
  }
}

module.exports = BatchService;
