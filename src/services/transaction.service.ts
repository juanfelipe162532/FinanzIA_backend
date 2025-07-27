import prisma from '../config/database';
import { logger } from '../utils/logger';
import { AppError } from '../middlewares/error.middleware';
import { validateCategoryId } from '../utils/validation';

export class TransactionService {
  /**
   * Obtiene transacciones del usuario con filtros y paginación
   * @param userId
   * @param page
   * @param limit
   * @param filters
   * @returns
   */
  static async getUserTransactions(
    userId: string,
    page: number = 1,
    limit: number = 10,
    filters: {
      type?: string;
      categoryId?: string;
      startDate?: string;
      endDate?: string;
    } = {}
  ) {
    try {
      const skip = (page - 1) * limit;

      const where: any = { userId };

      if (filters.type) {
        where.type = filters.type;
      }

      if (filters.categoryId) {
        where.categoryId = filters.categoryId;
      }

      if (filters.startDate || filters.endDate) {
        where.date = {};
        if (filters.startDate) {
          where.date.gte = new Date(filters.startDate);
        }
        if (filters.endDate) {
          where.date.lte = new Date(filters.endDate);
        }
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where,
          include: {
            category: true,
          },
          orderBy: {
            date: 'desc',
          },
          skip,
          take: limit,
        }),
        prisma.transaction.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${transactions.length} transactions for user ${userId}`);

      return {
        data: transactions,
        pagination: {
          currentPage: page,
          totalPages,
          totalItems: total,
          itemsPerPage: limit,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
        },
      };
    } catch (error) {
      logger.error('Error fetching user transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Crea una nueva transacción
   */
  static async createTransaction(transactionData: any) {
    try {
      // Validate and normalize categoryId if provided
      if (transactionData.categoryId) {
        try {
          transactionData.categoryId = await validateCategoryId(transactionData.categoryId);
        } catch (error: any) {
          throw new AppError(error.message || 'ID de categoría inválido', 400);
        }
      }

      const transaction = await prisma.transaction.create({
        data: {
          amount: transactionData.amount,
          type: transactionData.type,
          description: transactionData.description,
          date: transactionData.date ? new Date(transactionData.date) : new Date(),
          categoryId: transactionData.categoryId,
          userId: transactionData.userId,
        },
        include: {
          category: true,
        },
      });

      logger.info(`Created transaction with ID: ${transaction.id}`);
      return transaction;
    } catch (error) {
      logger.error('Error creating transaction:', error);
      if (error && typeof error === 'object' && 'code' in error) {
        if (error.code === 'P2023') {
          throw new AppError('Formato de ID de categoría inválido', 400);
        } else if (error.code === 'P2003') {
          throw new AppError('La categoría especificada no existe', 400);
        }
      }
      throw new Error('Failed to create transaction');
    }
  }

  /**
   * Obtiene una transacción por ID
   */
  static async getTransactionById(id: string, userId: string) {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: {
          id,
          userId,
        },
        include: {
          category: true,
        },
      });

      logger.info(`Retrieved transaction with ID: ${id}`);
      return transaction;
    } catch (error) {
      logger.error('Error fetching transaction by ID:', error);
      throw new Error('Failed to fetch transaction');
    }
  }

  /**
   * Actualiza una transacción
   */
  static async updateTransaction(id: string, userId: string, updateData: any) {
    try {
      const transaction = await prisma.transaction.update({
        where: {
          id,
          userId,
        },
        data: {
          amount: updateData.amount,
          type: updateData.type,
          description: updateData.description,
          date: updateData.date ? new Date(updateData.date) : undefined,
          categoryId: updateData.categoryId,
        },
        include: {
          category: true,
        },
      });

      logger.info(`Updated transaction with ID: ${id}`);
      return transaction;
    } catch (error) {
      logger.error('Error updating transaction:', error);
      throw new Error('Failed to update transaction');
    }
  }

  /**
   * Elimina una transacción
   */
  static async deleteTransaction(id: string, userId: string) {
    try {
      await prisma.transaction.delete({
        where: {
          id,
          userId,
        },
      });

      logger.info(`Deleted transaction with ID: ${id}`);
    } catch (error) {
      logger.error('Error deleting transaction:', error);
      throw new Error('Failed to delete transaction');
    }
  }

  /**
   * Obtiene estadísticas de transacciones
   * @param userId
   * @param period
   * @returns
   */
  static async getTransactionStats(userId: string, period: string = 'month') {
    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const [totalIncome, totalExpenses, transactionCount, categoryStats] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'income',
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'expense',
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.transaction.count({
          where: {
            userId,
            date: {
              gte: startDate,
            },
          },
        }),
        prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            userId,
            date: {
              gte: startDate,
            },
          },
          _sum: {
            amount: true,
          },
          _count: {
            id: true,
          },
        }),
      ]);

      const stats = {
        period,
        totalIncome: totalIncome._sum.amount || 0,
        totalExpenses: totalExpenses._sum.amount || 0,
        balance: (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0),
        transactionCount,
        categoryBreakdown: categoryStats,
      };

      logger.info(`Retrieved transaction stats for user ${userId}`);
      return stats;
    } catch (error) {
      logger.error('Error fetching transaction stats:', error);
      throw new Error('Failed to fetch transaction statistics');
    }
  }
}
