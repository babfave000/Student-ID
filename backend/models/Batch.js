const pool = require('../config/database');

class Batch {
  static async create(batchData) {
    const {
      batch_name,
      description,
      created_by,
      status = 'SENT'
    } = batchData;

    const query = `
      INSERT INTO production_batches 
      (batch_name, description, created_by, created_at, status, total_count)
      VALUES (?, ?, ?, NOW(), ?, 0)
    `;

    const [result] = await pool.execute(query, [
      batch_name,
      description,
      created_by,
      status
    ]);

    return result.insertId;
  }

  static async findById(id) {
    const query = `
      SELECT b.*, u.full_name as created_by_name
      FROM production_batches b
      LEFT JOIN staff_users u ON b.created_by = u.id
      WHERE b.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async getAll(limit = 100, offset = 0) {
    // Default values with multiple fallbacks
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 100;
    const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
    
    const query = `
      SELECT b.*, u.full_name as created_by_name,
             (SELECT COUNT(*) FROM batch_registrations WHERE batch_id = b.id) as registration_count
      FROM production_batches b
      LEFT JOIN staff_users u ON b.created_by = u.id
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;
    
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [String(safeLimit), String(safeOffset)]);
    return rows;
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE production_batches 
      SET status = ?
      WHERE id = ?
    `;
    await pool.execute(query, [status, id]);
  }

  static async updateTotalCount(id) {
    const query = `
      UPDATE production_batches 
      SET total_count = (SELECT COUNT(*) FROM batch_registrations WHERE batch_id = ?)
      WHERE id = ?
    `;
    await pool.execute(query, [id, id]);
  }

  static async addRegistration(batchId, registrationId) {
    const query = `
      INSERT INTO batch_registrations (batch_id, registration_id, added_at)
      VALUES (?, ?, NOW())
    `;
    await pool.execute(query, [batchId, registrationId]);
    
    // Update batch total count
    await this.updateTotalCount(batchId);
  }

  static async getRegistrations(batchId) {
    const query = `
      SELECT r.*, s.matric_no, s.first_name, s.last_name, s.email, s.phone, 
             s.faculty, s.department, s.level
      FROM batch_registrations br
      JOIN id_registrations r ON br.registration_id = r.id
      JOIN students s ON r.student_id = s.id
      WHERE br.batch_id = ?
      ORDER BY s.faculty, s.department, s.last_name
    `;
    const [rows] = await pool.execute(query, [batchId]);
    return rows;
  }

  static async getByStatus(status, limit = 100, offset = 0) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 100;
    const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
    const query = `
      SELECT b.*, u.full_name as created_by_name,
             (SELECT COUNT(*) FROM batch_registrations WHERE batch_id = b.id) as registration_count
      FROM production_batches b
      LEFT JOIN staff_users u ON b.created_by = u.id
      WHERE b.status = ?
      ORDER BY b.created_at DESC
      LIMIT ? OFFSET ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [status, String(safeLimit), String(safeOffset)]);
    return rows;
  }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM production_batches';
    const [rows] = await pool.execute(query);
    return rows[0].total;
  }
}

module.exports = Batch;