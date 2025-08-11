import prisma from '../config/database';
import { logger } from '../utils/logger';
import {
  BedrockRuntimeClient,
  ConverseCommand,
  ConverseStreamCommand,
  ConversationRole,
} from '@aws-sdk/client-bedrock-runtime';

export class AIService {
  private static client = new BedrockRuntimeClient({
    region: 'us-east-1',
    credentials: {
      accessKeyId: 'AKIAXFEZEY7QFP5DQT75',
      secretAccessKey: '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',
    },
  });

  private static modelId = 'amazon.nova-lite-v1:0';

  private static genericSystemPrompt = `Eres un asistente virtual experto en finanzas personales y empresariales. FORMATO DE RESPUESTAS:

**ESTRUCTURA:**
- Usa títulos con ":" al final para secciones principales
- Usa "**texto**" para destacar términos importantes  
- Usa listas con "- " para puntos clave (máximo 3-4 puntos)
- Usa números "1. " para pasos o procesos

**CONTENIDO:**
- Máximo 2-3 párrafos por respuesta
- Frases simples y directas
- Solo temas financieros
- Educación general, no consejos específicos de inversión

**EJEMPLO:**
Presupuesto Personal:
Para crear un presupuesto efectivo, considera estos **elementos clave**:
- Ingresos mensuales fijos
- Gastos esenciales (vivienda, alimentación)  
- Ahorro del 20% de ingresos

El método **50/30/20** es ideal para principiantes.`;
  /**
   * Envía un mensaje al AI y guarda en historial
   */
  static async sendChatMessage(userId: string, message: string, context?: any) {
    try {
      // Obtener información del usuario para personalizar la respuesta
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      const userName = user ? `${user.firstName} ${user.lastName}` : 'Usuario';

      // Generar respuesta con AWS Bedrock
      const aiResponse = await this.generateAIResponse(message, context, userName);

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
          content: aiResponse,
        },
      });

      logger.info(`Saved chat entry with ID: ${aiEntry.id} for user ${userId}`);

      return {
        id: aiEntry.id,
        userMessage: message,
        aiResponse: aiResponse,
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
   * Envía un mensaje al AI con respuesta en streaming
   */
  static async *sendChatMessageStream(userId: string, message: string, context?: any) {
    try {
      // Obtener información del usuario para personalizar la respuesta
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { firstName: true, lastName: true },
      });

      const userName = user ? `${user.firstName} ${user.lastName}` : 'Usuario';

      // Guardar mensaje del usuario
      const userEntry = await prisma.aIChatHistory.create({
        data: {
          userId,
          role: 'user',
          content: message,
        },
      });

      logger.info(`Saved user message with ID: ${userEntry.id} for user ${userId}`);

      // Generar respuesta streaming con AWS Bedrock
      let accumulatedResponse = '';

      yield* this.generateAIResponseStream(message, context, userName, chunk => {
        accumulatedResponse += chunk;
      });

      // Guardar respuesta completa del AI
      if (accumulatedResponse.trim()) {
        const aiEntry = await prisma.aIChatHistory.create({
          data: {
            userId,
            role: 'assistant',
            content: accumulatedResponse,
          },
        });

        logger.info(`Saved AI response with ID: ${aiEntry.id} for user ${userId}`);
      }
    } catch (error) {
      logger.error('Error in AI chat streaming service:', error);
      yield JSON.stringify({
        content:
          'Disculpa, ocurrió un error al procesar tu consulta. Por favor intenta nuevamente.',
      });
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
   * Genera respuesta streaming del AI usando AWS Bedrock
   */
  private static async *generateAIResponseStream(
    message: string,
    context: any,
    userName: string,
    onChunk?: (chunk: string) => void
  ) {
    try {
      // Crear el prompt personalizado incluyendo el nombre del usuario
      const userPrompt = `Usuario: ${userName}\nPregunta: ${message}`;

      const input = {
        modelId: this.modelId,
        messages: [
          {
            role: ConversationRole.USER,
            content: [{ text: userPrompt }],
          },
        ],
        systemPrompts: [
          {
            text: this.genericSystemPrompt,
          },
        ],
        inferenceConfig: {
          maxTokens: 300,
          temperature: 0.3,
        },
      };

      const command = new ConverseStreamCommand(input);
      const response = await this.client.send(command);

      if (response.stream) {
        for await (const event of response.stream) {
          if (event.contentBlockDelta?.delta?.text) {
            const chunk = event.contentBlockDelta.delta.text;
            if (onChunk) {
              onChunk(chunk);
            }
            yield JSON.stringify({ content: chunk });
          }
        }
      }

      logger.info(`AI streaming response completed for user ${userName}`);
    } catch (error) {
      logger.error('Error generating AI streaming response:', error);
      yield JSON.stringify({
        content:
          'Disculpa, ocurrió un error al procesar tu consulta. Por favor intenta nuevamente.',
      });
    }
  }

  /**
   * Genera respuesta del AI usando AWS Bedrock
   */
  private static async generateAIResponse(
    message: string,
    context: any,
    userName: string
  ): Promise<string> {
    try {
      // Crear el prompt personalizado incluyendo el nombre del usuario
      const userPrompt = `Usuario: ${userName}\nPregunta: ${message}`;

      const input = {
        modelId: this.modelId,
        messages: [
          {
            role: ConversationRole.USER,
            content: [{ text: userPrompt }],
          },
        ],
        systemPrompts: [
          {
            text: this.genericSystemPrompt,
          },
        ],
        inferenceConfig: {
          maxTokens: 300,
          temperature: 0.3,
        },
      };

      const command = new ConverseCommand(input);
      const response = await this.client.send(command);

      const aiResponse = response.output?.message?.content?.[0]?.text;

      if (aiResponse && aiResponse.trim() !== '') {
        logger.info(`AI response generated for user ${userName}`);
        return aiResponse;
      } else {
        logger.warn('No response received from AI model');
        return 'Lo siento, no pude generar una respuesta en este momento. Por favor intenta nuevamente.';
      }
    } catch (error) {
      logger.error('Error generating AI response:', error);
      return 'Disculpa, ocurrió un error al procesar tu consulta. Por favor intenta nuevamente.';
    }
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
        description:
          'Tus gastos representan más del 80% de tus ingresos. Considera reducir gastos no esenciales.',
        priority: 'high',
      });
    }

    // Análisis de presupuestos
    if (budgets.length === 0) {
      suggestions.push({
        type: 'recommendation',
        category: 'budgeting',
        title: 'Crear presupuestos',
        description:
          'No tienes presupuestos establecidos. Crear presupuestos te ayudará a controlar mejor tus gastos.',
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

    const topExpenseCategory = Object.entries(expensesByCategory).sort(
      ([, a]: any, [, b]: any) => b - a
    )[0];

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
