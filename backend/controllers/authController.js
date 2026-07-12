const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const generateToken = (user) => {
  return jwt.sign(
    { 
      employeeId: user.employee_id,
      email: user.email,
      role: user.role 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const [users] = await pool.execute(
      'SELECT employee_id, first_name, last_name, email, password_hash, role, department_id, status FROM employees WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const user = users[0];

    if (user.status !== 'Active') {
      return res.status(401).json({ success: false, message: 'Account is inactive' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Update last login
    await pool.execute('UPDATE employees SET last_login_at = NOW() WHERE employee_id = ?', [user.employee_id]);

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user.employee_id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          departmentId: user.department_id
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.signup = async (req, res, next) => {
  try {
    const { firstName, lastName, email, password, phone, departmentId } = req.body;

    // Check if email exists
    const [existing] = await pool.execute('SELECT employee_id FROM employees WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await pool.execute(
      'INSERT INTO employees (first_name, last_name, email, password_hash, phone, department_id, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, "Employee", "Active", NOW())',
      [firstName, lastName, email, hashedPassword, phone || null, departmentId || null]
    );

    const token = generateToken({
      employee_id: result.insertId,
      email,
      role: 'Employee'
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: result.insertId,
          firstName,
          lastName,
          email,
          role: 'Employee',
          departmentId: departmentId || null
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getMe = async (req, res, next) => {
  try {
    const [users] = await pool.execute(
      'SELECT employee_id, first_name, last_name, email, role, department_id, phone, status, last_login_at FROM employees WHERE employee_id = ?',
      [req.user.employee_id]
    );

    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const user = users[0];
    res.json({
      success: true,
      data: {
        id: user.employee_id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        role: user.role,
        departmentId: user.department_id,
        phone: user.phone,
        status: user.status,
        lastLoginAt: user.last_login_at
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getEmployees = async (req, res, next) => {
  try {
    const { role, departmentId, status, search } = req.query;
    let query = `
      SELECT e.employee_id, e.first_name, e.last_name, e.email, e.phone, 
             e.role, e.status, e.department_id, d.department_name,
             e.created_at, e.last_login_at
      FROM employees e
      LEFT JOIN departments d ON e.department_id = d.department_id
      WHERE 1=1
    `;
    const params = [];

    if (role) {
      query += ' AND e.role = ?';
      params.push(role);
    }
    if (departmentId) {
      query += ' AND e.department_id = ?';
      params.push(departmentId);
    }
    if (status) {
      query += ' AND e.status = ?';
      params.push(status);
    }
    if (search) {
      query += ' AND (e.first_name LIKE ? OR e.last_name LIKE ? OR e.email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY e.created_at DESC';

    const [employees] = await pool.execute(query, params);
    res.json({ success: true, data: employees });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployeeRole = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { role, departmentId } = req.body;

    const validRoles = ['Admin', 'Asset_Manager', 'Department_Head', 'Employee'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    await pool.execute(
      'UPDATE employees SET role = ?, department_id = ?, updated_at = NOW() WHERE employee_id = ?',
      [role, departmentId || null, employeeId]
    );

    // If Department Head, update department head
    if (role === 'Department_Head' && departmentId) {
      await pool.execute(
        'UPDATE departments SET department_head_id = ? WHERE department_id = ?',
        [employeeId, departmentId]
      );
    }

    res.json({ success: true, message: 'Employee role updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.updateEmployeeStatus = async (req, res, next) => {
  try {
    const { employeeId } = req.params;
    const { status } = req.body;

    if (!['Active', 'Inactive'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    await pool.execute(
      'UPDATE employees SET status = ?, updated_at = NOW() WHERE employee_id = ?',
      [status, employeeId]
    );

    res.json({ success: true, message: 'Employee status updated successfully' });
  } catch (error) {
    next(error);
  }
};
