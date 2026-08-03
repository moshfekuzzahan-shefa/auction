import { Router } from 'express';
import { TournamentController } from './tournament.controller';
import { authorize } from '../../middleware/roles.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Public routes (or spectator)
router.get('/fixtures', TournamentController.getFixtures);
router.get('/standings', TournamentController.getStandings);
router.get('/stats/players', TournamentController.getPlayerStats);

// Super Admin / Admin routes
router.post('/fixtures', authenticate, authorize('SUPER_ADMIN'), TournamentController.createFixture);
router.post('/matches/:id/events', authenticate, authorize('SUPER_ADMIN', 'PODIUM_ADMIN'), TournamentController.logEvent);
router.patch('/matches/:id/status', authenticate, authorize('SUPER_ADMIN', 'PODIUM_ADMIN'), TournamentController.updateStatus);

export default router;
