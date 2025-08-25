import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { logger } from '../utils/logger';

export class UserController {
  /**
   * Obtiene un usuario específico por ID
   */
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const user = await UserService.getUserById(id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User retrieved successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Error in getUserById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza un usuario
   */
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const user = await UserService.updateUser(id, updateData);

      res.status(200).json({
        success: true,
        message: 'User updated successfully',
        data: user,
      });
    } catch (error) {
      logger.error('Error in updateUser controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Elimina un usuario
   */
  static async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      await UserService.deleteUser(id);

      res.status(200).json({
        success: true,
        message: 'User deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteUser controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene el perfil del usuario
   */
  static async getUserProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const profile = await UserService.getUserProfile(id);

      if (!profile) {
        return res.status(404).json({
          success: false,
          message: 'User profile not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'User profile retrieved successfully',
        data: profile,
      });
    } catch (error) {
      logger.error('Error in getUserProfile controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve user profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza el perfil del usuario
   */
  static async updateUserProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const profileData = req.body;

      const profile = await UserService.updateUserProfile(id, profileData);

      res.status(200).json({
        success: true,
        message: 'User profile updated successfully',
        data: profile,
      });
    } catch (error) {
      logger.error('Error in updateUserProfile controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update user profile',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
