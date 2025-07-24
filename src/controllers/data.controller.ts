import { Request, Response } from 'express';
import { DataService } from '../services/data.service';
import { logger } from '../utils/logger';

export class DataController {
  /**
   * Obtiene todos los usuarios
   */
  static async getAllUsers(req: Request, res: Response) {
    try {
      const users = await DataService.getAllUsers();

      res.status(200).json({
        success: true,
        message: 'Users retrieved successfully',
        data: users,
        count: users.length,
      });
    } catch (error) {
      logger.error('Error in getAllUsers controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve users',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene todas las transacciones
   */
  static async getAllTransactions(req: Request, res: Response) {
    try {
      const transactions = await DataService.getAllTransactions();

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions,
        count: transactions.length,
      });
    } catch (error) {
      logger.error('Error in getAllTransactions controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transactions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene todas las categorías
   */
  static async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await DataService.getAllCategories();

      res.status(200).json({
        success: true,
        message: 'Categories retrieved successfully',
        data: categories,
        count: categories.length,
      });
    } catch (error) {
      logger.error('Error in getAllCategories controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve categories',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene todos los presupuestos
   */
  static async getAllBudgets(req: Request, res: Response) {
    try {
      const budgets = await DataService.getAllBudgets();

      res.status(200).json({
        success: true,
        message: 'Budgets retrieved successfully',
        data: budgets,
        count: budgets.length,
      });
    } catch (error) {
      logger.error('Error in getAllBudgets controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve budgets',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene todo el historial de chat
   */
  static async getAllChatHistory(req: Request, res: Response) {
    try {
      const chatHistory = await DataService.getAllChatHistory();

      res.status(200).json({
        success: true,
        message: 'Chat history retrieved successfully',
        data: chatHistory,
        count: chatHistory.length,
      });
    } catch (error) {
      logger.error('Error in getAllChatHistory controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene todos los refresh tokens
   */
  static async getAllRefreshTokens(req: Request, res: Response) {
    try {
      const refreshTokens = await DataService.getAllRefreshTokens();

      res.status(200).json({
        success: true,
        message: 'Refresh tokens retrieved successfully',
        data: refreshTokens,
        count: refreshTokens.length,
      });
    } catch (error) {
      logger.error('Error in getAllRefreshTokens controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve refresh tokens',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene todos los datos de la base de datos
   */
  static async getAllData(req: Request, res: Response) {
    try {
      const allData = await DataService.getAllData();

      res.status(200).json({
        success: true,
        message: 'All data retrieved successfully',
        data: allData,
      });
    } catch (error) {
      logger.error('Error in getAllData controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve all data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene estadísticas de la base de datos
   */
  static async getDatabaseStats(req: Request, res: Response) {
    try {
      const stats = await DataService.getDatabaseStats();

      res.status(200).json({
        success: true,
        message: 'Database statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getDatabaseStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve database statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene datos de una tabla específica
   */
  static async getTableData(req: Request, res: Response) {
    try {
      const { tableName } = req.params;

      if (!tableName) {
        return res.status(400).json({
          success: false,
          message: 'Table name is required',
        });
      }

      const data = await DataService.getTableData(tableName);

      res.status(200).json({
        success: true,
        message: `Data from table '${tableName}' retrieved successfully`,
        data,
        count: Array.isArray(data) ? data.length : 1,
      });
    } catch (error) {
      logger.error('Error in getTableData controller:', error);

      if (error instanceof Error && error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          message: error.message,
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve table data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
