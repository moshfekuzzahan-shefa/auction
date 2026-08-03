import { Router } from 'express';
import { PublicController } from './public.controller';

const router = Router();

// Completely Public endpoints
router.get('/landing', PublicController.getLandingData);
router.get('/news', PublicController.getNews);

export default router;
