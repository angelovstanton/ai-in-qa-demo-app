import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Simple seeding database...');

  // Clear existing data
  console.log('🗑️ Clearing existing data...');
  await prisma.eventLog.deleteMany();
  await prisma.upvote.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.featureFlag.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Create departments
  console.log('🏢 Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Public Works',
        slug: 'public-works',
      }
    }),
    prisma.department.create({
      data: {
        name: 'Transportation',
        slug: 'transportation',
      }
    }),
    prisma.department.create({
      data: {
        name: 'Parks and Recreation',
        slug: 'parks-recreation',
      }
    }),
  ]);

  // Create users with basic fields only
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create demo users
  const users = await Promise.all([
    // Citizen
    prisma.user.create({
      data: {
        email: 'john@example.com',
        passwordHash: hashedPassword,
        name: 'John Doe',
        role: 'CITIZEN',
      }
    }),
    // Clerk
    prisma.user.create({
      data: {
        email: 'mary.clerk@city.gov',
        passwordHash: hashedPassword,
        name: 'Mary Johnson',
        role: 'CLERK',
        departmentId: departments[0].id,
      }
    }),
    // Supervisor
    prisma.user.create({
      data: {
        email: 'supervisor@city.gov',
        passwordHash: hashedPassword,
        name: 'Bob Wilson',
        role: 'SUPERVISOR',
        departmentId: departments[0].id,
      }
    }),
    // Field Agent
    prisma.user.create({
      data: {
        email: 'field.agent@city.gov',
        passwordHash: hashedPassword,
        name: 'Tom Brown',
        role: 'FIELD_AGENT',
        departmentId: departments[1].id,
      }
    }),
    // Admin
    prisma.user.create({
      data: {
        email: 'admin@city.gov',
        passwordHash: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
      }
    }),
  ]);

  const citizens = users.filter(u => u.role === 'CITIZEN');
  const clerks = users.filter(u => u.role === 'CLERK');

  // Create service requests
  console.log('📋 Creating service requests...');
  const requests = [];
  
  for (let i = 0; i < 20; i++) {
    const creator = i < 5 ? users[0] : users[Math.floor(Math.random() * citizens.length)]; // John gets first 5
    const assignee = Math.random() > 0.5 ? clerks[0] : null;
    const department = departments[Math.floor(Math.random() * departments.length)];
    
    const statuses = ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'RESOLVED', 'CLOSED', 'RESOLVED'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    const priority = priorities[Math.floor(Math.random() * priorities.length)];
    
    const createdAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random date within last 30 days
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000); // Updated within 7 days of creation

    const request = await prisma.serviceRequest.create({
      data: {
        code: `REQ-2024-${(i + 1).toString().padStart(3, '0')}`,
        title: [
          'Pothole on Main Street',
          'Broken streetlight on Oak Avenue',
          'Overflowing trash bin in Central Park',
          'Water leak at intersection',
          'Damaged sidewalk near school',
          'Graffiti removal request',
          'Tree branch blocking road',
          'Noise complaint - construction',
          'Parking meter malfunction',
          'Snow removal needed'
        ][i % 10],
        description: `This is a detailed description for service request ${i + 1}. The issue requires immediate attention and proper resolution.`,
        category: ['roads-transportation', 'street-lighting', 'waste-management', 'water-sewer', 'parks-recreation'][Math.floor(Math.random() * 5)],
        priority,
        status,
        locationText: `Location ${i + 1}, City Center`,
        createdBy: creator.id,
        assignedTo: assignee?.id,
        departmentId: department.id,
        createdAt,
        updatedAt,
        closedAt: ['RESOLVED', 'CLOSED'].includes(status) ? updatedAt : null,
      }
    });
    requests.push(request);
  }

  console.log('✅ Simple seeding completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   🏢 ${departments.length} departments`);
  console.log(`   👥 ${users.length} users`);
  console.log(`   📋 ${requests.length} service requests`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
