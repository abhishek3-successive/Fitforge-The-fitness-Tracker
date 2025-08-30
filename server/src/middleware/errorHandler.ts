import { Request, Response, NextFunction } from "express";
import { sendError } from "../utils";

/**
 * Global error handling middleware
 */
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Error Details:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((error: any) => error.message);
    return sendError(res, `Validation Error: ${errors.join(', ')}`, 400);
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return sendError(res, 'Invalid resource ID format', 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    return sendError(res, `${field} '${value}' already exists`, 409);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired', 401);
  }

  // MongoDB connection errors
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    return sendError(res, 'Database connection error', 503);
  }

  // Default server error
  return sendError(
    res,
    'Internal server error',
    err.statusCode || 500,
    process.env.NODE_ENV === 'development' ? err : undefined
  );
};

/**
 * 404 handler for undefined routes
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  return sendError(
    res,
    `Route ${req.originalUrl} not found`,
    404
  );
};

/**
 * Async wrapper to catch errors in async route handlers
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
