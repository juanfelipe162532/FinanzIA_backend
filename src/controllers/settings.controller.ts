import { Request, Response } from 'express';
import { SettingsService } from '../services/settings.service';
import { logger } from '../utils/logger';
import { body, validationResult } from 'express-validator';

export class SettingsController {
  /**
   * Validaciones para actualizar configuración
   */
  static validateUpdateSettings = [
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('timezone').optional().trim().notEmpty().withMessage('Timezone cannot be empty'),
    body('language').optional().isIn(['es', 'en']).withMessage('Language must be es or en'),
    body('dateFormat').optional().isIn(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).withMessage('Invalid date format'),
    body('theme').optional().isIn(['light', 'dark', 'system']).withMessage('Theme must be light, dark, or system'),
    body('notifications').optional().isObject().withMessage('Notifications must be an object'),
  ];

  /**
   * Validaciones para cambio de contraseña
   */
  static validatePasswordChange = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  ];

  /**
   * Obtiene la configuración del usuario
   */
  static async getUserSettings(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const settings = await SettingsService.getUserSettings(userId);

      res.status(200).json({
        success: true,
        message: 'Settings retrieved successfully',
        data: settings,
      });
    } catch (error) {
      logger.error('Error in getUserSettings controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza la configuración del usuario
   */
  static async updateUserSettings(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const userId = (req as any).user?.id;
      const settingsData = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const settings = await SettingsService.updateUserSettings(userId, settingsData);

      res.status(200).json({
        success: true,
        message: 'Settings updated successfully',
        data: settings,
      });
    } catch (error) {
      logger.error('Error in updateUserSettings controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene la configuración de seguridad del usuario
   */
  static async getUserSecurity(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const security = await SettingsService.getUserSecurity(userId);

      res.status(200).json({
        success: true,
        message: 'Security settings retrieved successfully',
        data: security,
      });
    } catch (error) {
      logger.error('Error in getUserSecurity controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve security settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza la contraseña del usuario
   */
  static async updatePassword(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const userId = (req as any).user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await SettingsService.updatePassword(userId, currentPassword, newPassword);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Error in updatePassword controller:', error);
      
      // Manejar errores específicos
      if (error instanceof Error && error.message === 'Current password is incorrect') {
        return res.status(400).json({
          success: false,
          message: 'Current password is incorrect',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to update password',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Habilita/deshabilita 2FA
   */
  static async toggle2FA(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { enable, secret } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      if (typeof enable !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Enable parameter must be a boolean',
        });
      }

      if (enable && !secret) {
        return res.status(400).json({
          success: false,
          message: 'Secret is required when enabling 2FA',
        });
      }

      const security = await SettingsService.toggle2FA(userId, enable, secret);

      res.status(200).json({
        success: true,
        message: `2FA ${enable ? 'enabled' : 'disabled'} successfully`,
        data: security,
      });
    } catch (error) {
      logger.error('Error in toggle2FA controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update 2FA settings',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Exporta todos los datos del usuario
   */
  static async exportUserData(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const userData = await SettingsService.exportUserData(userId);

      // Configurar headers para descarga
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="finanza_ia_data_${userId}_${new Date().toISOString().split('T')[0]}.json"`);

      res.status(200).json({
        success: true,
        message: 'User data exported successfully',
        data: userData,
      });
    } catch (error) {
      logger.error('Error in exportUserData controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to export user data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Verifica si el usuario está bloqueado
   */
  static async checkUserLocked(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const isLocked = await SettingsService.isUserLocked(userId);

      res.status(200).json({
        success: true,
        message: 'Lock status checked successfully',
        data: { isLocked },
      });
    } catch (error) {
      logger.error('Error in checkUserLocked controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check lock status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}