import { Router } from 'express';
import { BudgetController } from '../controllers/budget.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

/**
 * @route   GET /api/v1/budgets
 * @desc    Obtiene todos los presupuestos del usuario
 * @access  Private
 */
router.get('/', BudgetController.getUserBudgets);

/**
 * @route   POST /api/v1/budgets
 * @desc    Crea un nuevo presupuesto
 * @access  Private
 */
router.post('/', BudgetController.createBudget);

/**
 * @route   GET /api/v1/budgets/current
 * @desc    Obtiene presupuestos del mes actual
 * @access  Private
 */
router.get('/current', BudgetController.getCurrentBudgets);

/**
 * @route   GET /api/v1/budgets/:id
 * @desc    Obtiene un presupuesto específico
 * @access  Private
 */
router.get('/:id', BudgetController.getBudgetById);

/**
 * @route   PUT /api/v1/budgets/:id
 * @desc    Actualiza un presupuesto
 * @access  Private
 */
router.put('/:id', BudgetController.updateBudget);

/**
 * @route   DELETE /api/v1/budgets/:id
 * @desc    Elimina un presupuesto
 * @access  Private
 */
router.delete('/:id', BudgetController.deleteBudget);

export default router;
