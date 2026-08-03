import { Router } from 'express';
import { TeamsController } from './teams.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import multer from 'multer';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Team Creation Request & Verification routes
router.post('/request', authenticate, upload.single('logo'), TeamsController.requestTeam);
router.get('/requests/pending', authenticate, authorize('SUPER_ADMIN'), TeamsController.getPendingRequests);
router.put('/requests/:id/verify', authenticate, authorize('SUPER_ADMIN'), TeamsController.verifyTeamRequest);

// Super Admin creates teams
router.post('/create', authenticate, authorize('SUPER_ADMIN'), upload.single('logo'), TeamsController.registerTeam);

// Any authenticated user can get active teams
router.get('/', authenticate, TeamsController.getTeams);

// Protect specific team manager routes
router.use(authenticate, authorize('TEAM_MANAGER'));

router.get('/my-dashboard', TeamsController.getDashboard);
router.post('/notifications/read', TeamsController.markNotificationsRead);

export default router;
