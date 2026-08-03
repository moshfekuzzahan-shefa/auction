import prisma from '../config/db';
import logger from '../utils/logger';

interface AuditLogPayload {
  userId?: string;
  action: string;
  resource: string;
  metadata?: any;
  ipAddress?: string;
}

export const AuditService = {
  log: async (payload: AuditLogPayload) => {
    try {
      await prisma.auditLog.create({
        data: {
          userId: payload.userId,
          action: payload.action,
          resource: payload.resource,
          metadata: payload.metadata || {},
          ipAddress: payload.ipAddress,
        },
      });
      logger.info(`Audit: [${payload.action}] on ${payload.resource} by User: ${payload.userId || 'SYSTEM'}`);
    } catch (error) {
      logger.error('Failed to create audit log', error);
      // We don't throw here to avoid failing the primary business transaction
    }
  }
};
