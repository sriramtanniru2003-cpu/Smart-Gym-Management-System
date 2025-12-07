const { body, validationResult } = require('express-validator');

exports.validateClass = [
    body('name')
        .notEmpty().withMessage('Class name is required'),

    body('description')
        .optional()
        .isString(),

    body('schedule')
        .isArray().withMessage('Schedule must be an array'),

    body('schedule.*.day')
        .notEmpty().withMessage('Day is required'),

    body('schedule.*.startTime')
        .notEmpty().withMessage('Start time is required'),

    body('schedule.*.endTime')
        .notEmpty().withMessage('End time is required'),

    body('trainerId')
        .optional()
        .isMongoId().withMessage('Invalid trainer ID'),

    body('members')
        .optional()
        .isArray().withMessage('Members must be an array'),

    body('members.*')
        .optional()
        .isMongoId().withMessage('Member IDs must be valid'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
