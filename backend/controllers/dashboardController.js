const pool = require('../config/database');

exports.getKPIs = async (req, res, next) => {
  try {
    const [kpis] = await pool.execute('SELECT * FROM vw_dashboard_kpis');
    res.json({ success: true, data: kpis[0] });
  } catch (error) {
    next(error);
  }
};

exports.getOverdueReturns = async (req, res, next) => {
  try {
    const [overdue] = await pool.execute('SELECT * FROM vw_overdue_returns');
    res.json({ success: true, data: overdue });
  } catch (error) {
    next(error);
  }
};

exports.getUpcomingReturns = async (req, res, next) => {
  try {
    const query = `
      SELECT a.asset_id, a.asset_tag, a.asset_name, 
             al.allocation_id, al.allocated_to_employee_id,
             CONCAT(e.first_name, ' ', e.last_name) AS holder_name,
             al.expected_return_date, al.allocation_date
      FROM assets a
      JOIN asset_allocations al ON a.asset_id = al.asset_id
      LEFT JOIN employees e ON al.allocated_to_employee_id = e.employee_id
      WHERE al.status = 'Active' 
        AND al.expected_return_date IS NOT NULL
        AND al.expected_return_date >= CURDATE()
        AND al.expected_return_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)
      ORDER BY al.expected_return_date ASC
    `;
    const [returns] = await pool.execute(query);
    res.json({ success: true, data: returns });
  } catch (error) {
    next(error);
  }
};

exports.getRecentActivity = async (req, res, next) => {
  try {
    const query = `
      SELECT al.log_id, al.action, al.entity_type, al.entity_id, 
             al.description, al.created_at,
             CONCAT(e.first_name, ' ', e.last_name) AS actor_name
      FROM activity_logs al
      LEFT JOIN employees e ON al.actor_id = e.employee_id
      ORDER BY al.created_at DESC
      LIMIT 20
    `;
    const [activity] = await pool.execute(query);
    res.json({ success: true, data: activity });
  } catch (error) {
    next(error);
  }
};

exports.getMyNotifications = async (req, res, next) => {
  try {
    const [notifications] = await pool.execute(
      'SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC LIMIT 50',
      [req.user.employee_id]
    );
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationRead = async (req, res, next) => {
  try {
    const { notificationId } = req.params;
    await pool.execute(
      'UPDATE notifications SET is_read = 1, read_at = NOW() WHERE notification_id = ? AND recipient_id = ?',
      [notificationId, req.user.employee_id]
    );
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

exports.getUnreadCount = async (req, res, next) => {
  try {
    const [result] = await pool.execute(
      'SELECT COUNT(*) as count FROM notifications WHERE recipient_id = ? AND is_read = 0',
      [req.user.employee_id]
    );
    res.json({ success: true, data: { unreadCount: result[0].count } });
  } catch (error) {
    next(error);
  }
};
