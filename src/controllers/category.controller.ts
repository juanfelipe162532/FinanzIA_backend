import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { logger } from '../utils/logger';

export class CategoryController {
  /**
   * Obtiene todas las categorías del usuario
   */
  static async getUserCategories(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { type, includeSystem = 'true' } = req.query;

      const categories = await CategoryService.getUserCategories(
        userId!,
        type as string,
        includeSystem === 'true'
      );

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      logger.error('Error in getUserCategories controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Crea una nueva categoría
   */
  static async createCategory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const categoryData = { ...req.body, userId };

      const category = await CategoryService.createCategory(categoryData);

      res.status(201).json({
        success: true,
        message: 'Category created successfully',
        data: category,
      });
    } catch (error) {
      logger.error('Error in createCategory controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene una categoría específica
   */
  static async getCategoryById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const category = await CategoryService.getCategoryById(id, userId!);

      if (!category) {
        return res.status(404).json({
          success: false,
          message: 'Category not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (error) {
      logger.error('Error in getCategoryById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza una categoría
   */
  static async updateCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      const category = await CategoryService.updateCategory(id, userId!, updateData);

      res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: category,
      });
    } catch (error) {
      logger.error('Error in updateCategory controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Elimina una categoría
   */
  static async deleteCategory(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await CategoryService.deleteCategory(id, userId!);

      res.status(200).json({
        success: true,
        message: 'Category deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteCategory controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete category',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene categorías del sistema
   */
  static async getSystemCategories(req: Request, res: Response) {
    try {
      const { type } = req.query;
      const categories = await CategoryService.getSystemCategories(type as string);

      res.status(200).json({
        success: true,
        message: 'System categories retrieved successfully',
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      logger.error('Error in getSystemCategories controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve system categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
