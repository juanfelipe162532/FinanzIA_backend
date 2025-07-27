import prisma from '../config/database';
import { logger } from '../utils/logger';
import bcrypt from 'bcryptjs';

export class UserService {
  /**
   * Obtiene un usuario por ID
   */
  static async getUserById(id: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`Retrieved user with ID: ${id}`);
      return user;
    } catch (error) {
      logger.error('Error fetching user by ID:', error);
      throw new Error('Failed to fetch user');
    }
  }

  /**
   * Actualiza un usuario
   */
  static async updateUser(id: string, updateData: any) {
    try {
      // Si se está actualizando la contraseña, hashearla
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 12);
      }

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`Updated user with ID: ${id}`);
      return user;
    } catch (error) {
      logger.error('Error updating user:', error);
      throw new Error('Failed to update user');
    }
  }

  /**
   * Elimina un usuario
   */
  static async deleteUser(id: string) {
    try {
      await prisma.user.delete({
        where: { id },
      });

      logger.info(`Deleted user with ID: ${id}`);
    } catch (error) {
      logger.error('Error deleting user:', error);
      throw new Error('Failed to delete user');
    }
  }

  /**
   * Obtiene el perfil completo del usuario
   */
  static async getUserProfile(id: string) {
    try {
      const profile = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              transactions: true,
              budgets: true,
              categories: true,
            },
          },
        },
      });

      logger.info(`Retrieved profile for user with ID: ${id}`);
      return profile;
    } catch (error) {
      logger.error('Error fetching user profile:', error);
      throw new Error('Failed to fetch user profile');
    }
  }

  /**
   * Actualiza el perfil del usuario
   */
  static async updateUserProfile(id: string, profileData: any) {
    try {
      const profile = await prisma.user.update({
        where: { id },
        data: {
          firstName: profileData.firstName,
          lastName: profileData.lastName,
          avatar: profileData.avatar,
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      logger.info(`Updated profile for user with ID: ${id}`);
      return profile;
    } catch (error) {
      logger.error('Error updating user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }
}
