const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const RegistrationController = require('../controllers/registrationController');
const { authenticate, authenticateStudent } = require('../middleware/authMiddleware');
const { studentRegistrationValidation } = require('../utils/validators');
const { validateRequest } = require('../middleware/validationMiddleware');
const { ensureUploadsDir, uploadsDir } = require('../config/storage');

ensureUploadsDir();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'photo-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only JPEG, JPG, and PNG images are allowed'));
    }
  }
});

// All registration routes require student authentication
router.use(authenticateStudent);

// Get student's registration
router.get('/my-registration', RegistrationController.getMyRegistration);

// Create or update registration
router.post('/', upload.single('photo'), studentRegistrationValidation, validateRequest, RegistrationController.upsertRegistration);

// Update registration details
router.put('/', RegistrationController.updateRegistration);

// Submit registration
router.post('/submit', RegistrationController.submitRegistration);

// Upload photo
router.post('/photo', upload.single('photo'), RegistrationController.uploadPhoto);

module.exports = router;
