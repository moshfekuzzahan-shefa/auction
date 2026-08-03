import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({ where: { role: 'SUPER_ADMIN' } });
  console.log('Super Admins:', users);
}
main().finally(() => prisma.$disconnect());
