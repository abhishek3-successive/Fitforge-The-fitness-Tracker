import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from "../models/user";
import { sendError, sendUnauthorized } from "../utils";

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export interface JWTPayload {
  id: string;
  email: string;
  username: string;
}

/**
 * Generate JWT token
 */
export const generateToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_SECRET || 'your-fallback-secret-key';
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';
  
  return jwt.sign(payload, secret, { expiresIn } as any);
};

/**
 * Generate refresh token
 */
export const generateRefreshToken = (payload: JWTPayload): string => {
  const secret = process.env.JWT_REFRESH_SECRET || 'your-fallback-refresh-secret';
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
  
  return jwt.sign(payload, secret, { expiresIn } as any);
};

/**
 * Verify JWT token
 */
export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const secret = process.env.JWT_SECRET || 'your-fallback-secret-key';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Verify refresh token
 */
export const verifyRefreshToken = (token: string): JWTPayload | null => {
  try {
    const secret = process.env.JWT_REFRESH_SECRET || 'your-fallback-refresh-secret';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Middleware to authenticate user using JWT token
 */
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

    if (!token) {
      return sendUnauthorized(res, "Access token is required");
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return sendUnauthorized(res, "Invalid or expired token");
    }

    // Get user from database to ensure user still exists and is active
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return sendUnauthorized(res, "User not found or account deactivated");
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    return sendError(res, "Authentication failed", 401, error);
  }
};

/**
 * Middleware to check if user is authenticated (optional)
 * Adds user to request if token is valid, but doesn't block request if no token
 */
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        const user = await User.findById(decoded.id).select('-password');
        if (user) {
          req.user = user;
        }
      }
    }
    
    next();
  } catch (error) {
    // Continue without authentication
    next();
  }
};

/**
 * Middleware to check if authenticated user owns the resource
 */
export const checkResourceOwnership = (resourceIdParam: string = 'id', userFieldName: string = 'user') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return sendUnauthorized(res, "Authentication required");
      }

      const resourceId = req.params[resourceIdParam];
      const userId = req.user._id.toString();

      // For routes where the resource ID is the user ID
      if (userFieldName === 'userId' || userFieldName === 'id') {
        if (resourceId !== userId) {
          return res.json( {msg : "Access denied: You can only access your own resources"});
        }
      } else {
        // For routes where we need to check resource ownership
        // This would require checking the database - implement as needed per model
        // For now, we'll pass the check to the controller to handle
      }

      next();
    } catch (error) {
      return sendError(res, "Authorization check failed", 500, error);
    }
  };
};

/**
 * Middleware to check if user has specific role
 */
export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res, "Authentication required");
    }

    // Assuming user model has a role field
    if (!req.user.role || !roles.includes(req.user.role)) {
      return sendError(res, "Access denied: Insufficient permissions", 403);
    }

    next();
  };
};

/**
 * Middleware to check if user is admin
 */
export const requireAdmin = requireRole(['admin']);

/**
 * Rate limiting by user ID
 */
export const rateLimitByUser = (maxRequests: number, windowMinutes: number) => {
  const attempts: Map<string, { count: number; resetTime: number }> = new Map();

  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res, "Authentication required for rate limiting");
    }

    const userId = req.user._id.toString();
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    const userAttempts = attempts.get(userId);

    if (!userAttempts) {
      attempts.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (now > userAttempts.resetTime) {
      // Reset window
      attempts.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }

    if (userAttempts.count >= maxRequests) {
      return sendError(
        res, 
        `Rate limit exceeded. Try again in ${Math.ceil((userAttempts.resetTime - now) / 60000)} minutes`, 
        429
      );
    }

    userAttempts.count++;
    next();
  };
};
