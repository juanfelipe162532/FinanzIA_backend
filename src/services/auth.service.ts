import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { AppError } from '../middlewares/error.middleware';
import { StatusCodes } from 'http-status-codes';
import {
  AuthResponse,
  JwtPayload,
  LoginRequest,
  RefreshTokenPayload,
  RegisterRequest,
} from '../models/auth.model';
import { logger } from '../utils/logger';
import { SettingsService } from './settings.service';

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: RegisterRequest): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      throw new AppError('User already exists with this email', StatusCodes.CONFLICT);
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.password, salt);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        firstName: userData.firstName,
        lastName: userData.lastName,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar || undefined,
      },
      tokens,
    };
  }

  /**
   * Login a user
   */
  async login(loginData: LoginRequest): Promise<AuthResponse> {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: loginData.email },
    });

    if (!user) {
      throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }

    // Verificar si el usuario está bloqueado
    const isLocked = await SettingsService.isUserLocked(user.id);
    if (isLocked) {
      throw new AppError('Account is temporarily locked. Please try again later.', StatusCodes.LOCKED);
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(loginData.password, user.password);
    if (!isPasswordValid) {
      // Incrementar intentos de login fallidos
      await SettingsService.incrementLoginAttempts(user.id);
      throw new AppError('Invalid credentials', StatusCodes.UNAUTHORIZED);
    }

    // Actualizar último login exitoso
    await SettingsService.updateLastLogin(user.id);

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar || undefined,
      },
      tokens,
    };
  }

  /**
   * Logout a user by invalidating their refresh token
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Delete the refresh token from the database
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken },
      });
    } catch (error) {
      logger.error('Error during logout:', error);
      throw new AppError('Failed to logout', StatusCodes.INTERNAL_SERVER_ERROR);
    }
  }

  /**
   * Refresh access token using a valid refresh token
   */
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify the refresh token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as RefreshTokenPayload;

      // Find the token in the database
      const storedToken = await prisma.refreshToken.findFirst({
        where: {
          id: decoded.tokenId,
          userId: decoded.userId,
          token,
        },
      });

      if (!storedToken) {
        throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        // Delete expired token
        await prisma.refreshToken.delete({ where: { id: storedToken.id } });
        throw new AppError('Refresh token expired', StatusCodes.UNAUTHORIZED);
      }

      // Find the user
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
      });

      if (!user) {
        throw new AppError('User not found', StatusCodes.NOT_FOUND);
      }

      // Delete the old refresh token
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });

      // Generate new tokens
      return await this.generateTokens(user.id, user.email);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid refresh token', StatusCodes.UNAUTHORIZED);
    }
  }

  /**
   * Generate JWT access token
   */
  private generateAccessToken(payload: JwtPayload): string {
    const secret = process.env.JWT_SECRET || 'default_secret_key';
    return jwt.sign(payload, secret, { expiresIn: '15m' });
  }

  /**
   * Generate JWT access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    email: string
  ): Promise<{ accessToken: string; refreshToken: string }> {
    // Generate access token
    const accessToken = this.generateAccessToken({ userId, email });

    // Generate refresh token with a unique ID
    const refreshTokenId = uuidv4();
    const refreshToken = jwt.sign(
      { userId, tokenId: refreshTokenId } as RefreshTokenPayload,
      process.env.JWT_SECRET || 'default_secret_key',
      { expiresIn: '7d' }
    );

    // Calculate expiry date (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Store refresh token in database
    await prisma.refreshToken.create({
      data: {
        id: refreshTokenId,
        token: refreshToken,
        userId,
        expiresAt,
      },
    });

    return { accessToken, refreshToken };
  }
}
