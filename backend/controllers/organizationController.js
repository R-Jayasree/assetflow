const pool = require('../config/database');

// ========== DEPARTMENTS ==========
exports.getDepartments = async (req, res, next) => {
  try {
    const query = `
      SELECT d.department_id, d.department_name, d.department_code, 
             d.parent_department_id, d.status, d.description, d.created_at,
             pd.department_name AS parent_department_name,
             CONCAT(e.first_name, ' ', e.last_name) AS department_head_name
      FROM departments d
      LEFT JOIN departments pd ON d.parent_department_id = pd.department_id
      LEFT JOIN employees e ON d.department_head_id = e.employee_id
      ORDER BY d.department_name
    `;
    const [departments] = await pool.execute(query);
    res.json({ success: true, data: departments });
  } catch (error) {
    next(error);
  }
};

exports.createDepartment = async (req, res, next) => {
  try {
    const { departmentName, departmentCode, parentDepartmentId, description, departmentHeadId } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO departments (department_name, department_code, parent_department_id, description, department_head_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [departmentName, departmentCode, parentDepartmentId || null, description || null, departmentHeadId || null]
    );

    res.status(201).json({ success: true, message: 'Department created', data: { departmentId: result.insertId } });
  } catch (error) {
    next(error);
  }
};

exports.updateDepartment = async (req, res, next) => {
  try {
    const { departmentId } = req.params;
    const { departmentName, departmentCode, parentDepartmentId, description, departmentHeadId, status } = req.body;

    await pool.execute(
      'UPDATE departments SET department_name = ?, department_code = ?, parent_department_id = ?, description = ?, department_head_id = ?, status = ?, updated_at = NOW() WHERE department_id = ?',
      [departmentName, departmentCode, parentDepartmentId || null, description || null, departmentHeadId || null, status, departmentId]
    );

    res.json({ success: true, message: 'Department updated' });
  } catch (error) {
    next(error);
  }
};

// ========== ASSET CATEGORIES ==========
exports.getCategories = async (req, res, next) => {
  try {
    const [categories] = await pool.execute('SELECT * FROM asset_categories ORDER BY category_name');
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};

exports.createCategory = async (req, res, next) => {
  try {
    const { categoryName, categoryCode, description, customFieldsSchema, depreciationRate } = req.body;

    const [result] = await pool.execute(
      'INSERT INTO asset_categories (category_name, category_code, description, custom_fields_schema, depreciation_rate, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [categoryName, categoryCode, description || null, customFieldsSchema || null, depreciationRate || null]
    );

    res.status(201).json({ success: true, message: 'Category created', data: { categoryId: result.insertId } });
  } catch (error) {
    next(error);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { categoryName, categoryCode, description, customFieldsSchema, depreciationRate, status } = req.body;

    await pool.execute(
      'UPDATE asset_categories SET category_name = ?, category_code = ?, description = ?, custom_fields_schema = ?, depreciation_rate = ?, status = ?, updated_at = NOW() WHERE category_id = ?',
      [categoryName, categoryCode, description || null, customFieldsSchema || null, depreciationRate || null, status, categoryId]
    );

    res.json({ success: true, message: 'Category updated' });
  } catch (error) {
    next(error);
  }
};
