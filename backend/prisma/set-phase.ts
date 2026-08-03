import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Setting system phase to AUCTION...');
  
  // Find the first (and only) system state, or create it
  let state = await prisma.systemState.findFirst();
  if (!state) {
    state = await prisma.systemState.create({
      data: { currentPhase: 'AUCTION' }
    });
  } else {
    state = await prisma.systemState.update({
      where: { id: state.id },
      data: { currentPhase: 'AUCTION' }
    });
  }

  console.log('System Phase is now:', state.currentPhase);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
