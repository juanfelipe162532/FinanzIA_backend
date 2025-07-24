import { Request, Response, NextFunction } from 'express';
import { StatusCodes } from 'http-status-codes';
import { logger } from '../utils/logger';

export class AppError extends Error {
  statusCode: number;
  status: string;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: AppError | Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Default error status and message
  let statusCode = StatusCodes.INTERNAL_SERVER_ERROR;
  let message = 'Something went wrong';

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle other errors
  else if (err instanceof Error) {
    message = err.message;
  }

  // Log the error in development
  if (process.env.NODE_ENV === 'development') {
    logger.error({
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  // Send error response
  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    statusCode: StatusCodes.NOT_FOUND,
    message: `Can't find ${req.originalUrl} on this server!`,
  });
};
