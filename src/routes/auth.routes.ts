import express from 'express';
import { login, logout, refreshAccessToken, register } from '../controllers/auth.controller';
import { validateLoginRequest, validateRegisterRequest } from '../middlewares/auth.middleware';

const router = express.Router();

// Authentication routes
router.post('/register', validateRegisterRequest, register);
router.post('/login', validateLoginRequest, login);
router.post('/logout', logout);
router.post('/refresh-token', refreshAccessToken);

export default router;
