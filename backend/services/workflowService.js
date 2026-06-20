const Registration = require('../models/Registration');
const AuditLog = require('../models/AuditLog');
const NotificationService = require('./notificationService');
const logger = require('../utils/logger');

class WorkflowService {
  static validTransitions = {
    DRAFT: ['SUBMITTED', 'REJECTED'],
    SUBMITTED: ['UNDER_REVIEW', 'REJECTED', 'APPROVED'],
    UNDER_REVIEW: ['APPROVED', 'REJECTED', 'HOLD'],
    APPROVED: ['BATCHED'],
    BATCHED: ['PRINTED'],
    PRINTED: ['READY_FOR_COLLECTION'],
    READY_FOR_COLLECTION: ['COLLECTED'],
    REJECTED: ['SUBMITTED'],
    HOLD: ['UNDER_REVIEW', 'REJECTED'],
    COLLECTED: [] // Terminal state
  };

  static async transitionStatus(registrationId, newStatus, userId, userType, metadata = {}) {
    try {
      // Get current registration
      const registration = await Registration.findById(registrationId);
      if (!registration) {
        throw new Error('Registration not found');
      }

      const currentStatus = registration.status;

      // Validate transition
      if (!this.validTransitions[currentStatus].includes(newStatus)) {
        throw new Error(`Invalid transition from ${currentStatus} to ${newStatus}`);
      }

      // Update status
      await Registration.updateStatus(registrationId, newStatus);

      // Log the change
      await AuditLog.create({
        action: 'STATUS_CHANGE',
        entity_type: 'registration',
        entity_id: registrationId,
        user_id: userId,
        user_type: userType,
        old_value: { status: currentStatus },
        new_value: { status: newStatus, ...metadata }
      });

      logger.info(`Registration ${registrationId} status changed from ${currentStatus} to ${newStatus}`);

      // Trigger notifications based on status - don't fail the whole operation if notifications fail
      try {
        await this.handleNotificationTrigger(registration, newStatus);
      } catch (notificationError) {
        logger.error(`Notification failed for registration ${registrationId}: ${notificationError.message}`, notificationError.stack);
        // Don't throw, just log
      }

      return { success: true, oldStatus: currentStatus, newStatus };
    } catch (error) {
      logger.error(`Failed to transition status: ${error.message}`);
      throw error;
    }
  }

  static async handleNotificationTrigger(registration, newStatus) {
    try {
      const studentEmail = registration.email;
      const studentName = `${registration.first_name} ${registration.last_name}`;

      switch (newStatus) {
        case 'SUBMITTED':
          await NotificationService.notifyRegistrationSubmitted(
            registration.id,
            studentEmail,
            studentName
          );
          break;

        case 'APPROVED':
          await NotificationService.notifyApplicationApproved(
            registration.id,
            studentEmail,
            studentName
          );
          break;

        case 'BATCHED':
          // Would need to get batch name - simplified for now
          await NotificationService.notifyBatchedForProduction(
            registration.id,
            studentEmail,
            studentName,
            'Production Batch'
          );
          break;

        case 'READY_FOR_COLLECTION':
          await NotificationService.notifyReadyForCollection(
            registration.id,
            studentEmail,
            studentName,
            'Registry Office, Main Building'
          );
          break;

        case 'REJECTED':
          await NotificationService.notifyApplicationRejected(
            registration.id,
            studentEmail,
            studentName,
            'Please review and resubmit your application with correct information.'
          );
          break;

        default:
          // No notification for other statuses
          break;
      }
    } catch (error) {
      logger.error(`Failed to handle notification trigger: ${error.message}`);
      // Don't throw - notifications shouldn't block workflow
    }
  }

  static async submitRegistration(registrationId, userId, userType = 'student') {
    return this.transitionStatus(registrationId, 'SUBMITTED', userId, userType);
  }

  static async approveRegistration(registrationId, userId, userType = 'staff') {
    return this.transitionStatus(registrationId, 'APPROVED', userId, userType);
  }

  static async rejectRegistration(registrationId, rejectionReason, userId, userType = 'staff') {
    // First move to UNDER_REVIEW if not already
    const registration = await Registration.findById(registrationId);
    if (registration.status === 'SUBMITTED') {
      await this.transitionStatus(registrationId, 'UNDER_REVIEW', userId, userType);
    }
    
    const result = await this.transitionStatus(
      registrationId, 
      'REJECTED', 
      userId, 
      userType,
      { rejection_reason: rejectionReason }
    );

    // Send rejection notification with reason
    const studentEmail = registration.email;
    const studentName = `${registration.first_name} ${registration.last_name}`;
    await NotificationService.notifyApplicationRejected(
      registration.id,
      studentEmail,
      studentName,
      rejectionReason
    );

    return result;
  }

  static async batchRegistration(registrationId, batchId, userId, userType = 'staff') {
    const result = await this.transitionStatus(registrationId, 'BATCHED', userId, userType, { batch_id: batchId });
    return result;
  }

  static async markAsPrinted(registrationId, userId, userType = 'staff') {
    return this.transitionStatus(registrationId, 'PRINTED', userId, userType);
  }

  static async markAsReadyForCollection(registrationId, userId, userType = 'staff') {
    return this.transitionStatus(registrationId, 'READY_FOR_COLLECTION', userId, userType);
  }

  static async markAsCollected(registrationId, userId, userType = 'staff') {
    return this.transitionStatus(registrationId, 'COLLECTED', userId, userType);
  }

  static getStatusFlow(currentStatus) {
    return {
      current: currentStatus,
      nextPossible: this.validTransitions[currentStatus] || [],
      previousPossible: Object.keys(this.validTransitions).filter(
        key => this.validTransitions[key].includes(currentStatus)
      )
    };
  }

  static canTransition(currentStatus, newStatus) {
    return this.validTransitions[currentStatus]?.includes(newStatus) || false;
  }
}

module.exports = WorkflowService;