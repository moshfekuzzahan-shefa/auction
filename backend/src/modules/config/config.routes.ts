import { Router } from 'express';
import { ConfigController } from './config.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';

const router = Router();

// Secure all config routes to Super Admin only
router.use(authenticate, authorize('SUPER_ADMIN'));

// Categories
router.get('/categories', ConfigController.getCategories);
router.post('/categories', ConfigController.createCategory);
router.delete('/categories/:id', ConfigController.deleteCategory);

// Positions
router.get('/positions', ConfigController.getPositions);
router.post('/positions', ConfigController.createPosition);
router.delete('/positions/:id', ConfigController.deletePosition);

// Sessions
router.get('/sessions', ConfigController.getSessions);
router.post('/sessions', ConfigController.createSession);
router.delete('/sessions/:id', ConfigController.deleteSession);

// Bid Raise Rules
router.get('/bid-rules', ConfigController.getBidRaiseRules);
router.post('/bid-rules', ConfigController.createBidRaiseRule);
router.delete('/bid-rules/:id', ConfigController.deleteBidRaiseRule);

export default router;
