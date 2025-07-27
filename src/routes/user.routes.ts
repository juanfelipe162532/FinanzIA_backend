import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Obtiene un usuario específico
 * @access  Private
 */
router.get('/:id', UserController.getUserById);

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Actualiza un usuario
 * @access  Private
 */
router.put('/:id', UserController.updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Elimina un usuario
 * @access  Private
 */
router.delete('/:id', UserController.deleteUser);

/**
 * @route   GET /api/v1/users/:id/profile
 * @desc    Obtiene el perfil del usuario
 * @access  Private
 */
router.get('/:id/profile', UserController.getUserProfile);

/**
 * @route   PUT /api/v1/users/:id/profile
 * @desc    Actualiza el perfil del usuario
 * @access  Private
 */
router.put('/:id/profile', UserController.updateUserProfile);

export default router;
