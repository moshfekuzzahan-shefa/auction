import { PrismaClient } from '@prisma/client';

let databaseUrl = process.env.DATABASE_URL;

if (databaseUrl && !databaseUrl.includes('pgbouncer=true') && (databaseUrl.includes('pooler') || databaseUrl.includes('6543'))) {
  databaseUrl += databaseUrl.includes('?') ? '&pgbouncer=true' : '?pgbouncer=true';
}

const prisma = new PrismaClient({
  ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {})
});

export default prisma;
