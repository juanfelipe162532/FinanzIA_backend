import prisma from '../config/database';
import { logger } from '../utils/logger';

export class DashboardService {
  /**
   * Obtiene resumen financiero del usuario
   */
  static async getFinancialSummary(userId: string, period: string = 'month') {
    try {
      const now = new Date();
      let startDate: Date;
      let previousStartDate: Date;

      switch (period) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      }

      const endDate = period === 'week' ? startDate : 
                     period === 'month' ? new Date(now.getFullYear(), now.getMonth() + 1, 1) :
                     new Date(now.getFullYear() + 1, 0, 1);

      const previousEndDate = period === 'week' ? previousStartDate :
                             period === 'month' ? startDate :
                             new Date(now.getFullYear(), 0, 1);

      // Datos del período actual
      const [currentIncome, currentExpenses, currentTransactionCount] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'income',
            date: { gte: startDate, lt: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'expense',
            date: { gte: startDate, lt: endDate },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.count({
          where: {
            userId,
            date: { gte: startDate, lt: endDate },
          },
        }),
      ]);

      // Datos del período anterior para comparación
      const [previousIncome, previousExpenses] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'income',
            date: { gte: previousStartDate, lt: previousEndDate },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'expense',
            date: { gte: previousStartDate, lt: previousEndDate },
          },
          _sum: { amount: true },
        }),
      ]);

      const currentIncomeAmount = currentIncome._sum.amount || 0;
      const currentExpensesAmount = currentExpenses._sum.amount || 0;
      const currentBalance = currentIncomeAmount - currentExpensesAmount;

      const previousIncomeAmount = previousIncome._sum.amount || 0;
      const previousExpensesAmount = previousExpenses._sum.amount || 0;

      // Calcular cambios porcentuales
      const incomeChange = previousIncomeAmount > 0 
        ? ((currentIncomeAmount - previousIncomeAmount) / previousIncomeAmount) * 100 
        : 0;

      const expenseChange = previousExpensesAmount > 0 
        ? ((currentExpensesAmount - previousExpensesAmount) / previousExpensesAmount) * 100 
        : 0;

      const summary = {
        period,
        income: {
          current: currentIncomeAmount,
          previous: previousIncomeAmount,
          change: incomeChange,
        },
        expenses: {
          current: currentExpensesAmount,
          previous: previousExpensesAmount,
          change: expenseChange,
        },
        balance: {
          current: currentBalance,
          savingsRate: currentIncomeAmount > 0 ? (currentBalance / currentIncomeAmount) * 100 : 0,
        },
        transactionCount: currentTransactionCount,
      };

      logger.info(`Generated financial summary for user ${userId}`);
      return summary;
    } catch (error) {
      logger.error('Error generating financial summary:', error);
      throw new Error('Failed to generate financial summary');
    }
  }

  /**
   * Obtiene datos para gráficos
   */
  static async getChartData(userId: string, type: string = 'all', period: string = 'month') {
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

      const chartData: any = {};

      if (type === 'all' || type === 'category') {
        // Gráfico por categorías
        const categoryData = await prisma.transaction.groupBy({
          by: ['categoryId', 'type'],
          where: {
            userId,
            date: { gte: startDate },
          },
          _sum: { amount: true },
          _count: { id: true },
        });

        const categoriesWithNames = await Promise.all(
          categoryData.map(async (item) => {
            const category = await prisma.category.findUnique({
              where: { id: item.categoryId },
              select: { name: true, color: true, icon: true },
            });
            return {
              ...item,
              categoryName: category?.name || 'Unknown',
              categoryColor: category?.color,
              categoryIcon: category?.icon,
            };
          })
        );

        chartData.byCategory = categoriesWithNames;
      }

      if (type === 'all' || type === 'timeline') {
        // Gráfico de línea temporal
        const timelineData = await prisma.transaction.findMany({
          where: {
            userId,
            date: { gte: startDate },
          },
          select: {
            amount: true,
            type: true,
            date: true,
          },
          orderBy: { date: 'asc' },
        });

        chartData.timeline = timelineData;
      }

      if (type === 'all' || type === 'budget') {
        // Comparación con presupuestos
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear();

        const budgets = await prisma.budget.findMany({
          where: {
            userId,
            month: currentMonth,
            year: currentYear,
          },
          include: { category: true },
        });

        const budgetComparison = await Promise.all(
          budgets.map(async (budget) => {
            const spent = await prisma.transaction.aggregate({
              where: {
                userId,
                categoryId: budget.categoryId,
                type: 'expense',
                date: {
                  gte: new Date(currentYear, currentMonth - 1, 1),
                  lt: new Date(currentYear, currentMonth, 1),
                },
              },
              _sum: { amount: true },
            });

            return {
              categoryName: budget.category.name,
              budgeted: budget.amount,
              spent: spent._sum.amount || 0,
              remaining: budget.amount - (spent._sum.amount || 0),
              percentage: budget.amount > 0 ? ((spent._sum.amount || 0) / budget.amount) * 100 : 0,
            };
          })
        );

        chartData.budgetComparison = budgetComparison;
      }

      logger.info(`Generated chart data for user ${userId}`);
      return chartData;
    } catch (error) {
      logger.error('Error generating chart data:', error);
      throw new Error('Failed to generate chart data');
    }
  }

  /**
   * Obtiene tendencias de gastos e ingresos
   */
  static async getTrends(userId: string, period: string = '6months') {
    try {
      const now = new Date();
      let months = 6;

      switch (period) {
        case '3months':
          months = 3;
          break;
        case '6months':
          months = 6;
          break;
        case '12months':
          months = 12;
          break;
        default:
          months = 6;
      }

      const trends = [];

      for (let i = months - 1; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);

        const [income, expenses] = await Promise.all([
          prisma.transaction.aggregate({
            where: {
              userId,
              type: 'income',
              date: { gte: monthDate, lt: nextMonthDate },
            },
            _sum: { amount: true },
          }),
          prisma.transaction.aggregate({
            where: {
              userId,
              type: 'expense',
              date: { gte: monthDate, lt: nextMonthDate },
            },
            _sum: { amount: true },
          }),
        ]);

        trends.push({
          month: monthDate.toISOString().substring(0, 7), // YYYY-MM format
          income: income._sum.amount || 0,
          expenses: expenses._sum.amount || 0,
          balance: (income._sum.amount || 0) - (expenses._sum.amount || 0),
        });
      }

      logger.info(`Generated trends data for user ${userId}`);
      return trends;
    } catch (error) {
      logger.error('Error generating trends data:', error);
      throw new Error('Failed to generate trends data');
    }
  }

  /**
   * Obtiene métricas de rendimiento financiero
   */
  static async getPerformanceMetrics(userId: string) {
    try {
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();

      // Últimos 12 meses
      const yearStart = new Date(currentYear - 1, currentMonth + 1, 1);
      const yearEnd = new Date(currentYear, currentMonth + 1, 1);

      const [yearlyIncome, yearlyExpenses, totalTransactions, categoriesUsed] = await Promise.all([
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'income',
            date: { gte: yearStart, lt: yearEnd },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.aggregate({
          where: {
            userId,
            type: 'expense',
            date: { gte: yearStart, lt: yearEnd },
          },
          _sum: { amount: true },
        }),
        prisma.transaction.count({
          where: {
            userId,
            date: { gte: yearStart, lt: yearEnd },
          },
        }),
        prisma.transaction.groupBy({
          by: ['categoryId'],
          where: {
            userId,
            date: { gte: yearStart, lt: yearEnd },
          },
        }),
      ]);

      const totalIncome = yearlyIncome._sum.amount || 0;
      const totalExpenses = yearlyExpenses._sum.amount || 0;
      const netWorth = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? (netWorth / totalIncome) * 100 : 0;

      // Promedio mensual
      const avgMonthlyIncome = totalIncome / 12;
      const avgMonthlyExpenses = totalExpenses / 12;

      // Categoría con más gastos
      const topExpenseCategory = await prisma.transaction.groupBy({
        by: ['categoryId'],
        where: {
          userId,
          type: 'expense',
          date: { gte: yearStart, lt: yearEnd },
        },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 1,
      });

      let topCategoryName = 'N/A';
      if (topExpenseCategory.length > 0) {
        const category = await prisma.category.findUnique({
          where: { id: topExpenseCategory[0].categoryId },
          select: { name: true },
        });
        topCategoryName = category?.name || 'Unknown';
      }

      const metrics = {
        period: '12 months',
        totalIncome,
        totalExpenses,
        netWorth,
        savingsRate,
        averageMonthlyIncome: avgMonthlyIncome,
        averageMonthlyExpenses: avgMonthlyExpenses,
        totalTransactions,
        categoriesUsed: categoriesUsed.length,
        topExpenseCategory: {
          name: topCategoryName,
          amount: topExpenseCategory[0]?._sum.amount || 0,
        },
        financialHealth: this.calculateFinancialHealth(savingsRate, totalIncome, totalExpenses),
      };

      logger.info(`Generated performance metrics for user ${userId}`);
      return metrics;
    } catch (error) {
      logger.error('Error generating performance metrics:', error);
      throw new Error('Failed to generate performance metrics');
    }
  }

  /**
   * Calcula la salud financiera basada en métricas
   */
  private static calculateFinancialHealth(savingsRate: number, income: number, expenses: number) {
    let score = 0;
    let status = 'poor';
    const recommendations = [];

    // Tasa de ahorro (40% del score)
    if (savingsRate >= 20) {
      score += 40;
    } else if (savingsRate >= 10) {
      score += 25;
    } else if (savingsRate >= 5) {
      score += 15;
    } else {
      recommendations.push('Aumentar la tasa de ahorro al menos al 10%');
    }

    // Relación ingresos/gastos (30% del score)
    const expenseRatio = income > 0 ? (expenses / income) * 100 : 100;
    if (expenseRatio <= 70) {
      score += 30;
    } else if (expenseRatio <= 80) {
      score += 20;
    } else if (expenseRatio <= 90) {
      score += 10;
    } else {
      recommendations.push('Reducir gastos para mantenerlos bajo el 80% de los ingresos');
    }

    // Consistencia de ingresos (30% del score)
    if (income > 0) {
      score += 30; // Simplificado - en producción analizaríamos la variabilidad
    }

    // Determinar estado
    if (score >= 80) {
      status = 'excellent';
    } else if (score >= 60) {
      status = 'good';
    } else if (score >= 40) {
      status = 'fair';
    } else {
      status = 'poor';
    }

    return {
      score,
      status,
      recommendations,
    };
  }
}
