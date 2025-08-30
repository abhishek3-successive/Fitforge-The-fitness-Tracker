import { Request } from "express";

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
}

export interface PaginationResult {
  skip: number;
  limit: number;
  page: number;
}

export interface PaginationMeta {
  current: number;
  total: number;
  count: number;
  totalCount: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Extract pagination parameters from request query
 */
export const getPaginationFromQuery = (
  query: Request['query'], 
  options: PaginationOptions = {}
): PaginationResult => {
  const { maxLimit = 100 } = options;
  
  const page = Math.max(1, parseInt(query.page as string) || 1);
  let limit = parseInt(query.limit as string) || options.limit || 20;
  
  // Enforce maximum limit
  limit = Math.min(limit, maxLimit);
  
  const skip = (page - 1) * limit;
  
  return {
    skip,
    limit,
    page
  };
};

/**
 * Create pagination metadata
 */
export const createPaginationMeta = (
  page: number,
  limit: number,
  totalCount: number,
  currentCount: number
): PaginationMeta => {
  const totalPages = Math.ceil(totalCount / limit);
  
  return {
    current: page,
    total: totalPages,
    count: currentCount,
    totalCount,
    hasNext: page < totalPages,
    hasPrev: page > 1
  };
};
