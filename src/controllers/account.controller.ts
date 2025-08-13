import { Request, Response } from 'express';
import { AccountService } from '../services/account.service';
import { logger } from '../utils/logger';
import { body, validationResult, param } from 'express-validator';

export class AccountController {
  /**
   * Validaciones para crear cuenta
   */
  static validateCreateAccount = [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required and must be less than 100 characters'),
    body('type').isIn(['checking', 'savings', 'credit', 'investment']).withMessage('Invalid account type'),
    body('institution').optional().trim().isLength({ max: 100 }).withMessage('Institution must be less than 100 characters'),
    body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be a positive number'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('isActive').optional().isBoolean().withMessage('IsActive must be a boolean'),
  ];

  /**
   * Validaciones para actualizar cuenta
   */
  static validateUpdateAccount = [
    param('id').isMongoId().withMessage('Invalid account ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name must be less than 100 characters'),
    body('type').optional().isIn(['checking', 'savings', 'credit', 'investment']).withMessage('Invalid account type'),
    body('institution').optional().trim().isLength({ max: 100 }).withMessage('Institution must be less than 100 characters'),
    body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be a positive number'),
    body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters'),
    body('isActive').optional().isBoolean().withMessage('IsActive must be a boolean'),
  ];

  /**
   * Crea una nueva cuenta
   */
  static async createAccount(req: Request, res: Response) {
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

      const accountData = req.body;
      const account = await AccountService.createAccount(userId, accountData);

      res.status(201).json({
        success: true,
        message: 'Account created successfully',
        data: account,
      });
    } catch (error) {
      logger.error('Error in createAccount controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create account',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene todas las cuentas del usuario
   */
  static async getUserAccounts(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const accounts = await AccountService.getAccountsByUserId(userId);

      res.status(200).json({
        success: true,
        message: 'Accounts retrieved successfully',
        data: accounts,
      });
    } catch (error) {
      logger.error('Error in getUserAccounts controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve accounts',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene una cuenta específica por ID
   */
  static async getAccountById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const account = await AccountService.getAccountById(id, userId);

      if (!account) {
        return res.status(404).json({
          success: false,
          message: 'Account not found',
        });
      }

      res.status(200).json({
        success: true,
        message: 'Account retrieved successfully',
        data: account,
      });
    } catch (error) {
      logger.error('Error in getAccountById controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve account',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza una cuenta
   */
  static async updateAccount(req: Request, res: Response) {
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

      const account = await AccountService.updateAccount(id, userId, updateData);

      res.status(200).json({
        success: true,
        message: 'Account updated successfully',
        data: account,
      });
    } catch (error) {
      logger.error('Error in updateAccount controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update account',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Elimina una cuenta
   */
  static async deleteAccount(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const result = await AccountService.deleteAccount(id, userId);

      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
      logger.error('Error in deleteAccount controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete account',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Actualiza el balance de una cuenta
   */
  static async updateAccountBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { balance } = req.body;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      if (typeof balance !== 'number' || balance < 0) {
        return res.status(400).json({
          success: false,
          message: 'Balance must be a positive number',
        });
      }

      const account = await AccountService.updateAccountBalance(id, userId, balance);

      res.status(200).json({
        success: true,
        message: 'Account balance updated successfully',
        data: account,
      });
    } catch (error) {
      logger.error('Error in updateAccountBalance controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update account balance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene resumen de cuentas del usuario
   */
  static async getAccountsSummary(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const summary = await AccountService.getAccountsSummary(userId);

      res.status(200).json({
        success: true,
        message: 'Accounts summary retrieved successfully',
        data: summary,
      });
    } catch (error) {
      logger.error('Error in getAccountsSummary controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve accounts summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Recalcula el balance de una cuenta
   */
  static async recalculateAccountBalance(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const account = await AccountService.recalculateAccountBalance(id, userId);

      res.status(200).json({
        success: true,
        message: 'Account balance recalculated successfully',
        data: account,
      });
    } catch (error) {
      logger.error('Error in recalculateAccountBalance controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to recalculate account balance',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}