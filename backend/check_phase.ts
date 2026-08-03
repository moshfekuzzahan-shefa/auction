import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.systemState.findFirst().then(c => console.log('Current Phase:', c?.currentPhase)).finally(() => prisma.$disconnect());
