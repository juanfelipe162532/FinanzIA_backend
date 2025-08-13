import { Recommendation, IRecommendation } from '../models/recommendation.model';
import { Transaction } from '../models/transaction.model';
import { AIService } from './ai.service';
import { logger } from '../utils/logger';
import mongoose from 'mongoose';

export class RecommendationService {
  /**
   * Get current active recommendation for user
   */
  static async getCurrentRecommendation(userId: string): Promise<IRecommendation | null> {
    try {
      const objectId = new mongoose.Types.ObjectId(userId);
      const recommendation = await Recommendation.findActiveForUser(objectId);

      if (recommendation && recommendation.isValid()) {
        return recommendation;
      }

      return null;
    } catch (error) {
      logger.error('Error getting current recommendation:', error);
      throw new Error('Failed to get current recommendation');
    }
  }

  /**
   * Check if user can generate a new recommendation (24 hours have passed)
   */
  static async canGenerateRecommendation(userId: string): Promise<boolean> {
    try {
      const currentRecommendation = await this.getCurrentRecommendation(userId);
      return currentRecommendation === null;
    } catch (error) {
      logger.error('Error checking if can generate recommendation:', error);
      return false;
    }
  }

  /**
   * Generate new AI recommendation based on user's transactions from last 7 days
   */
  static async generateRecommendation(
    userId: string,
    forceGenerate: boolean = false
  ): Promise<IRecommendation> {
    try {
      const objectId = new mongoose.Types.ObjectId(userId);

      // Check if we can generate a new recommendation
      if (!forceGenerate && !(await this.canGenerateRecommendation(userId))) {
        throw new Error(
          'Cannot generate recommendation yet. Please wait 24 hours since last recommendation.'
        );
      }

      // Get transactions from last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const transactions = await Transaction.find({
        userId: objectId,
        date: { $gte: sevenDaysAgo },
      }).sort({ date: -1 });

      if (transactions.length === 0) {
        // Generate recommendation for users with no transactions
        const aiRecommendation = await this.generateNoTransactionsRecommendation();

        // Deactivate old recommendations
        await Recommendation.deactivateOldForUser(objectId);

        const recommendation = new Recommendation({
          userId: objectId,
          recommendation: aiRecommendation,
          transactionCount: 0,
          totalAmount: 0,
          analysisData: {
            period: 'last_7_days',
            categories: new Map(),
            topCategory: 'None',
            balance: 0,
          },
        });

        await recommendation.save();
        return recommendation;
      }

      // Analyze transactions
      const analysis = this.analyzeTransactions(transactions);

      // Generate AI recommendation
      const aiRecommendation = await this.generateAIRecommendation(transactions, analysis);

      // Deactivate old recommendations
      await Recommendation.deactivateOldForUser(objectId);

      // Create new recommendation
      const recommendation = new Recommendation({
        userId: objectId,
        recommendation: aiRecommendation,
        transactionCount: transactions.length,
        totalAmount: analysis.totalAmount,
        analysisData: {
          period: 'last_7_days',
          categories: analysis.categories,
          topCategory: analysis.topCategory,
          balance: analysis.balance,
        },
        metadata: {
          generatedBy: 'ai_service',
          version: '1.0',
        },
      });

      await recommendation.save();
      logger.info(`Generated new recommendation for user ${userId}`);

