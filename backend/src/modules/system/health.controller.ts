import { Request, Response } from 'express';
import prisma from '../../config/db';
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});
redisClient.on('error', () => {}); // silent fail
redisClient.connect().catch(() => {}); // silent fail for health check if not ready

export class HealthController {
  static async health(req: Request, res: Response) {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
  }

  static async ready(req: Request, res: Response) {
    try {
      // Check Postgres
      await prisma.$queryRaw`SELECT 1`;
      
      // Check Redis
      if (!redisClient.isReady) {
        throw new Error('Redis is not ready');
      }

      res.status(200).json({ status: 'Ready', db: 'Connected', redis: 'Connected' });
    } catch (error) {
      res.status(503).json({ status: 'Not Ready', error: (error as Error).message });
    }
  }

  static async live(req: Request, res: Response) {
    // If the Express server is responding, it's live
    res.status(200).json({ status: 'Live', uptime: process.uptime() });
  }
}
