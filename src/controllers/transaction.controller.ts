import { Request, Response } from 'express';
import { TransactionService } from '../services/transaction.service';
import { logger } from '../utils/logger';

export class TransactionController {
  /**
   * Obtiene todas las transacciones del usuario
   */
  static async getUserTransactions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 10, type, categoryId, startDate, endDate } = req.query;

      const filters = {
        type: type as string,
        categoryId: categoryId as string,
        startDate: startDate as string,
        endDate: endDate as string,
      };

      const transactions = await TransactionService.getUserTransactions(
        userId!,
        Number(page),
        Number(limit),
        filters
      );

      res.status(200).json({
        success: true,
        message: 'Transactions retrieved successfully',
        data: transactions.data,
        pagination: transactions.pagination,
      });
    } catch (error) {
      logger.error('Error in getUserTransactions controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transactions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Crea una nueva transacción
   */
  static async createTransaction(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const transactionData = { ...req.body, userId };

      const transaction = await TransactionService.createTransaction(transactionData);

      res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: transaction,
      });
    } catch (error) {
      logger.error('Error in createTransaction controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene una transacción específica
   */
  static async getTransactionById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      const transaction = await TransactionService.getTransactionById(id, userId!);

      if (!transaction) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: transaction,
      });
    } catch (error) {
      logger.error('Error in getTransactionById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza una transacción
   */
  static async updateTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      const updateData = req.body;

      const transaction = await TransactionService.updateTransaction(id, userId!, updateData);

      res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: transaction,
      });
    } catch (error) {
      logger.error('Error in updateTransaction controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Elimina una transacción
   */
  static async deleteTransaction(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      await TransactionService.deleteTransaction(id, userId!);

      res.status(200).json({
        success: true,
        message: 'Transaction deleted successfully',
      });
    } catch (error) {
      logger.error('Error in deleteTransaction controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete transaction',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene estadísticas de transacciones del usuario
   */
  static async getTransactionStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { period = 'month' } = req.query;

      const stats = await TransactionService.getTransactionStats(userId!, period as string);

      res.status(200).json({
        success: true,
        message: 'Transaction statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getTransactionStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve transaction statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
