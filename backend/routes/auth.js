const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticate } = require('../middleware/authMiddleware');
const { staffLoginValidation, studentLoginValidation } = require('../utils/validators');
const { validateRequest } = require('../middleware/validationMiddleware');

// Staff login
router.post('/staff/login', staffLoginValidation, validateRequest, AuthController.staffLogin);

// Student login
router.post('/student/login', studentLoginValidation, validateRequest, AuthController.studentLogin);

// Get current user (protected)
router.get('/me', authenticate, AuthController.getCurrentUser);

// Logout (protected)
router.post('/logout', authenticate, AuthController.logout);

// Change password (staff only, protected)
router.post('/change-password', authenticate, AuthController.changePassword);

module.exports = router;