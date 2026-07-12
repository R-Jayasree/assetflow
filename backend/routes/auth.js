const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { loginValidation, signupValidation } = require('../utils/validators');
const authController = require('../controllers/authController');

router.post('/login', loginValidation, authController.login);
router.post('/signup', signupValidation, authController.signup);
router.get('/me', authenticate, authController.getMe);
router.get('/employees', authenticate, requireRole('Admin', 'Asset_Manager'), authController.getEmployees);
router.put('/employees/:employeeId/role', authenticate, requireRole('Admin'), authController.updateEmployeeRole);
router.put('/employees/:employeeId/status', authenticate, requireRole('Admin'), authController.updateEmployeeStatus);

module.exports = router;
