const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const auditController = require('../controllers/auditController');

router.get('/', authenticate, auditController.getAuditCycles);
router.post('/', authenticate, requireRole('Admin', 'Asset_Manager'), auditController.createAuditCycle);
router.get('/:auditCycleId/assignments', authenticate, auditController.getAuditAssignments);
router.post('/:auditCycleId/assign', authenticate, requireRole('Admin', 'Asset_Manager'), auditController.assignAuditors);
router.get('/:auditCycleId/assets', authenticate, auditController.getAuditAssets);
router.post('/:auditCycleId/discrepancies', authenticate, auditController.submitDiscrepancy);
router.get('/:auditCycleId/discrepancies', authenticate, auditController.getDiscrepancies);
router.put('/discrepancies/:discrepancyId/resolve', authenticate, requireRole('Admin', 'Asset_Manager'), auditController.resolveDiscrepancy);
router.post('/:auditCycleId/close', authenticate, requireRole('Admin', 'Asset_Manager'), auditController.closeAuditCycle);

module.exports = router;
