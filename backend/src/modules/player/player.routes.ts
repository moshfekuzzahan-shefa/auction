import { Router } from 'express';
import multer from 'multer';
import { PlayerController } from './player.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { authorize } from '../../middleware/roles.middleware';
import { requirePhase } from '../../middleware/lifecycle.middleware';

const router = Router();
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Not an image! Please upload an image.'));
    }
  }
});

// Update and Withdraw routes require the user to be an authenticated PLAYER
// and the system must be in the REGISTRATION phase
router.get('/me', authenticate, authorize('PLAYER'), PlayerController.getProfile);
router.use('/update', authenticate, authorize('PLAYER'), requirePhase('REGISTRATION'));
router.use('/withdraw', authenticate, authorize('PLAYER'), requirePhase('REGISTRATION'));

router.get('/unsold', authenticate, authorize('SUPER_ADMIN', 'PODIUM_ADMIN', 'TEAM_MANAGER'), PlayerController.getUnsoldPlayers);
router.get('/all', authenticate, authorize('SUPER_ADMIN', 'PODIUM_ADMIN'), PlayerController.getAllPlayers);

// Register is public but requires the REGISTRATION phase
router.post(
  '/register',
  requirePhase('REGISTRATION'),
  upload.single('image'),
  PlayerController.register
);

router.put(
  '/update',
  upload.single('image'),
  PlayerController.update
);

router.delete(
  '/withdraw',
  PlayerController.withdraw
);

router.put(
  '/admin/:id',
  authenticate,
  authorize('SUPER_ADMIN', 'PODIUM_ADMIN'),
  PlayerController.adminUpdate
);

router.put(
  '/:id/category',
  authenticate,
  authorize('SUPER_ADMIN', 'PODIUM_ADMIN'),
  PlayerController.adminUpdate
);

export default router;
