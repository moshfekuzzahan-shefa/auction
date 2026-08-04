import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl) {
  if (databaseUrl.includes('pooler') || databaseUrl.includes('6543') || databaseUrl.includes('supabase')) {
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

export default prisma;
