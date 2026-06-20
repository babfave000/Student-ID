const pool = require('../config/database');

class Registration {
  static async create(registrationData) {
    const {
      student_id,
      photo_path,
      status = 'DRAFT'
    } = registrationData;

    const query = `
      INSERT INTO id_registrations 
      (student_id, photo_path, status, submitted_at, updated_at)
      VALUES (?, ?, ?, NOW(), NOW())
    `;

    const [result] = await pool.execute(query, [
      student_id,
      photo_path,
      status
    ]);

    return result.insertId;
  }

  static async findById(id) {
    const query = `
      SELECT r.*, s.matric_no, s.first_name, s.last_name, s.email, s.phone, 
             s.faculty, s.department, s.level
      FROM id_registrations r
      JOIN students s ON r.student_id = s.id
      WHERE r.id = ?
    `;
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async findByStudentId(studentId) {
    const query = `
      SELECT r.*, s.matric_no, s.first_name, s.last_name, s.email, s.phone, 
             s.faculty, s.department, s.level
      FROM id_registrations r
      JOIN students s ON r.student_id = s.id
      WHERE r.student_id = ?
      ORDER BY r.submitted_at DESC
    `;
    const [rows] = await pool.execute(query, [studentId]);
    return rows;
  }

  static async findByMatricNo(matricNo) {
    const query = `
      SELECT r.*, s.matric_no, s.first_name, s.last_name, s.email, s.phone, 
             s.faculty, s.department, s.level
      FROM id_registrations r
      JOIN students s ON r.student_id = s.id
      WHERE s.matric_no = ?
      ORDER BY r.submitted_at DESC
    `;
    const [rows] = await pool.execute(query, [matricNo]);
    return rows[0];
  }

  static async updateStatus(id, status) {
    const query = `
      UPDATE id_registrations 
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `;
    await pool.execute(query, [status, id]);
  }

  static async update(id, registrationData) {
    const {
      photo_path,
      status
    } = registrationData;

    const query = `
      UPDATE id_registrations 
      SET photo_path = COALESCE(?, photo_path),
          status = COALESCE(?, status),
          updated_at = NOW()
      WHERE id = ?
    `;
    await pool.execute(query, [photo_path, status, id]);
  }

  static async getByStatus(status, limit = 100, offset = 0) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 100;
    const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
    const query = `
      SELECT r.*, s.matric_no, s.first_name, s.last_name, s.email, s.phone, 
             s.faculty, s.department, s.level
      FROM id_registrations r
      JOIN students s ON r.student_id = s.id
      WHERE r.status = ?
      ORDER BY r.submitted_at DESC
      LIMIT ? OFFSET ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [status, String(safeLimit), String(safeOffset)]);
    return rows;
  }

  static async getPending(limit = 100, offset = 0) {
    return this.getByStatus('SUBMITTED', limit, offset);
  }

  static async getApproved(limit = 100, offset = 0) {
    return this.getByStatus('APPROVED', limit, offset);
  }

  static async getBatched(limit = 100, offset = 0) {
    return this.getByStatus('BATCHED', limit, offset);
  }

  static async getAll(limit = 100, offset = 0) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 100;
    const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
    const query = `
      SELECT r.*, s.matric_no, s.first_name, s.last_name, s.email, s.phone, 
             s.faculty, s.department, s.level
      FROM id_registrations r
      JOIN students s ON r.student_id = s.id
      ORDER BY r.submitted_at DESC
      LIMIT ? OFFSET ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [String(safeLimit), String(safeOffset)]);
    return rows;
  }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM id_registrations';
    const [rows] = await pool.execute(query);
    return rows[0].total;
  }

  static async countByStatus(status) {
    const query = 'SELECT COUNT(*) as total FROM id_registrations WHERE status = ?';
    const [rows] = await pool.execute(query, [status]);
    return rows[0].total;
  }
}

module.exports = Registration;