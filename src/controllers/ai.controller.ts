import { Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { logger } from '../utils/logger';

export class AIController {
  /**
   * Envía un mensaje al AI y obtiene respuesta
   */
  static async sendChatMessage(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required',
        });
      }

      const response = await AIService.sendChatMessage(userId!, message, context);

      res.status(200).json({
        success: true,
        message: 'AI response generated successfully',
        data: response,
      });
    } catch (error) {
      logger.error('Error in sendChatMessage controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate AI response',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene el historial de chat del usuario
   */
  static async getChatHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20 } = req.query;

      const history = await AIService.getChatHistory(userId!, Number(page), Number(limit));

      res.status(200).json({
        success: true,
        message: 'Chat history retrieved successfully',
        data: history.data,
        pagination: history.pagination,
      });
    } catch (error) {
      logger.error('Error in getChatHistory controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chat history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Limpia el historial de chat del usuario
   */
  static async clearChatHistory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      await AIService.clearChatHistory(userId!);

      res.status(200).json({
        success: true,
        message: 'Chat history cleared successfully',
      });
    } catch (error) {
      logger.error('Error in clearChatHistory controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to clear chat history',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Envía un mensaje al AI con respuesta en streaming
   */
  static async sendChatMessageStream(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { message, context } = req.body;

      if (!message) {
        return res.status(400).json({
          success: false,
          message: 'Message is required',
        });
      }

      // Set headers for Server-Sent Events
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Cache-Control, Content-Type, Authorization');

      // Keep connection alive
      const keepAlive = setInterval(() => {
        res.write(': keep-alive\n\n');
      }, 15000);

      try {
        // Stream AI response
        const stream = AIService.sendChatMessageStream(userId!, message, context);

        for await (const chunk of stream) {
          res.write(`data: ${chunk}\n\n`);
        }

        // Send completion signal
        res.write('data: [DONE]\n\n');
        res.end();
      } catch (streamError) {
        logger.error('Error during streaming:', streamError);
        res.write(`data: ${JSON.stringify({ content: 'Error occurred during streaming' })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      } finally {
        clearInterval(keepAlive);
      }
    } catch (error) {
      logger.error('Error in sendChatMessageStream controller:', error);

      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Failed to start AI streaming response',
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }

  /**
   * Obtiene sugerencias financieras personalizadas
   */
  static async getFinancialSuggestions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { type = 'general' } = req.query;

      const suggestions = await AIService.getFinancialSuggestions(userId!, type as string);

      res.status(200).json({
        success: true,
        message: 'Financial suggestions generated successfully',
        data: suggestions,
      });
    } catch (error) {
      logger.error('Error in getFinancialSuggestions controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate financial suggestions',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
