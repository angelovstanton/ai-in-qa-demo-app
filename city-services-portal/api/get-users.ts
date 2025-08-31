import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getUsers() {
  const clerks = await prisma.user.findMany({
    where: { role: 'CLERK' },
    select: { email: true, name: true },
    take: 10
  });
  
  const supervisors = await prisma.user.findMany({
    where: { role: 'SUPERVISOR' },
    select: { email: true, name: true },
    take: 10
  });
  
  const fieldAgents = await prisma.user.findMany({
    where: { role: 'FIELD_AGENT' },
    select: { email: true, name: true },
    take: 10
  });
  
  const citizens = await prisma.user.findMany({
    where: { role: 'CITIZEN' },
    select: { email: true, name: true },
    take: 5
  });

  console.log('All User Accounts for Login:');
  console.log('============================');
  
  console.log('\nCLERKS:');
  clerks.forEach(u => console.log(`  ${u.email}`));
  
  console.log('\nSUPERVISORS:');
  supervisors.forEach(u => console.log(`  ${u.email}`));
  
  console.log('\nFIELD AGENTS:');
  fieldAgents.forEach(u => console.log(`  ${u.email}`));
  
  console.log('\nCITIZENS:');
  citizens.forEach(u => console.log(`  ${u.email}`));
  
  await prisma.$disconnect();
}

getUsers().catch(console.error);