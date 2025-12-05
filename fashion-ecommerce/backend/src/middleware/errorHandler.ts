import { Request, Response, NextFunction } from 'express';

export interface ErrorResponse extends Error {
  statusCode?: number;
  errors?: any;
}

const errorHandler = (err: ErrorResponse, _req: Request, res: Response, _next: NextFunction) => {
  // Always ensure we return a valid JSON response
  // Never throw exceptions from error handler
  try {
    // Safely extract error information
    let statusCode = 500;
    let message = 'Server Error';
    
    try {
      // Safely get error message
      if (err?.message) {
        message = err.message;
      } else if (err?.toString) {
        message = err.toString();
      }
    } catch {
      message = 'Server Error';
    }

    // Log error for dev (safely)
    if (process.env.NODE_ENV === 'development') {
      try {
        console.error('Error:', message);
      } catch {
        // Silent fail for logging
      }
    }

    // Mongoose bad ObjectId
    if (err?.name === 'CastError') {
      statusCode = 404;
      message = 'Resource not found';
    }

    // Mongoose duplicate key
    try {
      if ((err as any)?.code === 11000) {
        statusCode = 400;
        message = 'Duplicate field value entered';
      }
    } catch {
      // Ignore if code check fails
    }

    // Mongoose validation error
    try {
      if (err?.name === 'ValidationError') {
        const errors = (err as any)?.errors;
        if (errors && typeof errors === 'object') {
          const messages = Object.values(errors)
            .map((val: any) => val?.message || String(val))
            .filter(Boolean)
            .join(', ');
          if (messages) {
            message = messages;
          }
        }
        statusCode = 400;
      }
    } catch {
      // Ignore if validation error processing fails
    }

    // Safely get status code
    try {
      if (err?.statusCode && typeof err.statusCode === 'number') {
        statusCode = err.statusCode;
      }
    } catch {
      // Use default 500
    }

    // Build safe response
    const response: any = {
      success: false,
      message: message,
    };

    // Only add stack in development
    if (process.env.NODE_ENV === 'development') {
      try {
        if (err?.stack) {
          response.stack = err.stack;
        }
      } catch {
        // Ignore if stack extraction fails
      }
    }

    // Always send valid JSON response
    res.status(statusCode).json(response);
  } catch (handlerError) {
    // Ultimate fallback - ensure response is always sent
    try {
      res.status(500).json({
        success: false,
        message: 'An error occurred while processing your request',
      });
    } catch {
      // If even this fails, there's nothing more we can do
      // The response may have already been sent
    }
  }
};

export default errorHandler;

