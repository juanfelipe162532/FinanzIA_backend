import prisma from '../config/database';
import { logger } from '../utils/logger';

export class AIService {
  /**
   * Envía un mensaje al AI y guarda en historial
   */
  static async sendChatMessage(userId: string, message: string, context?: any) {
    try {
      // Aquí iría la lógica de integración con el AI (OpenAI, etc.)
      // Por ahora simularemos una respuesta
      const aiResponse = await this.generateAIResponse(message, context, userId);

      // Guardar mensaje del usuario
      const userEntry = await prisma.aIChatHistory.create({
        data: {
          userId,
          role: 'user',
          content: message,
        },
      });

      // Guardar respuesta del AI
      const aiEntry = await prisma.aIChatHistory.create({
        data: {
          userId,
          role: 'assistant',
          content: aiResponse.content,
        },
      });

      logger.info(`Saved chat entry with ID: ${aiEntry.id} for user ${userId}`);

      return {
        id: aiEntry.id,
        userMessage: message,
        aiResponse: aiResponse.content,
        suggestions: aiResponse.suggestions,
        timestamp: aiEntry.timestamp,
      };
    } catch (error) {
      logger.error('Error in AI chat service:', error);
      throw new Error('Failed to process AI chat message');
    }
  }

  /**
   * Obtiene el historial de chat del usuario
   */
  static async getChatHistory(userId: string, page: number = 1, limit: number = 20) {
    try {
      const skip = (page - 1) * limit;

      const [chatHistory, total] = await Promise.all([
        prisma.aIChatHistory.findMany({
          where: { userId },
          orderBy: { timestamp: 'desc' },
          skip,
          take: limit,
        }),
        prisma.aIChatHistory.count({ where: { userId } }),
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info(`Retrieved ${chatHistory.length} chat entries for user ${userId}`);

      return {
        data: chatHistory,
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
      logger.error('Error fetching chat history:', error);
      throw new Error('Failed to fetch chat history');
    }
  }

  /**
   * Limpia el historial de chat del usuario
   */
  static async clearChatHistory(userId: string) {
    try {
      await prisma.aIChatHistory.deleteMany({
        where: { userId },
      });

      logger.info(`Cleared chat history for user ${userId}`);
    } catch (error) {
      logger.error('Error clearing chat history:', error);
      throw new Error('Failed to clear chat history');
    }
  }

  /**
   * Genera sugerencias financieras personalizadas
   */
  static async getFinancialSuggestions(userId: string, type: string = 'general') {
    try {
      // Obtener datos financieros del usuario
      const userData = await this.getUserFinancialData(userId);
      
      // Generar sugerencias basadas en los datos
      const suggestions = await this.generateFinancialSuggestions(userData, type);

      logger.info(`Generated ${suggestions.length} financial suggestions for user ${userId}`);
      return suggestions;
    } catch (error) {
      logger.error('Error generating financial suggestions:', error);
      throw new Error('Failed to generate financial suggestions');
    }
  }

  /**
   * Obtiene datos financieros del usuario para análisis
   */
  private static async getUserFinancialData(userId: string) {
    try {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const [transactions, budgets, categories] = await Promise.all([
        prisma.transaction.findMany({
          where: {
            userId,
            date: {
              gte: new Date(currentYear, currentMonth - 2, 1), // Últimos 3 meses
            },
          },
          include: { category: true },
        }),
        prisma.budget.findMany({
          where: {
            userId,
            year: currentYear,
            month: currentMonth + 1,
          },
          include: { category: true },
        }),
        prisma.category.findMany({
          where: {
            OR: [{ userId }, { isSystem: true }],
          },
        }),
      ]);

      return { transactions, budgets, categories };
    } catch (error) {
      logger.error('Error fetching user financial data:', error);
      throw new Error('Failed to fetch user financial data');
    }
  }

  /**
   * Genera respuesta del AI (simulada)
   */
  private static async generateAIResponse(message: string, context: any, userId: string) {
    // Aquí iría la integración real con OpenAI o similar
    // Por ahora retornamos respuestas simuladas

    const responses = [
      {
        content: "Basándome en tus patrones de gasto, te recomiendo revisar tus gastos en entretenimiento. Podrías ahorrar un 15% reduciendo las salidas a restaurantes.",
        suggestions: ["Cocinar más en casa", "Buscar ofertas en restaurantes", "Establecer un presupuesto semanal para entretenimiento"]
      },
      {
        content: "Tus ingresos han sido consistentes este mes. Es un buen momento para aumentar tu fondo de emergencia.",
        suggestions: ["Ahorrar 10% adicional", "Considerar inversiones a largo plazo", "Revisar seguros"]
      },
      {
        content: "He notado que gastas más los fines de semana. Te sugiero planificar un presupuesto específico para estos días.",
        suggestions: ["Presupuesto de fin de semana", "Actividades gratuitas", "Comparar precios antes de comprar"]
      }
    ];

    // Seleccionar respuesta aleatoria (en producción sería basada en AI real)
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];

    return randomResponse;
  }

  /**
   * Genera sugerencias financieras basadas en datos del usuario
   */
  private static async generateFinancialSuggestions(userData: any, type: string) {
    const { transactions, budgets } = userData;

    const suggestions = [];

    // Análisis de gastos
    const totalExpenses = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    const totalIncome = transactions
      .filter((t: any) => t.type === 'income')
      .reduce((sum: number, t: any) => sum + t.amount, 0);

    if (totalExpenses > totalIncome * 0.8) {
      suggestions.push({
        type: 'warning',
        category: 'spending',
        title: 'Alto nivel de gastos',
        description: 'Tus gastos representan más del 80% de tus ingresos. Considera reducir gastos no esenciales.',
        priority: 'high',
      });
    }

    // Análisis de presupuestos
    if (budgets.length === 0) {
      suggestions.push({
        type: 'recommendation',
        category: 'budgeting',
        title: 'Crear presupuestos',
        description: 'No tienes presupuestos establecidos. Crear presupuestos te ayudará a controlar mejor tus gastos.',
        priority: 'medium',
      });
    }

    // Análisis de categorías de gasto
    const expensesByCategory = transactions
      .filter((t: any) => t.type === 'expense')
      .reduce((acc: any, t: any) => {
        const categoryName = t.category.name;
        acc[categoryName] = (acc[categoryName] || 0) + t.amount;
        return acc;
      }, {});

    const topExpenseCategory = Object.entries(expensesByCategory)
      .sort(([,a]: any, [,b]: any) => b - a)[0];

    if (topExpenseCategory) {
      suggestions.push({
        type: 'insight',
        category: 'analysis',
        title: `Mayor gasto en ${topExpenseCategory[0]}`,
        description: `Tu mayor categoría de gasto es ${topExpenseCategory[0]} con $${topExpenseCategory[1]}. Revisa si puedes optimizar estos gastos.`,
        priority: 'low',
      });
    }

    return suggestions;
  }
}
