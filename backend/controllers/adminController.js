const fs = require('fs');
const Registration = require('../models/Registration');
const Batch = require('../models/Batch');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const NotificationLog = require('../models/NotificationLog');
const WorkflowService = require('../services/workflowService');
const BatchService = require('../services/batchService');
const logger = require('../utils/logger');

class AdminController {
  // Get dashboard statistics
  static async getStatistics(req, res) {
    try {
      logger.info('=== Starting statistics collection ===');
      const stats = {};
      
      logger.info('Counting students...');
      stats.totalStudents = await Student.count();
      
      logger.info('Counting total registrations...');
      stats.totalRegistrations = await Registration.count();
      
      logger.info('Counting pending registrations...');
      stats.pendingRegistrations = await Registration.countByStatus('SUBMITTED');
      
      logger.info('Counting approved registrations...');
      stats.approvedRegistrations = await Registration.countByStatus('APPROVED');
      
      logger.info('Counting batched registrations...');
      stats.batchedRegistrations = await Registration.countByStatus('BATCHED');
      
      logger.info('Counting ready for collection...');
      stats.readyForCollection = await Registration.countByStatus('READY_FOR_COLLECTION');
      
      logger.info('Counting collected...');
      stats.collected = await Registration.countByStatus('COLLECTED');
      
      logger.info('Counting batches...');
      stats.totalBatches = await Batch.count();
      
      logger.info('Counting staff...');
      stats.totalStaff = await Staff.count();
      
      logger.info('Getting batch stats via BatchService...');
      const batchStats = await BatchService.getBatchStatistics();
      Object.assign(stats, { batches: batchStats });
      
      logger.info('=== Statistics collection complete ===');

      res.json({
        success: true,
        statistics: stats
      });
    } catch (error) {
      logger.error(`Get statistics error: ${error.message}`, error.stack);
      res.status(500).json({ error: 'Failed to get statistics', details: error.message });
    }
  }

  // Get pending registrations
  static async getPendingRegistrations(req, res) {
    try {
      logger.info('=== Getting pending registrations ===');
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      logger.info(`Params: page=${page}, limit=${limit}, offset=${offset}`);

      logger.info('Calling Registration.getPending()...');
      const registrations = await Registration.getPending(limit, offset);
      logger.info('Got pending registrations, now counting total...');
      const total = await Registration.countByStatus('SUBMITTED');

      logger.info('=== Pending registrations complete ===');
      res.json({
        success: true,
        registrations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error(`Get pending registrations error: ${error.message}`, error.stack);
      res.status(500).json({ error: 'Failed to get pending registrations', details: error.message });
    }
  }

  // Get approved registrations (for batching)
  static async getApprovedRegistrations(req, res) {
    try {
      const { faculty, department, level } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      let registrations;
      let total;

      if (faculty || department || level) {
        // Use filtering service
        registrations = await BatchService.filterRegistrationsForBatching({
          faculty,
          department,
          level,
          status: 'APPROVED'
        });
        total = registrations.length;
        
        // Apply pagination manually
        const paginatedRegistrations = registrations.slice(offset, offset + limit);
        registrations = paginatedRegistrations;
      } else {
        registrations = await Registration.getApproved(limit, offset);
        total = await Registration.countByStatus('APPROVED');
      }

      res.json({
        success: true,
        registrations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error(`Get approved registrations error: ${error.message}`);
      res.status(500).json({ error: 'Failed to get approved registrations' });
    }
  }

  // Get collection registrations
  static async getCollectionRegistrations(req, res) {
    try {
      const requestedStatus = req.query.status === 'collected' ? 'COLLECTED' : 'READY_FOR_COLLECTION';
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;

      const registrations = await Registration.getByStatus(requestedStatus, limit, offset);
      const total = await Registration.countByStatus(requestedStatus);

      res.json({
        success: true,
        registrations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error(`Get collection registrations error: ${error.message}`);
      res.status(500).json({ error: 'Failed to get collection registrations' });
    }
  }

  // Approve registration
  static async approveRegistration(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await WorkflowService.approveRegistration(id, userId, 'staff');

      res.json({
        success: true,
        message: 'Registration approved successfully',
        result
      });
    } catch (error) {
      logger.error(`Approve registration error: ${error.message}`);
      res.status(500).json({ error: 'Failed to approve registration' });
    }
  }

  // Reject registration
  static async rejectRegistration(req, res) {
    try {
      const { id } = req.params;
      const { rejection_reason } = req.body;
      const userId = req.user.id;

      const result = await WorkflowService.rejectRegistration(
        id,
        rejection_reason || 'Application does not meet requirements',
        userId,
        'staff'
      );

      res.json({
        success: true,
        message: 'Registration rejected successfully',
        result
      });
    } catch (error) {
      logger.error(`Reject registration error: ${error.message}`);
      res.status(500).json({ error: 'Failed to reject registration' });
    }
  }

  // Get all batches
  static async getBatches(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;
      const offset = (page - 1) * limit;

      const batches = await Batch.getAll(limit, offset);
      const total = await Batch.count();

      res.json({
        success: true,
        batches,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error(`Get batches error: ${error.message}`);
      res.status(500).json({ error: 'Failed to get batches' });
    }
  }

  // Get batch details
  static async getBatchDetails(req, res) {
    try {
      const { id } = req.params;
      const batch = await Batch.findById(id);

      if (!batch) {
        return res.status(404).json({ error: 'Batch not found' });
      }

      const registrations = await Batch.getRegistrations(id);

      res.json({
        success: true,
        batch: {
          ...batch,
          registrations
        }
      });
    } catch (error) {
      logger.error(`Get batch details error: ${error.message}`);
      res.status(500).json({ error: 'Failed to get batch details' });
    }
  }

  // Create batch
  static async createBatch(req, res) {
    try {
      const { batch_name, description, registration_ids } = req.body;
      const userId = req.user.id;

      if (!registration_ids || registration_ids.length === 0) {
        return res.status(400).json({ error: 'At least one registration ID is required' });
      }

      const result = await BatchService.createBatchWithRegistrations(
        { batch_name, description },
        registration_ids,
        userId
      );

      res.status(201).json({
        success: true,
        message: 'Batch created successfully',
        result
      });
    } catch (error) {
      logger.error(`Create batch error: ${error.message}`);
      res.status(500).json({ error: 'Failed to create batch' });
    }
  }

  // Add registrations to an existing batch
  static async addRegistrationsToBatch(req, res) {
    try {
      const { id } = req.params;
      const { registration_ids } = req.body;
      const userId = req.user.id;

      if (!registration_ids || registration_ids.length === 0) {
        return res.status(400).json({ error: 'At least one registration ID is required' });
      }

      const result = await BatchService.addRegistrationsToBatch(id, registration_ids, userId);

      res.json({
        success: true,
        message: 'Registrations added to batch successfully',
        result
      });
    } catch (error) {
      logger.error(`Add registrations to batch error: ${error.message}`);
      res.status(500).json({ error: error.message || 'Failed to add registrations to batch' });
    }
  }

  // Update batch status
  static async updateBatchStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const userId = req.user.id;

      const result = await BatchService.updateBatchStatus(id, status, userId);

      res.json({
        success: true,
        message: 'Batch status updated successfully',
        result
      });
    } catch (error) {
      logger.error(`Update batch status error: ${error.message}`);
      res.status(500).json({ error: 'Failed to update batch status' });
    }
  }

  // Generate batch report
  static async generateBatchReport(req, res) {
    try {
      const { id } = req.params;
      const report = await BatchService.generateBatchReport(id);

      res.json({
        success: true,
        report
      });
    } catch (error) {
      logger.error(`Generate batch report error: ${error.message}`);
      res.status(500).json({ error: 'Failed to generate batch report' });
    }
  }

  // Download batch package with names report and photos
  static async downloadBatchPackage(req, res) {
    try {
      const { id } = req.params;
      const packageResult = await BatchService.createBatchPhotoPackage(id);

      res.download(packageResult.zipPath, packageResult.downloadName, async (error) => {
        try {
          await fs.promises.rm(packageResult.tempRoot, { recursive: true, force: true });
        } catch (cleanupError) {
          logger.error(`Batch package cleanup error: ${cleanupError.message}`);
        }

        if (error && !res.headersSent) {
          res.status(500).json({ error: 'Failed to download batch package' });
        }
      });
    } catch (error) {
      logger.error(`Download batch package error: ${error.message}`);
      res.status(500).json({ error: error.message || 'Failed to download batch package' });
    }
  }

  // Get audit log
  static async getAuditLog(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const offset = (page - 1) * limit;

      const logs = await AuditLog.getAll(limit, offset);
      const total = await AuditLog.count();

      res.json({
        success: true,
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error(`Get audit log error: ${error.message}`);
      res.status(500).json({ error: 'Failed to get audit log' });
    }
  }

  // Get notification logs
  static async getNotificationLogs(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;
      const offset = (page - 1) * limit;
      const status = req.query.status;

      let logs;
      let total;

      if (status) {
        logs = await NotificationLog.getByStatus(status, limit, offset);
        total = logs.length; // Simplified
      } else {
        logs = await NotificationLog.getAll(limit, offset);
        total = await NotificationLog.count();
      }

      res.json({
        success: true,
        logs,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error(`Get notification logs error: ${error.message}`);
      res.status(500).json({ error: 'Failed to get notification logs' });
    }
  }

  // Mark registration as collected
  static async markAsCollected(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await WorkflowService.markAsCollected(id, userId, 'staff');

      res.json({
        success: true,
        message: 'Registration marked as collected'
      });
    } catch (error) {
      logger.error(`Mark as collected error: ${error.message}`);
      res.status(500).json({ error: 'Failed to mark as collected' });
    }
  }

  // Get all students (for management)
  static async getAllStudents(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 100;
      const offset = (page - 1) * limit;

      const students = await Student.getAll(limit, offset);
      const total = await Student.count();

      res.json({
        success: true,
        students,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      });
    } catch (error) {
      logger.error(`Get all students error: ${error.message}`);
      res.status(500).json({ error: 'Failed to get students' });
    }
  }
}

module.exports = AdminController;
