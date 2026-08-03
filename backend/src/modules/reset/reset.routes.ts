import { Router } from 'express';
import { ResetController } from './reset.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';

const router = Router();

// MUST BE SUPER ADMIN
router.post('/nuke', authenticate, authorize('SUPER_ADMIN'), ResetController.executeReset);

export default router;
