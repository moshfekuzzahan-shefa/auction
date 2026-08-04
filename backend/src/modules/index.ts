import { Router } from 'express';

const router = Router();

import authRoutes from './auth/auth.routes';
import userRoutes from './users/users.routes';
import systemRoutes from './system/system.routes';
import configRoutes from './config/config.routes';
import playerRoutes from './player/player.routes';
import teamRoutes from './teams/teams.routes';
import tournamentRoutes from './tournament/tournament.routes';
import publicRoutes from './public/public.routes';
import resetRoutes from './reset/reset.routes';

import { PublicController } from './public/public.controller';

router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

router.get('/categories', PublicController.getCategories);

import auctionRoutes from './auction/auction.routes';

router.use('/public', publicRoutes);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/admin/users', userRoutes);
router.use('/system', systemRoutes);
router.use('/config', configRoutes);
router.use('/player', playerRoutes);
router.use('/teams', teamRoutes);
router.use('/tournament', tournamentRoutes);
router.use('/matches', tournamentRoutes);
router.use('/reset', resetRoutes);
router.use('/auction', auctionRoutes);
// router.use('/tournament', tournamentRoutes);

export default router;
