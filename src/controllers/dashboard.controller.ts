import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { logger } from '../utils/logger';

export class DashboardController {
  /**
   * Obtiene resumen financiero del usuario
   */
  static async getFinancialSummary(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { period = 'month' } = req.query;

      const summary = await DashboardService.getFinancialSummary(userId!, period as string);

      res.status(200).json({
        success: true,
        message: 'Financial summary retrieved successfully',
        data: summary,
      });
    } catch (error) {
      logger.error('Error in getFinancialSummary controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve financial summary',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene datos para gráficos del dashboard
   */
  static async getChartData(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { type = 'all', period = 'month' } = req.query;

      const chartData = await DashboardService.getChartData(userId!, type as string, period as string);

      res.status(200).json({
        success: true,
        message: 'Chart data retrieved successfully',
        data: chartData,
      });
    } catch (error) {
      logger.error('Error in getChartData controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve chart data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene tendencias de gastos e ingresos
   */
  static async getTrends(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { period = '6months' } = req.query;

      const trends = await DashboardService.getTrends(userId!, period as string);

      res.status(200).json({
        success: true,
        message: 'Trends data retrieved successfully',
        data: trends,
      });
    } catch (error) {
      logger.error('Error in getTrends controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve trends data',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Obtiene métricas de rendimiento financiero
   */
  static async getPerformanceMetrics(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      const metrics = await DashboardService.getPerformanceMetrics(userId!);

      res.status(200).json({
        success: true,
        message: 'Performance metrics retrieved successfully',
        data: metrics,
      });
    } catch (error) {
      logger.error('Error in getPerformanceMetrics controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve performance metrics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
