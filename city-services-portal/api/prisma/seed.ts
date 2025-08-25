import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Enum-like constants for type safety
const Role = {
  CITIZEN: 'CITIZEN',
  CLERK: 'CLERK',
  FIELD_AGENT: 'FIELD_AGENT',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMIN'
} as const;

const Priority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT'
} as const;

const Status = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  TRIAGED: 'TRIAGED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_ON_CITIZEN: 'WAITING_ON_CITIZEN',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED'
} as const;

const categories = [
  'Roads and Transportation',
  'Street Lighting',
  'Waste Management',
  'Water and Sewer',
  'Parks and Recreation',
  'Public Safety',
  'Building and Permits'
];

const sampleTitles = [
  'Pothole on Main Street',
  'Broken streetlight at intersection',
  'Overflowing garbage bin',
  'Water leak in front of building',
  'Damaged playground equipment',
  'Noise complaint from construction',
  'Permit request for fence installation',
  'Traffic signal malfunction',
  'Graffiti on public building',
  'Tree branch blocking sidewalk'
];

const sampleDescriptions = [
  'There is a large pothole that has been growing for weeks and is now causing damage to vehicles. It needs immediate attention as it poses a safety hazard to drivers and pedestrians.',
  'The streetlight at the corner has been out for several days, making it dangerous for pedestrians to cross at night. Please send someone to repair or replace the bulb.',
  'The garbage bin on our street has been overflowing for the past week. The waste is attracting rodents and creating unsanitary conditions in the neighborhood.',
  'There appears to be a water leak coming from the main line in front of the building. Water is pooling on the sidewalk and may be causing structural damage.',
  'The swing set in the local park has a broken chain and poses a safety risk to children. Several parents have expressed concern about potential injuries.',
  'Construction work starting very early in the morning (5 AM) is disturbing residents. The noise levels exceed acceptable limits for residential areas.',
  'I would like to request a permit to install a fence around my property. Please provide information on requirements and application process.',
  'The traffic signal at the busy intersection has been stuck on red for one direction, causing significant traffic delays and potential safety issues.',
  'Graffiti has appeared on the side of the community center building. It is offensive and should be removed as soon as possible.',
  'A large tree branch fell during the storm and is now blocking half of the sidewalk, forcing pedestrians to walk in the street.'
];

const locations = [
  'Main Street and 1st Avenue',
  '123 Oak Street',
  'Central Park area',
  '456 Elm Avenue',
  'Downtown intersection',
  '789 Pine Road',
  'Community Center parking lot',
  'City Hall vicinity',
  '321 Maple Drive',
  'Public Library entrance'
];

function generateRequestCode(index: number): string {
  const year = new Date().getFullYear();
  const paddedIndex = (index + 1).toString().padStart(4, '0');
  return `REQ-${year}-${paddedIndex}`;
}

