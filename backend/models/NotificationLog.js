const pool = require('../config/database');

class NotificationLog {
  static async create(logData) {
    const {
      registration_id,
      recipient_email,
      recipient_phone = null,
      notification_type,
      status = 'PENDING',
      message_content
    } = logData;

    const query = `
      INSERT INTO notification_logs 
      (registration_id, recipient_email, recipient_phone, notification_type, 
       status, message_content, sent_at)
      VALUES (?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.execute(query, [
      registration_id,
      recipient_email,
      recipient_phone,
      notification_type,
      status,
      message_content
    ]);

    return result.insertId;
  }

  static async updateStatus(id, status, errorMessage = null) {
    const query = `
      UPDATE notification_logs 
      SET status = ?, error_message = ?
      WHERE id = ?
    `;
    await pool.execute(query, [status, errorMessage, id]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM notification_logs WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async findByRegistration(registrationId, limit = 20) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 20;
    const query = `
      SELECT * FROM notification_logs
      WHERE registration_id = ?
      ORDER BY sent_at DESC
      LIMIT ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [registrationId, String(safeLimit)]);
    return rows;
  }

  static async getByStatus(status, limit = 100, offset = 0) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 100;
    const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
    const query = `
      SELECT * FROM notification_logs
      WHERE status = ?
      ORDER BY sent_at DESC
      LIMIT ? OFFSET ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [status, String(safeLimit), String(safeOffset)]);
    return rows;
  }

  static async getFailed(limit = 100) {
    return this.getByStatus('FAILED', limit);
  }

  static async getAll(limit = 200, offset = 0) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 200;
    const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
    const query = `
      SELECT nl.*, s.matric_no, s.first_name, s.last_name
      FROM notification_logs nl
      JOIN id_registrations r ON nl.registration_id = r.id
      JOIN students s ON r.student_id = s.id
      ORDER BY nl.sent_at DESC
      LIMIT ? OFFSET ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [String(safeLimit), String(safeOffset)]);
    return rows;
  }

  static async getStatistics() {
    const query = `
      SELECT 
        notification_type,
        status,
        COUNT(*) as count
      FROM notification_logs
      GROUP BY notification_type, status
      ORDER BY notification_type, status
    `;
    const [rows] = await pool.execute(query);
    return rows;
  }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM notification_logs';
    const [rows] = await pool.execute(query);
    return rows[0].total;
  }
}

module.exports = NotificationLog;