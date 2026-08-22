import { Router } from 'express';
import { TournamentController } from './tournament.controller';
import { authorize } from '../../middleware/roles.middleware';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

// Root handlers for /api/matches and /api/tournament
router.get('/', TournamentController.getFixtures);
router.post('/', authenticate, authorize('SUPER_ADMIN'), TournamentController.createFixture);
router.delete('/:id', authenticate, authorize('SUPER_ADMIN'), TournamentController.deleteFixture);

// Named sub-routes
router.get('/fixtures', TournamentController.getFixtures);
router.get('/matches', TournamentController.getFixtures);
router.get('/standings', TournamentController.getStandings);
router.get('/leaderboard', TournamentController.getLeaderboardStats);

// Super Admin / Admin routes
router.post('/fixtures', authenticate, authorize('SUPER_ADMIN'), TournamentController.createFixture);
router.post('/matches', authenticate, authorize('SUPER_ADMIN'), TournamentController.createFixture);
router.post('/generate-fixtures', authenticate, authorize('SUPER_ADMIN'), TournamentController.generateAutoFixtures);
router.delete('/fixtures/:id', authenticate, authorize('SUPER_ADMIN'), TournamentController.deleteFixture);
router.delete('/matches/:id', authenticate, authorize('SUPER_ADMIN'), TournamentController.deleteFixture);
router.post('/matches/:id/events', authenticate, authorize('SUPER_ADMIN', 'PODIUM_ADMIN'), TournamentController.logEvent);
router.post('/matches/:id/result', authenticate, authorize('SUPER_ADMIN', 'PODIUM_ADMIN'), TournamentController.submitMatchResult);
router.patch('/matches/:id/status', authenticate, authorize('SUPER_ADMIN', 'PODIUM_ADMIN'), TournamentController.updateStatus);

export default router;
