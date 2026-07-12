const pool = require('../config/database');

exports.getAssets = async (req, res, next) => {
  try {
    const { search, categoryId, status, departmentId, location, isBookable } = req.query;
    let query = `
      SELECT a.asset_id, a.asset_tag, a.asset_name, a.serial_number, a.model, a.manufacturer,
             a.acquisition_date, a.acquisition_cost, a.current_condition, a.location,
             a.status, a.is_bookable, a.created_at,
             c.category_name, c.category_code,
             d.department_name,
             CONCAT(e.first_name, ' ', e.last_name) AS created_by_name
      FROM assets a
      LEFT JOIN asset_categories c ON a.category_id = c.category_id
      LEFT JOIN departments d ON a.department_id = d.department_id
      LEFT JOIN employees e ON a.created_by = e.employee_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ' AND (a.asset_tag LIKE ? OR a.asset_name LIKE ? OR a.serial_number LIKE ?)';
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    if (categoryId) {
      query += ' AND a.category_id = ?';
      params.push(categoryId);
    }
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (departmentId) {
      query += ' AND a.department_id = ?';
      params.push(departmentId);
    }
    if (location) {
      query += ' AND a.location LIKE ?';
      params.push(`%${location}%`);
    }
    if (isBookable !== undefined) {
      query += ' AND a.is_bookable = ?';
      params.push(isBookable === 'true' || isBookable === '1' ? 1 : 0);
    }

    query += ' ORDER BY a.created_at DESC';

    const [assets] = await pool.execute(query, params);
    res.json({ success: true, data: assets });
  } catch (error) {
    next(error);
  }
};

exports.getAssetById = async (req, res, next) => {
  try {
    const { assetId } = req.params;

    const [assets] = await pool.execute(
      `SELECT a.*, c.category_name, d.department_name,
              CONCAT(e.first_name, ' ', e.last_name) AS created_by_name
       FROM assets a
       LEFT JOIN asset_categories c ON a.category_id = c.category_id
       LEFT JOIN departments d ON a.department_id = d.department_id
       LEFT JOIN employees e ON a.created_by = e.employee_id
       WHERE a.asset_id = ?`,
      [assetId]
    );

    if (assets.length === 0) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    // Get allocation history
    const [allocations] = await pool.execute(
      `SELECT al.*, 
              CONCAT(e.first_name, ' ', e.last_name) AS allocated_to_name,
              CONCAT(e2.first_name, ' ', e2.last_name) AS allocated_by_name
       FROM asset_allocations al
       LEFT JOIN employees e ON al.allocated_to_employee_id = e.employee_id
       LEFT JOIN employees e2 ON al.allocated_by = e2.employee_id
       WHERE al.asset_id = ? ORDER BY al.created_at DESC`,
      [assetId]
    );

    // Get maintenance history
    const [maintenance] = await pool.execute(
      `SELECT mr.*,
              CONCAT(e.first_name, ' ', e.last_name) AS requested_by_name,
              CONCAT(e2.first_name, ' ', e2.last_name) AS approved_by_name
       FROM maintenance_requests mr
       LEFT JOIN employees e ON mr.requested_by = e.employee_id
       LEFT JOIN employees e2 ON mr.approved_by = e2.employee_id
       WHERE mr.asset_id = ? ORDER BY mr.created_at DESC`,
      [assetId]
    );

    res.json({
      success: true,
      data: {
        ...assets[0],
        allocationHistory: allocations,
        maintenanceHistory: maintenance
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.createAsset = async (req, res, next) => {
  try {
    const {
      assetName, categoryId, serialNumber, model, manufacturer,
      acquisitionDate, acquisitionCost, location, departmentId,
      isBookable, notes, customFieldValues
    } = req.body;

    // Generate asset tag
    const [tagResult] = await pool.execute('CALL sp_generate_asset_tag(@asset_tag)');
    const [tagRow] = await pool.execute('SELECT @asset_tag AS asset_tag');
    const assetTag = tagRow[0].asset_tag;

    const [result] = await pool.execute(
      `INSERT INTO assets (
        asset_tag, asset_name, category_id, serial_number, model, manufacturer,
        acquisition_date, acquisition_cost, location, department_id, is_bookable,
        status, custom_field_values, notes, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Available', ?, ?, ?, NOW())`,
      [
        assetTag, assetName, categoryId, serialNumber || null, model || null,
        manufacturer || null, acquisitionDate || null, acquisitionCost || null,
        location || null, departmentId || null, isBookable ? 1 : 0,
        customFieldValues || null, notes || null, req.user.employee_id
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Asset registered successfully',
      data: { assetId: result.insertId, assetTag }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAsset = async (req, res, next) => {
  try {
    const { assetId } = req.params;
    const {
      assetName, categoryId, serialNumber, model, manufacturer,
      acquisitionDate, acquisitionCost, currentCondition, location,
      departmentId, isBookable, status, notes, customFieldValues
    } = req.body;

    await pool.execute(
      `UPDATE assets SET
        asset_name = ?, category_id = ?, serial_number = ?, model = ?,
        manufacturer = ?, acquisition_date = ?, acquisition_cost = ?,
        current_condition = ?, location = ?, department_id = ?, is_bookable = ?,
        status = ?, custom_field_values = ?, notes = ?, updated_at = NOW()
      WHERE asset_id = ?`,
      [
        assetName, categoryId, serialNumber || null, model || null,
        manufacturer || null, acquisitionDate || null, acquisitionCost || null,
        currentCondition, location || null, departmentId || null,
        isBookable ? 1 : 0, status, customFieldValues || null, notes || null, assetId
      ]
    );

    res.json({ success: true, message: 'Asset updated successfully' });
  } catch (error) {
    next(error);
  }
};

exports.getCurrentHolders = async (req, res, next) => {
  try {
    const [holders] = await pool.execute('SELECT * FROM vw_current_asset_holders');
    res.json({ success: true, data: holders });
  } catch (error) {
    next(error);
  }
};
