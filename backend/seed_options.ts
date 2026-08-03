import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const sessions = [
    { name: '2020-2021' },
    { name: '2021-2022' },
    { name: '2022-2023' },
    { name: '2023-2024' },
  ];

  for (const s of sessions) {
    const exists = await prisma.academicSession.findFirst({ where: { name: s.name }});
    if (!exists) {
      await prisma.academicSession.create({ data: s });
    }
  }

  const positions = [
    { name: 'Forward', code: 'FW' },
    { name: 'Midfielder', code: 'MF' },
    { name: 'Defender', code: 'DF' },
    { name: 'Goalkeeper', code: 'GK' },
  ];

  for (const p of positions) {
    const exists = await prisma.playerPosition.findFirst({ where: { code: p.code }});
    if (!exists) {
      await prisma.playerPosition.create({ data: p });
    }
  }

  console.log('Successfully seeded Sessions and Positions!');
}

main().catch(console.error).finally(() => prisma.$disconnect());
