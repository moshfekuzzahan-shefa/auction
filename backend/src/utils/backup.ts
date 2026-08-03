import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';
import util from 'util';
import logger from './logger';

const execAsync = util.promisify(exec);

export const BackupService = {
  createBackup: async (): Promise<string> => {
    try {
      const backupDir = path.join(__dirname, '../../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.sql`;
      const filepath = path.join(backupDir, filename);

      // Require DATABASE_URL or specific credentials
      const dbUrl = process.env.DATABASE_URL;
      if (!dbUrl) throw new Error('DATABASE_URL missing for pg_dump');

      // Execute pg_dump
      // In production, pg_dump must be installed on the host/container
      logger.info(`Starting DB backup to ${filepath}`);
      await execAsync(`pg_dump ${dbUrl} > ${filepath}`);
      logger.info('DB backup completed successfully');

      return filepath;
    } catch (error) {
      logger.error('Failed to create DB backup:', error);
      throw new Error('Database backup failed before reset.');
    }
  }
};
