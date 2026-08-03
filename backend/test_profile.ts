import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
prisma.profile.findMany({where:{isSold:false}, take:1}).then(console.log).finally(()=>prisma.$disconnect());
