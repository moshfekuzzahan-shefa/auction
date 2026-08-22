import prisma from '../config/db';

async function main() {
  console.log('Testing connection to Supabase database...');
  try {
    const userCount = await prisma.user.count();
    console.log(`Connection Successful! Total users in DB: ${userCount}`);
  } catch (err: any) {
    console.error('Connection Failed:', err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
