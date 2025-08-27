const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Helper function to get random element from array
const getRandomElement = (array) => array[Math.floor(Math.random() * array.length)];

// Helper function to get multiple random elements
const getRandomElements = (array, count) => {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

// Sample data
const categories = [
  'roads-transportation', 'street-lighting', 'waste-management', 'water-sewer',
  'parks-recreation', 'public-safety', 'building-permits', 'snow-removal',
  'traffic-signals', 'sidewalk-maintenance', 'tree-services', 'noise-complaints',
  'animal-control', 'other'
];

const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const statuses = ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'WAITING_ON_CITIZEN', 'RESOLVED', 'CLOSED', 'REJECTED'];

const citizenNames = [
  'John Doe', 'Jane Smith', 'Michael Johnson', 'Sarah Williams', 'David Brown',
  'Lisa Davis', 'Robert Miller', 'Emily Wilson', 'James Moore', 'Jessica Taylor',
  'Christopher Anderson', 'Amanda Thomas', 'Matthew Jackson', 'Ashley White',
  'Joshua Harris', 'Stephanie Martin', 'Andrew Thompson', 'Michelle Garcia',
  'Daniel Martinez', 'Nicole Robinson', 'Ryan Clark', 'Jennifer Rodriguez',
  'Kevin Lewis', 'Rachel Lee', 'Brian Walker', 'Laura Hall', 'Mark Allen',
  'Kimberly Young', 'Steven Hernandez', 'Donna King', 'Edward Wright',
  'Carol Lopez', 'Jason Hill', 'Sharon Scott', 'Timothy Green', 'Sandra Adams',
  'Jeffrey Baker', 'Betty Gonzalez', 'Ryan Nelson', 'Helen Carter'
];

const staffNames = {
  clerk: ['Mary Johnson', 'Patricia Williams', 'Linda Brown', 'Barbara Davis', 'Elizabeth Miller'],
  supervisor: ['Bob Wilson', 'Richard Anderson', 'Charles Thomas', 'Joseph Jackson', 'Thomas White'],
  fieldAgent: ['Tom Brown', 'William Harris', 'David Martin', 'John Thompson', 'Michael Garcia'],
  admin: ['Admin User', 'Sarah Administrator', 'System Manager']
};

const sampleTitles = [
  'Pothole on Main Street', 'Broken streetlight on Oak Avenue', 'Overflowing trash bin in Central Park',
  'Water leak at intersection', 'Damaged sidewalk near school', 'Graffiti removal request',
  'Tree branch blocking road', 'Noise complaint - construction', 'Parking meter malfunction',
  'Snow removal needed', 'Traffic light not working', 'Abandoned vehicle report',
  'Park bench needs repair', 'Street sign missing', 'Crosswalk paint faded',
  'Fire hydrant blocked', 'Illegal dumping report', 'Streetlight flickering',
  'Pothole repair needed', 'Sidewalk crack hazard', 'Tree trimming request',
  'Noise violation complaint', 'Water main break', 'Traffic congestion issue',
  'Park maintenance needed', 'Building code violation', 'Snow plow request',
  'Speed limit sign needed', 'Crosswalk signal broken', 'Tree removal needed',
  'Litter cleanup request', 'Parking violation report', 'Street cleaning needed',
  'Manhole cover loose', 'Streetlight out', 'Sidewalk obstruction',
  'Traffic accident cleanup', 'Park equipment broken', 'Building permit inquiry',
  'Ice removal needed', 'Stop sign vandalized', 'Pedestrian safety concern'
];

const locations = [
  '123 Main Street, Downtown', '456 Oak Avenue, Midtown', '789 Pine Road, Westside',
  '321 Elm Street, Eastside', '654 Maple Drive, Northside', '987 Cedar Lane, Southside',
  '147 Park Avenue, Central', '258 First Street, Historic', '369 Second Street, Business',
  '741 Broadway, Arts District', '852 Market Street, Shopping', '963 Union Street, Residential',
  '159 College Avenue, University', '357 Hospital Drive, Medical', '486 Industrial Boulevard, Manufacturing',
  '572 Riverside Drive, Waterfront', '683 Hill Street, Heights', '794 Valley Road, Suburbs',
  '815 Forest Avenue, Green District', '926 Beach Street, Coastal'
];

