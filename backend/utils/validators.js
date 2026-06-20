const { body, param } = require('express-validator');

const studentRegistrationValidation = [
  body('first_name')
    .notEmpty().withMessage('First name is required')
    .isLength({ min: 2, max: 50 }).withMessage('First name must be between 2 and 50 characters'),
  body('last_name')
    .notEmpty().withMessage('Last name is required')
    .isLength({ min: 2, max: 50 }).withMessage('Last name must be between 2 and 50 characters'),
  body('email')
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email format'),
  body('phone')
    .notEmpty().withMessage('Phone number is required')
    .matches(/^\+?\d{10,15}$/).withMessage('Invalid phone number format'),
  body('faculty')
    .notEmpty().withMessage('Faculty is required')
    .isLength({ min: 2, max: 100 }).withMessage('Faculty must be between 2 and 100 characters'),
  body('department')
    .notEmpty().withMessage('Department is required')
    .isLength({ min: 2, max: 100 }).withMessage('Department must be between 2 and 100 characters'),
  body('level')
    .notEmpty().withMessage('Level is required')
    .isIn(['100', '200', '300', '400', '500', '600']).withMessage('Invalid level')
];

const staffLoginValidation = [
  body('username')
    .notEmpty().withMessage('Username is required')
    .isLength({ min: 3, max: 50 }).withMessage('Username must be between 3 and 50 characters'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const studentLoginValidation = [
  body('matric_no')
    .notEmpty().withMessage('Matriculation number is required')
    .matches(/^[A-Z]{3}\/\d{2}\/\d{3}$/).withMessage('Invalid matriculation number format'),
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
];

const batchCreationValidation = [
  body('batch_name')
    .notEmpty().withMessage('Batch name is required')
    .isLength({ min: 3, max: 100 }).withMessage('Batch name must be between 3 and 100 characters'),
  body('description')
    .optional()
    .isLength({ max: 500 }).withMessage('Description must not exceed 500 characters'),
  body('registration_ids')
    .isArray().withMessage('Registration IDs must be an array')
    .notEmpty().withMessage('At least one registration ID is required')
];

const registrationApprovalValidation = [
  body('action')
    .notEmpty().withMessage('Action is required')
    .isIn(['approve', 'reject']).withMessage('Action must be either approve or reject'),
  body('rejection_reason')
    .optional()
    .isLength({ max: 500 }).withMessage('Rejection reason must not exceed 500 characters')
];

const idValidation = [
  param('id')
    .isInt().withMessage('ID must be an integer')
];

module.exports = {
  studentRegistrationValidation,
  staffLoginValidation,
  studentLoginValidation,
  batchCreationValidation,
  registrationApprovalValidation,
  idValidation
};