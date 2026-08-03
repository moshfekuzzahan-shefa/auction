import { Router } from 'express';
import { UsersController } from './users.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';

const router = Router();

// Only SUPER_ADMIN can create Podium Admins and Team Managers
router.post(
  '/podium-admin',
  authenticate,
  authorize('SUPER_ADMIN'),
  UsersController.createPodiumAdmin
);

router.post(
  '/team-manager',
  authenticate,
  authorize('SUPER_ADMIN'),
  UsersController.createTeamManager
);

// Role Promotion / Revocation Flow
router.patch(
  '/:id/role',
  authenticate,
  authorize('SUPER_ADMIN'),
  UsersController.updateRole
);

router.put(
  '/:id/role',
  authenticate,
  authorize('SUPER_ADMIN'),
  UsersController.updateRole
);

export default router;
