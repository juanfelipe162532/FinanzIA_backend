import { Request, Response } from 'express';
import { BudgetService } from '../services/budget.service';
import { logger } from '../utils/logger';

export class BudgetController {
  /**
   * Obtiene todos los presupuestos del usuario
   */
  static async getUserBudgets(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { month, year } = req.query;

      const budgets = await BudgetService.getUserBudgets(
        userId!,
        month ? Number(month) : undefined,
        year ? Number(year) : undefined
      );

      res.status(200).json({
        success: true,
        message: 'Budgets retrieved successfully',
        data: budgets,
        count: budgets.length,
      });
    } catch (error) {
      logger.error('Error in getUserBudgets controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve budgets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Crea un nuevo presupuesto
   */
  static async createBudget(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const budgetData = { ...req.body, userId };

      const budget = await BudgetService.createBudget(budgetData);

      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: budget,
      });
    } catch (error) {
      logger.error('Error in createBudget controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create budget',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene un presupuesto específico
   */
  static async getBudgetById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const budget = await BudgetService.getBudgetById(id, userId!);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Budget retrieved successfully',
        data: budget,
      });
    } catch (error) {
      logger.error('Error in getBudgetById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve budget',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza un presupuesto
   */
  static async updateBudget(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      const budget = await BudgetService.updateBudget(id, userId!, updateData);

      res.status(200).json({
        success: true,
        message: 'Budget updated successfully',
        data: budget,
      });
    } catch (error) {
      logger.error('Error in updateBudget controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update budget',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Elimina un presupuesto
   */
  static async deleteBudget(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await BudgetService.deleteBudget(id, userId!);

      res.status(200).json({
        success: true,
        message: 'Budget deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteBudget controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete budget',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene presupuestos del mes actual
   */
  static async getCurrentBudgets(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      const budgets = await BudgetService.getCurrentBudgets(userId!, currentMonth, currentYear);

      res.status(200).json({
        success: true,
        message: 'Current budgets retrieved successfully',
        data: budgets,
        count: budgets.length,
      });
    } catch (error) {
      logger.error('Error in getCurrentBudgets controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve current budgets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
