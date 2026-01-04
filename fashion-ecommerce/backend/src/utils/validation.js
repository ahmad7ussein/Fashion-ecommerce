"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEnum = exports.validateObjectId = exports.isValidObjectId = void 0;
const isValidObjectId = (id) => {
    if (!id || typeof id !== 'string') {
        return false;
    }
    return /^[0-9a-fA-F]{24}$/.test(id);
};
exports.isValidObjectId = isValidObjectId;
const validateObjectId = (id, fieldName = 'ID') => {
    if (!(0, exports.isValidObjectId)(id)) {
        return {
            success: false,
            message: `Invalid ${fieldName} format`,
        };
    }
    return null;
};
exports.validateObjectId = validateObjectId;
const validateEnum = (value, validValues, fieldName) => {
    if (value && !validValues.includes(value)) {
        return {
            success: false,
            message: `Invalid ${fieldName}. Must be one of: ${validValues.join(', ')}`,
        };
    }
    return null;
};
exports.validateEnum = validateEnum;
