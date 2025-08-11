import { Router } from 'express';
import { AIController } from '../controllers/ai.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(protect);

/**
 * @route   POST /api/v1/ai/chat
 * @desc    Envía un mensaje al AI y obtiene respuesta
 * @access  Private
 */
router.post('/chat', AIController.sendChatMessage);

/**
 * @route   POST /api/v1/ai/chat/stream
 * @desc    Envía un mensaje al AI y obtiene respuesta en streaming
 * @access  Private
 */
router.post('/chat/stream', AIController.sendChatMessageStream);

/**
 * @route   GET /api/v1/ai/history
 * @desc    Obtiene el historial de chat del usuario
 * @access  Private
 */
router.get('/history', AIController.getChatHistory);

/**
 * @route   DELETE /api/v1/ai/history
 * @desc    Limpia el historial de chat del usuario
 * @access  Private
 */
router.delete('/history', AIController.clearChatHistory);

/**
 * @route   GET /api/v1/ai/suggestions
 * @desc    Obtiene sugerencias financieras personalizadas
 * @access  Private
 */
router.get('/suggestions', AIController.getFinancialSuggestions);

export default router;
