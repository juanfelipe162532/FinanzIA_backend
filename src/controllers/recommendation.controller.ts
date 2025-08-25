import { Request, Response } from 'express';
import { RecommendationService } from '../services/recommendation.service';
import { logger } from '../utils/logger';

export class RecommendationController {
  /**
   * Get current active recommendation for user
   */
  static async getCurrentRecommendation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const recommendation = await RecommendationService.getCurrentRecommendation(userId);

      if (!recommendation) {
        return res.status(404).json({
          success: false,
          message: 'No active recommendation found',
          data: null,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Current recommendation retrieved successfully',
        data: {
          id: recommendation._id,
          recommendation: recommendation.recommendation,
          transactionCount: recommendation.transactionCount,
          totalAmount: recommendation.totalAmount,
          analysisData: recommendation.analysisData,
          generatedAt: recommendation.generatedAt,
          expiresAt: recommendation.expiresAt,
          timeUntilExpiration: recommendation.getTimeUntilExpiration(),
          isValid: recommendation.isValid(),
        },
      });
    } catch (error) {
      logger.error('Error in getCurrentRecommendation controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get current recommendation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Generate new AI recommendation
   */
  static async generateRecommendation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { force = false } = req.body;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Check if user can generate a new recommendation
      if (!force && !(await RecommendationService.canGenerateRecommendation(userId))) {
        const currentRecommendation = await RecommendationService.getCurrentRecommendation(userId);

        return res.status(429).json({
          success: false,
          message:
            'Cannot generate recommendation yet. Please wait 24 hours since last recommendation.',
          data: {
            canGenerateAt: currentRecommendation?.expiresAt,
            timeUntilNext: currentRecommendation?.getTimeUntilExpiration(),
          },
        });
      }

      const recommendation = await RecommendationService.generateRecommendation(userId, force);

      res.status(201).json({
        success: true,
        message: 'Recommendation generated successfully',
        data: {
          id: recommendation._id,
          recommendation: recommendation.recommendation,
          transactionCount: recommendation.transactionCount,
          totalAmount: recommendation.totalAmount,
          analysisData: recommendation.analysisData,
          generatedAt: recommendation.generatedAt,
          expiresAt: recommendation.expiresAt,
          timeUntilExpiration: recommendation.getTimeUntilExpiration(),
          isValid: recommendation.isValid(),
        },
      });
    } catch (error) {
      logger.error('Error in generateRecommendation controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate recommendation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Check if user can generate a new recommendation
   */
  static async canGenerateRecommendation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const canGenerate = await RecommendationService.canGenerateRecommendation(userId);
      const stats = await RecommendationService.getRecommendationStats(userId);

      res.status(200).json({
        success: true,
        message: 'Recommendation status retrieved successfully',
        data: {
          canGenerate,
          ...stats,
        },
      });
    } catch (error) {
      logger.error('Error in canGenerateRecommendation controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check recommendation status',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get recommendation statistics
   */
  static async getRecommendationStats(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      const stats = await RecommendationService.getRecommendationStats(userId);

      res.status(200).json({
        success: true,
        message: 'Recommendation statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      logger.error('Error in getRecommendationStats controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendation statistics',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Force refresh recommendation (for testing/development)
   */
  static async forceRefreshRecommendation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Only allow in development or for admin users
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({
          success: false,
          message: 'Force refresh is not allowed in production',
        });
      }

      const recommendation = await RecommendationService.forceRefreshRecommendation(userId);

      res.status(201).json({
        success: true,
        message: 'Recommendation force refreshed successfully',
        data: {
          id: recommendation._id,
          recommendation: recommendation.recommendation,
          transactionCount: recommendation.transactionCount,
          totalAmount: recommendation.totalAmount,
          analysisData: recommendation.analysisData,
          generatedAt: recommendation.generatedAt,
          expiresAt: recommendation.expiresAt,
          timeUntilExpiration: recommendation.getTimeUntilExpiration(),
          isValid: recommendation.isValid(),
        },
      });
    } catch (error) {
      logger.error('Error in forceRefreshRecommendation controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to force refresh recommendation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * Get or generate recommendation (convenience endpoint)
   */
  static async getOrGenerateRecommendation(req: Request, res: Response) {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'User not authenticated',
        });
      }

      // Try to get current recommendation first
      let recommendation = await RecommendationService.getCurrentRecommendation(userId);

      // If no active recommendation, try to generate one
      if (!recommendation) {
        const canGenerate = await RecommendationService.canGenerateRecommendation(userId);

        if (canGenerate) {
          recommendation = await RecommendationService.generateRecommendation(userId);
        }
      }

      if (!recommendation) {
        return res.status(404).json({
          success: false,
          message: 'No recommendation available and cannot generate new one yet',
          data: null,
        });
      }

      res.status(200).json({
        success: true,
        message: 'Recommendation retrieved successfully',
        data: {
          id: recommendation._id,
          recommendation: recommendation.recommendation,
          transactionCount: recommendation.transactionCount,
          totalAmount: recommendation.totalAmount,
          analysisData: recommendation.analysisData,
          generatedAt: recommendation.generatedAt,
          expiresAt: recommendation.expiresAt,
          timeUntilExpiration: recommendation.getTimeUntilExpiration(),
          isValid: recommendation.isValid(),
        },
      });
    } catch (error) {
      logger.error('Error in getOrGenerateRecommendation controller:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get or generate recommendation',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}
