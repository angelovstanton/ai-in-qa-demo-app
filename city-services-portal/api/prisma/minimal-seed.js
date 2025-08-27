const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Minimal seeding...');

  // Clear existing data in correct order
  await prisma.eventLog.deleteMany();
  await prisma.upvote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create department
  const dept = await prisma.department.create({
    data: {
      name: 'Public Works',
      slug: 'public-works',
    }
  });

  // Create users with minimal fields
  const john = await prisma.user.create({
    data: {
      email: 'john@example.com',
      passwordHash: hashedPassword,
      name: 'John Doe',
      role: 'CITIZEN',
    }
  });

  const clerk = await prisma.user.create({
    data: {
      email: 'mary.clerk@city.gov',
      passwordHash: hashedPassword,
      name: 'Mary Johnson',
      role: 'CLERK',
      departmentId: dept.id,
    }
  });

  // Create some service requests
  for (let i = 1; i <= 10; i++) {
    await prisma.serviceRequest.create({
      data: {
        code: `REQ-2024-${i.toString().padStart(3, '0')}`,
        title: `Service Request ${i}`,
        description: `Description for request ${i}`,
        category: 'roads-transportation',
        priority: 'MEDIUM',
        status: i <= 5 ? 'RESOLVED' : 'SUBMITTED',
        locationText: `Location ${i}`,
        dateOfRequest: new Date().toISOString(),
        createdBy: john.id,
        assignedTo: i <= 5 ? clerk.id : null,
        departmentId: dept.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        closedAt: i <= 5 ? new Date() : null,
      }
    });
  }

  console.log('✅ Minimal seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
