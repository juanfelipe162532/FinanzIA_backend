import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';

export const notFoundHandler = (req: Request, res: Response) => {
  res.status(StatusCodes.NOT_FOUND).json({
    status: 'error',
    statusCode: StatusCodes.NOT_FOUND,
    message: `Can't find ${req.originalUrl} on this server!`,
  });
};
