import { Router } from 'express';
import { AuctionController } from './auction.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';

const router = Router();

// Protect with PODIUM_ADMIN and SUPER_ADMIN roles
router.get('/history', authenticate, authorize('SUPER_ADMIN', 'PODIUM_ADMIN'), AuctionController.getHistory);

export default router;
