import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  if (databaseUrl.includes('6543') || databaseUrl.includes('pgbouncer=true')) {
    if (!databaseUrl.includes('pgbouncer=true')) {
      databaseUrl += databaseUrl.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
    }
    if (!databaseUrl.includes('statement_cache_size=0')) {
      databaseUrl += databaseUrl.includes('?') ? '&statement_cache_size=0' : '?statement_cache_size=0';
    }
  }
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Auto-migrate column type for lastAdminChange in PostgreSQL to TEXT
prisma.$executeRawUnsafe(`
  ALTER TABLE "Profile" ALTER COLUMN "lastAdminChange" TYPE TEXT USING "lastAdminChange"::text;
`).catch(() => {
  // Silent catch if column is already text or table busy
});

export default prisma;
