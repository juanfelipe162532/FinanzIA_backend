import prisma from '../config/database';
import { logger } from '../utils/logger';

export class CategoryService {
  /**
   * Obtiene categorías del usuario (incluyendo sistema si se especifica)
   */
  static async getUserCategories(userId: string, type?: string, includeSystem: boolean = true) {
    try {
      const where: any = {
        OR: [
          { userId },
          ...(includeSystem ? [{ isSystem: true }] : []),
        ],
      };

      if (type) {
        where.type = type;
      }

      const categories = await prisma.category.findMany({
        where,
        include: {
          parent: true,
          children: true,
          _count: {
            select: {
              transactions: true,
              budgets: true,
            },
          },
        },
        orderBy: [
          { isSystem: 'desc' },
          { name: 'asc' },
        ],
      });

      logger.info(`Retrieved ${categories.length} categories for user ${userId}`);
      return categories;
    } catch (error) {
      logger.error('Error fetching user categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Crea una nueva categoría
   */
  static async createCategory(categoryData: any) {
    try {
      const category = await prisma.category.create({
        data: {
          name: categoryData.name,
          icon: categoryData.icon,
          color: categoryData.color,
          type: categoryData.type,
          userId: categoryData.userId,
          parentId: categoryData.parentId,
          isSystem: false,
        },
        include: {
          parent: true,
          children: true,
        },
      });

      logger.info(`Created category with ID: ${category.id}`);
      return category;
    } catch (error) {
      logger.error('Error creating category:', error);
      throw new Error('Failed to create category');
    }
  }

  /**
   * Obtiene una categoría por ID
   */
  static async getCategoryById(id: string, userId: string) {
    try {
      const category = await prisma.category.findFirst({
        where: {
          id,
          OR: [
            { userId },
            { isSystem: true },
          ],
        },
        include: {
          parent: true,
          children: true,
          transactions: {
            take: 10,
            orderBy: {
              date: 'desc',
            },
          },
          budgets: true,
          _count: {
            select: {
              transactions: true,
              budgets: true,
            },
          },
        },
      });

      logger.info(`Retrieved category with ID: ${id}`);
      return category;
    } catch (error) {
      logger.error('Error fetching category by ID:', error);
      throw new Error('Failed to fetch category');
    }
  }

  /**
   * Actualiza una categoría
   */
  static async updateCategory(id: string, userId: string, updateData: any) {
    try {
      // Verificar que la categoría pertenece al usuario y no es del sistema
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          userId,
          isSystem: false,
        },
      });

      if (!existingCategory) {
        throw new Error('Category not found or cannot be updated');
      }

      const category = await prisma.category.update({
        where: { id },
        data: {
          name: updateData.name,
          icon: updateData.icon,
          color: updateData.color,
          type: updateData.type,
          parentId: updateData.parentId,
        },
        include: {
          parent: true,
          children: true,
        },
      });

      logger.info(`Updated category with ID: ${id}`);
      return category;
    } catch (error) {
      logger.error('Error updating category:', error);
      throw new Error('Failed to update category');
    }
  }

  /**
   * Elimina una categoría
   */
  static async deleteCategory(id: string, userId: string) {
    try {
      // Verificar que la categoría pertenece al usuario y no es del sistema
      const existingCategory = await prisma.category.findFirst({
        where: {
          id,
          userId,
          isSystem: false,
        },
      });

      if (!existingCategory) {
        throw new Error('Category not found or cannot be deleted');
      }

      // Verificar si tiene transacciones o presupuestos asociados
      const hasRelatedData = await prisma.category.findFirst({
        where: { id },
        include: {
          _count: {
            select: {
              transactions: true,
              budgets: true,
            },
          },
        },
      });

      if (hasRelatedData && (hasRelatedData._count.transactions > 0 || hasRelatedData._count.budgets > 0)) {
        throw new Error('Cannot delete category with associated transactions or budgets');
      }

      await prisma.category.delete({
        where: { id },
      });

      logger.info(`Deleted category with ID: ${id}`);
    } catch (error) {
      logger.error('Error deleting category:', error);
      throw new Error('Failed to delete category');
    }
  }

  /**
   * Obtiene categorías del sistema
   */
  static async getSystemCategories(type?: string) {
    try {
      const where: any = { isSystem: true };

      if (type) {
        where.type = type;
      }

      const categories = await prisma.category.findMany({
        where,
        include: {
          parent: true,
          children: true,
        },
        orderBy: {
          name: 'asc',
        },
      });

      logger.info(`Retrieved ${categories.length} system categories`);
      return categories;
    } catch (error) {
      logger.error('Error fetching system categories:', error);
      throw new Error('Failed to fetch system categories');
    }
  }
}
