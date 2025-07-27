import prisma from '../config/database';
import { logger } from '../utils/logger';

export class BudgetService {
  /**
   * Obtiene presupuestos del usuario
   */
  static async getUserBudgets(userId: string, month?: number, year?: number) {
    try {
      const where: any = { userId };

      if (month !== undefined) {
        where.month = month;
      }

      if (year !== undefined) {
        where.year = year;
      }

      const budgets = await prisma.budget.findMany({
        where,
        include: {
          category: true,
        },
        orderBy: [
          { year: 'desc' },
          { month: 'desc' },
          { category: { name: 'asc' } },
        ],
      });

      // Calcular gastos actuales para cada presupuesto
      const budgetsWithSpent = await Promise.all(
        budgets.map(async (budget) => {
          const spent = await prisma.transaction.aggregate({
            where: {
              userId,
              categoryId: budget.categoryId,
              type: 'expense',
              date: {
                gte: new Date(budget.year, budget.month - 1, 1),
                lt: new Date(budget.year, budget.month, 1),
              },
            },
            _sum: {
              amount: true,
            },
          });

          return {
            ...budget,
            spent: spent._sum.amount || 0,
            remaining: budget.amount - (spent._sum.amount || 0),
            percentageUsed: budget.amount > 0 ? ((spent._sum.amount || 0) / budget.amount) * 100 : 0,
          };
        })
      );

      logger.info(`Retrieved ${budgets.length} budgets for user ${userId}`);
      return budgetsWithSpent;
    } catch (error) {
      logger.error('Error fetching user budgets:', error);
      throw new Error('Failed to fetch budgets');
    }
  }

  /**
   * Crea un nuevo presupuesto
   */
  static async createBudget(budgetData: any) {
    try {
      const budget = await prisma.budget.create({
        data: {
          amount: budgetData.amount,
          categoryId: budgetData.categoryId,
          userId: budgetData.userId,
          month: budgetData.month,
          year: budgetData.year,
        },
        include: {
          category: true,
        },
      });

      logger.info(`Created budget with ID: ${budget.id}`);
      return budget;
    } catch (error) {
      logger.error('Error creating budget:', error);
      throw new Error('Failed to create budget');
    }
  }

  /**
   * Obtiene un presupuesto por ID
   */
  static async getBudgetById(id: string, userId: string) {
    try {
      const budget = await prisma.budget.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          category: true,
        },
      });

      if (budget) {
        // Calcular gastos actuales
        const spent = await prisma.transaction.aggregate({
          where: {
            userId,
            categoryId: budget.categoryId,
            type: 'expense',
            date: {
              gte: new Date(budget.year, budget.month - 1, 1),
              lt: new Date(budget.year, budget.month, 1),
            },
          },
          _sum: {
            amount: true,
          },
        });

        const budgetWithSpent = {
          ...budget,
          spent: spent._sum.amount || 0,
          remaining: budget.amount - (spent._sum.amount || 0),
          percentageUsed: budget.amount > 0 ? ((spent._sum.amount || 0) / budget.amount) * 100 : 0,
        };

        logger.info(`Retrieved budget with ID: ${id}`);
        return budgetWithSpent;
      }

      return null;
    } catch (error) {
      logger.error('Error fetching budget by ID:', error);
      throw new Error('Failed to fetch budget');
    }
  }

  /**
   * Actualiza un presupuesto
   */
  static async updateBudget(id: string, userId: string, updateData: any) {
    try {
      const budget = await prisma.budget.update({
        where: {
          id,
          userId,
        },
        data: {
          amount: updateData.amount,
          categoryId: updateData.categoryId,
          month: updateData.month,
          year: updateData.year,
        },
        include: {
          category: true,
        },
      });

      logger.info(`Updated budget with ID: ${id}`);
      return budget;
    } catch (error) {
      logger.error('Error updating budget:', error);
      throw new Error('Failed to update budget');
    }
  }

  /**
   * Elimina un presupuesto
   */
  static async deleteBudget(id: string, userId: string) {
    try {
      await prisma.budget.delete({
        where: {
          id,
          userId,
        },
      });

      logger.info(`Deleted budget with ID: ${id}`);
    } catch (error) {
      logger.error('Error deleting budget:', error);
      throw new Error('Failed to delete budget');
    }
  }

  /**
   * Obtiene presupuestos del mes actual con análisis detallado
   */
  static async getCurrentBudgets(userId: string, month: number, year: number) {
    try {
      const budgets = await prisma.budget.findMany({
        where: {
          userId,
          month,
          year,
        },
        include: {
          category: true,
        },
        orderBy: {
          category: { name: 'asc' },
        },
      });

      // Calcular gastos y análisis para cada presupuesto
      const budgetsWithAnalysis = await Promise.all(
        budgets.map(async (budget) => {
          const [spent, transactionCount] = await Promise.all([
            prisma.transaction.aggregate({
              where: {
                userId,
                categoryId: budget.categoryId,
                type: 'expense',
                date: {
                  gte: new Date(year, month - 1, 1),
                  lt: new Date(year, month, 1),
                },
              },
              _sum: {
                amount: true,
              },
            }),
            prisma.transaction.count({
              where: {
                userId,
                categoryId: budget.categoryId,
                type: 'expense',
                date: {
                  gte: new Date(year, month - 1, 1),
                  lt: new Date(year, month, 1),
                },
              },
            }),
          ]);

          const spentAmount = spent._sum.amount || 0;
          const remaining = budget.amount - spentAmount;
          const percentageUsed = budget.amount > 0 ? (spentAmount / budget.amount) * 100 : 0;

          let status = 'on_track';
          if (percentageUsed >= 100) {
            status = 'over_budget';
          } else if (percentageUsed >= 80) {
            status = 'warning';
          }

          return {
            ...budget,
            spent: spentAmount,
            remaining,
            percentageUsed,
            transactionCount,
            status,
          };
        })
      );

      logger.info(`Retrieved ${budgets.length} current budgets for user ${userId}`);
      return budgetsWithAnalysis;
    } catch (error) {
      logger.error('Error fetching current budgets:', error);
      throw new Error('Failed to fetch current budgets');
    }
  }
}
