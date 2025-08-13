import { Request, Response } from 'express';
import { GoalService } from '../services/goal.service';
import { logger } from '../utils/logger';
import { body, validationResult, param, query } from 'express-validator';

export class GoalController {
  /**
   * Validaciones para crear meta
   */
  static validateCreateGoal = [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('targetAmount').isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
    body('currentAmount').optional().isFloat({ min: 0 }).withMessage('Current amount must be 0 or greater'),
    body('targetDate').optional().isISO8601().withMessage('Target date must be a valid date'),
    body('category').optional().isIn(['savings', 'vacation', 'emergency', 'investment', 'other']).withMessage('Invalid category'),
    body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Priority must be high, medium, or low'),
    body('isPublic').optional().isBoolean().withMessage('IsPublic must be a boolean'),
  ];

  /**
   * Validaciones para actualizar meta
   */
  static validateUpdateGoal = [
    param('id').isMongoId().withMessage('Invalid goal ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
    body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
    body('targetAmount').optional().isFloat({ gt: 0 }).withMessage('Target amount must be greater than 0'),
    body('targetDate').optional().isISO8601().withMessage('Target date must be a valid date'),
    body('category').optional().isIn(['savings', 'vacation', 'emergency', 'investment', 'other']).withMessage('Invalid category'),
    body('status').optional().isIn(['active', 'completed', 'paused', 'cancelled']).withMessage('Invalid status'),
    body('priority').optional().isIn(['high', 'medium', 'low']).withMessage('Priority must be high, medium, or low'),
    body('isPublic').optional().isBoolean().withMessage('IsPublic must be a boolean'),
  ];

  /**
   * Validaciones para agregar contribución
   */
  static validateAddContribution = [
    param('id').isMongoId().withMessage('Invalid goal ID'),
    body('amount').isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),
    body('date').optional().isISO8601().withMessage('Date must be a valid date'),
    body('description').optional().trim().isLength({ max: 200 }).withMessage('Description must be less than 200 characters'),
  ];

  /**
   * Crea una nueva meta
   */
  static async createGoal(req: Request, res: Response) {
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
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const goalData = req.body;
      const goal = await GoalService.createGoal(userId, goalData);

      res.status(201).json({
        success: true,
        message: 'Goal created successfully',
        data: goal,
      });
    } catch (error) {
      logger.error('Error in createGoal controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create goal',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene todas las metas del usuario
   */
  static async getUserGoals(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Obtener filtros de query parameters
      const filters = {
        status: req.query.status as string,
        category: req.query.category as string,
        priority: req.query.priority as string,
      };

      const goals = await GoalService.getGoalsByUserId(userId, filters);

      res.status(200).json({
        success: true,
        message: 'Goals retrieved successfully',
        data: goals,
      });
    } catch (error) {
      logger.error('Error in getUserGoals controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve goals',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene una meta específica por ID
   */
  static async getGoalById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const goal = await GoalService.getGoalById(id, userId);

      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Goal retrieved successfully',
        data: goal,
      });
    } catch (error) {
      logger.error('Error in getGoalById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve goal',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza una meta
   */
  static async updateGoal(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { id } = req.params;
      const userId = (req as any).user?.id;
      const updateData = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const goal = await GoalService.updateGoal(id, userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Goal updated successfully',
        data: goal,
      });
    } catch (error) {
      logger.error('Error in updateGoal controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update goal',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Elimina una meta
   */
  static async deleteGoal(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await GoalService.deleteGoal(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Error in deleteGoal controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete goal',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Agrega una contribución a una meta
   */
  static async addContribution(req: Request, res: Response) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation errors',
          errors: errors.array(),
        });
      }

      const { id: goalId } = req.params;
      const userId = (req as any).user?.id;
      const contributionData = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const contribution = await GoalService.addContribution(goalId, userId, contributionData);

      res.status(201).json({
        success: true,
        message: 'Contribution added successfully',
        data: contribution,
      });
    } catch (error) {
      logger.error('Error in addContribution controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to add contribution',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene las contribuciones de una meta
   */
  static async getGoalContributions(req: Request, res: Response) {
    try {
      const { id: goalId } = req.params;
      const userId = (req as any).user?.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await GoalService.getGoalContributions(goalId, userId, page, limit);

      res.status(200).json({
        success: true,
        message: 'Goal contributions retrieved successfully',
        data: result,
      });
    } catch (error) {
      logger.error('Error in getGoalContributions controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve goal contributions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene resumen de metas del usuario
   */
  static async getGoalsSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const summary = await GoalService.getGoalsSummary(userId);

      res.status(200).json({
        success: true,
        message: 'Goals summary retrieved successfully',
        data: summary,
      });
    } catch (error) {
      logger.error('Error in getGoalsSummary controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve goals summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene sugerencias de metas para el usuario
   */
  static async suggestGoals(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const suggestions = await GoalService.suggestGoals(userId);

      res.status(200).json({
        success: true,
        message: 'Goal suggestions generated successfully',
        data: suggestions,
      });
    } catch (error) {
      logger.error('Error in suggestGoals controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate goal suggestions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}