import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

/**
 * @route   GET /api/v1/categories
 * @desc    Obtiene todas las categorías del usuario
 * @access  Private
 */
router.get('/', CategoryController.getUserCategories);

/**
 * @route   POST /api/v1/categories
 * @desc    Crea una nueva categoría
 * @access  Private
 */
router.post('/', CategoryController.createCategory);

/**
 * @route   GET /api/v1/categories/system
 * @desc    Obtiene categorías del sistema
 * @access  Private
 */
router.get('/system', CategoryController.getSystemCategories);

/**
 * @route   GET /api/v1/categories/:id
 * @desc    Obtiene una categoría específica
 * @access  Private
 */
router.get('/:id', CategoryController.getCategoryById);

/**
 * @route   PUT /api/v1/categories/:id
 * @desc    Actualiza una categoría
 * @access  Private
 */
router.put('/:id', CategoryController.updateCategory);

/**
 * @route   DELETE /api/v1/categories/:id
 * @desc    Elimina una categoría
 * @access  Private
 */
router.delete('/:id', CategoryController.deleteCategory);

export default router;
