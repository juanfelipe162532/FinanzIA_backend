import prisma from '../config/database';
import { logger } from '../utils/logger';

export class GoalService {
  /**
   * Crea una nueva meta
   */
  static async createGoal(userId: string, goalData: any) {
    try {
      const goal = await prisma.goal.create({
        data: {
          userId,
          name: goalData.name,
          description: goalData.description,
          targetAmount: goalData.targetAmount,
          currentAmount: goalData.currentAmount || 0,
          targetDate: goalData.targetDate ? new Date(goalData.targetDate) : null,
          category: goalData.category || 'other',
          status: goalData.status || 'active',
          priority: goalData.priority || 'medium',
          isPublic: goalData.isPublic || false,
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
          contributions: {
            orderBy: {
              date: 'desc',
            },
            take: 5,
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      });

      logger.info(`Created goal with ID: ${goal.id} for user: ${userId}`);
      return goal;
    } catch (error) {
      logger.error('Error creating goal:', error);
      throw new Error('Failed to create goal');
    }
  }

  /**
   * Obtiene todas las metas del usuario
   */
  static async getGoalsByUserId(userId: string, filters: any = {}) {
    try {
      const where: any = { userId };

      // Aplicar filtros
      if (filters.status) {
        where.status = filters.status;
      }
      if (filters.category) {
        where.category = filters.category;
      }
      if (filters.priority) {
        where.priority = filters.priority;
      }

      const goals = await prisma.goal.findMany({
        where,
        include: {
          contributions: {
            orderBy: {
              date: 'desc',
            },
            take: 3,
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
        orderBy: [
          { priority: 'desc' }, // High priority first
          { createdAt: 'desc' },
        ],
      });

      // Calcular estadísticas adicionales
      const goalsWithStats = goals.map(goal => ({
        ...goal,
        progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
        remainingAmount: goal.targetAmount - goal.currentAmount,
        daysRemaining: goal.targetDate ? Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
        isOverdue: goal.targetDate ? goal.targetDate < new Date() && goal.status !== 'completed' : false,
      }));

      logger.info(`Retrieved ${goals.length} goals for user: ${userId}`);
      return goalsWithStats;
    } catch (error) {
      logger.error('Error fetching goals:', error);
      throw new Error('Failed to fetch goals');
    }
  }

  /**
   * Obtiene una meta por ID
   */
  static async getGoalById(id: string, userId: string) {
    try {
      const goal = await prisma.goal.findFirst({
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
          contributions: {
            orderBy: {
              date: 'desc',
            },
            include: {
              transaction: {
                select: {
                  id: true,
                  description: true,
                  category: {
                    select: {
                      name: true,
                      icon: true,
                      color: true,
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      });

      if (!goal) {
        throw new Error('Goal not found or access denied');
      }

      // Calcular estadísticas
      const goalWithStats = {
        ...goal,
        progress: goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0,
        remainingAmount: goal.targetAmount - goal.currentAmount,
        daysRemaining: goal.targetDate ? Math.ceil((goal.targetDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null,
        isOverdue: goal.targetDate ? goal.targetDate < new Date() && goal.status !== 'completed' : false,
        averageContribution: goal._count.contributions > 0 ? goal.currentAmount / goal._count.contributions : 0,
      };

      logger.info(`Retrieved goal with ID: ${id} for user: ${userId}`);
      return goalWithStats;
    } catch (error) {
      logger.error('Error fetching goal:', error);
      throw new Error('Failed to fetch goal');
    }
  }

  /**
   * Actualiza una meta
   */
  static async updateGoal(id: string, userId: string, updateData: any) {
    try {
      const goal = await prisma.goal.update({
        where: { 
          id,
          userId,
        },
        data: {
          name: updateData.name,
          description: updateData.description,
          targetAmount: updateData.targetAmount,
          targetDate: updateData.targetDate ? new Date(updateData.targetDate) : null,
          category: updateData.category,
          status: updateData.status,
          priority: updateData.priority,
          isPublic: updateData.isPublic,
        },
        include: {
          contributions: {
            orderBy: {
              date: 'desc',
            },
            take: 5,
          },
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      });

      // Si la meta se marca como completada, actualizar currentAmount si es necesario
      if (updateData.status === 'completed' && goal.currentAmount < goal.targetAmount) {
        await prisma.goal.update({
          where: { id },
          data: { currentAmount: goal.targetAmount },
        });
      }

      logger.info(`Updated goal with ID: ${id} for user: ${userId}`);
      return goal;
    } catch (error) {
      logger.error('Error updating goal:', error);
      throw new Error('Failed to update goal');
    }
  }

  /**
   * Elimina una meta
   */
  static async deleteGoal(id: string, userId: string) {
    try {
      // Verificar si la meta tiene contribuciones
      const goalWithContributions = await prisma.goal.findFirst({
        where: { 
          id,
          userId,
        },
        include: {
          _count: {
            select: {
              contributions: true,
            },
          },
        },
      });

      if (!goalWithContributions) {
        throw new Error('Goal not found or access denied');
      }

      if (goalWithContributions._count.contributions > 0) {
        // Marcar como cancelada en lugar de eliminar
        await prisma.goal.update({
          where: { id },
          data: { status: 'cancelled' },
        });
        logger.info(`Cancelled goal with ID: ${id} (has ${goalWithContributions._count.contributions} contributions)`);
        return { message: 'Goal cancelled due to existing contributions' };
      } else {
        // Eliminar si no tiene contribuciones
        await prisma.goal.delete({
          where: { id },
        });
        logger.info(`Deleted goal with ID: ${id} for user: ${userId}`);
        return { message: 'Goal deleted successfully' };
      }
    } catch (error) {
      logger.error('Error deleting goal:', error);
      throw new Error('Failed to delete goal');
    }
  }

  /**
   * Agrega una contribución a una meta
   */
  static async addContribution(goalId: string, userId: string, contributionData: any, transactionId?: string) {
    try {
      const contribution = await prisma.$transaction(async (tx) => {
        // Verificar que la meta existe y pertenece al usuario
        const goal = await tx.goal.findFirst({
          where: { 
            id: goalId,
            userId,
          },
        });

        if (!goal) {
          throw new Error('Goal not found or access denied');
        }

        // Crear la contribución
        const newContribution = await tx.goalContribution.create({
          data: {
            goalId,
            amount: contributionData.amount,
            date: contributionData.date ? new Date(contributionData.date) : new Date(),
            description: contributionData.description,
            transactionId,
          },
        });

        // Actualizar el monto actual de la meta
        const updatedGoal = await tx.goal.update({
          where: { id: goalId },
          data: {
            currentAmount: {
              increment: contributionData.amount,
            },
          },
        });

        // Si se alcanzó la meta, marcarla como completada
        if (updatedGoal.currentAmount >= updatedGoal.targetAmount && updatedGoal.status === 'active') {
          await tx.goal.update({
            where: { id: goalId },
            data: { status: 'completed' },
          });
        }

        return newContribution;
      });

      logger.info(`Added contribution of ${contributionData.amount} to goal: ${goalId}`);
      return contribution;
    } catch (error) {
      logger.error('Error adding contribution:', error);
      throw new Error('Failed to add contribution to goal');
    }
  }

  /**
   * Obtiene las contribuciones de una meta
   */
  static async getGoalContributions(goalId: string, userId: string, page: number = 1, limit: number = 20) {
    try {
      // Verificar que la meta pertenece al usuario
      const goal = await prisma.goal.findFirst({
        where: { 
          id: goalId,
          userId,
        },
      });

      if (!goal) {
        throw new Error('Goal not found or access denied');
      }

      const skip = (page - 1) * limit;

      const contributions = await prisma.goalContribution.findMany({
        where: { goalId },
        include: {
          transaction: {
            select: {
              id: true,
              description: true,
              type: true,
              category: {
                select: {
                  name: true,
                  icon: true,
                  color: true,
                },
              },
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
        skip,
        take: limit,
      });

      const totalContributions = await prisma.goalContribution.count({
        where: { goalId },
      });

      logger.info(`Retrieved ${contributions.length} contributions for goal: ${goalId}`);
      return {
        contributions,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(totalContributions / limit),
          totalItems: totalContributions,
          itemsPerPage: limit,
        },
      };
    } catch (error) {
      logger.error('Error fetching goal contributions:', error);
      throw new Error('Failed to fetch goal contributions');
    }
  }

  /**
   * Obtiene resumen de todas las metas del usuario
   */
  static async getGoalsSummary(userId: string) {
    try {
      const goals = await prisma.goal.findMany({
        where: { userId },
        select: {
          id: true,
          name: true,
          targetAmount: true,
          currentAmount: true,
          status: true,
          priority: true,
          category: true,
          targetDate: true,
        },
      });

      const summary = {
        totalGoals: goals.length,
        activeGoals: goals.filter(g => g.status === 'active').length,
        completedGoals: goals.filter(g => g.status === 'completed').length,
        totalTargetAmount: goals.reduce((sum, goal) => sum + goal.targetAmount, 0),
        totalCurrentAmount: goals.reduce((sum, goal) => sum + goal.currentAmount, 0),
        overallProgress: 0,
        goalsByCategory: goals.reduce((acc, goal) => {
          acc[goal.category || 'other'] = (acc[goal.category || 'other'] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        goalsByStatus: goals.reduce((acc, goal) => {
          acc[goal.status] = (acc[goal.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>),
        upcomingDeadlines: goals
          .filter(g => g.targetDate && g.targetDate > new Date() && g.status === 'active')
          .sort((a, b) => a.targetDate!.getTime() - b.targetDate!.getTime())
          .slice(0, 5)
          .map(g => ({
            id: g.id,
            name: g.name,
            targetDate: g.targetDate,
            daysRemaining: Math.ceil((g.targetDate!.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
            progress: g.targetAmount > 0 ? (g.currentAmount / g.targetAmount) * 100 : 0,
          })),
      };

      // Calcular progreso general
      if (summary.totalTargetAmount > 0) {
        summary.overallProgress = (summary.totalCurrentAmount / summary.totalTargetAmount) * 100;
      }

      logger.info(`Generated goals summary for user: ${userId}`);
      return summary;
    } catch (error) {
      logger.error('Error generating goals summary:', error);
      throw new Error('Failed to generate goals summary');
    }
  }

  /**
   * Sugiere metas basadas en el historial del usuario
   */
  static async suggestGoals(userId: string) {
    try {
      // Obtener datos del usuario para sugerir metas
      const userData = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          transactions: {
            where: {
              date: {
                gte: new Date(new Date().getFullYear() - 1, 0, 1), // Último año
              },
            },
            select: {
              amount: true,
              type: true,
              category: {
                select: {
                  name: true,
                  type: true,
                },
              },
            },
          },
          goals: {
            select: {
              category: true,
              targetAmount: true,
            },
          },
        },
      });

      if (!userData) {
        throw new Error('User not found');
      }

      // Calcular ingresos y gastos promedio mensuales
      const monthlyIncome = userData.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0) / 12;
      
      const monthlyExpenses = userData.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0) / 12;

      const monthlySavings = monthlyIncome - monthlyExpenses;

      // Generar sugerencias
      const suggestions = [];

      // Meta de ahorro de emergencia (3-6 meses de gastos)
      if (!userData.goals.some(g => g.category === 'emergency')) {
        suggestions.push({
          category: 'emergency',
          name: 'Fondo de Emergencia',
          description: 'Ahorra para 6 meses de gastos básicos',
          targetAmount: monthlyExpenses * 6,
          priority: 'high',
          estimatedMonths: Math.ceil((monthlyExpenses * 6) / (monthlySavings * 0.3)),
        });
      }

      // Meta de ahorro anual (10% de ingresos)
      if (!userData.goals.some(g => g.category === 'savings')) {
        suggestions.push({
          category: 'savings',
          name: 'Ahorro Anual',
          description: 'Ahorra el 10% de tus ingresos anuales',
          targetAmount: monthlyIncome * 12 * 0.1,
          priority: 'medium',
          estimatedMonths: Math.ceil((monthlyIncome * 12 * 0.1) / (monthlySavings * 0.2)),
        });
      }

      // Meta de vacaciones
      if (!userData.goals.some(g => g.category === 'vacation')) {
        suggestions.push({
          category: 'vacation',
          name: 'Vacaciones',
          description: 'Ahorra para unas merecidas vacaciones',
          targetAmount: monthlyIncome * 2,
          priority: 'low',
          estimatedMonths: Math.ceil((monthlyIncome * 2) / (monthlySavings * 0.15)),
        });
      }

      logger.info(`Generated ${suggestions.length} goal suggestions for user: ${userId}`);
      return suggestions;
    } catch (error) {
      logger.error('Error generating goal suggestions:', error);
      throw new Error('Failed to generate goal suggestions');
    }
  }
}