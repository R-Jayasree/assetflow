const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

const loginValidation = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidationErrors
];

const signupValidation = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('departmentId').optional().isInt().withMessage('Invalid department ID'),
  handleValidationErrors
];

const assetValidation = [
  body('assetName').trim().notEmpty().withMessage('Asset name is required'),
  body('categoryId').isInt().withMessage('Valid category ID is required'),
  body('serialNumber').optional().trim(),
  body('model').optional().trim(),
  body('manufacturer').optional().trim(),
  body('acquisitionDate').optional().isDate().withMessage('Invalid acquisition date'),
  body('acquisitionCost').optional().isDecimal().withMessage('Invalid cost'),
  body('location').optional().trim(),
  body('departmentId').optional().isInt().withMessage('Invalid department ID'),
  body('isBookable').optional().isBoolean(),
  handleValidationErrors
];

const allocationValidation = [
  body('assetId').isInt().withMessage('Valid asset ID is required'),
  body('allocatedToEmployeeId').optional().isInt(),
  body('allocatedToDepartmentId').optional().isInt(),
  body('expectedReturnDate').optional().isDate(),
  handleValidationErrors
];

const bookingValidation = [
  body('assetId').isInt().withMessage('Valid asset ID is required'),
  body('startTime').isISO8601().withMessage('Valid start time is required'),
  body('endTime').isISO8601().withMessage('Valid end time is required'),
  body('purpose').optional().trim(),
  handleValidationErrors
];

const maintenanceValidation = [
  body('assetId').isInt().withMessage('Valid asset ID is required'),
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('priority').optional().isIn(['Low', 'Medium', 'High', 'Critical']),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  loginValidation,
  signupValidation,
  assetValidation,
  allocationValidation,
  bookingValidation,
  maintenanceValidation
};
