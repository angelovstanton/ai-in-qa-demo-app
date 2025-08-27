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
  'roads-transportation',
  'street-lighting',
  'waste-management',
  'water-sewer',
  'parks-recreation',
  'public-safety',
  'building-permits',
  'snow-removal',
  'traffic-signals',
  'sidewalk-maintenance',
  'tree-services',
  'noise-complaints',
  'animal-control',
  'other'
];

const categoryLabels: Record<string, string> = {
  'roads-transportation': 'Roads and Transportation',
  'street-lighting': 'Street Lighting',
  'waste-management': 'Waste Management',
  'water-sewer': 'Water and Sewer',
  'parks-recreation': 'Parks and Recreation',
  'public-safety': 'Public Safety',
  'building-permits': 'Building and Permits',
  'snow-removal': 'Snow Removal',
  'traffic-signals': 'Traffic Signals',
  'sidewalk-maintenance': 'Sidewalk Maintenance',
  'tree-services': 'Tree Services',
  'noise-complaints': 'Noise Complaints',
  'animal-control': 'Animal Control',
  'other': 'Other'
};

// Realistic sample data
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
  'Tree branch blocking sidewalk',
  'Sidewalk crack hazard',
  'Snow removal needed',
  'Street sign vandalism',
  'Illegal dumping reported',
  'Public restroom maintenance',
  'Park bench repair needed',
  'Streetlight flickering',
  'Road surface deterioration',
  'Drainage system blockage',
  'Public Wi-Fi not working',
  'Bus stop shelter damage',
  'Crosswalk paint fading',
  'Public fountain broken',
  'Parking meter malfunction',
  'Fire hydrant obstruction',
  'Tree trimming request',
  'Public building access issue',
  'Street cleaning needed',
  'Public phone booth repair',
  'Sidewalk snow clearance',
  'Road construction debris',
  'Public art vandalism',
  'Street vendor permit',
  'Public event permit request',
  'Noise ordinance violation',
  'Public lighting insufficient',
  'Road marking restoration',
  'Public building heating issue',
  'Street furniture damage',
  'Public garden maintenance'
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
  'A large tree branch fell during the storm and is now blocking half of the sidewalk, forcing pedestrians to walk in the street.',
  'There is a significant crack in the sidewalk that has become a tripping hazard. Multiple people have stumbled over it.',
  'The recent snowfall has not been cleared from our residential street, making it impassable for vehicles and dangerous for pedestrians.',
  'The stop sign at the intersection has been vandalized with spray paint, making it difficult to read and potentially dangerous.',
  'Someone has been illegally dumping construction debris in the vacant lot behind our building. This is creating an eyesore and potential health hazard.',
  'The public restroom in the park has been out of order for over a week. The facility needs maintenance and cleaning.',
  'Several park benches have loose or broken slats that could injure someone. They need repair or replacement.',
  'The streetlight outside our building has been flickering intermittently, sometimes leaving the area in complete darkness.',
  'The road surface has multiple cracks and uneven patches that are making driving uncomfortable and potentially damaging vehicles.',
  'The storm drain on our street appears to be blocked, causing water to pool during rain and creating flooding issues.',
  'The public Wi-Fi access point in the downtown area has not been working for several days, affecting local businesses and visitors.'
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
  'Public Library entrance',
  '555 Broadway',
  'Riverside Drive',
  'Market Square',
  '777 Cedar Lane',
  'Industrial District',
  'University Campus',
  'Shopping Center Plaza',
  'Memorial Park',
  '999 Willow Street',
  'Historic District',
  'Waterfront Promenade',
  'Sports Complex',
  '1111 Cherry Avenue',
  'Business District',
  'Residential Area North',
  'Old Town Square',
  '1234 Birch Road',
  'Municipal Building',
  'Transit Hub',
  'Cultural Center',
  '1456 Spruce Street',
  'Civic Center',
  'Entertainment District',
  '1678 Poplar Avenue',
  'Medical District',
  'Educational Campus',
  '1890 Ash Boulevard',
  'Commercial Zone',
  'Suburban Area',
  'City Limits'
];

