import prisma from '../config/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export class SettingsService {
  /**
   * Obtiene la configuración del usuario
   */
  static async getUserSettings(userId: string) {
    try {
      let settings = await prisma.userSettings.findUnique({
        where: { userId },
      });

      // Si no existe configuración, crear una por defecto
      if (!settings) {
        settings = await this.createDefaultSettings(userId);
      }

      logger.info(`Retrieved settings for user: ${userId}`);
      return settings;
    } catch (error) {
      logger.error('Error fetching user settings:', error);
      throw new Error('Failed to fetch user settings');
    }
  }

  /**
   * Actualiza la configuración del usuario
   */
  static async updateUserSettings(userId: string, settingsData: any) {
    try {
      const settings = await prisma.userSettings.upsert({
        where: { userId },
        update: {
          currency: settingsData.currency,
          timezone: settingsData.timezone,
          language: settingsData.language,
          dateFormat: settingsData.dateFormat,
          notifications: settingsData.notifications,
          theme: settingsData.theme,
        },
        create: {
          userId,
          currency: settingsData.currency || 'COP',
          timezone: settingsData.timezone || 'America/Bogota',
          language: settingsData.language || 'es',
          dateFormat: settingsData.dateFormat || 'DD/MM/YYYY',
          notifications: settingsData.notifications || {
            email: true,
            push: true,
            budgetAlerts: true,
            goalReminders: true,
          },
          theme: settingsData.theme || 'system',
        },
      });

      logger.info(`Updated settings for user: ${userId}`);
      return settings;
    } catch (error) {
      logger.error('Error updating user settings:', error);
      throw new Error('Failed to update user settings');
    }
  }

  /**
   * Obtiene la configuración de seguridad del usuario
   */
  static async getUserSecurity(userId: string) {
    try {
      let security = await prisma.userSecurity.findUnique({
        where: { userId },
        select: {
          id: true,
          userId: true,
          twoFactorEnabled: true,
          loginAttempts: true,
          lockedUntil: true,
          lastLoginAt: true,
          passwordChangedAt: true,
          createdAt: true,
          updatedAt: true,
          // No incluir secrets ni backup codes por seguridad
        },
      });

      // Si no existe configuración de seguridad, crear una por defecto
      if (!security) {
        security = await this.createDefaultSecurity(userId);
      }

      logger.info(`Retrieved security settings for user: ${userId}`);
      return security;
    } catch (error) {
      logger.error('Error fetching user security:', error);
      throw new Error('Failed to fetch user security settings');
    }
  }

  /**
   * Actualiza la contraseña del usuario
   */
  static async updatePassword(userId: string, currentPassword: string, newPassword: string) {
    try {
      // Obtener el usuario actual
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { password: true },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Verificar la contraseña actual
      const isValidPassword = await bcrypt.compare(currentPassword, user.password);
      if (!isValidPassword) {
        throw new Error('Current password is incorrect');
      }

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Actualizar la contraseña y fecha de cambio
      await prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });

        await tx.userSecurity.upsert({
          where: { userId },
          update: { 
            passwordChangedAt: new Date(),
            loginAttempts: 0, // Reset intentos de login
          },
          create: {
            userId,
            passwordChangedAt: new Date(),
          },
        });
      });

      logger.info(`Password updated for user: ${userId}`);
      return { message: 'Password updated successfully' };
    } catch (error) {
      logger.error('Error updating password:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to update password');
    }
  }

  /**
   * Habilita/deshabilita 2FA
   */
  static async toggle2FA(userId: string, enable: boolean, secret?: string) {
    try {
      const updateData: any = {
        twoFactorEnabled: enable,
      };

      if (enable && secret) {
        updateData.twoFactorSecret = secret;
        updateData.backupCodes = this.generateBackupCodes();
      } else if (!enable) {
        updateData.twoFactorSecret = null;
        updateData.backupCodes = [];
      }

      const security = await prisma.userSecurity.upsert({
        where: { userId },
        update: updateData,
        create: {
          userId,
          ...updateData,
        },
        select: {
          id: true,
          userId: true,
          twoFactorEnabled: true,
          backupCodes: enable, // Solo incluir backup codes si se está habilitando
        },
      });

      logger.info(`${enable ? 'Enabled' : 'Disabled'} 2FA for user: ${userId}`);
      return security;
    } catch (error) {
      logger.error('Error toggling 2FA:', error);
      throw new Error('Failed to update 2FA settings');
    }
  }

  /**
   * Actualiza último login
   */
  static async updateLastLogin(userId: string) {
    try {
      await prisma.userSecurity.upsert({
        where: { userId },
        update: { 
          lastLoginAt: new Date(),
          loginAttempts: 0,
          lockedUntil: null,
        },
        create: {
          userId,
          lastLoginAt: new Date(),
        },
      });

      logger.info(`Updated last login for user: ${userId}`);
    } catch (error) {
      logger.error('Error updating last login:', error);
      // No lanzar error, es un update opcional
    }
  }

  /**
   * Incrementa intentos de login fallidos
   */
  static async incrementLoginAttempts(userId: string) {
    try {
      const security = await prisma.userSecurity.upsert({
        where: { userId },
        update: { 
          loginAttempts: { increment: 1 },
        },
        create: {
          userId,
          loginAttempts: 1,
        },
        select: {
          loginAttempts: true,
        },
      });

      // Si tiene más de 5 intentos, bloquear por 30 minutos
      if (security.loginAttempts >= 5) {
        const lockUntil = new Date();
        lockUntil.setMinutes(lockUntil.getMinutes() + 30);

        await prisma.userSecurity.update({
          where: { userId },
          data: { lockedUntil: lockUntil },
        });

        logger.warn(`User ${userId} locked until ${lockUntil} due to ${security.loginAttempts} failed attempts`);
      }

      return security.loginAttempts;
    } catch (error) {
      logger.error('Error incrementing login attempts:', error);
      throw new Error('Failed to track login attempts');
    }
  }

  /**
   * Verifica si el usuario está bloqueado
   */
  static async isUserLocked(userId: string): Promise<boolean> {
    try {
      const security = await prisma.userSecurity.findUnique({
        where: { userId },
        select: { lockedUntil: true },
      });

      if (!security?.lockedUntil) return false;

      const isLocked = security.lockedUntil > new Date();
      
      // Si ya no está bloqueado, limpiar el campo
      if (!isLocked) {
        await prisma.userSecurity.update({
          where: { userId },
          data: { 
            lockedUntil: null,
            loginAttempts: 0,
          },
        });
      }

      return isLocked;
    } catch (error) {
      logger.error('Error checking if user is locked:', error);
      return false; // En caso de error, permitir el acceso
    }
  }

  /**
   * Crea configuración por defecto
   */
  private static async createDefaultSettings(userId: string) {
    const defaultSettings = await prisma.userSettings.create({
      data: {
        userId,
        currency: 'COP',
        timezone: 'America/Bogota',
        language: 'es',
        dateFormat: 'DD/MM/YYYY',
        notifications: {
          email: true,
          push: true,
          budgetAlerts: true,
          goalReminders: true,
        },
        theme: 'system',
      },
    });

    logger.info(`Created default settings for user: ${userId}`);
    return defaultSettings;
  }

  /**
   * Crea configuración de seguridad por defecto
   */
  private static async createDefaultSecurity(userId: string) {
    const defaultSecurity = await prisma.userSecurity.create({
      data: {
        userId,
        twoFactorEnabled: false,
        loginAttempts: 0,
        passwordChangedAt: new Date(),
      },
      select: {
        id: true,
        userId: true,
        twoFactorEnabled: true,
        loginAttempts: true,
        lockedUntil: true,
        lastLoginAt: true,
        passwordChangedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    logger.info(`Created default security settings for user: ${userId}`);
    return defaultSecurity;
  }

  /**
   * Genera códigos de respaldo para 2FA
   */
  private static generateBackupCodes(): string[] {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      codes.push(randomBytes(4).toString('hex').toUpperCase());
    }
    return codes;
  }

  /**
   * Exporta todos los datos del usuario
   */
  static async exportUserData(userId: string) {
    try {
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          settings: true,
          security: {
            select: {
              twoFactorEnabled: true,
              lastLoginAt: true,
              passwordChangedAt: true,
            },
          },
          accounts: true,
          transactions: {
            include: {
              category: true,
              account: true,
            },
          },
          budgets: {
            include: {
              category: true,
            },
          },
          goals: {
            include: {
              contributions: true,
            },
          },
          categories: true,
          chatHistory: {
            orderBy: { timestamp: 'desc' },
          },
        },
      });

      if (!userData) {
        throw new Error('User not found');
      }

      logger.info(`Exported data for user: ${userId}`);
      return {
        exportDate: new Date(),
        user: {
          ...userData,
          password: undefined, // No incluir contraseña
        },
      };
    } catch (error) {
      logger.error('Error exporting user data:', error);
      throw new Error('Failed to export user data');
    }
  }
}