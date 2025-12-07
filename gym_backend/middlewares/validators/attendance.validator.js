const { body, validationResult } = require('express-validator');

exports.validateAttendance = [
    body('memberId')
        .notEmpty().withMessage('Member ID is required')
        .isMongoId().withMessage('Invalid member ID'),

    body('date')
        .notEmpty().withMessage('Date is required')
        .isISO8601().withMessage('Invalid date format'),

    body('attendanceType')
        .notEmpty().withMessage('Attendance type is required')
        .isIn(['entry', 'exit']).withMessage('Attendance type must be entry or exit'),

    body('attended')
        .isBoolean().withMessage('Attended must be true or false'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
