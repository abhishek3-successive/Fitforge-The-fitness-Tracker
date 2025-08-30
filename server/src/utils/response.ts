import { Response } from "express";
import { PaginationMeta } from "./pagnation";

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string | any;
  pagination?: PaginationMeta;
  timestamp?: string;
}

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200,
  pagination?: PaginationMeta
) => {
  const response: ApiResponse<T> = {
    success: true,
    timestamp: new Date().toISOString()
  };

  if (message) response.message = message;
  if (data !== undefined) response.data = data;
  if (pagination) response.pagination = pagination;

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string,
  statusCode: number = 500,
  error?: any
) => {
  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString()
  };

  if (error && process.env.NODE_ENV === 'development') {
    response.error = error instanceof Error ? error.message : error;
  }

  return res.status(statusCode).json(response);
};

/**
 * Send not found response
 */
export const sendNotFound = (res: Response, resource: string = "Resource") => {
  return sendError(res, `${resource} not found`, 404);
};

/**
 * Send validation error response
 */
export const sendValidationError = (res: Response, message: string = "Validation failed") => {
  return sendError(res, message, 400);
};

/**
 * Send unauthorized response
 */
export const sendUnauthorized = (res: Response, message: string = "Unauthorized") => {
  return sendError(res, message, 401);
};

/**
 * Send forbidden response
 */
export const sendForbidden = (res: Response, message: string = "Forbidden") => {
  return sendError(res, message, 403);
};