      return recommendation;
    } catch (error) {
      logger.error('Error generating recommendation:', error);
      throw error;
    }
  }

  /**
   * Analyze transactions and extract key insights
   */
  private static analyzeTransactions(transactions: any[]): any {
    const expenses = transactions.filter(t => t.type === 'expense');
    const income = transactions.filter(t => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    // Group expenses by category (using description keywords)
    const categories = new Map<string, number>();

    expenses.forEach(expense => {
      const category = this.getCategoryFromDescription(expense.description);
      categories.set(category, (categories.get(category) || 0) + expense.amount);
    });

    // Find top spending category
    let topCategory = 'Gastos generales';
    let topAmount = 0;

    categories.forEach((amount, category) => {
      if (amount > topAmount) {
        topAmount = amount;
        topCategory = category;
      }
    });

    return {
      totalExpenses,
      totalIncome,
      balance,
      totalAmount: totalExpenses + totalIncome,
      categories,
      topCategory,
      topAmount,
      transactionCount: transactions.length,
      expenseCount: expenses.length,
      incomeCount: income.length,
    };
  }

  /**
   * Generate AI recommendation prompt and get response
   */
  private static async generateAIRecommendation(
    transactions: any[],
    analysis: any
  ): Promise<string> {
    const prompt = this.buildRecommendationPrompt(transactions, analysis);

    try {
      const aiResponse = await AIService.generateCompletion(prompt, {
        maxTokens: 200,
        temperature: 0.7,
        systemPrompt:
          'Eres un asesor financiero experto que da consejos prácticos y motivacionales en español. Tus respuestas son concisas, específicas y accionables.',
      });

      return aiResponse.trim();
    } catch (error) {
      logger.error('Error calling AI service:', error);
      // Fallback recommendation
      return this.generateFallbackRecommendation(analysis);
    }
  }

  /**
   * Build detailed prompt for AI recommendation
   */
  private static buildRecommendationPrompt(transactions: any[], analysis: any): string {
    const categoriesText = Array.from(
      analysis.categories.entries() as IterableIterator<[string, number]>
    )
      .map(([category, amount]) => `- ${category}: $${amount.toFixed(2)}`)
      .join('\n');

    const recentTransactionsText = transactions
      .slice(0, 10)
      .map(
        t =>
          `- ${t.type === 'expense' ? 'Gasto' : 'Ingreso'}: ${t.description} - $${t.amount.toFixed(2)} (${t.date.toISOString().split('T')[0]})`
      )
      .join('\n');

    return `
Analiza los siguientes datos financieros de los últimos 7 días y genera una recomendación personalizada:

RESUMEN FINANCIERO:
- Ingresos totales: $${analysis.totalIncome.toFixed(2)}
- Gastos totales: $${analysis.totalExpenses.toFixed(2)}
- Balance: $${analysis.balance.toFixed(2)}
- Número de transacciones: ${analysis.transactionCount}

GASTOS POR CATEGORÍAS:
${categoriesText}

CATEGORÍA CON MAYOR GASTO: ${analysis.topCategory} ($${analysis.topAmount.toFixed(2)})

TRANSACCIONES RECIENTES:
${recentTransactionsText}

Proporciona una recomendación que incluya:
1. Un análisis específico del comportamiento financiero
2. Un consejo práctico y accionable
3. Una estimación realista de cuánto podrían ahorrar

Respuesta en máximo 120 palabras, concisa y motivacional.
`;
  }

  /**
   * Generate recommendation for users with no transactions
   */
  private static async generateNoTransactionsRecommendation(): Promise<string> {
    const prompts = [
      '¡Comienza tu viaje financiero registrando tus gastos e ingresos! Llevar un control detallado te ayudará a identificar patrones y oportunidades de ahorro. Te recomiendo: 1) Registra cada transacción diariamente, 2) Categoriza tus gastos, 3) Establece un presupuesto mensual. Incluso registrar $500 en gastos semanales puede revelarte ahorros potenciales de $50-100 mensuales.',
      'Para mejorar tus finanzas, el primer paso es la visibilidad. Registra todas tus transacciones durante esta semana y descubre dónde va tu dinero. Muchos usuarios descubren gastos innecesarios de $200-300 mensuales solo con este simple seguimiento. ¡Empieza hoy!',
      'Un presupuesto efectivo comienza con datos reales. Te sugiero registrar al menos 7 días de transacciones para obtener tu primera recomendación personalizada. Esto te ayudará a crear un plan de ahorro realista y alcanzar tus metas financieras más rápido.',
    ];

    return prompts[Math.floor(Math.random() * prompts.length)];
  }

  /**
   * Generate fallback recommendation when AI fails
   */
  private static generateFallbackRecommendation(analysis: any): string {
    if (analysis.balance >= 0) {
      return `¡Excelente! Mantienes un balance positivo de $${analysis.balance.toFixed(2)}. Para optimizar aún más, considera reducir gastos en ${analysis.topCategory} (tu categoría principal con $${analysis.topAmount.toFixed(2)}). Un ahorro del 10% en esta categoría podría darte $${(analysis.topAmount * 0.1).toFixed(2)} adicionales este mes.`;
    } else {
      return `Tu balance actual es de $${analysis.balance.toFixed(2)}. Te recomiendo revisar tus gastos en ${analysis.topCategory}, donde gastaste $${analysis.topAmount.toFixed(2)}. Reducir un 20% en esta categoría podría ahorrarte $${(analysis.topAmount * 0.2).toFixed(2)} y mejorar tu situación financiera.`;
    }
  }

  /**
   * Categorize transaction based on description
   */
  private static getCategoryFromDescription(description: string): string {
    const desc = description.toLowerCase();

    if (
      desc.includes('comida') ||
      desc.includes('restaurante') ||
      desc.includes('almuerzo') ||
      desc.includes('desayuno') ||
      desc.includes('cena') ||
      desc.includes('mercado') ||
      desc.includes('supermercado') ||
      desc.includes('groceries')
    ) {
      return 'Alimentación';
    }

    if (
      desc.includes('uber') ||
      desc.includes('taxi') ||
      desc.includes('gasolina') ||
      desc.includes('combustible') ||
      desc.includes('bus') ||
      desc.includes('metro') ||
      desc.includes('transporte') ||
      desc.includes('parking')
    ) {
      return 'Transporte';
    }

    if (
      desc.includes('cine') ||
      desc.includes('película') ||
      desc.includes('juego') ||
      desc.includes('bar') ||
      desc.includes('diversión') ||
      desc.includes('entretenimiento') ||
      desc.includes('netflix') ||
      desc.includes('spotify')
    ) {
      return 'Entretenimiento';
    }

    if (
      desc.includes('electricidad') ||
      desc.includes('agua') ||
      desc.includes('gas') ||
      desc.includes('internet') ||
      desc.includes('teléfono') ||
      desc.includes('servicio') ||
      desc.includes('recibo') ||
      desc.includes('factura')
    ) {
      return 'Servicios';
    }

    if (
      desc.includes('compra') ||
      desc.includes('ropa') ||
      desc.includes('shopping') ||
      desc.includes('tienda') ||
      desc.includes('mall')
    ) {
      return 'Compras';
    }

    if (
      desc.includes('médico') ||
      desc.includes('doctor') ||
      desc.includes('medicina') ||
      desc.includes('farmacia') ||
      desc.includes('hospital') ||
      desc.includes('salud')
    ) {
      return 'Salud';
    }

    if (
      desc.includes('educación') ||
      desc.includes('colegio') ||
      desc.includes('universidad') ||
      desc.includes('curso') ||
      desc.includes('libro')
    ) {
      return 'Educación';
    }

    if (
      desc.includes('casa') ||
      desc.includes('hogar') ||
      desc.includes('arriendo') ||
      desc.includes('alquiler') ||
      desc.includes('hipoteca')
    ) {
      return 'Vivienda';
    }

    // Default category
    const firstWord = description.split(' ')[0];
    return firstWord || 'Otros';
  }

  /**
   * Get recommendation statistics for user
   */
  static async getRecommendationStats(userId: string): Promise<any> {
    try {
      const objectId = new mongoose.Types.ObjectId(userId);

      const totalRecommendations = await Recommendation.countDocuments({ userId: objectId });
      const activeRecommendation = await this.getCurrentRecommendation(userId);

      let timeUntilNext = null;
      if (activeRecommendation) {
        timeUntilNext = activeRecommendation.getTimeUntilExpiration();
      }

      return {
        totalGenerated: totalRecommendations,
        hasActive: !!activeRecommendation,
        timeUntilNext,
        canGenerateNew: await this.canGenerateRecommendation(userId),
        lastGeneratedAt: activeRecommendation?.generatedAt || null,
      };
    } catch (error) {
      logger.error('Error getting recommendation stats:', error);
      throw new Error('Failed to get recommendation statistics');
    }
  }

  /**
   * Force refresh recommendation (for testing/admin)
   */
  static async forceRefreshRecommendation(userId: string): Promise<IRecommendation> {
    logger.info(`Force refreshing recommendation for user ${userId}`);
    return await this.generateRecommendation(userId, true);
  }
}
