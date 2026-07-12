const pool = require('../config/database');
const NotificationService = require('../services/notificationService');

exports.getAuditCycles = async (req, res, next) => {
  try {
    const query = `
      SELECT ac.*,
             CONCAT(e.first_name, ' ', e.last_name) AS created_by_name,
             (SELECT COUNT(*) FROM audit_assignments WHERE audit_cycle_id = ac.audit_cycle_id) AS auditor_count,
             (SELECT COUNT(*) FROM audit_discrepancies WHERE audit_cycle_id = ac.audit_cycle_id) AS discrepancy_count
      FROM audit_cycles ac
      LEFT JOIN employees e ON ac.created_by = e.employee_id
      ORDER BY ac.created_at DESC
    `;
    const [audits] = await pool.execute(query);
    res.json({ success: true, data: audits });
  } catch (error) {
    next(error);
  }
};

exports.createAuditCycle = async (req, res, next) => {
  try {
    const { auditName, scopeType, scopeValue, startDate, endDate } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO audit_cycles (audit_name, scope_type, scope_value, start_date, end_date, status, created_by, created_at) VALUES (?, ?, ?, ?, ?, "Planned", ?, NOW())',
      [auditName, scopeType, scopeValue || null, startDate, endDate || null, req.user.employee_id]
    );

    res.status(201).json({
      success: true,
      message: 'Audit cycle created',
      data: { auditCycleId: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

exports.assignAuditors = async (req, res, next) => {
  try {
    const { auditCycleId } = req.params;
    const { auditorIds } = req.body;

    for (const auditorId of auditorIds) {
      await pool.execute(
        'INSERT INTO audit_assignments (audit_cycle_id, auditor_id, assigned_at) VALUES (?, ?, NOW())',
        [auditCycleId, auditorId]
      );
      await NotificationService.notifyAuditAssigned(auditorId, `Audit Cycle #${auditCycleId}`);
    }

    // Update audit status to In_Progress
    await pool.execute(
      'UPDATE audit_cycles SET status = "In_Progress", updated_at = NOW() WHERE audit_cycle_id = ?',
      [auditCycleId]
    );

    res.json({ success: true, message: 'Auditors assigned successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getAuditAssignments = async (req, res, next) => {
  try {
    const { auditCycleId } = req.params;
    const query = `
      SELECT aa.*,
             CONCAT(e.first_name, ' ', e.last_name) AS auditor_name,
             e.email AS auditor_email
      FROM audit_assignments aa
      JOIN employees e ON aa.auditor_id = e.employee_id
      WHERE aa.audit_cycle_id = ?
    `;
    const [assignments] = await pool.execute(query, [auditCycleId]);
    res.json({ success: true, data: assignments });
  } catch (error) {
    next(error);
  }
};

exports.getAuditAssets = async (req, res, next) => {
  try {
    const { auditCycleId } = req.params;

    // Get audit scope to determine which assets
    const [audits] = await pool.execute(
      'SELECT scope_type, scope_value FROM audit_cycles WHERE audit_cycle_id = ?',
      [auditCycleId]
    );

    if (audits.length === 0) {
      return res.status(404).json({ success: false, message: 'Audit cycle not found' });
    }

    const audit = audits[0];
    let assetQuery = `
      SELECT a.asset_id, a.asset_tag, a.asset_name, a.status, a.current_condition, a.location,
             c.category_name,
             d.department_name,
             ad.discrepancy_id, ad.actual_status AS audit_status, ad.notes AS audit_notes,
             ad.condition_found, ad.is_resolved
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.category_id
      LEFT JOIN departments d ON a.department_id = d.department_id
      LEFT JOIN audit_discrepancies ad ON a.asset_id = ad.asset_id AND ad.audit_cycle_id = ?
      WHERE 1=1
    `;
    const params = [auditCycleId];

    if (audit.scope_type === 'Department') {
      assetQuery += ' AND a.department_id = (SELECT department_id FROM departments WHERE department_name = ?)';
      params.push(audit.scope_value);
    } else if (audit.scope_type === 'Location') {
      assetQuery += ' AND a.location = ?';
      params.push(audit.scope_value);
    } else if (audit.scope_type === 'Category') {
      assetQuery += ' AND c.category_name = ?';
      params.push(audit.scope_value);
    }

    assetQuery += ' ORDER BY a.asset_tag';

    const [assets] = await pool.execute(assetQuery, params);
    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

exports.submitDiscrepancy = async (req, res, next) => {
  try {
    const { auditCycleId } = req.params;
    const { assetId, expectedStatus, actualStatus, locationFound, conditionFound, notes } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO audit_discrepancies 
       (audit_cycle_id, asset_id, auditor_id, expected_status, actual_status, location_found, condition_found, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
      [auditCycleId, assetId, req.user.employee_id, expectedStatus, actualStatus, locationFound || null, conditionFound || null, notes || null]
    );

    // Create notification for asset managers
    const [managers] = await pool.execute(
      'SELECT employee_id FROM employees WHERE role = "Asset_Manager" AND status = "Active"'
    );

    for (const manager of managers) {
      await NotificationService.createNotification(
        manager.employee_id,
        'Audit_Discrepancy_Flagged',
        'Audit Discrepancy Found',
        `A discrepancy has been found during audit cycle #${auditCycleId}. Asset ID: ${assetId}`,
        'Audit',
        auditCycleId
      );
    }

    res.status(201).json({
      success: true,
      message: 'Discrepancy submitted',
      data: { discrepancyId: result.insertId }
    });
  } catch (error) {
    next(error);
  }
};

exports.getDiscrepancies = async (req, res, next) => {
  try {
    const { auditCycleId } = req.params;
    const query = `
      SELECT ad.*, a.asset_tag, a.asset_name,
             CONCAT(e.first_name, ' ', e.last_name) AS auditor_name,
             CONCAT(e2.first_name, ' ', e2.last_name) AS resolved_by_name
      FROM audit_discrepancies ad
      JOIN assets a ON ad.asset_id = a.asset_id
      LEFT JOIN employees e ON ad.auditor_id = e.employee_id
      LEFT JOIN employees e2 ON ad.resolved_by = e2.employee_id
      WHERE ad.audit_cycle_id = ?
      ORDER BY ad.created_at DESC
    `;
    const [discrepancies] = await pool.execute(query, [auditCycleId]);
    res.json({ success: true, data: discrepancies });
  } catch (error) {
    next(error);
  }
};

exports.resolveDiscrepancy = async (req, res, next) => {
  try {
    const { discrepancyId } = req.params;
    const { resolutionAction, notes } = req.body;

    await pool.execute(
      `UPDATE audit_discrepancies 
       SET is_resolved = 1, resolved_by = ?, resolved_at = NOW(), resolution_action = ?, notes = CONCAT(IFNULL(notes, ''), '\nResolution: ', ?)
       WHERE discrepancy_id = ?`,
      [req.user.employee_id, resolutionAction, notes || '', discrepancyId]
    );

    res.json({ success: true, message: 'Discrepancy resolved' });
  } catch (error) {
    next(error);
  }
};

exports.closeAuditCycle = async (req, res, next) => {
  try {
    const { auditCycleId } = req.params;
    const { closureNotes } = req.body;

    // Update missing assets to Lost status
    await pool.execute(
      `UPDATE assets a
       JOIN audit_discrepancies ad ON a.asset_id = ad.asset_id
       SET a.status = 'Lost', a.updated_at = NOW()
       WHERE ad.audit_cycle_id = ? AND ad.actual_status = 'Missing' AND ad.is_resolved = 0`,
      [auditCycleId]
    );

    await pool.execute(
      'UPDATE audit_cycles SET status = "Closed", closed_at = NOW(), closure_notes = ? WHERE audit_cycle_id = ?',
      [closureNotes || null, auditCycleId]
    );

    res.json({ success: true, message: 'Audit cycle closed' });
  } catch (error) {
    next(error);
  }
};
