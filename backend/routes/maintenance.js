const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { maintenanceValidation } = require('../utils/validators');
const maintenanceController = require('../controllers/maintenanceController');

router.get('/', authenticate, maintenanceController.getMaintenanceRequests);
router.post('/', authenticate, maintenanceValidation, maintenanceController.createMaintenanceRequest);
router.put('/:requestId/status', authenticate, requireRole('Admin', 'Asset_Manager'), maintenanceController.updateMaintenanceStatus);

module.exports = router;
