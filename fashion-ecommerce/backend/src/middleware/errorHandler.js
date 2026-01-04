"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const errorHandler = (err, _req, res, _next) => {
    try {
        let statusCode = 500;
        let message = 'Server Error';
        try {
            if (err?.message) {
                message = err.message;
            }
            else if (err?.toString) {
                message = err.toString();
            }
        }
        catch {
            message = 'Server Error';
        }
        if (process.env.NODE_ENV === 'development') {
            try {
                console.error('Error:', message);
            }
            catch {
            }
        }
        if (err?.name === 'CastError') {
            statusCode = 404;
            message = 'Resource not found';
        }
        try {
            if (err?.code === 11000) {
                statusCode = 400;
                message = 'Duplicate field value entered';
            }
        }
        catch {
        }
        try {
            if (err?.name === 'ValidationError') {
                const errors = err?.errors;
                if (errors && typeof errors === 'object') {
                    const messages = Object.values(errors)
                        .map((val) => val?.message || String(val))
                        .filter(Boolean)
                        .join(', ');
                    if (messages) {
                        message = messages;
                    }
                }
                statusCode = 400;
            }
        }
        catch {
        }
        try {
            if (err?.statusCode && typeof err.statusCode === 'number') {
                statusCode = err.statusCode;
            }
        }
        catch {
        }
        const response = {
            success: false,
            message: message,
        };
        if (process.env.NODE_ENV === 'development') {
            try {
                if (err?.stack) {
                    response.stack = err.stack;
                }
            }
            catch {
            }
        }
        res.status(statusCode).json(response);
    }
    catch (handlerError) {
        try {
            res.status(500).json({
                success: false,
                message: 'An error occurred while processing your request',
            });
        }
        catch {
        }
    }
};
exports.default = errorHandler;