const contactMethods = ['EMAIL', 'PHONE', 'SMS'];
const issueTypes = ['Infrastructure', 'Safety', 'Environmental', 'Administrative', 'Emergency'];
const affectedServices = ['Traffic', 'Utilities', 'Public Safety', 'Sanitation', 'Parks', 'Transportation'];

async function main() {
  console.log('🌱 Comprehensive seeding database...');

  // Clear existing data in correct order
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

  const hashedPassword = await bcrypt.hash('password123', 10);

  // Create departments
  console.log('🏢 Creating departments...');
  const departments = await Promise.all([
    prisma.department.create({
      data: { name: 'Public Works', slug: 'public-works' }
    }),
    prisma.department.create({
      data: { name: 'Transportation', slug: 'transportation' }
    }),
    prisma.department.create({
      data: { name: 'Parks and Recreation', slug: 'parks-recreation' }
    }),
    prisma.department.create({
      data: { name: 'Public Safety', slug: 'public-safety' }
    }),
    prisma.department.create({
      data: { name: 'Environmental Services', slug: 'environmental-services' }
    })
  ]);

  // Create feature flags
  console.log('🚩 Creating feature flags...');
  await Promise.all([
    prisma.featureFlag.create({
      data: {
        key: 'ENABLE_UPVOTES',
        value: JSON.stringify({ enabled: true, description: 'Enable upvoting for service requests' })
      }
    }),
    prisma.featureFlag.create({
      data: {
        key: 'ENABLE_COMMENTS',
        value: JSON.stringify({ enabled: true, description: 'Enable comments on service requests' })
      }
    }),
    prisma.featureFlag.create({
      data: {
        key: 'ENABLE_ATTACHMENTS',
        value: JSON.stringify({ enabled: true, description: 'Enable file attachments' })
      }
    })
  ]);

  console.log('👥 Creating users...');
  const users = [];

  // Create 30 citizens with full profiles
  for (let i = 0; i < 30; i++) {
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
        communicationMethod: getRandomElement(contactMethods),
        emailNotifications: Math.random() > 0.3,
        smsNotifications: Math.random() > 0.7,
        marketingEmails: Math.random() > 0.8, // Most opt out
        serviceUpdates: Math.random() > 0.2,
        twoFactorEnabled: Math.random() > 0.9, // Few enable 2FA
        securityQuestion: Math.random() > 0.5 ? getRandomElement(['What was your first pet\'s name?', 'What city were you born in?', 'What was your mother\'s maiden name?', 'What was your first car?']) : null,
        securityAnswer: Math.random() > 0.5 ? getRandomElement(['Fluffy', 'Buddy', 'Max', 'Boston', 'Chicago', 'Miami', 'Smith', 'Johnson', 'Williams', 'Honda', 'Toyota', 'Ford']) : null,
      }
    });
    users.push(user);
  }

  // Create 5 clerks with full profiles
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
        smsNotifications: false,
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: Math.random() > 0.7, // Some staff enable 2FA
        securityQuestion: getRandomElement(['What was your first pet\'s name?', 'What city were you born in?', 'What was your mother\'s maiden name?', 'What was your first car?']),
        securityAnswer: getRandomElement(['Office Cat', 'Work Dog', 'City Hall', 'New York', 'Albany', 'Smith', 'Johnson', 'Williams', 'Honda', 'Toyota', 'Ford']),
      }
    });
    users.push(user);
  }

  // Create 3 supervisors with full profiles
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
        smsNotifications: false,
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: Math.random() > 0.6, // Supervisors more likely to enable 2FA
        securityQuestion: getRandomElement(['What was your first pet\'s name?', 'What city were you born in?', 'What was your mother\'s maiden name?', 'What was your first car?']),
        securityAnswer: getRandomElement(['Rex', 'Bella', 'Max', 'Brooklyn', 'Queens', 'Manhattan', 'Brown', 'Davis', 'Miller', 'Civic', 'Accord', 'Camry']),
      }
    });
    users.push(user);
  }

  // Create 3 field agents with full profiles
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
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: Math.random() > 0.8, // Field agents less likely to enable 2FA
        securityQuestion: getRandomElement(['What was your first pet\'s name?', 'What city were you born in?', 'What was your mother\'s maiden name?', 'What was your first car?']),
        securityAnswer: getRandomElement(['Scout', 'Ranger', 'Field', 'Mobile', 'Service', 'Tech', 'Wilson', 'Garcia', 'Martinez', 'Truck', 'Van', 'Jeep']),
      }
    });
    users.push(user);
  }

  // Create 2 admins with full profiles
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
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: true, // Admins should have 2FA enabled
        securityQuestion: getRandomElement(['What was your first pet\'s name?', 'What city were you born in?', 'What was your mother\'s maiden name?', 'What was your first car?']),
        securityAnswer: getRandomElement(['Admin', 'System', 'Manager', 'Executive', 'Director', 'Chief', 'Administrator', 'Johnson', 'Williams', 'Executive', 'Official', 'Secure']),
      }
    });
    users.push(user);
  }

  // Create original demo accounts for compatibility with full profiles
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
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: false,
        securityQuestion: 'What was your first pet\'s name?',
        securityAnswer: 'Buddy',
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

  // Create 120 service requests with realistic data
  console.log('📋 Creating 120 service requests...');
  const requests = [];

  for (let i = 0; i < 120; i++) {
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
      ? getRandomElement(staffUsers) : null;
    
    const createdAt = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Random date within last 90 days
    const updatedAt = new Date(createdAt.getTime() + Math.random() * 30 * 24 * 60 * 60 * 1000); // Updated within 30 days of creation

    const request = await prisma.serviceRequest.create({
      data: {
        code: `REQ-2024-${(i + 1).toString().padStart(3, '0')}`,
        title: sampleTitles[i % sampleTitles.length],
        description: `This is a detailed description for ${sampleTitles[i % sampleTitles.length].toLowerCase()}. The issue has been reported and requires proper attention and resolution. Additional details about the location, severity, and impact are provided here to help with proper assessment and prioritization.`,
        category,
        priority,
        status,
        dateOfRequest: createdAt.toISOString(),
        
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
        }
      });
    }
  }

  // Create upvotes for requests to improve ranklist data
  console.log('👍 Creating upvotes...');
  const upvoteCount = Math.floor(requests.length * 0.6); // 60% of requests get upvotes
  for (let i = 0; i < upvoteCount; i++) {
    const request = requests[i];
    const upvoters = getRandomElements(citizens.filter(c => c.id !== request.createdBy), Math.floor(Math.random() * 8) + 1); // 1-8 upvotes per request
    
    for (const upvoter of upvoters) {
      try {
        await prisma.upvote.create({
          data: {
            requestId: request.id,
            userId: upvoter.id,
          }
        });
      } catch (error) {
        // Skip duplicate upvotes (user can only upvote once per request)
        continue;
      }
    }
  }

  console.log('✅ Comprehensive seeding completed successfully!');
  console.log(`📊 Created:`);
  console.log(`   🏢 ${departments.length} departments`);
  console.log(`   👥 ${users.length} users (${citizens.length} citizens, ${clerks.length} clerks, ${supervisors.length} supervisors, ${fieldAgents.length} field agents, ${users.filter(u => u.role === 'ADMIN').length} admins)`);
  console.log(`   📋 ${requests.length} service requests`);
  console.log(`   📎 ${attachmentCount} attachments`);
  console.log(`   💬 ${commentCount} comments`);
  console.log(`   📋 ${assignedRequests.length} assignments`);
  console.log(`   👍 Upvotes created for ${upvoteCount} requests`);
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
