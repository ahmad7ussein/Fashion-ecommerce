"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.designValidation = exports.orderValidation = exports.productValidation = exports.loginValidation = exports.registerValidation = exports.validate = void 0;
const express_validator_1 = require("express-validator");
const validate = (req, res, next) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        const errorMessages = errors.array().map((err) => err.msg || err.message || 'Validation error').join(', ');
        return res.status(400).json({
            success: false,
            message: errorMessages || 'Validation failed',
            errors: errors.array(),
        });
    }
    next();
};
exports.validate = validate;
exports.registerValidation = [
    (0, express_validator_1.body)('firstName').trim().notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Please provide a valid email'),
    (0, express_validator_1.body)('password')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters'),
];
exports.loginValidation = [
    (0, express_validator_1.body)('identifier').notEmpty().withMessage('Email or ID is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
exports.productValidation = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Product name is required'),
    (0, express_validator_1.body)('price').isNumeric().withMessage('Price must be a number'),
    (0, express_validator_1.body)('category').notEmpty().withMessage('Category is required'),
    (0, express_validator_1.body)('gender').notEmpty().withMessage('Gender is required'),
];
exports.orderValidation = [
    (0, express_validator_1.body)('items').isArray({ min: 1 }).withMessage('Order must have at least one item'),
    (0, express_validator_1.body)('shippingAddress.firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('shippingAddress.lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('shippingAddress.email').isEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('shippingAddress.phone').notEmpty().withMessage('Phone is required'),
    (0, express_validator_1.body)('shippingAddress.street').notEmpty().withMessage('Street address is required'),
    (0, express_validator_1.body)('shippingAddress.city').notEmpty().withMessage('City is required'),
    (0, express_validator_1.body)('shippingAddress.state').notEmpty().withMessage('State is required'),
    (0, express_validator_1.body)('shippingAddress.zip').notEmpty().withMessage('ZIP code is required'),
    (0, express_validator_1.body)('shippingAddress.country').notEmpty().withMessage('Country is required'),
];
exports.designValidation = [
    (0, express_validator_1.body)('name').trim().notEmpty().withMessage('Design name is required'),
    (0, express_validator_1.body)('elements').optional().isArray().withMessage('Elements must be an array'),
    (0, express_validator_1.body)('views').optional().isArray().withMessage('Views must be an array'),
];
