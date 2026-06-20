const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AdminController = require('../controllers/adminController');
const { authenticate, authenticateStaff } = require('../middleware/authMiddleware');
const { idValidation, batchCreationValidation } = require('../utils/validators');
const { validateRequest } = require('../middleware/validationMiddleware');

// All admin routes require staff authentication
router.use(authenticateStaff);

// Dashboard statistics
router.get('/statistics', AdminController.getStatistics);

// Registration management
router.get('/registrations/pending', AdminController.getPendingRegistrations);
router.get('/registrations/approved', AdminController.getApprovedRegistrations);
router.get('/registrations/collection', AdminController.getCollectionRegistrations);
router.put('/registrations/:id/approve', idValidation, validateRequest, AdminController.approveRegistration);
router.put('/registrations/:id/reject', idValidation, [
  body('rejection_reason').optional().isLength({ max: 500 }).withMessage('Rejection reason must not exceed 500 characters')
], validateRequest, AdminController.rejectRegistration);
router.put('/registrations/:id/collect', idValidation, validateRequest, AdminController.markAsCollected);

// Batch management
router.get('/batches', AdminController.getBatches);
router.get('/batches/:id', idValidation, validateRequest, AdminController.getBatchDetails);
router.get('/batches/:id/package', idValidation, validateRequest, AdminController.downloadBatchPackage);
router.post('/batches/:id/registrations', idValidation, validateRequest, AdminController.addRegistrationsToBatch);
router.post('/batches', batchCreationValidation, validateRequest, AdminController.createBatch);
router.put('/batches/:id/status', idValidation, validateRequest, AdminController.updateBatchStatus);
router.get('/batches/:id/report', idValidation, validateRequest, AdminController.generateBatchReport);

// Student management
router.get('/students', AdminController.getAllStudents);

// Logs
router.get('/audit-log', AdminController.getAuditLog);
router.get('/notification-logs', AdminController.getNotificationLogs);

module.exports = router;
