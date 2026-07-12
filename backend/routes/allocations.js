const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { allocationValidation } = require('../utils/validators');
const allocationController = require('../controllers/allocationController');

router.get('/', authenticate, allocationController.getAllocations);
router.post('/', authenticate, requireRole('Admin', 'Asset_Manager'), allocationValidation, allocationController.createAllocation);
router.post('/:allocationId/return', authenticate, allocationController.returnAsset);

router.get('/transfers', authenticate, allocationController.getTransfers);
router.post('/transfers', authenticate, allocationController.createTransfer);
router.put('/transfers/:transferId/approve', authenticate, requireRole('Admin', 'Asset_Manager', 'Department_Head'), allocationController.approveTransfer);

module.exports = router;
