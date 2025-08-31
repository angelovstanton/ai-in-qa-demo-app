import { PrismaClient, Department, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Realistic Bulgarian and international names
const FIRST_NAMES = [
  'Alexander', 'Maria', 'Ivan', 'Elena', 'Georgi', 'Anna', 'Dimitar', 'Sophia',
  'Nikolay', 'Victoria', 'Peter', 'Kristina', 'Stefan', 'Daniela', 'Martin',
  'Teodora', 'Boris', 'Milena', 'Hristo', 'Ralitsa', 'Vladimir', 'Desislava',
  'Plamen', 'Simona', 'Krasimir', 'Yana', 'Todor', 'Gabriela', 'Emil', 'Polina',
  'John', 'Sarah', 'Michael', 'Emma', 'Robert', 'Lisa', 'David', 'Jennifer'
];

const LAST_NAMES = [
  'Petrov', 'Ivanov', 'Georgiev', 'Dimitrov', 'Nikolov', 'Stefanov', 'Todorov',
  'Stoyanov', 'Mihaylov', 'Kolev', 'Marinov', 'Popov', 'Angelov', 'Hristov',
  'Atanasov', 'Iliev', 'Kostov', 'Vasilev', 'Petkov', 'Borisov', 'Yankov',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'
];

export interface UsersSeedResult {
  allUsers: User[];
  citizens: User[];
  clerks: User[];
  supervisors: User[];
  fieldAgents: User[];
  admins: User[];
}

function generateEmail(firstName: string, lastName: string, role: string, index: number): string {
  const domain = role === 'CITIZEN' ? 'gmail.com' : 'city.gov';
  const prefix = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index > 0 ? index : ''}`;
  return `${prefix}@${domain}`;
}

function generatePhone(): string {
  const areaCodes = ['887', '888', '889', '878', '879'];
  const areaCode = areaCodes[Math.floor(Math.random() * areaCodes.length)];
  const number = Math.floor(Math.random() * 9000000) + 1000000;
  return `+359 ${areaCode} ${number}`;
}

export async function seedUsers(
  prisma: PrismaClient, 
  departments: Department[]
): Promise<UsersSeedResult> {
  console.log('👥 Seeding Users...');
  
  const passwordHash = await bcrypt.hash('password123', 10);
  const result: UsersSeedResult = {
    allUsers: [],
    citizens: [],
    clerks: [],
    supervisors: [],
    fieldAgents: [],
    admins: []
  };
  
  // Create demo accounts
  console.log('   Creating demo accounts...');
  const demoAccounts = [
    { email: 'john@example.com', name: 'John Doe', role: 'CITIZEN' },
    { email: 'mary.clerk@city.gov', name: 'Mary Johnson', role: 'CLERK', departmentId: departments[0].id },
    { email: 'supervisor@city.gov', name: 'Tom Wilson', role: 'SUPERVISOR', departmentId: departments[0].id },
    { email: 'field.agent@city.gov', name: 'Bob Anderson', role: 'FIELD_AGENT', departmentId: departments[0].id },
    { email: 'admin@city.gov', name: 'Admin User', role: 'ADMIN' }
  ];
  
  for (const account of demoAccounts) {
    const user = await prisma.user.create({
      data: {
        ...account,
        passwordHash,
        isActive: true,
        emailConfirmed: true,
        phone: generatePhone()
      }
    });
    
    result.allUsers.push(user);
    switch (user.role) {
      case 'CITIZEN': result.citizens.push(user); break;
      case 'CLERK': result.clerks.push(user); break;
      case 'SUPERVISOR': result.supervisors.push(user); break;
      case 'FIELD_AGENT': result.fieldAgents.push(user); break;
      case 'ADMIN': result.admins.push(user); break;
    }
  }
  
  // Create citizens (60)
  console.log('   Creating citizens...');
  const usedEmails = new Set(demoAccounts.map(a => a.email));
  
  for (let i = 0; i < 60; i++) {
    const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
    const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
    let email = generateEmail(firstName, lastName, 'CITIZEN', 0);
    let emailCounter = 1;
    
    while (usedEmails.has(email)) {
      email = generateEmail(firstName, lastName, 'CITIZEN', emailCounter++);
    }
    usedEmails.add(email);
    
    const user = await prisma.user.create({
      data: {
        email,
        name: `${firstName} ${lastName}`,
        role: 'CITIZEN',
        passwordHash,
        isActive: true,
        emailConfirmed: Math.random() > 0.2,
        phone: generatePhone(),
        // Add address for some citizens
        ...(Math.random() > 0.3 ? {
          streetAddress: `${Math.floor(Math.random() * 200) + 1} ${['Vitosha', 'Alexander Nevsky', 'Tsar Boris III', 'Graf Ignatiev', 'Rakovski'][Math.floor(Math.random() * 5)]} Blvd`,
          city: ['Sofia', 'Plovdiv', 'Varna', 'Burgas', 'Ruse'][Math.floor(Math.random() * 5)],
          state: 'Bulgaria',
          postalCode: `${Math.floor(Math.random() * 9000) + 1000}`
        } : {})
      }
    });
    
    result.citizens.push(user);
    result.allUsers.push(user);
  }
  
  // Create department staff
  console.log('   Creating department staff...');
  
  for (const dept of departments) {
    // 2-3 clerks per department
    const numClerks = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < numClerks; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      let email = generateEmail(firstName, lastName, 'CLERK', 0);
      let emailCounter = 1;
      
      while (usedEmails.has(email)) {
        email = generateEmail(firstName, lastName, 'CLERK', emailCounter++);
      }
      usedEmails.add(email);
      
      const user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          role: 'CLERK',
          departmentId: dept.id,
          passwordHash,
          isActive: true,
          emailConfirmed: true,
          phone: generatePhone()
        }
      });
      
      result.clerks.push(user);
      result.allUsers.push(user);
    }
    
    // 1-2 supervisors per department
    const numSupervisors = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < numSupervisors; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      let email = generateEmail(firstName, lastName, 'SUPERVISOR', 0);
      let emailCounter = 1;
      
      while (usedEmails.has(email)) {
        email = generateEmail(firstName, lastName, 'SUPERVISOR', emailCounter++);
      }
      usedEmails.add(email);
      
      const user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          role: 'SUPERVISOR',
          departmentId: dept.id,
          passwordHash,
          isActive: true,
          emailConfirmed: true,
          phone: generatePhone()
        }
      });
      
      result.supervisors.push(user);
      result.allUsers.push(user);
    }
    
    // 2-3 field agents per department
    const numFieldAgents = Math.floor(Math.random() * 2) + 2;
    for (let i = 0; i < numFieldAgents; i++) {
      const firstName = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
      const lastName = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
      let email = generateEmail(firstName, lastName, 'FIELD_AGENT', 0);
      let emailCounter = 1;
      
      while (usedEmails.has(email)) {
        email = generateEmail(firstName, lastName, 'FIELD_AGENT', emailCounter++);
      }
      usedEmails.add(email);
      
      const user = await prisma.user.create({
        data: {
          email,
          name: `${firstName} ${lastName}`,
          firstName,
          lastName,
          role: 'FIELD_AGENT',
          departmentId: dept.id,
          passwordHash,
          isActive: true,
          emailConfirmed: true,
          phone: generatePhone()
        }
      });
      
      result.fieldAgents.push(user);
      result.allUsers.push(user);
    }
  }
  
  console.log(`   ✅ Created ${result.allUsers.length} users:`);
  console.log(`      - ${result.citizens.length} citizens`);
  console.log(`      - ${result.clerks.length} clerks`);
  console.log(`      - ${result.supervisors.length} supervisors`);
  console.log(`      - ${result.fieldAgents.length} field agents`);
  console.log(`      - ${result.admins.length} admins\n`);
  
  return result;
}