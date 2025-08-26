import { Request, Response, NextFunction } from "express";

/**
 * Async wrapper for route handlers to catch errors automatically
 * This version just passes errors to next() for the global error handler
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
