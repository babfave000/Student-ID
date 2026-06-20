const { createTransporter, emailTemplates } = require('../config/email');
const NotificationLog = require('../models/NotificationLog');
const logger = require('../utils/logger');

class NotificationService {
  static async sendEmail(recipientEmail, templateName, templateParams) {
    try {
      const transporter = createTransporter();
      
      // Get email template
      const template = emailTemplates[templateName];
      if (!template) {
        throw new Error(`Email template '${templateName}' not found`);
      }

      // Generate email content
      const emailContent = template(...templateParams);
      
      // Send email
      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || '"Institution ID Card System" <noreply@example.edu.ng>',
        to: recipientEmail,
        subject: emailContent.subject,
        html: emailContent.html
      });

      logger.info(`Email sent successfully to ${recipientEmail}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      logger.error(`Failed to send email to ${recipientEmail}: ${error.message}`);
      throw error;
    }
  }

  static async notifyRegistrationSubmitted(registrationId, studentEmail, studentName) {
    let logId;
    try {
      // Log notification attempt
      logId = await NotificationLog.create({
        registration_id: registrationId,
        recipient_email: studentEmail,
        notification_type: 'REGISTRATION_SUBMITTED',
        status: 'PENDING',
        message_content: 'Registration submitted notification'
      });

      // Send email
      await this.sendEmail(studentEmail, 'registrationSubmitted', [studentName]);

      // Update log as successful
      await NotificationLog.updateStatus(logId, 'SENT');

      logger.info(`Registration submitted notification sent to ${studentEmail}`);
      return true;
    } catch (error) {
      // Update log as failed if logId exists
      if (logId) {
        try {
          await NotificationLog.updateStatus(logId, 'FAILED', error.message);
        } catch (updateErr) {
          logger.error(`Failed to update notification log status: ${updateErr.message}`);
        }
      }
      logger.error(`Failed to send registration submitted notification: ${error.message}`);
      return false;
    }
  }

  static async notifyApplicationApproved(registrationId, studentEmail, studentName) {
    let logId;
    try {
      logId = await NotificationLog.create({
        registration_id: registrationId,
        recipient_email: studentEmail,
        notification_type: 'APPLICATION_APPROVED',
        status: 'PENDING',
        message_content: 'Application approved notification'
      });

      await this.sendEmail(studentEmail, 'applicationApproved', [studentName]);
      await NotificationLog.updateStatus(logId, 'SENT');

      logger.info(`Application approved notification sent to ${studentEmail}`);
      return true;
    } catch (error) {
      if (logId) {
        try {
          await NotificationLog.updateStatus(logId, 'FAILED', error.message);
        } catch (updateErr) {
          logger.error(`Failed to update notification log status: ${updateErr.message}`);
        }
      }
      logger.error(`Failed to send application approved notification: ${error.message}`);
      return false;
    }
  }

  static async notifyBatchedForProduction(registrationId, studentEmail, studentName, batchName) {
    let logId;
    try {
      logId = await NotificationLog.create({
        registration_id: registrationId,
        recipient_email: studentEmail,
        notification_type: 'BATCHED_FOR_PRODUCTION',
        status: 'PENDING',
        message_content: 'Batched for production notification'
      });

      await this.sendEmail(studentEmail, 'batchedForProduction', [studentName, batchName]);
      await NotificationLog.updateStatus(logId, 'SENT');

      logger.info(`Batched for production notification sent to ${studentEmail}`);
      return true;
    } catch (error) {
      if (logId) {
        try {
          await NotificationLog.updateStatus(logId, 'FAILED', error.message);
        } catch (updateErr) {
          logger.error(`Failed to update notification log status: ${updateErr.message}`);
        }
      }
      logger.error(`Failed to send batched for production notification: ${error.message}`);
      return false;
    }
  }

  static async notifyReadyForCollection(registrationId, studentEmail, studentName, collectionLocation) {
    let logId;
    try {
      logId = await NotificationLog.create({
        registration_id: registrationId,
        recipient_email: studentEmail,
        notification_type: 'READY_FOR_COLLECTION',
        status: 'PENDING',
        message_content: 'Ready for collection notification'
      });

      await this.sendEmail(studentEmail, 'readyForCollection', [studentName, collectionLocation]);
      await NotificationLog.updateStatus(logId, 'SENT');

      logger.info(`Ready for collection notification sent to ${studentEmail}`);
      return true;
    } catch (error) {
      if (logId) {
        try {
          await NotificationLog.updateStatus(logId, 'FAILED', error.message);
        } catch (updateErr) {
          logger.error(`Failed to update notification log status: ${updateErr.message}`);
        }
      }
      logger.error(`Failed to send ready for collection notification: ${error.message}`);
      return false;
    }
  }

  static async notifyApplicationRejected(registrationId, studentEmail, studentName, rejectionReason) {
    let logId;
    try {
      logId = await NotificationLog.create({
        registration_id: registrationId,
        recipient_email: studentEmail,
        notification_type: 'APPLICATION_REJECTED',
        status: 'PENDING',
        message_content: 'Application rejected notification'
      });

      await this.sendEmail(studentEmail, 'applicationRejected', [studentName, rejectionReason]);
      await NotificationLog.updateStatus(logId, 'SENT');

      logger.info(`Application rejected notification sent to ${studentEmail}`);
      return true;
    } catch (error) {
      if (logId) {
        try {
          await NotificationLog.updateStatus(logId, 'FAILED', error.message);
        } catch (updateErr) {
          logger.error(`Failed to update notification log status: ${updateErr.message}`);
        }
      }
      logger.error(`Failed to send application rejected notification: ${error.message}`);
      return false;
    }
  }

  static async retryFailedNotifications(limit = 10) {
    try {
      const failedNotifications = await NotificationLog.getFailed(limit);
      let successCount = 0;

      for (const notification of failedNotifications) {
        // Determine which notification type to resend
        let success = false;
        
        switch (notification.notification_type) {
          case 'REGISTRATION_SUBMITTED':
            // Would need to fetch student details - simplified for now
            break;
          case 'APPLICATION_APPROVED':
            // Would need to fetch student details - simplified for now
            break;
          case 'BATCHED_FOR_PRODUCTION':
            // Would need to fetch student details - simplified for now
            break;
          case 'READY_FOR_COLLECTION':
            // Would need to fetch student details - simplified for now
            break;
          case 'APPLICATION_REJECTED':
            // Would need to fetch student details - simplified for now
            break;
        }

        if (success) {
          successCount++;
        }
      }

      logger.info(`Retried ${failedNotifications.length} failed notifications, ${successCount} successful`);
      return { total: failedNotifications.length, successful: successCount };
    } catch (error) {
      logger.error(`Failed to retry notifications: ${error.message}`);
      throw error;
    }
  }
}

module.exports = NotificationService;