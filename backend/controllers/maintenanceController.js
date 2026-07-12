const pool = require('../config/database');
const NotificationService = require('../services/notificationService');

exports.getMaintenanceRequests = async (req, res, next) => {
  try {
    const { status, assetId, requestedBy } = req.query;
    let query = `
      SELECT mr.*, a.asset_tag, a.asset_name,
             CONCAT(e1.first_name, ' ', e1.last_name) AS requested_by_name,
             CONCAT(e2.first_name, ' ', e2.last_name) AS approved_by_name,
             CONCAT(e3.first_name, ' ', e3.last_name) AS assigned_to_name
      FROM maintenance_requests mr
      JOIN assets a ON mr.asset_id = a.asset_id
      LEFT JOIN employees e1 ON mr.requested_by = e1.employee_id
      LEFT JOIN employees e2 ON mr.approved_by = e2.employee_id
      LEFT JOIN employees e3 ON mr.assigned_to = e3.employee_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND mr.status = ?';
      params.push(status);
    }
    if (assetId) {
      query += ' AND mr.asset_id = ?';
      params.push(assetId);
    }
    if (requestedBy) {
      query += ' AND mr.requested_by = ?';
      params.push(requestedBy);
    }

    query += ' ORDER BY mr.created_at DESC';

    const [requests] = await pool.execute(query, params);
    res.json({ success: true, data: requests });
  } catch (error) {
    next(error);
  }
};

exports.createMaintenanceRequest = async (req, res, next) => {
  try {
    const { assetId, title, description, priority } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO maintenance_requests (asset_id, requested_by, title, description, priority, status, requested_at, created_at) VALUES (?, ?, ?, ?, ?, "Pending", NOW(), NOW())',
      [assetId, req.user.employee_id, title, description, priority || 'Medium']
    );

    res.status(201).json({
      success: true,
      message: 'Maintenance request created',
      data: { requestId: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateMaintenanceStatus = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const { status, rejectionReason, assignedTo, resolutionNotes, estimatedCost, actualCost } = req.body;

    const [requests] = await pool.execute(
      'SELECT * FROM maintenance_requests WHERE request_id = ?',
      [requestId]
    );

    if (requests.length === 0) {
      return res.status(404).json({ success: false, message: 'Maintenance request not found' });
    }

    const request = requests[0];
    let updateQuery = 'UPDATE maintenance_requests SET status = ?, updated_at = NOW()';
    const params = [status];

    if (status === 'Approved') {
      updateQuery += ', approved_by = ?, approved_at = NOW()';
      params.push(req.user.employee_id);
    }
    if (status === 'Technician_Assigned' && assignedTo) {
      updateQuery += ', assigned_to = ?';
      params.push(assignedTo);
    }
    if (status === 'In_Progress') {
      updateQuery += ', started_at = NOW()';
    }
    if (status === 'Resolved') {
      updateQuery += ', resolved_at = NOW(), resolution_notes = ?, actual_cost = ?';
      params.push(resolutionNotes || null, actualCost || null);
    }
    if (status === 'Closed') {
      updateQuery += ', closed_at = NOW()';
    }
    if (status === 'Rejected') {
      updateQuery += ', approved_by = ?, rejection_reason = ?';
      params.push(req.user.employee_id, rejectionReason || null);
    }

    updateQuery += ' WHERE request_id = ?';
    params.push(requestId);

    await pool.execute(updateQuery, params);

    // Send notifications
    if (status === 'Approved') {
      await NotificationService.notifyMaintenanceApproved(request.requested_by, request.title);
    }
    if (status === 'Resolved') {
      await NotificationService.notifyMaintenanceResolved(request.requested_by, request.title);
    }

    res.json({ success: true, message: `Maintenance request ${status.toLowerCase()}` });
  } catch (error) {
    next(error);
  }
};
