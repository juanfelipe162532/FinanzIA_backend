import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

/**
 * @route   GET /api/v1/dashboard/summary
 * @desc    Obtiene resumen financiero del usuario
 * @access  Private
 */
router.get('/summary', DashboardController.getFinancialSummary);

/**
 * @route   GET /api/v1/dashboard/charts
 * @desc    Obtiene datos para gráficos del dashboard
 * @access  Private
 */
router.get('/charts', DashboardController.getChartData);

/**
 * @route   GET /api/v1/dashboard/trends
 * @desc    Obtiene tendencias de gastos e ingresos
 * @access  Private
 */
router.get('/trends', DashboardController.getTrends);

/**
 * @route   GET /api/v1/dashboard/metrics
 * @desc    Obtiene métricas de rendimiento financiero
 * @access  Private
 */
router.get('/metrics', DashboardController.getPerformanceMetrics);

export default router;
