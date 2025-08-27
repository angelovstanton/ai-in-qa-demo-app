const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkRequests() {
  console.log('🔍 Checking service requests in database...');
  
  // Get sample requests
  const requests = await prisma.serviceRequest.findMany({
    take: 5,
    select: {
      id: true,
      code: true,
      title: true,
      status: true,
      createdBy: true
    }
  });
  
  console.log('Sample requests:');
  requests.forEach(req => {
    console.log(`- ID: ${req.id}, Code: ${req.code}, Status: ${req.status}, Title: ${req.title.substring(0, 30)}...`);
  });
  
  // Get resolved requests count
  const resolvedCount = await prisma.serviceRequest.count({
    where: {
      status: { in: ['RESOLVED', 'CLOSED'] }
    }
  });
  
  console.log(`\n📊 Total resolved/closed requests: ${resolvedCount}`);
  
  // Get a specific resolved request
  const resolvedRequest = await prisma.serviceRequest.findFirst({
    where: {
      status: { in: ['RESOLVED', 'CLOSED'] }
    },
    select: {
      id: true,
      code: true,
      title: true,
      status: true
    }
  });
  
  if (resolvedRequest) {
    console.log(`\n✅ Sample resolved request:`);
    console.log(`   ID: ${resolvedRequest.id}`);
    console.log(`   Code: ${resolvedRequest.code}`);
    console.log(`   Status: ${resolvedRequest.status}`);
    console.log(`   Title: ${resolvedRequest.title}`);
  }
}

checkRequests()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
