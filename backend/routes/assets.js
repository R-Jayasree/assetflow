const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { requireRole } = require('../middleware/roleCheck');
const { assetValidation } = require('../utils/validators');
const assetController = require('../controllers/assetController');

router.get('/', authenticate, assetController.getAssets);
router.get('/holders', authenticate, requireRole('Admin', 'Asset_Manager'), assetController.getCurrentHolders);
router.get('/:assetId', authenticate, assetController.getAssetById);
router.post('/', authenticate, requireRole('Admin', 'Asset_Manager'), assetValidation, assetController.createAsset);
router.put('/:assetId', authenticate, requireRole('Admin', 'Asset_Manager'), assetController.updateAsset);

module.exports = router;
