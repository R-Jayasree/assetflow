const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const organizationController = require('../controllers/organizationController');

router.get('/departments', authenticate, organizationController.getDepartments);
router.post('/departments', authenticate, requireRole('Admin'), organizationController.createDepartment);
router.put('/departments/:departmentId', authenticate, requireRole('Admin'), organizationController.updateDepartment);

router.get('/categories', authenticate, organizationController.getCategories);
router.post('/categories', authenticate, requireRole('Admin', 'Asset_Manager'), organizationController.createCategory);
router.put('/categories/:categoryId', authenticate, requireRole('Admin', 'Asset_Manager'), organizationController.updateCategory);

module.exports = router;
