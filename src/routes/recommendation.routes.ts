import { Router } from 'express';
import { RecommendationController } from '../controllers/recommendation.controller';
import { protect as authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validation.middleware';
import { body } from 'express-validator';

const router = Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

/**
 * @route   GET /api/recommendations/current
 * @desc    Get current active recommendation for user
 * @access  Private
 */
router.get('/current', RecommendationController.getCurrentRecommendation);

/**
 * @route   POST /api/recommendations/generate
 * @desc    Generate new AI recommendation
 * @access  Private
 */
router.post(
  '/generate',
  [body('force').optional().isBoolean().withMessage('Force must be a boolean')],
  validateRequest,
  RecommendationController.generateRecommendation
);

/**
 * @route   GET /api/recommendations/can-generate
 * @desc    Check if user can generate a new recommendation
 * @access  Private
 */
router.get('/can-generate', RecommendationController.canGenerateRecommendation);

/**
 * @route   GET /api/recommendations/stats
 * @desc    Get recommendation statistics for user
 * @access  Private
 */
router.get('/stats', RecommendationController.getRecommendationStats);

/**
 * @route   POST /api/recommendations/force-refresh
 * @desc    Force refresh recommendation (development only)
 * @access  Private
 */
router.post('/force-refresh', RecommendationController.forceRefreshRecommendation);

/**
 * @route   GET /api/recommendations
 * @desc    Get or generate recommendation (convenience endpoint)
 * @access  Private
 */
router.get('/', RecommendationController.getOrGenerateRecommendation);

export default router;
