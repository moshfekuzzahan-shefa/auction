import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && !databaseUrl.includes('pgbouncer=true') && (databaseUrl.includes('pooler') || databaseUrl.includes('6543'))) {
  databaseUrl += databaseUrl.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export default prisma;
