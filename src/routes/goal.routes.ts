import { Router } from 'express';
import { GoalController } from '../controllers/goal.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de metas
router.post('/', GoalController.validateCreateGoal, GoalController.createGoal);
router.get('/', GoalController.getUserGoals);
router.get('/summary', GoalController.getGoalsSummary);
router.get('/suggestions', GoalController.suggestGoals);
router.get('/:id', GoalController.getGoalById);
router.put('/:id', GoalController.validateUpdateGoal, GoalController.updateGoal);
router.delete('/:id', GoalController.deleteGoal);

// Rutas de contribuciones
router.post(
  '/:id/contributions',
  GoalController.validateAddContribution,
  GoalController.addContribution
);
router.get('/:id/contributions', GoalController.getGoalContributions);

export default router;
