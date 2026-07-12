const pool = require('../config/database');
const NotificationService = require('../services/notificationService');

exports.getBookings = async (req, res, next) => {
  try {
    const { assetId, status, bookedBy, startDate, endDate } = req.query;
    let query = `
      SELECT b.*, a.asset_name, a.asset_tag,
             CONCAT(e.first_name, ' ', e.last_name) AS booked_by_name,
             d.department_name AS booked_for_department
      FROM bookings b
      JOIN assets a ON b.asset_id = a.asset_id
      LEFT JOIN employees e ON b.booked_by = e.employee_id
      LEFT JOIN departments d ON b.booked_for_dept_id = d.department_id
      WHERE 1=1
    `;
    const params = [];

    if (assetId) {
      query += ' AND b.asset_id = ?';
      params.push(assetId);
    }
    if (status) {
      query += ' AND b.status = ?';
      params.push(status);
    }
    if (bookedBy) {
      query += ' AND b.booked_by = ?';
      params.push(bookedBy);
    }
    if (startDate && endDate) {
      query += ' AND ((b.start_time BETWEEN ? AND ?) OR (b.end_time BETWEEN ? AND ?))';
      params.push(startDate, endDate, startDate, endDate);
    }

    query += ' ORDER BY b.start_time DESC';

    const [bookings] = await pool.execute(query, params);
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

exports.getBookingCalendar = async (req, res, next) => {
  try {
    const { assetId, startDate, endDate } = req.query;
    let query = 'SELECT * FROM vw_booking_calendar WHERE 1=1';
    const params = [];

    if (assetId) {
      query += ' AND asset_id = ?';
      params.push(assetId);
    }
    if (startDate && endDate) {
      query += ' AND ((start_time BETWEEN ? AND ?) OR (end_time BETWEEN ? AND ?))';
      params.push(startDate, endDate, startDate, endDate);
    }

    query += ' ORDER BY start_time';

    const [bookings] = await pool.execute(query, params);
    res.json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

exports.createBooking = async (req, res, next) => {
  try {
    const { assetId, startTime, endTime, purpose, bookedForDeptId } = req.body;

    // Check for overlaps using stored procedure
    const [overlapResult] = await pool.execute(
      'CALL sp_check_booking_overlap(?, ?, ?, NULL)',
      [assetId, startTime, endTime]
    );

    if (overlapResult[0][0].overlap_count > 0) {
      return res.status(409).json({
        success: false,
        message: 'This time slot overlaps with an existing booking'
      });
    }

    // Check if asset is bookable
    const [assets] = await pool.execute(
      'SELECT asset_name, is_bookable FROM assets WHERE asset_id = ?',
      [assetId]
    );

    if (assets.length === 0) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    if (!assets[0].is_bookable) {
      return res.status(400).json({ success: false, message: 'This asset is not available for booking' });
    }

    const [result] = await pool.execute(
      'INSERT INTO bookings (asset_id, booked_by, booked_for_dept_id, start_time, end_time, purpose, status, created_at) VALUES (?, ?, ?, ?, ?, ?, "Upcoming", NOW())',
      [assetId, req.user.employee_id, bookedForDeptId || null, startTime, endTime, purpose || null]
    );

    await NotificationService.notifyBookingConfirmed(
      req.user.employee_id,
      assets[0].asset_name,
      startTime
    );

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { bookingId: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

exports.cancelBooking = async (req, res, next) => {
  try {
    const { bookingId } = req.params;
    const { reason } = req.body;

    const [bookings] = await pool.execute(
      'SELECT * FROM bookings WHERE booking_id = ?',
      [bookingId]
    );

    if (bookings.length === 0) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Only allow cancel if user owns it or is admin/manager
    if (booking.booked_by !== req.user.employee_id && 
        !['Admin', 'Asset_Manager'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this booking' });
    }

    await pool.execute(
      'UPDATE bookings SET status = "Cancelled", cancelled_at = NOW(), cancellation_reason = ? WHERE booking_id = ?',
      [reason || null, bookingId]
    );

    res.json({ success: true, message: 'Booking cancelled' });
  } catch (error) {
    next(error);
  }
};

exports.getBookableAssets = async (req, res, next) => {
  try {
    const [assets] = await pool.execute(
      `SELECT a.asset_id, a.asset_tag, a.asset_name, a.location, a.current_condition,
              c.category_name
       FROM assets a
       LEFT JOIN asset_categories c ON a.category_id = c.category_id
       WHERE a.is_bookable = 1 AND a.status = 'Available'
       ORDER BY a.asset_name`
    );
    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};
