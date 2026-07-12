const pool = require('../config/database');

class NotificationService {
  static async createNotification(recipientId, type, title, message, entityType = null, entityId = null) {
    try {
      await pool.execute(
        'CALL sp_create_notification(?, ?, ?, ?, ?, ?)',
        [recipientId, type, title, message, entityType, entityId]
      );
      return true;
    } catch (error) {
      console.error('Notification creation failed:', error);
      return false;
    }
  }

  static async notifyAssetAssigned(employeeId, assetName, assetTag) {
    return this.createNotification(
      employeeId,
      'Asset_Assigned',
      'New Asset Assigned',
      `You have been assigned asset "${assetName}" (${assetTag}).`,
      'Asset',
      null
    );
  }

  static async notifyTransferRequested(toEmployeeId, assetName, fromName) {
    return this.createNotification(
      toEmployeeId,
      'Transfer_Requested',
      'Asset Transfer Requested',
      `${fromName} has requested a transfer for asset "${assetName}".`,
      'Transfer',
      null
    );
  }

  static async notifyTransferApproved(employeeId, assetName) {
    return this.createNotification(
      employeeId,
      'Transfer_Approved',
      'Transfer Approved',
      `Your transfer request for "${assetName}" has been approved.`,
      'Transfer',
      null
    );
  }

  static async notifyMaintenanceApproved(requestedBy, assetName) {
    return this.createNotification(
      requestedBy,
      'Maintenance_Approved',
      'Maintenance Request Approved',
      `Your maintenance request for "${assetName}" has been approved.`,
      'Maintenance',
      null
    );
  }

  static async notifyMaintenanceResolved(requestedBy, assetName) {
    return this.createNotification(
      requestedBy,
      'Maintenance_Resolved',
      'Maintenance Resolved',
      `Maintenance for "${assetName}" has been completed.`,
      'Maintenance',
      null
    );
  }

  static async notifyBookingConfirmed(employeeId, assetName, startTime) {
    return this.createNotification(
      employeeId,
      'Booking_Confirmed',
      'Booking Confirmed',
      `Your booking for "${assetName}" on ${startTime} has been confirmed.`,
      'Booking',
      null
    );
  }

  static async notifyAuditAssigned(auditorId, auditName) {
    return this.createNotification(
      auditorId,
      'Audit_Assigned',
      'Audit Assignment',
      `You have been assigned to audit cycle: "${auditName}".`,
      'Audit',
      null
    );
  }

  static async notifyOverdueReturn(employeeId, assetName, assetTag, expectedDate) {
    return this.createNotification(
      employeeId,
      'Overdue_Return',
      'Overdue Asset Return',
      `Asset "${assetName}" (${assetTag}) was due for return on ${expectedDate}. Please return it immediately.`,
      'Allocation',
      null
    );
  }
}

module.exports = NotificationService;
