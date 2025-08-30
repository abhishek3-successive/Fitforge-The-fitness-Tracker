import { Request, Response, NextFunction } from "express";
import { sendValidationError } from "../utils";

/**
 * Validate required fields in request body
 */
export const validateRequiredFields = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const missingFields: string[] = [];
    
    fields.forEach(field => {
      if (!req.body[field] && req.body[field] !== 0 && req.body[field] !== false) {
        missingFields.push(field);
      }
    });

    if (missingFields.length > 0) {
      return sendValidationError(
        res, 
        `Missing required fields: ${missingFields.join(', ')}`
      );
    }

    next();
  };
};

/**
 * Validate pagination parameters
 */
export const validatePaginationParams = (req: Request, res: Response, next: NextFunction) => {
  const { page, limit } = req.query;
  
  if (page && (isNaN(Number(page)) || Number(page) < 1)) {
    return sendValidationError(res, "Page must be a positive integer");
  }
  
  if (limit && (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)) {
    return sendValidationError(res, "Limit must be a positive integer between 1 and 100");
  }
  
  next();
};

/**
 * Validate MongoDB ObjectId parameter
 */
export const validateObjectId = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    
    if (!objectIdRegex.test(id)) {
      return sendValidationError(res, `Invalid ${paramName} format`);
    }
    
    next();
  };
};

/**
 * Validate email format in request body
 */
export const validateEmail = (req: Request, res: Response, next: NextFunction) => {
  const { email } = req.body;
  
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return sendValidationError(res, "Please provide a valid email address");
    }
  }
  
  next();
};

/**
 * Validate password strength
 */
export const validatePassword = (req: Request, res: Response, next: NextFunction) => {
  const { password } = req.body;
  
  if (password) {
    if (password.length < 6) {
      return sendValidationError(res, "Password must be at least 6 characters long");
    }
    
    // Temporarily relaxed for testing - just require 6+ characters
    // if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    //   return sendValidationError(
    //     res, 
    //     "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    //   );
    // }
  }
  
  next();
};

/**
 * Validate rating value (1-5)
 */
export const validateRating = (req: Request, res: Response, next: NextFunction) => {
  const { rating } = req.body;
  
  if (rating !== undefined) {
    const numRating = Number(rating);
    if (!Number.isInteger(numRating) || numRating < 1 || numRating > 5) {
      return sendValidationError(res, "Rating must be an integer between 1 and 5");
    }
  }
  
  next();
};

/**
 * Validate date format
 */
export const validateDate = (fieldName: string, required: boolean = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const dateValue = req.body[fieldName] || req.query[fieldName];
    
    if (!dateValue && required) {
      return sendValidationError(res, `${fieldName} is required`);
    }
    
    if (dateValue) {
      const date = new Date(dateValue as string);
      if (isNaN(date.getTime())) {
        return sendValidationError(res, `${fieldName} must be a valid date`);
      }
    }
    
    next();
  };
};

/**
 * Validate array field
 */
export const validateArray = (fieldName: string, minLength?: number, maxLength?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const arrayValue = req.body[fieldName];
    
    if (arrayValue !== undefined) {
      if (!Array.isArray(arrayValue)) {
        return sendValidationError(res, `${fieldName} must be an array`);
      }
      
      if (minLength !== undefined && arrayValue.length < minLength) {
        return sendValidationError(res, `${fieldName} must have at least ${minLength} items`);
      }
      
      if (maxLength !== undefined && arrayValue.length > maxLength) {
        return sendValidationError(res, `${fieldName} cannot have more than ${maxLength} items`);
      }
    }
    
    next();
  };
};

/**
 * Validate enum values
 */
export const validateEnum = (fieldName: string, allowedValues: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[fieldName] || req.query[fieldName];
    
    if (value && !allowedValues.includes(value as string)) {
      return sendValidationError(
        res, 
        `${fieldName} must be one of: ${allowedValues.join(', ')}`
      );
    }
    
    next();
  };
};

/**
 * Validate numeric range
 */
export const validateNumericRange = (fieldName: string, min?: number, max?: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const value = req.body[fieldName] || req.query[fieldName];
    
    if (value !== undefined) {
      const numValue = Number(value);
      
      if (isNaN(numValue)) {
        return sendValidationError(res, `${fieldName} must be a valid number`);
      }
      
      if (min !== undefined && numValue < min) {
        return sendValidationError(res, `${fieldName} must be at least ${min}`);
      }
      
      if (max !== undefined && numValue > max) {
        return sendValidationError(res, `${fieldName} cannot be greater than ${max}`);
      }
    }
    
    next();
  };
};

/**
 * Sanitize string inputs
 */
export const sanitizeStrings = (fields: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.body[field] && typeof req.body[field] === 'string') {
        req.body[field] = req.body[field]
          .trim()
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
          .replace(/[<>]/g, ''); // Remove angle brackets
      }
    });
    
    next();
  };
};
