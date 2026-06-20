const jwt = require('jsonwebtoken');
const Staff = require('../models/Staff');
const Student = require('../models/Student');
const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

class AuthController {
  // Staff login
  static async staffLogin(req, res) {
    try {
      const { username, password } = req.body;

      // Find staff user
      const staff = await Staff.findByUsername(username);
      if (!staff) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await Staff.verifyPassword(password, staff.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const token = jwt.sign(
        { userId: staff.id, userType: 'staff', role: staff.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Log login
      await AuditLog.create({
        action: 'LOGIN',
        entity_type: 'staff',
        entity_id: staff.id,
        user_id: staff.id,
        user_type: 'staff'
      });

      logger.info(`Staff user ${username} logged in successfully`);

      res.json({
        success: true,
        token,
        user: {
          id: staff.id,
          username: staff.username,
          full_name: staff.full_name,
          email: staff.email,
          role: staff.role
        }
      });
    } catch (error) {
      logger.error(`Staff login error: ${error.message}`);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Student login
  static async studentLogin(req, res) {
    try {
      const { matric_no, password } = req.body;

      // Find student by matric number
      const student = await Student.findByMatricNo(matric_no);
      if (!student) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // For simplicity, using matric number as password (in production, use proper password)
      // In production, you should have a separate password field for students
      if (matric_no !== password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Generate JWT token
      if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not defined in environment variables');
      }

      const token = jwt.sign(
        { userId: student.id, userType: 'student' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      // Log login
      await AuditLog.create({
        action: 'LOGIN',
        entity_type: 'student',
        entity_id: student.id,
        user_id: student.id,
        user_type: 'student'
      });

      logger.info(`Student ${matric_no} logged in successfully`);

      res.json({
        success: true,
        token,
        user: {
          id: student.id,
          matric_no: student.matric_no,
          first_name: student.first_name,
          last_name: student.last_name,
          email: student.email,
          faculty: student.faculty,
          department: student.department,
          level: student.level
        }
      });
    } catch (error) {
      logger.error(`Student login error: ${error.message}`);
      res.status(500).json({ error: 'Login failed' });
    }
  }

  // Get current user info
  static async getCurrentUser(req, res) {
    try {
      const user = req.user;
      res.json({
        success: true,
        user
      });
    } catch (error) {
      logger.error(`Get current user error: ${error.message}`);
      res.status(500).json({ error: 'Failed to get user info' });
    }
  }

  // Logout (client-side token removal)
  static async logout(req, res) {
    try {
      // Log logout
      await AuditLog.create({
        action: 'LOGOUT',
        entity_type: req.user.userType,
        entity_id: req.user.id,
        user_id: req.user.id,
        user_type: req.user.userType
      });

      logger.info(`User ${req.user.userType} ${req.user.id} logged out`);

      res.json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error(`Logout error: ${error.message}`);
      res.status(500).json({ error: 'Logout failed' });
    }
  }

  // Change password (staff only)
  static async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      const staff = await Staff.findById(userId);
      if (!staff) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Verify current password
      const isValidPassword = await Staff.verifyPassword(currentPassword, staff.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      // Update password
      await Staff.updatePassword(userId, newPassword);

      // Log password change
      await AuditLog.create({
        action: 'PASSWORD_CHANGE',
        entity_type: 'staff',
        entity_id: userId,
        user_id: userId,
        user_type: 'staff'
      });

      logger.info(`Password changed for staff user ${userId}`);

      res.json({
        success: true,
        message: 'Password changed successfully'
      });
    } catch (error) {
      logger.error(`Change password error: ${error.message}`);
      res.status(500).json({ error: 'Failed to change password' });
    }
  }
}

module.exports = AuthController;