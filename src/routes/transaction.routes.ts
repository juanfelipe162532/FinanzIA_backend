import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

/**
 * @route   GET /api/v1/transactions
 * @desc    Obtiene todas las transacciones del usuario
 * @access  Private
 */
router.get('/', TransactionController.getUserTransactions);

/**
 * @route   POST /api/v1/transactions
 * @desc    Crea una nueva transacción
 * @access  Private
 */
router.post('/', TransactionController.createTransaction);

/**
 * @route   GET /api/v1/transactions/stats
 * @desc    Obtiene estadísticas de transacciones del usuario
 * @access  Private
 */
router.get('/stats', TransactionController.getTransactionStats);

/**
 * @route   GET /api/v1/transactions/:id
 * @desc    Obtiene una transacción específica
 * @access  Private
 */
router.get('/:id', TransactionController.getTransactionById);

/**
 * @route   PUT /api/v1/transactions/:id
 * @desc    Actualiza una transacción
 * @access  Private
 */
router.put('/:id', TransactionController.updateTransaction);

/**
 * @route   DELETE /api/v1/transactions/:id
 * @desc    Elimina una transacción
 * @access  Private
 */
router.delete('/:id', TransactionController.deleteTransaction);

export default router;
