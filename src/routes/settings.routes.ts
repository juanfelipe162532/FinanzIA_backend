import { Router } from 'express';
import { SettingsController } from '../controllers/settings.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas de configuración
router.get('/', SettingsController.getUserSettings);
router.put('/', SettingsController.validateUpdateSettings, SettingsController.updateUserSettings);

// Rutas de seguridad
router.get('/security', SettingsController.getUserSecurity);
router.put('/security/password', SettingsController.validatePasswordChange, SettingsController.updatePassword);
router.put('/security/2fa', SettingsController.toggle2FA);
router.get('/security/locked', SettingsController.checkUserLocked);

// Rutas de exportación
router.get('/export', SettingsController.exportUserData);

export default router;