async function main() {
  console.log('?? Seeding database...');

  // Clear existing data first
  console.log('?? Clearing existing data...');
  await prisma.serviceRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Create departments
  console.log('?? Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({
      data: { name: 'Public Works', slug: 'public-works' }
    }),
    prisma.department.create({
      data: { name: 'Parks & Recreation', slug: 'parks-recreation' }
    }),
    prisma.department.create({
      data: { name: 'Streets & Transportation', slug: 'streets-transportation' }
    }),
    prisma.department.create({
      data: { name: 'Water & Sewer', slug: 'water-sewer' }
    }),
    prisma.department.create({
      data: { name: 'Building & Permits', slug: 'building-permits' }
    }),
  ]);

  // Create users
  console.log('?? Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    // Citizens
    prisma.user.create({
      data: {
        email: 'john@example.com',
        passwordHash: hashedPassword,
        name: 'John Doe',
        role: 'CITIZEN',
      }
    }),
    prisma.user.create({
      data: {
        email: 'jane@example.com',
        passwordHash: hashedPassword,
        name: 'Jane Smith',
        role: 'CITIZEN',
      }
    }),
    // Clerks
    prisma.user.create({
      data: {
        email: 'mary.clerk@city.gov',
        passwordHash: hashedPassword,
        name: 'Mary Johnson',
        role: 'CLERK',
        departmentId: departments[0].id,
      }
    }),
    // Supervisors
    prisma.user.create({
      data: {
        email: 'supervisor@city.gov',
        passwordHash: hashedPassword,
        name: 'Bob Wilson',
        role: 'SUPERVISOR',
        departmentId: departments[0].id,
      }
    }),
    // Field Agents
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

  // Create service requests
  console.log('?? Creating service requests...');
  const requests = await Promise.all([
    prisma.serviceRequest.create({
      data: {
        code: generateRequestCode(0),
        title: 'Pothole on Main Street',
        description: 'Large pothole causing traffic issues near the intersection of Main and Oak streets.',
        category: 'Roads and Transportation',
        priority: 'HIGH',
        status: 'SUBMITTED',
        locationText: 'Main Street and Oak Street intersection',
        lat: 40.7128,
        lng: -74.0060,
        createdBy: users[0].id,
        departmentId: departments[2].id,
      }
    }),
    prisma.serviceRequest.create({
      data: {
        code: generateRequestCode(1),
        title: 'Broken Streetlight',
        description: 'Streetlight is out on Elm Street, creating safety concerns for pedestrians.',
        category: 'Street Lighting',
        priority: 'MEDIUM',
        status: 'TRIAGED',
        locationText: '123 Elm Street',
        lat: 40.7589,
        lng: -73.9851,
        createdBy: users[1].id,
        departmentId: departments[0].id,
        assignedTo: users[4].id,
      }
    }),
    prisma.serviceRequest.create({
      data: {
        code: generateRequestCode(2),
        title: 'Park Bench Vandalism',
        description: 'Several park benches have been damaged by vandalism in Central Park.',
        category: 'Parks and Recreation',
        priority: 'LOW',
        status: 'IN_PROGRESS',
        locationText: 'Central Park, near the playground',
        lat: 40.7831,
        lng: -73.9712,
        createdBy: users[0].id,
        departmentId: departments[1].id,
        assignedTo: users[4].id,
      }
    }),
    prisma.serviceRequest.create({
      data: {
        code: generateRequestCode(3),
        title: 'Water Main Break',
        description: 'Water main break causing flooding on Riverside Drive.',
        category: 'Water and Sewer',
        priority: 'URGENT',
        status: 'SUBMITTED',
        locationText: '456 Riverside Drive',
        lat: 40.8176,
        lng: -73.9482,
        createdBy: users[1].id,
        departmentId: departments[3].id,
      }
    }),
    prisma.serviceRequest.create({
      data: {
        code: generateRequestCode(4),
        title: 'Illegal Construction',
        description: 'Construction work being performed without proper permits.',
        category: 'Building and Permits',
        priority: 'HIGH',
        status: 'RESOLVED',
        locationText: '789 Construction Avenue',
        lat: 40.7505,
        lng: -73.9934,
        createdBy: users[0].id,
        departmentId: departments[4].id,
        assignedTo: users[2].id,
      }
    }),
  ]);

  console.log('? Seeding completed successfully!');
  console.log(`?? Created:`);
  console.log(`   • ${departments.length} departments`);
  console.log(`   • ${users.length} users`);
  console.log(`   • ${requests.length} service requests`);
  
  console.log('\n?? Demo accounts:');
  console.log('   • Citizen: john@example.com / password123');
  console.log('   • Clerk: mary.clerk@city.gov / password123');
  console.log('   • Supervisor: supervisor@city.gov / password123');
  console.log('   • Field Agent: field.agent@city.gov / password123');
  console.log('   • Admin: admin@city.gov / password123');
}

main()
  .catch((e) => {
    console.error('? Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });