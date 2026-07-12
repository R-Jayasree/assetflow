const pool = require('../config/database');

exports.getAssetUtilization = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        a.asset_id, a.asset_tag, a.asset_name, c.category_name,
        COUNT(DISTINCT al.allocation_id) AS total_allocations,
        SUM(CASE WHEN al.status = 'Active' THEN 1 ELSE 0 END) AS current_allocations,
        COUNT(DISTINCT mr.request_id) AS maintenance_count,
        a.acquisition_date, a.acquisition_cost
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.category_id
      LEFT JOIN asset_allocations al ON a.asset_id = al.asset_id
      LEFT JOIN maintenance_requests mr ON a.asset_id = mr.asset_id
      GROUP BY a.asset_id
      ORDER BY total_allocations DESC
    `;
    const [data] = await pool.execute(query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getMaintenanceFrequency = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        c.category_name,
        COUNT(mr.request_id) AS total_requests,
        AVG(CASE WHEN mr.status = 'Resolved' THEN DATEDIFF(mr.resolved_at, mr.requested_at) END) AS avg_resolution_days,
        SUM(CASE WHEN mr.priority = 'Critical' THEN 1 ELSE 0 END) AS critical_count,
        SUM(CASE WHEN mr.priority = 'High' THEN 1 ELSE 0 END) AS high_count
      FROM maintenance_requests mr
      JOIN assets a ON mr.asset_id = a.asset_id
      JOIN asset_categories c ON a.category_id = c.category_id
      GROUP BY c.category_id
      ORDER BY total_requests DESC
    `;
    const [data] = await pool.execute(query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getDepartmentAllocation = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        d.department_name,
        COUNT(DISTINCT a.asset_id) AS total_assets,
        COUNT(DISTINCT CASE WHEN a.status = 'Allocated' THEN a.asset_id END) AS allocated_assets,
        COUNT(DISTINCT CASE WHEN a.status = 'Available' THEN a.asset_id END) AS available_assets,
        COUNT(DISTINCT CASE WHEN a.status = 'Under_Maintenance' THEN a.asset_id END) AS maintenance_assets,
        SUM(a.acquisition_cost) AS total_value
      FROM departments d
      LEFT JOIN assets a ON d.department_id = a.department_id
      GROUP BY d.department_id
      ORDER BY total_assets DESC
    `;
    const [data] = await pool.execute(query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getBookingHeatmap = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    const query = `
      SELECT 
        a.asset_name,
        DAYOFWEEK(b.start_time) AS day_of_week,
        HOUR(b.start_time) AS hour_of_day,
        COUNT(*) AS booking_count
      FROM bookings b
      JOIN assets a ON b.asset_id = a.asset_id
      WHERE b.status IN ('Upcoming', 'Ongoing', 'Completed')
        AND (? IS NULL OR b.start_time >= ?)
        AND (? IS NULL OR b.end_time <= ?)
      GROUP BY a.asset_id, DAYOFWEEK(b.start_time), HOUR(b.start_time)
      ORDER BY a.asset_name, day_of_week, hour_of_day
    `;
    const [data] = await pool.execute(query, [startDate || null, startDate || null, endDate || null, endDate || null]);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};

exports.getAssetsDueForMaintenance = async (req, res, next) => {
  try {
    const query = `
      SELECT 
        a.asset_id, a.asset_tag, a.asset_name, c.category_name,
        MAX(mr.resolved_at) AS last_maintenance_date,
        DATEDIFF(CURDATE(), MAX(mr.resolved_at)) AS days_since_maintenance,
        a.current_condition
      FROM assets a
      LEFT JOIN maintenance_requests mr ON a.asset_id = mr.asset_id AND mr.status = 'Resolved'
      LEFT JOIN asset_categories c ON a.category_id = c.category_id
      WHERE a.status != 'Disposed' AND a.status != 'Retired'
      GROUP BY a.asset_id
      HAVING days_since_maintenance > 180 OR days_since_maintenance IS NULL
      ORDER BY days_since_maintenance DESC
    `;
    const [data] = await pool.execute(query);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
};
