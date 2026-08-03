import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.playerCategory.count().then(c => console.log('Categories:', c)).finally(() => prisma.$disconnect());
