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

// Application for Podium Admin rights
router.post('/podium-admin-request', authenticate, UsersController.applyPodiumAdmin);

// Super Admin management for pending Podium Admin applications
router.get('/podium-admin-requests', authenticate, authorize('SUPER_ADMIN'), UsersController.getPendingPodiumAdminApplications);
router.put('/podium-admin-requests/:id/verify', authenticate, authorize('SUPER_ADMIN'), UsersController.verifyPodiumAdminApplication);

export default router;
