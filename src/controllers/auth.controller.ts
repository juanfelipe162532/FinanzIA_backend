import { Request, Response } from 'express';
import { StatusCodes } from 'http-status-codes';
import { AuthService } from '../services/auth.service';
import { LoginRequest, RegisterRequest } from '../models/auth.model';
import { logger } from '../utils/logger';
import asyncHandler from 'express-async-handler';

const authService = new AuthService();

export const register = asyncHandler(async (req: Request, res: Response) => {
  const userData: RegisterRequest = req.body;
  const result = await authService.register(userData);

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict',
  });

  res.status(StatusCodes.CREATED).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
    },
  });
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const loginData: LoginRequest = req.body;
  const result = await authService.login(loginData);

  // Set refresh token as HTTP-only cookie
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    sameSite: 'strict',
  });

  res.status(StatusCodes.OK).json({
    status: 'success',
    data: {
      user: result.user,
      accessToken: result.tokens.accessToken,
    },
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    await authService.logout(refreshToken);

    // Clear the cookie
    res.clearCookie('refreshToken');
  }

  res.status(StatusCodes.OK).json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export const refreshAccessToken = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies?.refreshToken;

  if (!refreshToken) {
    res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'fail',
      message: 'Refresh token not provided',
    });
    return;
  }

  try {
    const tokens = await authService.refreshToken(refreshToken);

    // Set new refresh token as HTTP-only cookie
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: 'strict',
    });

    res.status(StatusCodes.OK).json({
      status: 'success',
      data: {
        accessToken: tokens.accessToken,
      },
    });
  } catch (error) {
    logger.error('Error refreshing token:', error);

    // Clear the cookie on error
    res.clearCookie('refreshToken');

    res.status(StatusCodes.UNAUTHORIZED).json({
      status: 'fail',
      message: 'Invalid or expired refresh token',
    });
  }
});
