import prisma from '../config/database';
import { logger } from '../utils/logger';

export class AccountService {
  /**
   * Crea una nueva cuenta
   */
  static async createAccount(userId: string, accountData: any) {
    try {
      const account = await prisma.account.create({
        data: {
          userId,
          name: accountData.name,
          type: accountData.type,
          institution: accountData.institution,
          balance: accountData.balance || 0,
          currency: accountData.currency || 'COP',
          isActive: accountData.isActive !== undefined ? accountData.isActive : true,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });

      logger.info(`Created account with ID: ${account.id} for user: ${userId}`);
      return account;
    } catch (error) {
      logger.error('Error creating account:', error);
      throw new Error('Failed to create account');
    }
  }

  /**
   * Obtiene todas las cuentas del usuario
   */
  static async getAccountsByUserId(userId: string) {
    try {
      const accounts = await prisma.account.findMany({
        where: { userId },
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      logger.info(`Retrieved ${accounts.length} accounts for user: ${userId}`);
      return accounts;
    } catch (error) {
      logger.error('Error fetching accounts:', error);
      throw new Error('Failed to fetch accounts');
    }
  }

  /**
   * Obtiene una cuenta por ID
   */
  static async getAccountById(id: string, userId: string) {
    try {
      const account = await prisma.account.findFirst({
        where: { 
          id,
          userId,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          transactions: {
            orderBy: {
              date: 'desc',
            },
            take: 10,
            include: {
              category: {
                select: {
                  id: true,
                  name: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });

      if (!account) {
        throw new Error('Account not found or access denied');
      }

      logger.info(`Retrieved account with ID: ${id} for user: ${userId}`);
      return account;
    } catch (error) {
      logger.error('Error fetching account:', error);
      throw new Error('Failed to fetch account');
    }
  }

  /**
   * Actualiza una cuenta
   */
  static async updateAccount(id: string, userId: string, updateData: any) {
    try {
      const account = await prisma.account.update({
        where: { 
          id,
          userId,
        },
        data: {
          name: updateData.name,
          type: updateData.type,
          institution: updateData.institution,
          balance: updateData.balance,
          currency: updateData.currency,
          isActive: updateData.isActive,
        },
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });

      logger.info(`Updated account with ID: ${id} for user: ${userId}`);
      return account;
    } catch (error) {
      logger.error('Error updating account:', error);
      throw new Error('Failed to update account');
    }
  }

  /**
   * Elimina una cuenta
   */
  static async deleteAccount(id: string, userId: string) {
    try {
      // Verificar si la cuenta tiene transacciones
      const accountWithTransactions = await prisma.account.findFirst({
        where: { 
          id,
          userId,
        },
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });

      if (!accountWithTransactions) {
        throw new Error('Account not found or access denied');
      }

      if (accountWithTransactions._count.transactions > 0) {
        // En lugar de eliminar, marcar como inactiva
        await prisma.account.update({
          where: { id },
          data: { isActive: false },
        });
        logger.info(`Deactivated account with ID: ${id} (has ${accountWithTransactions._count.transactions} transactions)`);
        return { message: 'Account deactivated due to existing transactions' };
      } else {
        // Eliminar si no tiene transacciones
        await prisma.account.delete({
          where: { id },
        });
        logger.info(`Deleted account with ID: ${id} for user: ${userId}`);
        return { message: 'Account deleted successfully' };
      }
    } catch (error) {
      logger.error('Error deleting account:', error);
      throw new Error('Failed to delete account');
    }
  }

  /**
   * Actualiza el balance de una cuenta
   */
  static async updateAccountBalance(id: string, userId: string, newBalance: number) {
    try {
      const account = await prisma.account.update({
        where: { 
          id,
          userId,
        },
        data: {
          balance: newBalance,
        },
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });

      logger.info(`Updated balance for account ID: ${id} to ${newBalance}`);
      return account;
    } catch (error) {
      logger.error('Error updating account balance:', error);
      throw new Error('Failed to update account balance');
    }
  }

  /**
   * Obtiene resumen financiero por cuentas
   */
  static async getAccountsSummary(userId: string) {
    try {
      const accounts = await prisma.account.findMany({
        where: { 
          userId,
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          type: true,
          balance: true,
          currency: true,
        },
      });

      const summary = {
        totalAccounts: accounts.length,
        totalBalance: accounts.reduce((sum, account) => sum + account.balance, 0),
        accountsByType: accounts.reduce((acc, account) => {
          acc[account.type] = (acc[account.type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        balanceByType: accounts.reduce((acc, account) => {
          acc[account.type] = (acc[account.type] || 0) + account.balance;
          return acc;
        }, {} as Record<string, number>),
        accounts,
      };

      logger.info(`Generated accounts summary for user: ${userId}`);
      return summary;
    } catch (error) {
      logger.error('Error generating accounts summary:', error);
      throw new Error('Failed to generate accounts summary');
    }
  }

  /**
   * Recalcula el balance de una cuenta basado en transacciones
   */
  static async recalculateAccountBalance(id: string, userId: string) {
    try {
      // Obtener todas las transacciones de la cuenta
      const transactions = await prisma.transaction.findMany({
        where: {
          accountId: id,
          userId,
        },
        select: {
          amount: true,
          type: true,
        },
      });

      // Calcular el balance
      const calculatedBalance = transactions.reduce((balance, transaction) => {
        return transaction.type === 'income' 
          ? balance + transaction.amount 
          : balance - transaction.amount;
      }, 0);

      // Actualizar el balance en la cuenta
      const updatedAccount = await prisma.account.update({
        where: { id },
        data: { balance: calculatedBalance },
        include: {
          _count: {
            select: {
              transactions: true,
            },
          },
        },
      });

      logger.info(`Recalculated balance for account ID: ${id} - New balance: ${calculatedBalance}`);
      return updatedAccount;
    } catch (error) {
      logger.error('Error recalculating account balance:', error);
      throw new Error('Failed to recalculate account balance');
    }
  }
}