const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const reportController = require('../controllers/reportController');

router.get('/utilization', authenticate, requireRole('Admin', 'Asset_Manager'), reportController.getAssetUtilization);
router.get('/maintenance-frequency', authenticate, requireRole('Admin', 'Asset_Manager'), reportController.getMaintenanceFrequency);
router.get('/department-allocation', authenticate, requireRole('Admin', 'Asset_Manager'), reportController.getDepartmentAllocation);
router.get('/booking-heatmap', authenticate, reportController.getBookingHeatmap);
router.get('/due-maintenance', authenticate, requireRole('Admin', 'Asset_Manager'), reportController.getAssetsDueForMaintenance);

module.exports = router;
