const pool = require('../config/database');
const bcrypt = require('bcryptjs');

class Staff {
  static async create(staffData) {
    const {
      username,
      password,
      full_name,
      email,
      role = 'registry'
    } = staffData;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    const query = `
      INSERT INTO staff_users 
      (username, password_hash, full_name, email, role, created_at)
      VALUES (?, ?, ?, ?, ?, NOW())
    `;

    const [result] = await pool.execute(query, [
      username,
      password_hash,
      full_name,
      email,
      role
    ]);

    return result.insertId;
  }

  static async findByUsername(username) {
    const query = 'SELECT * FROM staff_users WHERE username = ?';
    const [rows] = await pool.execute(query, [username]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, username, full_name, email, role, created_at FROM staff_users WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  static async updatePassword(id, newPassword) {
    const password_hash = await bcrypt.hash(newPassword, 10);
    const query = 'UPDATE staff_users SET password_hash = ? WHERE id = ?';
    await pool.execute(query, [password_hash, id]);
  }

  static async update(id, staffData) {
    const {
      full_name,
      email,
      role
    } = staffData;

    const query = `
      UPDATE staff_users 
      SET full_name = COALESCE(?, full_name),
          email = COALESCE(?, email),
          role = COALESCE(?, role)
      WHERE id = ?
    `;
    await pool.execute(query, [full_name, email, role, id]);
  }

  static async getAll(limit = 100, offset = 0) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 100;
    const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
    const query = `
      SELECT id, username, full_name, email, role, created_at 
      FROM staff_users 
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `;
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [String(safeLimit), String(safeOffset)]);
    return rows;
  }

  static async delete(id) {
    const query = 'DELETE FROM staff_users WHERE id = ?';
    await pool.execute(query, [id]);
  }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM staff_users';
    const [rows] = await pool.execute(query);
    return rows[0].total;
  }
}

module.exports = Staff;