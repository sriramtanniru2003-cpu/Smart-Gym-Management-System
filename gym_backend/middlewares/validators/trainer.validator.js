const { body, validationResult } = require('express-validator');

exports.validateTrainer = [
    body('name').notEmpty().withMessage('Trainer name is required'),

    body('contactInformation.email')
        .isEmail().withMessage('Valid email is required'),

    body('contactInformation.phone')
        .optional()
        .isString(),

    body('specialization')
        .optional()
        .isString(),

    body('availability')
        .optional()
        .isArray().withMessage('Availability must be an array'),

    body('availability.*.day')
        .optional()
        .isString().withMessage('Day must be a string'),

    body('availability.*.startTime')
        .optional()
        .isString().withMessage('Start time must be a string'),

    body('availability.*.endTime')
        .optional()
        .isString().withMessage('End time must be a string'),

    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        next();
    }
];
