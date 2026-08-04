import { Router } from 'express';
import { AuthController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/me', authenticate, AuthController.getMe);
router.post('/login', AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.post('/forgot-password', AuthController.forgotPassword);
router.post('/reset-password', AuthController.resetPassword);

export default router;
