import { Router } from 'express';
import { SystemController } from './system.controller';
import { HealthController } from './health.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';

const router = Router();

router.get('/health', HealthController.health);
router.get('/ready', HealthController.ready);
router.get('/live', HealthController.live);

// Public: Get current state
router.get('/', SystemController.getState);

// Super Admin Only: Set global phase (SETUP, REGISTRATION, AUCTION, TOURNAMENT)
router.put(
  '/phase',
  authenticate,
  authorize('SUPER_ADMIN'),
  SystemController.setPhase
);

// Super Admin Only: Set config (budget, roster)
router.put(
  '/config',
  authenticate,
  authorize('SUPER_ADMIN'),
  SystemController.setConfig
);

// Super Admin Only: Set schedule (Countdowns)
router.put(
  '/schedule',
  authenticate,
  authorize('SUPER_ADMIN'),
  SystemController.setSchedule
);

// Super Admin Only: Update Categories
router.put(
  '/categories',
  authenticate,
  authorize('SUPER_ADMIN'),
  SystemController.updateCategories
);

// Super Admin Only: Update Bidding Rules
router.put(
  '/rules',
  authenticate,
  authorize('SUPER_ADMIN'),
  SystemController.updateRules
);

export default router;
