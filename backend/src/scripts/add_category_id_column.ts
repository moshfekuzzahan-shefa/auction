import prisma from '../config/db';

async function main() {
  console.log('Adding categoryId column to BidRaiseRule table...');
  try {
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "BidRaiseRule" ADD COLUMN IF NOT EXISTS "categoryId" TEXT;
    `);
    console.log('SUCCESS: Column BidRaiseRule.categoryId verified/added successfully!');
  } catch (err: any) {
    console.error('Error adding column:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
