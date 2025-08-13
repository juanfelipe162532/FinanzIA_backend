import { Router } from 'express';
import { AccountController } from '../controllers/account.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de cuentas
router.post('/', AccountController.validateCreateAccount, AccountController.createAccount);
router.get('/', AccountController.getUserAccounts);
router.get('/summary', AccountController.getAccountsSummary);
router.get('/:id', AccountController.getAccountById);
router.put('/:id', AccountController.validateUpdateAccount, AccountController.updateAccount);
router.delete('/:id', AccountController.deleteAccount);
router.patch('/:id/balance', AccountController.updateAccountBalance);
router.post('/:id/recalculate', AccountController.recalculateAccountBalance);

export default router;