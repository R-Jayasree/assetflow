const pool = require('../config/database');
const NotificationService = require('../services/notificationService');

exports.getAllocations = async (req, res, next) => {
  try {
    const { status, employeeId, assetId } = req.query;
    let query = `
      SELECT al.*, a.asset_tag, a.asset_name, a.current_condition,
             CONCAT(e.first_name, ' ', e.last_name) AS allocated_to_name,
             CONCAT(e2.first_name, ' ', e2.last_name) AS allocated_by_name,
             d.department_name AS allocated_to_department
      FROM asset_allocations al
      JOIN assets a ON al.asset_id = a.asset_id
      LEFT JOIN employees e ON al.allocated_to_employee_id = e.employee_id
      LEFT JOIN employees e2 ON al.allocated_by = e2.employee_id
      LEFT JOIN departments d ON al.allocated_to_department_id = d.department_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND al.status = ?';
      params.push(status);
    }
    if (employeeId) {
      query += ' AND al.allocated_to_employee_id = ?';
      params.push(employeeId);
    }
    if (assetId) {
      query += ' AND al.asset_id = ?';
      params.push(assetId);
    }

    query += ' ORDER BY al.created_at DESC';

    const [allocations] = await pool.execute(query, params);
    res.json({ success: true, data: allocations });
  } catch (error) {
    next(error);
  }
};

exports.createAllocation = async (req, res, next) => {
  try {
    const { assetId, allocatedToEmployeeId, allocatedToDepartmentId, expectedReturnDate } = req.body;

    // Check if asset is available
    const [assets] = await pool.execute(
      'SELECT status, asset_name, asset_tag FROM assets WHERE asset_id = ?',
      [assetId]
    );

    if (assets.length === 0) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    const asset = assets[0];
    if (asset.status !== 'Available') {
      // Get current holder
      const [holders] = await pool.execute(
        'SELECT CONCAT(e.first_name, " ", e.last_name) AS holder_name FROM asset_allocations al JOIN employees e ON al.allocated_to_employee_id = e.employee_id WHERE al.asset_id = ? AND al.status = "Active"',
        [assetId]
      );
      const holderName = holders.length > 0 ? holders[0].holder_name : 'someone';
      return res.status(409).json({
        success: false,
        message: `Asset is currently allocated to ${holderName}`,
        data: { currentHolder: holderName, canRequestTransfer: true }
      });
    }

    const [result] = await pool.execute(
      'INSERT INTO asset_allocations (asset_id, allocated_to_employee_id, allocated_to_department_id, allocated_by, allocation_date, expected_return_date, status, created_at) VALUES (?, ?, ?, ?, NOW(), ?, "Active", NOW())',
      [assetId, allocatedToEmployeeId || null, allocatedToDepartmentId || null, req.user.employee_id, expectedReturnDate || null]
    );

    // Notify employee
    if (allocatedToEmployeeId) {
      await NotificationService.notifyAssetAssigned(allocatedToEmployeeId, asset.asset_name, asset.asset_tag);
    }

    res.status(201).json({
      success: true,
      message: 'Asset allocated successfully',
      data: { allocationId: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

exports.returnAsset = async (req, res, next) => {
  try {
    const { allocationId } = req.params;
    const { returnCondition, returnNotes } = req.body;

    const [allocations] = await pool.execute(
      'SELECT * FROM asset_allocations WHERE allocation_id = ?',
      [allocationId]
    );

    if (allocations.length === 0) {
      return res.status(404).json({ success: false, message: 'Allocation not found' });
    }

    if (allocations[0].status !== 'Active') {
      return res.status(400).json({ success: false, message: 'Allocation is not active' });
    }

    await pool.execute(
      'UPDATE asset_allocations SET status = "Returned", actual_return_date = NOW(), return_condition = ?, return_notes = ? WHERE allocation_id = ?',
      [returnCondition || 'Good', returnNotes || null, allocationId]
    );

    res.json({ success: true, message: 'Asset returned successfully' });
  } catch (error) {
    next(error);
  }
};

// ========== TRANSFERS ==========
exports.getTransfers = async (req, res, next) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT t.*, a.asset_tag, a.asset_name,
             CONCAT(e1.first_name, ' ', e1.last_name) AS from_employee_name,
             CONCAT(e2.first_name, ' ', e2.last_name) AS to_employee_name,
             CONCAT(e3.first_name, ' ', e3.last_name) AS requested_by_name,
             CONCAT(e4.first_name, ' ', e4.last_name) AS approved_by_name,
             d.department_name AS to_department_name
      FROM asset_transfers t
      JOIN assets a ON t.asset_id = a.asset_id
      LEFT JOIN employees e1 ON t.from_employee_id = e1.employee_id
      LEFT JOIN employees e2 ON t.to_employee_id = e2.employee_id
      LEFT JOIN employees e3 ON t.requested_by = e3.employee_id
      LEFT JOIN employees e4 ON t.approved_by = e4.employee_id
      LEFT JOIN departments d ON t.to_department_id = d.department_id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND t.status = ?';
      params.push(status);
    }

    query += ' ORDER BY t.created_at DESC';

    const [transfers] = await pool.execute(query, params);
    res.json({ success: true, data: transfers });
  } catch (error) {
    next(error);
  }
};

exports.createTransfer = async (req, res, next) => {
  try {
    const { assetId, toEmployeeId, toDepartmentId, transferReason, expectedReturnDate } = req.body;

    // Get current active allocation
    const [allocations] = await pool.execute(
      'SELECT * FROM asset_allocations WHERE asset_id = ? AND status = "Active"',
      [assetId]
    );

    if (allocations.length === 0) {
      return res.status(400).json({ success: false, message: 'Asset is not currently allocated' });
    }

    const fromAllocation = allocations[0];

    const [result] = await pool.execute(
      'INSERT INTO asset_transfers (asset_id, from_allocation_id, from_employee_id, to_employee_id, to_department_id, requested_by, request_date, expected_return_date, transfer_reason, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, ?, "Requested", NOW())',
      [assetId, fromAllocation.allocation_id, fromAllocation.allocated_to_employee_id, toEmployeeId || null, toDepartmentId || null, req.user.employee_id, expectedReturnDate || null, transferReason || null]
    );

    // Notify relevant parties
    if (toEmployeeId) {
      await NotificationService.notifyTransferRequested(toEmployeeId, fromAllocation.asset_name || 'Asset', req.user.first_name + ' ' + req.user.last_name);
    }

    res.status(201).json({
      success: true,
      message: 'Transfer request created',
      data: { transferId: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

exports.approveTransfer = async (req, res, next) => {
  try {
    const { transferId } = req.params;
    const { action, rejectionReason } = req.body; // action: 'approve' or 'reject'

    const [transfers] = await pool.execute(
      'SELECT * FROM asset_transfers WHERE transfer_id = ?',
      [transferId]
    );

    if (transfers.length === 0) {
      return res.status(404).json({ success: false, message: 'Transfer not found' });
    }

    const transfer = transfers[0];

    if (action === 'approve') {
      // Close old allocation
      await pool.execute(
        'UPDATE asset_allocations SET status = "Returned", actual_return_date = NOW() WHERE allocation_id = ?',
        [transfer.from_allocation_id]
      );

      // Create new allocation
      const [allocResult] = await pool.execute(
        'INSERT INTO asset_allocations (asset_id, allocated_to_employee_id, allocated_to_department_id, allocated_by, allocation_date, expected_return_date, status, created_at) VALUES (?, ?, ?, ?, NOW(), ?, "Active", NOW())',
        [transfer.asset_id, transfer.to_employee_id, transfer.to_department_id, req.user.employee_id, transfer.expected_return_date]
      );

      // Update transfer
      await pool.execute(
        'UPDATE asset_transfers SET status = "Completed", approved_by = ?, approval_date = NOW() WHERE transfer_id = ?',
        [req.user.employee_id, transferId]
      );

      // Notify
      if (transfer.to_employee_id) {
        const [assets] = await pool.execute('SELECT asset_name FROM assets WHERE asset_id = ?', [transfer.asset_id]);
        await NotificationService.notifyTransferApproved(transfer.to_employee_id, assets[0]?.asset_name || 'Asset');
      }

      res.json({ success: true, message: 'Transfer approved and completed' });
    } else {
      await pool.execute(
        'UPDATE asset_transfers SET status = "Rejected", approved_by = ?, rejection_reason = ? WHERE transfer_id = ?',
        [req.user.employee_id, rejectionReason || null, transferId]
      );
      res.json({ success: true, message: 'Transfer rejected' });
    }
  } catch (error) {
    next(error);
  }
};
