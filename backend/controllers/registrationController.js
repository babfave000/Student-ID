const Registration = require('../models/Registration');
const Student = require('../models/Student');
const WorkflowService = require('../services/workflowService');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class RegistrationController {
  // Get student's registration status
  static async getMyRegistration(req, res) {
    try {
      const studentId = req.user.id;
      const registrations = await Registration.findByStudentId(studentId);

      if (registrations.length === 0) {
        return res.json({
          success: true,
          hasRegistration: false,
          message: 'No registration found'
        });
      }

      const latestRegistration = registrations[0];

      res.json({
        success: true,
        hasRegistration: true,
        registration: latestRegistration
      });
    } catch (error) {
      logger.error(`Get my registration error: ${error.message}`);
      res.status(500).json({ error: 'Failed to get registration' });
    }
  }

  // Create or update registration
  static async upsertRegistration(req, res) {
    try {
      const studentId = req.user.id;
      logger.info(`Upserting registration for student ${studentId}`);
      logger.info(`Request body keys: ${Object.keys(req.body)}`);
      if (req.file) {
        logger.info(`File uploaded: ${req.file.filename}`);
      }
      
      const { first_name, last_name, email, phone, faculty, department, level } = req.body;
      
      logger.info('Received data:', { first_name, last_name, email, phone, faculty, department, level });

      // Check if student already has an existing registration
      const existingRegistrations = await Registration.findByStudentId(studentId);
      const activeRegistration = existingRegistrations.find(
        reg => reg.status === 'DRAFT' || reg.status === 'REJECTED'
      );
      const hasTerminalRegistration = existingRegistrations.some(
        reg => ['COLLECTED'].includes(reg.status)
      );

      if (hasTerminalRegistration && !activeRegistration) {
        logger.info(`Student ${studentId} has terminal registration`);
        return res.status(400).json({
          error: 'You already have a completed registration',
        });
      }

      // Update or create student record
      const studentData = { first_name, last_name, email, phone, faculty, department, level };
      logger.info('Updating student data:', studentData);
      await Student.update(studentId, studentData);

      let registrationId;
      let auditValue;
      if (activeRegistration) {
        // Update existing DRAFT/REJECTED registration
        const updateData = {
          photo_path: req.file ? `/uploads/${req.file.filename}` : activeRegistration.photo_path,
          status: 'DRAFT' // Reset to DRAFT if it was REJECTED
        };
        logger.info('Updating existing registration:', updateData);
        await Registration.update(activeRegistration.id, updateData);
        registrationId = activeRegistration.id;
        auditValue = updateData;
      } else {
        // Create new registration
        const registrationData = {
          student_id: studentId,
          status: 'DRAFT',
          photo_path: req.file ? `/uploads/${req.file.filename}` : null
        };
        logger.info('Creating registration with:', registrationData);
        registrationId = await Registration.create(registrationData);
        auditValue = registrationData;
      }

      // Log registration creation
      await AuditLog.create({
        action: 'REGISTRATION_CREATED',
        entity_type: 'registration',
        entity_id: registrationId,
        user_id: studentId,
        user_type: 'student',
        new_value: auditValue
      });

      logger.info(`Registration ${registrationId} created for student ${studentId}`);

      res.status(201).json({
        success: true,
        message: 'Registration created successfully',
        registrationId
      });
    } catch (error) {
      logger.error(`Create registration error: ${error.message}`, error.stack);
      res.status(500).json({ error: `Failed to create registration: ${error.message}` });
    }
  }

  // Submit registration
  static async submitRegistration(req, res) {
    try {
      const studentId = req.user.id;
      const registrations = await Registration.findByStudentId(studentId);

      if (registrations.length === 0) {
        return res.status(404).json({ error: 'No registration found' });
      }

      const latestRegistration = registrations[0];

      if (latestRegistration.status !== 'DRAFT') {
        return res.status(400).json({
          error: 'Registration is not in DRAFT status',
          currentStatus: latestRegistration.status
        });
      }

      await WorkflowService.submitRegistration(latestRegistration.id, studentId, 'student');

      res.json({
        success: true,
        message: 'Registration submitted successfully',
        registrationId: latestRegistration.id
      });
    } catch (error) {
      logger.error(`Submit registration error: ${error.message}`);
      res.status(500).json({ error: 'Failed to submit registration' });
    }
  }

  // Upload photo
  static async uploadPhoto(req, res) {
    try {
      const studentId = req.user.id;
      const registrations = await Registration.findByStudentId(studentId);

      if (registrations.length === 0) {
        return res.status(404).json({ error: 'No registration found' });
      }

      const latestRegistration = registrations[0];

      if (!req.file) {
        return res.status(400).json({ error: 'No photo uploaded' });
      }

      const photoPath = `/uploads/${req.file.filename}`;

      await Registration.update(latestRegistration.id, { photo_path: photoPath });

      // Log photo upload
      await AuditLog.create({
        action: 'PHOTO_UPLOADED',
        entity_type: 'registration',
        entity_id: latestRegistration.id,
        user_id: studentId,
        user_type: 'student',
        new_value: { photo_path: photoPath }
      });

      logger.info(`Photo uploaded for registration ${latestRegistration.id}`);

      res.json({
        success: true,
        message: 'Photo uploaded successfully',
        photoPath
      });
    } catch (error) {
      logger.error(`Upload photo error: ${error.message}`);
      res.status(500).json({ error: 'Failed to upload photo' });
    }
  }

  // Update registration details
  static async updateRegistration(req, res) {
    try {
      const studentId = req.user.id;
      const { first_name, last_name, email, phone, faculty, department, level } = req.body;

      const registrations = await Registration.findByStudentId(studentId);
      if (registrations.length === 0) {
        return res.status(404).json({ error: 'No registration found' });
      }

      const latestRegistration = registrations[0];

      if (!['DRAFT', 'REJECTED'].includes(latestRegistration.status)) {
        return res.status(400).json({
          error: 'Cannot update registration in current status',
          currentStatus: latestRegistration.status
        });
      }

      // Update student record
      const studentData = { first_name, last_name, email, phone, faculty, department, level };
      await Student.update(studentId, studentData);

      // Log update
      await AuditLog.create({
        action: 'REGISTRATION_UPDATED',
        entity_type: 'registration',
        entity_id: latestRegistration.id,
        user_id: studentId,
        user_type: 'student',
        old_value: latestRegistration,
        new_value: studentData
      });

      logger.info(`Registration updated for student ${studentId}`);

      res.json({
        success: true,
        message: 'Registration updated successfully'
      });
    } catch (error) {
      logger.error(`Update registration error: ${error.message}`);
      res.status(500).json({ error: 'Failed to update registration' });
    }
  }
}

module.exports = RegistrationController;
