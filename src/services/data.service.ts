import prisma from '../config/database';
import { logger } from '../utils/logger';

export class DataService {
  /**
   * Obtiene todos los usuarios con sus relaciones
   */
  static async getAllUsers() {
    try {
      const users = await prisma.user.findMany({
        include: {
          transactions: {
            include: {
              category: true,
            },
          },
          budgets: {
            include: {
              category: true,
            },
          },
          categories: true,
          chatHistory: true,
          refreshTokens: true,
        },
      });

      logger.info(`Retrieved ${users.length} users from database`);
      return users;
    } catch (error) {
      logger.error('Error fetching all users:', error);
      throw new Error('Failed to fetch users');
    }
  }

  /**
   * Obtiene todas las transacciones con sus relaciones
   */
  static async getAllTransactions() {
    try {
      const transactions = await prisma.transaction.findMany({
        include: {
          category: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      logger.info(`Retrieved ${transactions.length} transactions from database`);
      return transactions;
    } catch (error) {
      logger.error('Error fetching all transactions:', error);
      throw new Error('Failed to fetch transactions');
    }
  }

  /**
   * Obtiene todas las categorías con sus relaciones
   */
  static async getAllCategories() {
    try {
      const categories = await prisma.category.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          transactions: true,
          budgets: true,
          parent: true,
          children: true,
        },
      });

      logger.info(`Retrieved ${categories.length} categories from database`);
      return categories;
    } catch (error) {
      logger.error('Error fetching all categories:', error);
      throw new Error('Failed to fetch categories');
    }
  }

  /**
   * Obtiene todos los presupuestos con sus relaciones
   */
  static async getAllBudgets() {
    try {
      const budgets = await prisma.budget.findMany({
        include: {
          category: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      });

      logger.info(`Retrieved ${budgets.length} budgets from database`);
      return budgets;
    } catch (error) {
      logger.error('Error fetching all budgets:', error);
      throw new Error('Failed to fetch budgets');
    }
  }

  /**
   * Obtiene todo el historial de chat de IA
   */
  static async getAllChatHistory() {
    try {
      const chatHistory = await prisma.aIChatHistory.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          timestamp: 'desc',
        },
      });

      logger.info(`Retrieved ${chatHistory.length} chat history records from database`);
      return chatHistory;
    } catch (error) {
      logger.error('Error fetching all chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  /**
   * Obtiene todos los refresh tokens
   */
  static async getAllRefreshTokens() {
    try {
      const refreshTokens = await prisma.refreshToken.findMany({
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logger.info(`Retrieved ${refreshTokens.length} refresh tokens from database`);
      return refreshTokens;
    } catch (error) {
      logger.error('Error fetching all refresh tokens:', error);
      throw new Error('Failed to fetch refresh tokens');
    }
  }

  /**
   * Obtiene todos los datos de la base de datos en un solo objeto
   */
  static async getAllData() {
    try {
      logger.info('Starting to fetch all data from database');

      const [users, transactions, categories, budgets, chatHistory, refreshTokens] =
        await Promise.all([
          this.getAllUsers(),
          this.getAllTransactions(),
          this.getAllCategories(),
          this.getAllBudgets(),
          this.getAllChatHistory(),
          this.getAllRefreshTokens(),
        ]);

      const allData = {
        users,
        transactions,
        categories,
        budgets,
        chatHistory,
        refreshTokens,
        summary: {
          totalUsers: users.length,
          totalTransactions: transactions.length,
          totalCategories: categories.length,
          totalBudgets: budgets.length,
          totalChatHistoryRecords: chatHistory.length,
          totalRefreshTokens: refreshTokens.length,
        },
      };

      logger.info('Successfully retrieved all data from database', allData.summary);
      return allData;
    } catch (error) {
      logger.error('Error fetching all data:', error);
      throw new Error('Failed to fetch all data from database');
    }
  }

  /**
   * Obtiene estadísticas generales de la base de datos
   */
  static async getDatabaseStats() {
    try {
      const [
        userCount,
        transactionCount,
        categoryCount,
        budgetCount,
        chatHistoryCount,
        refreshTokenCount,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.transaction.count(),
        prisma.category.count(),
        prisma.budget.count(),
        prisma.aIChatHistory.count(),
        prisma.refreshToken.count(),
      ]);

      const stats = {
        totalUsers: userCount,
        totalTransactions: transactionCount,
        totalCategories: categoryCount,
        totalBudgets: budgetCount,
        totalChatHistoryRecords: chatHistoryCount,
        totalRefreshTokens: refreshTokenCount,
        totalRecords:
          userCount +
          transactionCount +
          categoryCount +
          budgetCount +
          chatHistoryCount +
          refreshTokenCount,
      };

      logger.info('Database statistics retrieved:', stats);
      return stats;
    } catch (error) {
      logger.error('Error fetching database stats:', error);
      throw new Error('Failed to fetch database statistics');
    }
  }

  /**
   * Obtiene datos de una tabla específica por nombre
   */
  static async getTableData(tableName: string) {
    try {
      let data;

      switch (tableName.toLowerCase()) {
        case 'users':
        case 'user':
          data = await this.getAllUsers();
          break;
        case 'transactions':
        case 'transaction':
          data = await this.getAllTransactions();
          break;
        case 'categories':
        case 'category':
          data = await this.getAllCategories();
          break;
        case 'budgets':
        case 'budget':
          data = await this.getAllBudgets();
          break;
        case 'chathistory':
        case 'chat_history':
        case 'aichathistory':
          data = await this.getAllChatHistory();
          break;
        case 'refreshtokens':
        case 'refresh_tokens':
          data = await this.getAllRefreshTokens();
          break;
        default:
          throw new Error(`Table '${tableName}' not found or not supported`);
      }

      logger.info(`Retrieved data for table: ${tableName}`);
      return data;
    } catch (error) {
      logger.error(`Error fetching data for table ${tableName}:`, error);
      throw error;
    }
  }
}
