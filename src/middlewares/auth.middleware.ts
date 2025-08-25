import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { JwtPayload } from '../models/auth.model';
import { AppError } from './error.middleware';

// Extend Express Request interface to include user
declare module 'express' {
  interface Request {
    user?: {
      id: string;
      userId: string;
      email: string;
    };
  }
}

/**
 * Middleware to protect routes that require authentication
 */
export const protect = (req: Request, res: Response, next: NextFunction) => {
  try {
    console.log('Auth middleware called');
    // Get token from header
    const authHeader = req.headers.authorization;
    console.log('Auth header:', authHeader);
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const [, tokenValue] = authHeader.split(' ');
      token = tokenValue;
      console.log('Token extracted:', token ? 'yes' : 'no');
    }

    // Check if token exists
    if (!token) {
      console.log('No token found');
      return next(new AppError('Not authorized to access this route', StatusCodes.UNAUTHORIZED));
    }

    try {
      // Verify token
      console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'exists' : 'missing');
      console.log('Token:', token.substring(0, 20) + '...');
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      console.log('Token decoded successfully:', decoded);

      // Add user to request
      req.user = {
        id: decoded.userId,
        userId: decoded.userId,
        email: decoded.email,
      };

      next();
    } catch (error) {
      console.log('JWT verification error:', error);
      return next(new AppError('Not authorized to access this route', StatusCodes.UNAUTHORIZED));
    }
  } catch (error) {
    return next(new AppError('Authentication error', StatusCodes.INTERNAL_SERVER_ERROR));
  }
};

/**
 * Middleware to validate request body for login
 */
export const validateLoginRequest = (req: Request, res: Response, next: NextFunction) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new AppError('Please provide email and password', StatusCodes.BAD_REQUEST));
  }

  next();
};

/**
 * Middleware to validate request body for registration
 */
export const validateRegisterRequest = (req: Request, res: Response, next: NextFunction) => {
  const { email, password, firstName, lastName } = req.body;

  if (!email || !password || !firstName || !lastName) {
    return next(
      new AppError(
        'Please provide email, password, firstName and lastName',
        StatusCodes.BAD_REQUEST
      )
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new AppError('Please provide a valid email', StatusCodes.BAD_REQUEST));
  }

  // Validate password strength
  if (password.length < 6) {
    return next(
      new AppError('Password must be at least 6 characters long', StatusCodes.BAD_REQUEST)
    );
  }

  next();
};