// Citizen names for realistic data
const citizenNames = [
  'John Doe', 'Jane Smith', 'Michael Johnson', 'Emily Davis', 'David Wilson',
  'Sarah Brown', 'Robert Jones', 'Lisa Garcia', 'William Miller', 'Jennifer Martinez',
  'James Anderson', 'Maria Rodriguez', 'Christopher Taylor', 'Patricia Thomas',
  'Daniel Jackson', 'Linda White', 'Matthew Harris', 'Barbara Martin', 'Anthony Thompson',
  'Helen Garcia', 'Mark Wilson', 'Nancy Anderson', 'Steven Thomas', 'Karen Jackson'
];

// Staff names for different roles
const staffNames = {
  clerk: ['Mary Johnson', 'Alice Cooper', 'Bob Smith', 'Carol Davis', 'Tom Wilson'],
  supervisor: ['Bob Wilson', 'Susan Lee', 'Frank Miller'],
  fieldAgent: ['Tom Brown', 'Mike Davis', 'Steve Johnson'],
  admin: ['Admin User', 'System Administrator']
};

const contactMethods = ['EMAIL', 'PHONE', 'SMS'];
const issueTypes = ['MAINTENANCE', 'REPAIR', 'INSTALLATION', 'INSPECTION', 'COMPLAINT'];
const affectedServices = ['ELECTRICITY', 'WATER', 'SEWER', 'TRANSPORTATION', 'INTERNET', 'PHONE'];

function generateRequestCode(index: number): string {
  const year = new Date().getFullYear();
  const paddedIndex = (index + 1).toString().padStart(4, '0');
  return `REQ-${year}-${paddedIndex}`;
}

