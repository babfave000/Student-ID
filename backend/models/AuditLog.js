const pool = require('../config/database');

class AuditLog {
  static async create(logData) {
    const {
      action,
      entity_type,
      entity_id,
      user_id,
      user_type = 'staff',
      old_value = null,
      new_value = null
    } = logData;

    const query = `
      INSERT INTO audit_log 
      (action, entity_type, entity_id, user_id, user_type, old_value, new_value, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.execute(query, [
      action,
      entity_type,
      entity_id,
      user_id,
      user_type,
      old_value ? JSON.stringify(old_value) : null,
      new_value ? JSON.stringify(new_value) : null
    ]);

    return result.insertId;
  }

  static async findByEntity(entityType, entityId, limit = 50) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 50;
    const query = `
      SELECT a.*,
             COALESCE(s.full_name, st.first_name) as user_name
      FROM audit_log a
      LEFT JOIN staff_users s ON a.user_id = s.id AND a.user_type = 'staff'
      LEFT JOIN students st ON a.user_id = st.id AND a.user_type = 'student'
      WHERE a.entity_type = ? AND a.entity_id = ?
      ORDER BY a.timestamp DESC
      LIMIT ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [entityType, entityId, String(safeLimit)]);
    return rows;
  }

  static async findByUserId(userId, limit = 100) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 100;
    const query = `
      SELECT * FROM audit_log
      WHERE user_id = ?
      ORDER BY timestamp DESC
      LIMIT ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [userId, String(safeLimit)]);
    return rows;
  }

  static async getAll(limit = 200, offset = 0) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 200;
    const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
    const query = `
      SELECT a.*,
             COALESCE(s.full_name, st.first_name) as user_name
      FROM audit_log a
      LEFT JOIN staff_users s ON a.user_id = s.id AND a.user_type = 'staff'
      LEFT JOIN students st ON a.user_id = st.id AND a.user_type = 'student'
      ORDER BY a.timestamp DESC
      LIMIT ? OFFSET ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [String(safeLimit), String(safeOffset)]);
    return rows;
  }

  static async getByDateRange(startDate, endDate, limit = 200) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 200;
    const query = `
      SELECT a.*,
             COALESCE(s.full_name, st.first_name) as user_name
      FROM audit_log a
      LEFT JOIN staff_users s ON a.user_id = s.id AND a.user_type = 'staff'
      LEFT JOIN students st ON a.user_id = st.id AND a.user_type = 'student'
      WHERE a.timestamp BETWEEN ? AND ?
      ORDER BY a.timestamp DESC
      LIMIT ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [startDate, endDate, String(safeLimit)]);
    return rows;
  }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM audit_log';
    const [rows] = await pool.execute(query);
    return rows[0].total;
  }
}

module.exports = AuditLog;