const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const dashboardController = require('../controllers/dashboardController');

router.get('/kpis', authenticate, dashboardController.getKPIs);
router.get('/overdue-returns', authenticate, dashboardController.getOverdueReturns);
router.get('/upcoming-returns', authenticate, dashboardController.getUpcomingReturns);
router.get('/recent-activity', authenticate, dashboardController.getRecentActivity);
router.get('/notifications', authenticate, dashboardController.getMyNotifications);
router.get('/notifications/unread-count', authenticate, dashboardController.getUnreadCount);
router.put('/notifications/:notificationId/read', authenticate, dashboardController.markNotificationRead);

module.exports = router;
