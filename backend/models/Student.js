const pool = require('../config/database');

class Student {
  static async create(studentData) {
    const {
      matric_no,
      first_name,
      last_name,
      email,
      phone,
      faculty,
      department,
      level
    } = studentData;

    const query = `
      INSERT INTO students 
      (matric_no, first_name, last_name, email, phone, faculty, department, level)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await pool.execute(query, [
      matric_no,
      first_name,
      last_name,
      email,
      phone,
      faculty,
      department,
      level
    ]);

    return result.insertId;
  }

  static async findByMatricNo(matricNo) {
    const query = 'SELECT * FROM students WHERE matric_no = ?';
    const [rows] = await pool.execute(query, [matricNo]);
    return rows[0];
  }

  static async findById(id) {
    const query = 'SELECT * FROM students WHERE id = ?';
    const [rows] = await pool.execute(query, [id]);
    return rows[0];
  }

  static async update(id, studentData) {
    const {
      first_name,
      last_name,
      email,
      phone,
      faculty,
      department,
      level
    } = studentData;

    const query = `
      UPDATE students 
      SET first_name = ?, last_name = ?, email = ?, phone = ?, 
          faculty = ?, department = ?, level = ?
      WHERE id = ?
    `;

    await pool.execute(query, [
      first_name,
      last_name,
      email,
      phone,
      faculty,
      department,
      level,
      id
    ]);
  }

  static async getAll(limit = 100, offset = 0) {
    const safeLimit = Number.isInteger(parseInt(limit)) ? parseInt(limit) : 100;
    const safeOffset = Number.isInteger(parseInt(offset)) ? parseInt(offset) : 0;
    const query = 'SELECT * FROM students LIMIT ? OFFSET ?';
    // Pass numeric params as strings to avoid mysql2 ER_WRONG_ARGUMENTS error
    const [rows] = await pool.execute(query, [String(safeLimit), String(safeOffset)]);
    return rows;
  }

  static async count() {
    const query = 'SELECT COUNT(*) as total FROM students';
    const [rows] = await pool.execute(query);
    return rows[0].total;
  }
}

module.exports = Student;