function getRandomElement<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomElements<T>(array: T[], count: number = 1): T[] {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function getRandomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function main() {
  console.log('🌱 Seeding database...');

  // Clear existing data first
  console.log('🗑️ Clearing existing data...');
  await prisma.eventLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.featureFlag.deleteMany();

  // Create departments
  console.log('🏢 Creating departments...');
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

  // Create feature flags
  console.log('🚩 Creating feature flags...');
  await Promise.all([
    prisma.featureFlag.create({
      data: {
        key: 'API_Random500',
        value: JSON.stringify({ enabled: false, percentage: 5 })
      }
    }),
    prisma.featureFlag.create({
      data: {
        key: 'UI_WrongDefaultSort',
        value: JSON.stringify({ enabled: false })
      }
    }),
    prisma.featureFlag.create({
      data: {
        key: 'API_SlowRequests',
        value: JSON.stringify({ enabled: false, percentage: 10, delay: 3000 })
      }
    }),
    prisma.featureFlag.create({
      data: {
        key: 'API_UploadIntermittentFail',
        value: JSON.stringify({ enabled: false, percentage: 20 })
      }
    }),
  ]);

  // Create users
  console.log('👥 Creating users...');
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = [];

  // Create 20 citizens
  for (let i = 0; i < 20; i++) {
    const fullName = citizenNames[i] || `Citizen ${i + 1}`;
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Smith';
    
    const user = await prisma.user.create({
      data: {
        email: `citizen${i + 1}@example.com`,
        passwordHash: hashedPassword,
        name: fullName,
        role: 'CITIZEN',
        firstName: firstName,
        lastName: lastName,
        phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        alternatePhone: Math.random() > 0.5 ? `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : null,
        streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Maple Dr', 'Cedar Ln', 'Park Ave', 'First St', 'Second St', 'Broadway'])}`,
        city: getRandomElement(['New York', 'Brooklyn', 'Queens', 'Manhattan', 'Bronx', 'Staten Island']),
        state: 'NY',
        postalCode: `1${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        country: 'United States',
        preferredLanguage: getRandomElement(['EN', 'EN', 'EN', 'BG']), // Mostly English
        communicationMethod: getRandomElement(['EMAIL', 'PHONE', 'SMS']),
        emailNotifications: Math.random() > 0.3,
        smsNotifications: Math.random() > 0.7,
        marketingEmails: Math.random() > 0.6,
        serviceUpdates: Math.random() > 0.2,
      }
    });
    users.push(user);
  }

  // Create 5 clerks
  for (let i = 0; i < 5; i++) {
    const fullName = staffNames.clerk[i] || `Clerk ${i + 1}`;
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Johnson';
    
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
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        serviceUpdates: true,
      }
    });
    users.push(user);
  }

  // Create 3 supervisors
  for (let i = 0; i < 3; i++) {
    const fullName = staffNames.supervisor[i] || `Supervisor ${i + 1}`;
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Wilson';
    
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
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        serviceUpdates: true,
      }
    });
    users.push(user);
  }

  // Create 3 field agents
  for (let i = 0; i < 3; i++) {
    const fullName = staffNames.fieldAgent[i] || `Agent ${i + 1}`;
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Brown';
    
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
        streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Field St', 'Service Ave', 'Worker Blvd', 'Tech Dr', 'Mobile Way'])}`,
        city: 'New York',
        state: 'NY',
        postalCode: `1${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        country: 'United States',
        preferredLanguage: 'EN',
        communicationMethod: 'SMS',
        smsNotifications: true,
        serviceUpdates: true,
      }
    });
    users.push(user);
  }

  // Create 2 admins
  for (let i = 0; i < 2; i++) {
    const fullName = staffNames.admin[i] || `Admin ${i + 1}`;
    const nameParts = fullName.split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Administrator';
    
    const user = await prisma.user.create({
      data: {
        email: `admin${i + 1}@city.gov`,
        passwordHash: hashedPassword,
        name: fullName,
        role: 'ADMIN',
        firstName: firstName,
        lastName: lastName,
        phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
        streetAddress: `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Admin Plaza', 'Executive Ave', 'Management Blvd', 'Director Dr', 'Chief St'])}`,
        city: 'New York',
        state: 'NY',
        postalCode: `1${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        country: 'United States',
        preferredLanguage: 'EN',
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        smsNotifications: true,
        serviceUpdates: true,
      }
    });
    users.push(user);
  }

  // Create original demo accounts for compatibility
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
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        serviceUpdates: true,
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
        streetAddress: '321 Field Worker Ave',
        city: 'New York',
        state: 'NY',
        postalCode: '10004',
        country: 'United States',
        preferredLanguage: 'EN',
        communicationMethod: 'SMS',
        smsNotifications: true,
        serviceUpdates: true,
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
        streetAddress: '100 City Hall Plaza',
        city: 'New York',
        state: 'NY',
        postalCode: '10005',
        country: 'United States',
        preferredLanguage: 'EN',
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        smsNotifications: true,
        serviceUpdates: true,
      }
    }),
  ]);

  users.push(...demoUsers);

  // Separate users by role for request assignment
  const citizens = users.filter(u => u.role === 'CITIZEN');
  const clerks = users.filter(u => u.role === 'CLERK');
  const supervisors = users.filter(u => u.role === 'SUPERVISOR');
  const fieldAgents = users.filter(u => u.role === 'FIELD_AGENT');
  const staffUsers = [...clerks, ...supervisors, ...fieldAgents];

  // Create 150 service requests with realistic data
  console.log('📋 Creating 150 service requests...');
  const requests = [];
  const statuses = Object.values(Status);
  const priorities = Object.values(Priority);

  for (let i = 0; i < 150; i++) {
    // Ensure demo user (john@example.com) gets a good portion of requests
    const creator = i < 20 ? users.find(u => u.email === 'john@example.com') || getRandomElement(citizens) : getRandomElement(citizens);
    // Ensure good distribution across categories, with emphasis on street-lighting for ranklist demo
    const categoryWeights = [...categories, 'street-lighting', 'street-lighting', 'street-lighting'];
    const category = getRandomElement(categoryWeights);
    // Ensure good distribution of statuses with more resolved/closed requests for ranklist
    const statusWeights = [
      'SUBMITTED', 'SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'WAITING_ON_CITIZEN',
      'RESOLVED', 'RESOLVED', 'RESOLVED', 'RESOLVED', 'RESOLVED', 
      'CLOSED', 'CLOSED', 'CLOSED', 'CLOSED',
      'REJECTED'
    ];
    const status = getRandomElement(statusWeights);
    const priority = getRandomElement(priorities);
    const department = getRandomElement(departments);
    
    // Assign to staff if status is beyond SUBMITTED
    const assignee = ['TRIAGED', 'IN_PROGRESS', 'WAITING_ON_CITIZEN', 'RESOLVED', 'CLOSED'].includes(status) 
      ? getRandomElement(staffUsers) 
      : null;

    // Generate realistic dates
    const createdAt = getRandomDate(new Date(2024, 0, 1), new Date());
    const updatedAt = new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime()));

    const request = await prisma.serviceRequest.create({
      data: {
        code: generateRequestCode(i),
        title: sampleTitles[i % sampleTitles.length] + (i >= sampleTitles.length ? ` (${Math.floor(i / sampleTitles.length) + 1})` : ''),
        description: sampleDescriptions[i % sampleDescriptions.length],
        category,
        priority,
        status,
        
        // Date fields
        dateOfRequest: getRandomDate(new Date(2024, 0, 1), createdAt),
        
        // Location fields
        streetAddress: Math.random() > 0.3 ? `${Math.floor(Math.random() * 9999) + 1} ${getRandomElement(['Main St', 'Oak Ave', 'Pine Rd', 'Elm St', 'Maple Dr'])}` : null,
        city: Math.random() > 0.2 ? getRandomElement(['New York', 'Brooklyn', 'Queens', 'Bronx', 'Manhattan']) : null,
        postalCode: Math.random() > 0.2 ? `1${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}` : null,
        locationText: locations[i % locations.length],
        landmark: Math.random() > 0.6 ? getRandomElement(['Near the school', 'Next to the park', 'Opposite the library', 'Behind the mall', 'Close to the station']) : null,
        accessInstructions: Math.random() > 0.7 ? getRandomElement(['Use side entrance', 'Ring doorbell', 'Access via parking lot', 'Enter through main gate']) : null,
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1,
        
        // Contact fields
        contactMethod: Math.random() > 0.3 ? getRandomElement(contactMethods) : null,
        alternatePhone: Math.random() > 0.6 ? `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}` : null,
        bestTimeToContact: Math.random() > 0.5 ? getRandomElement(['Morning (9-12)', 'Afternoon (12-17)', 'Evening (17-20)', 'Weekends only']) : null,
        
        // Issue details
        issueType: Math.random() > 0.4 ? getRandomElement(issueTypes) : null,
        severity: Math.random() > 0.3 ? Math.floor(Math.random() * 10) + 1 : null,
        isRecurring: Math.random() > 0.8,
        isEmergency: priority === 'URGENT' && Math.random() > 0.7,
        hasPermits: category === 'building-permits' || Math.random() > 0.9,
        
        // Service impact
        affectedServices: Math.random() > 0.4 ? JSON.stringify(getRandomElements(affectedServices, Math.floor(Math.random() * 3) + 1)) : null,
        estimatedValue: Math.random() > 0.7 ? Math.floor(Math.random() * 50000) + 100 : null,
        
        // Additional contacts
        additionalContacts: Math.random() > 0.8 ? JSON.stringify([{
          name: getRandomElement(citizenNames),
          phone: `+1-555-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
          relationship: getRandomElement(['Spouse', 'Neighbor', 'Property Manager', 'Business Partner'])
        }]) : null,
        
        // User experience
        satisfactionRating: Math.random() > 0.6 ? Math.floor(Math.random() * 5) + 1 : null,
        formComments: Math.random() > 0.5 ? `Additional information about ${sampleTitles[i % sampleTitles.length].toLowerCase()}.` : null,
        
        // Legal and preferences
        agreesToTerms: true,
        wantsUpdates: Math.random() > 0.2,
        
        // Scheduled service
        preferredDate: Math.random() > 0.7 ? new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000) : null,
        preferredTime: Math.random() > 0.8 ? getRandomElement(['09:00-12:00', '12:00-15:00', '15:00-18:00']) : null,
        
        // System fields
        createdBy: creator.id,
        assignedTo: assignee?.id,
        departmentId: department.id,
        createdAt,
        updatedAt,
        slaDueAt: status === 'URGENT' ? new Date(createdAt.getTime() + 24 * 60 * 60 * 1000) : 
                  status === 'HIGH' ? new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000) : 
                  new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000),
        closedAt: ['RESOLVED', 'CLOSED'].includes(status) ? updatedAt : null,
      }
    });
    requests.push(request);
  }

  // Create attachments for some requests (using default image)
  console.log('📎 Creating attachments...');
  const attachmentCount = Math.floor(requests.length * 0.3); // 30% of requests have attachments
  for (let i = 0; i < attachmentCount; i++) {
    const request = requests[i];
    await prisma.attachment.create({
      data: {
        requestId: request.id,
        uploadedById: request.createdBy,
        filename: 'service-request-default-image.png',
        mime: 'image/png',
        size: 1024000, // 1MB
        url: '/images/service-request-default-image.png',
      }
    });
  }

  // Create comments for requests
  console.log('💬 Creating comments...');
  const commentCount = Math.floor(requests.length * 0.4); // 40% of requests have comments
  for (let i = 0; i < commentCount; i++) {
    const request = requests[i];
    const commenter = Math.random() > 0.5 ? 
      users.find(u => u.id === request.createdBy) : // Original creator
      getRandomElement(staffUsers); // Staff member
    
    if (commenter) {
      await prisma.comment.create({
        data: {
          requestId: request.id,
          authorId: commenter.id,
          body: `This is a comment about the ${request.title.toLowerCase()}. ${commenter.role === 'CITIZEN' ? 'I wanted to provide additional information about this issue.' : 'We are reviewing this request and will provide updates soon.'}`,
          visibility: commenter.role === 'CITIZEN' ? 'PUBLIC' : (Math.random() > 0.5 ? 'PUBLIC' : 'INTERNAL'),
        }
      });
    }
  }

  // Create assignments for requests that are assigned
  console.log('📋 Creating assignments...');
  const assignedRequests = requests.filter(r => r.assignedTo);
  for (const request of assignedRequests) {
    if (request.assignedTo) {
      const supervisor = getRandomElement(supervisors);
      await prisma.assignment.create({
        data: {
          requestId: request.id,
          assigneeId: request.assignedTo,
          assignedById: supervisor.id,
        }
      });
    }
  }

  // Create event logs for requests
  console.log('📝 Creating event logs...');
  for (const request of requests) {
    // Create initial submission event
    await prisma.eventLog.create({
      data: {
        requestId: request.id,
        type: 'REQUEST_CREATED',
        payload: JSON.stringify({
          title: request.title,
          category: request.category,
          priority: request.priority,
          createdBy: request.createdBy
        }),
        createdAt: request.createdAt,
      }
    });

    // Create status change events if not in initial status
    if (request.status !== 'SUBMITTED') {
      await prisma.eventLog.create({
        data: {
          requestId: request.id,
          type: 'STATUS_CHANGED',
          payload: JSON.stringify({
            fromStatus: 'SUBMITTED',
            toStatus: request.status,
            changedBy: request.assignedTo || request.createdBy
          }),
          createdAt: request.updatedAt,
        }
      });
    }

    // Create assignment event if assigned
    if (request.assignedTo) {
      await prisma.eventLog.create({
        data: {
          requestId: request.id,
          type: 'REQUEST_ASSIGNED',
          payload: JSON.stringify({
            assignedTo: request.assignedTo,
            assignedBy: getRandomElement(supervisors).id
          }),
          createdAt: request.updatedAt,
        }
      });
    }
  }

  // TODO: Create upvotes for requests to improve ranklist data
  // This will be added after Prisma client is regenerated

  console.log('✅ Seeding completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   🏢 ${departments.length} departments`);
  console.log(`   👥 ${users.length} users (${citizens.length} citizens, ${clerks.length} clerks, ${supervisors.length} supervisors, ${fieldAgents.length} field agents, ${users.filter(u => u.role === 'ADMIN').length} admins)`);
  console.log(`   📋 ${requests.length} service requests`);
  console.log(`   📎 ${attachmentCount} attachments`);
  console.log(`   💬 ${commentCount} comments`);
  console.log(`   📝 ${requests.length * 2} event logs (average)`);
  console.log(`   🚩 4 feature flags`);
  
  console.log('\n🔑 Demo accounts:');
  console.log('   👤 Citizen: john@example.com / password123');
  console.log('   👩‍💼 Clerk: mary.clerk@city.gov / password123');
  console.log('   👨‍💼 Supervisor: supervisor@city.gov / password123');
  console.log('   🚗 Field Agent: field.agent@city.gov / password123');
  console.log('   🔧 Admin: admin@city.gov / password123');
  
  console.log('\n📧 Additional accounts:');
  console.log('   👥 Citizens: citizen1@example.com to citizen20@example.com / password123');
  console.log('   👩‍💼 Clerks: clerk1@city.gov to clerk5@city.gov / password123');
  console.log('   👨‍💼 Supervisors: supervisor1@city.gov to supervisor3@city.gov / password123');
  console.log('   🚗 Agents: agent1@city.gov to agent3@city.gov / password123');
  console.log('   🔧 Admins: admin1@city.gov to admin2@city.gov / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });