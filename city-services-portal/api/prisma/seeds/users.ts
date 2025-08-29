import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const NAMES_FIRST = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'Robert', 'Lisa', 'Christopher', 'Jessica', 'Matthew', 'Ashley', 'Joshua', 'Amanda', 'Andrew', 'Stephanie', 'Kenneth', 'Melissa', 'Paul', 'Nicole', 'Steven', 'Elizabeth', 'Kevin', 'Sharon', 'Brian', 'Kimberly', 'George', 'Deborah', 'Edward', 'Dorothy'];

const NAMES_LAST = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson'];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function seedUsers(prisma: PrismaClient, departments: any[]) {
  console.log('👥 Creating users...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  const users = [];

  // Create 50 Citizens
  console.log('   👨‍👩‍👧‍👦 Creating 50 citizens...');
  for (let i = 0; i < 50; i++) {
    const firstName = getRandomElement(NAMES_FIRST);
    const lastName = getRandomElement(NAMES_LAST);
    const fullName = `${firstName} ${lastName}`;
    
    const user = await prisma.user.create({
      data: {
        email: `citizen${i + 1}@example.com`,
        passwordHash: hashedPassword,
        name: fullName,
        role: 'CITIZEN',
        firstName: firstName,
        lastName: lastName,
        phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Main St', 'Oak Ave', 'Park Blvd', 'First St', 'Second Ave', 'Elm St', 'Maple Ave', 'Cedar Ln'])}`,
        city: 'New York',
        state: 'NY',
        postalCode: `1${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        country: 'United States',
        preferredLanguage: 'EN',
        communicationMethod: getRandomElement(['EMAIL', 'PHONE', 'SMS']),
        emailNotifications: Math.random() > 0.3,
        smsNotifications: Math.random() > 0.7,
        serviceUpdates: Math.random() > 0.2,
      }
    });
    users.push(user);
  }

  // Create 25 Clerks distributed across departments
  console.log('   👔 Creating 25 clerks...');
  for (let i = 0; i < 25; i++) {
    const firstName = getRandomElement(NAMES_FIRST);
    const lastName = getRandomElement(NAMES_LAST);
    const fullName = `${firstName} ${lastName}`;
    
    const user = await prisma.user.create({
      data: {
        email: `clerk${i + 1}@city.gov`,
        passwordHash: hashedPassword,
        name: fullName,
        role: 'CLERK',
        departmentId: getRandomElement(departments).id,
        firstName: firstName,
        lastName: lastName,
        phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Government St', 'City Hall Ave', 'Municipal Blvd', 'Public Way', 'Service Dr'])}`,
        city: 'New York',
        state: 'NY',
        postalCode: `1${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        country: 'United States',
        preferredLanguage: 'EN',
      }
    });
    users.push(user);
  }

  // Create 15 Supervisors distributed across departments
  console.log('   👨‍💼 Creating 15 supervisors...');
  for (let i = 0; i < 15; i++) {
    const firstName = getRandomElement(NAMES_FIRST);
    const lastName = getRandomElement(NAMES_LAST);
    const fullName = `${firstName} ${lastName}`;
    
    const user = await prisma.user.create({
      data: {
        email: `supervisor${i + 1}@city.gov`,
        passwordHash: hashedPassword,
        name: fullName,
        role: 'SUPERVISOR',
        departmentId: getRandomElement(departments).id,
        firstName: firstName,
        lastName: lastName,
        phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Government St', 'City Hall Ave', 'Municipal Blvd', 'Public Way', 'Service Dr'])}`,
        city: 'New York',
        state: 'NY',
        postalCode: `1${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        country: 'United States',
        preferredLanguage: 'EN',
      }
    });
    users.push(user);
  }

  // Create 20 Field Agents distributed across departments
  console.log('   🚐 Creating 20 field agents...');
  for (let i = 0; i < 20; i++) {
    const firstName = getRandomElement(NAMES_FIRST);
    const lastName = getRandomElement(NAMES_LAST);
    const fullName = `${firstName} ${lastName}`;
    
    const user = await prisma.user.create({
      data: {
        email: `agent${i + 1}@city.gov`,
        passwordHash: hashedPassword,
        name: fullName,
        role: 'FIELD_AGENT',
        departmentId: getRandomElement(departments).id,
        firstName: firstName,
        lastName: lastName,
        phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Government St', 'City Hall Ave', 'Municipal Blvd', 'Public Way', 'Service Dr'])}`,
        city: 'New York',
        state: 'NY',
        postalCode: `1${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        country: 'United States',
        preferredLanguage: 'EN',
      }
    });
    users.push(user);
  }

  // Create demo accounts for testing
  console.log('   🎭 Creating demo accounts...');
  const demoUsers = await Promise.all([
    prisma.user.create({
      data: {
        email: 'john@example.com',
        passwordHash: hashedPassword,
        name: 'John Doe (Demo)',
        role: 'CITIZEN',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+1-555-123-4567',
        alternatePhone: '+1-555-987-6543',
        streetAddress: '123 Demo Street',
        city: 'New York',
        state: 'NY',
        postalCode: '10001',
        country: 'United States',
        preferredLanguage: 'EN',
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        smsNotifications: true,
        serviceUpdates: true,
      }
    }),
    prisma.user.create({
      data: {
        email: 'mary.clerk@city.gov',
        passwordHash: hashedPassword,
        name: 'Mary Johnson (Demo)',
        role: 'CLERK',
        departmentId: departments[0].id,
        firstName: 'Mary',
        lastName: 'Johnson',
        phone: '+1-555-234-5678',
        streetAddress: '456 City Hall Avenue',
        city: 'New York',
        state: 'NY',
        postalCode: '10002',
        country: 'United States',
        preferredLanguage: 'EN',
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        serviceUpdates: true,
      }
    }),
    prisma.user.create({
      data: {
        email: 'supervisor@city.gov',
        passwordHash: hashedPassword,
        name: 'Bob Wilson (Demo)',
        role: 'SUPERVISOR',
        departmentId: departments[0].id,
        firstName: 'Bob',
        lastName: 'Wilson',
        phone: '+1-555-345-6789',
        streetAddress: '789 Supervisor Lane',
        city: 'New York',
        state: 'NY',
        postalCode: '10003',
        country: 'United States',
        preferredLanguage: 'EN',
      }
    }),
    prisma.user.create({
      data: {
        email: 'field.agent@city.gov',
        passwordHash: hashedPassword,
        name: 'Tom Brown (Demo)',
        role: 'FIELD_AGENT',
        departmentId: departments[1].id,
        firstName: 'Tom',
        lastName: 'Brown',
        phone: '+1-555-456-7890',
        streetAddress: '321 Field Agent Road',
        city: 'New York',
        state: 'NY',
        postalCode: '10004',
        country: 'United States',
        preferredLanguage: 'EN',
      }
    }),
    prisma.user.create({
      data: {
        email: 'admin@city.gov',
        passwordHash: hashedPassword,
        name: 'Admin User (Demo)',
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+1-555-567-8901',
        streetAddress: '999 Administrator Plaza',
        city: 'New York',
        state: 'NY',
        postalCode: '10005',
        country: 'United States',
        preferredLanguage: 'EN',
      }
    })
  ]);
  
  users.push(...demoUsers);

  // Separate users by role for easy access
  const citizens = users.filter(u => u.role === 'CITIZEN');
  const clerks = users.filter(u => u.role === 'CLERK');
  const supervisors = users.filter(u => u.role === 'SUPERVISOR');
  const fieldAgents = users.filter(u => u.role === 'FIELD_AGENT');
  const staffUsers = [...clerks, ...supervisors, ...fieldAgents];

  console.log(`   ✅ Created ${users.length} users: ${citizens.length} citizens, ${clerks.length} clerks, ${supervisors.length} supervisors, ${fieldAgents.length} field agents`);
  
  return {
    allUsers: users,
    citizens,
    clerks,
    supervisors,
    fieldAgents,
    staffUsers
  };
}