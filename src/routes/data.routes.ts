import { Router } from 'express';
import { DataController } from '../controllers/data.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

/**
 * @route   GET /api/data/all
 * @desc    Obtiene todos los datos de la base de datos
 * @access  Private
 */
router.get('/all', DataController.getAllData);

/**
 * @route   GET /api/data/stats
 * @desc    Obtiene estadísticas de la base de datos
 * @access  Private
 */
router.get('/stats', DataController.getDatabaseStats);

/**
 * @route   GET /api/data/users
 * @desc    Obtiene todos los usuarios
 * @access  Private
 */
router.get('/users', DataController.getAllUsers);

/**
 * @route   GET /api/data/transactions
 * @desc    Obtiene todas las transacciones
 * @access  Private
 */
router.get('/transactions', DataController.getAllTransactions);

/**
 * @route   GET /api/data/categories
 * @desc    Obtiene todas las categorías
 * @access  Private
 */
router.get('/categories', DataController.getAllCategories);

/**
 * @route   GET /api/data/budgets
 * @desc    Obtiene todos los presupuestos
 * @access  Private
 */
router.get('/budgets', DataController.getAllBudgets);

/**
 * @route   GET /api/data/chat-history
 * @desc    Obtiene todo el historial de chat
 * @access  Private
 */
router.get('/chat-history', DataController.getAllChatHistory);

/**
 * @route   GET /api/data/refresh-tokens
 * @desc    Obtiene todos los refresh tokens
 * @access  Private
 */
router.get('/refresh-tokens', DataController.getAllRefreshTokens);

/**
 * @route   GET /api/data/table/:tableName
 * @desc    Obtiene datos de una tabla específica
 * @access  Private
 */
router.get('/table/:tableName', DataController.getTableData);

export default router;
