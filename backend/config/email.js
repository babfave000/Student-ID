const nodemailer = require('nodemailer');
require('dotenv').config();

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Institution configuration
const INSTITUTION_NAME = process.env.INSTITUTION_NAME || 'Institution ID Card System';
const INSTITUTION_SHORT_NAME = process.env.INSTITUTION_SHORT_NAME || 'ID System';
const COLLECTION_LOCATION = process.env.INSTITUTION_ADDRESS || 'Registry Office, Main Building';

// Email templates
const emailTemplates = {
  registrationSubmitted: (studentName) => ({
    subject: `ID Card Registration Submitted - ${INSTITUTION_SHORT_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">ID Card Registration Submitted</h2>
        <p>Dear ${studentName},</p>
        <p>Your ID card registration has been successfully submitted. Our team will review your application and you will be notified once it is approved.</p>
        <p>You can track the status of your application by logging into the student portal.</p>
        <p><strong>Next Steps:</strong></p>
        <ol>
          <li>Wait for administrative review (usually 1-3 business days)</li>
          <li>You will receive an email notification when approved</li>
          <li>Your card will be batched for production</li>
          <li>You will be notified when ready for collection</li>
        </ol>
        <p>If you have any questions, please contact the support office.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
        <p style="color: #666; font-size: 12px;">${INSTITUTION_NAME}</p>
      </div>
    `
  }),
  
  applicationApproved: (studentName) => ({
    subject: `ID Card Application Approved - ${INSTITUTION_SHORT_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">ID Card Application Approved</h2>
        <p>Dear ${studentName},</p>
        <p>Congratulations! Your ID card application has been approved.</p>
        <p>Your application will now be batched for production. You will receive another notification when your card is ready for collection.</p>
        <p><strong>Current Status:</strong> Approved - Awaiting Batching</p>
        <p>You can continue to track your progress in the student portal.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
        <p style="color: #666; font-size: 12px;">${INSTITUTION_NAME}</p>
      </div>
    `
  }),
  
  batchedForProduction: (studentName, batchName) => ({
    subject: `ID Card In Production - Batch ${batchName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">ID Card In Production</h2>
        <p>Dear ${studentName},</p>
        <p>Your ID card has been batched and is now in production.</p>
        <p><strong>Batch Details:</strong></p>
        <ul>
          <li>Batch Name: ${batchName}</li>
          <li>Status: In Production</li>
        </ul>
        <p>Production typically takes 5-10 business days. You will receive a final notification when your card is ready for collection.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
        <p style="color: #666; font-size: 12px;">${INSTITUTION_NAME}</p>
      </div>
    `
  }),
  
  readyForCollection: (studentName, collectionLocation) => ({
    subject: `ID Card Ready for Collection - ${INSTITUTION_SHORT_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1a73e8;">ID Card Ready for Collection</h2>
        <p>Dear ${studentName},</p>
        <p>Great news! Your ID card is ready for collection.</p>
        <p><strong>Collection Details:</strong></p>
        <ul>
          <li>Location: ${collectionLocation || COLLECTION_LOCATION}</li>
          <li>Requirements: Bring your matriculation number and a form of identification</li>
          <li>Hours: Monday - Friday, 8:00 AM - 4:00 PM</li>
        </ul>
        <p>Please collect your card within 30 days to avoid cancellation.</p>
        <p>Congratulations on completing your registration!</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
        <p style="color: #666; font-size: 12px;">${INSTITUTION_NAME}</p>
      </div>
    `
  }),
  
  applicationRejected: (studentName, rejectionReason) => ({
    subject: `ID Card Application Update Required - ${INSTITUTION_SHORT_NAME}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">ID Card Application Update Required</h2>
        <p>Dear ${studentName},</p>
        <p>Your ID card application requires updates before it can be processed.</p>
        <p><strong>Reason:</strong> ${rejectionReason || 'Please review and resubmit your application with correct information.'}</p>
        <p>Please log into the student portal to review the feedback and make necessary corrections.</p>
        <p>If you need assistance, please contact the support office.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">This is an automated message. Please do not reply.</p>
        <p style="color: #666; font-size: 12px;">${INSTITUTION_NAME}</p>
      </div>
    `
  })
};

module.exports = {
  createTransporter,
  emailTemplates
};