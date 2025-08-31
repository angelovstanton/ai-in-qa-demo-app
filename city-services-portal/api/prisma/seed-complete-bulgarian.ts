import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

// Real Bulgarian cities with actual coordinates
const BULGARIAN_CITIES = {
  Sofia: {
    lat: 42.6977,
    lng: 23.3219,
    districts: [
      { name: 'Center', streets: ['Vitosha Boulevard', 'Alexander Nevsky Square', 'Graf Ignatiev Street', 'Rakovski Street'] },
      { name: 'Lozenets', streets: ['Cherni Vrah Boulevard', 'Srebarna Street', 'Koziak Street', 'James Bourchier Boulevard'] },
      { name: 'Mladost', streets: ['Alexander Malinov Boulevard', 'Andrey Saharov Boulevard', 'Business Park Street'] },
      { name: 'Lyulin', streets: ['Europa Boulevard', 'Pancho Vladigerov Boulevard', 'Tsar Boris III Boulevard'] },
      { name: 'Studentski Grad', streets: ['8th December Street', 'Acad. Stefan Mladenov Street'] }
    ]
  },
  Plovdiv: {
    lat: 42.1354,
    lng: 24.7453,
    districts: [
      { name: 'Center', streets: ['Main Street', 'Tsar Boris III Obedinitel Boulevard', 'Ivan Vazov Street'] },
      { name: 'Karshiyaka', streets: ['Dunav Boulevard', 'Osvobozhdenie Boulevard', 'Nikola Vaptsarov Boulevard'] },
      { name: 'Trakia', streets: ['Trakiya Street', 'Osvobozhdenie Boulevard', 'Maritsa Boulevard'] }
    ]
  },
  Varna: {
    lat: 43.2141,
    lng: 27.9147,
    districts: [
      { name: 'Center', streets: ['Knyaz Boris I Boulevard', 'Slivnitsa Boulevard', 'Maria Luiza Boulevard'] },
      { name: 'Primorski', streets: ['Primorski Park Street', 'San Stefano Street', '8th Primorski Polk Boulevard'] }
    ]
  },
  Burgas: {
    lat: 42.5048,
    lng: 27.4626,
    districts: [
      { name: 'Center', streets: ['Alexandrovska Street', 'Bogoridi Boulevard', 'San Stefano Street'] },
      { name: 'Slaveykov', streets: ['Stefan Stambolov Boulevard', 'Demokratsia Boulevard'] }
    ]
  },
  Ruse: {
    lat: 43.8356,
    lng: 25.9657,
    districts: [
      { name: 'Center', streets: ['Alexandrovska Street', 'Pridunavski Boulevard', 'Tsar Osvoboditel Boulevard'] }
    ]
  }
};

// Bulgarian names
const BULGARIAN_NAMES = {
  first: [
    'Alexander', 'Maria', 'Ivan', 'Elena', 'Georgi', 'Anna', 'Dimitar', 'Sophia',
    'Nikolay', 'Victoria', 'Peter', 'Kristina', 'Stefan', 'Daniela', 'Martin',
    'Teodora', 'Boris', 'Milena', 'Hristo', 'Ralitsa', 'Vladimir', 'Desislava',
    'Plamen', 'Simona', 'Krasimir', 'Yana', 'Todor', 'Gabriela', 'Emil', 'Polina'
  ],
  last: [
    'Petrov', 'Ivanov', 'Georgiev', 'Dimitrov', 'Nikolov', 'Stefanov', 'Todorov',
    'Stoyanov', 'Mihaylov', 'Kolev', 'Marinov', 'Popov', 'Angelov', 'Hristov',
    'Atanasov', 'Iliev', 'Kostov', 'Vasilev', 'Petkov', 'Borisov', 'Yankov'
  ]
};

// Diverse service issues
const SERVICE_ISSUES = {
  'Roads and Infrastructure': [
    'Large pothole on main road causing vehicle damage',
    'Cracked sidewalk near school - trip hazard',
    'Missing stop sign at dangerous intersection',
    'Faded pedestrian crossing needs repainting',
    'Damaged guardrail on highway bridge',
    'Street flooding due to poor drainage',
    'Uneven road surface causing accidents',
    'Broken curb at bus stop',
    'Sinkhole developing on residential street',
    'Bridge expansion joint damaged',
    'Speed bump needed near school zone',
    'Road markings completely faded',
    'Streetlight pole knocked down',
    'Crosswalk signal not working',
    'Manhole cover missing',
    'Road surface cracking severely',
    'Sidewalk blocked by construction',
    'Bike lane needs repair',
    'Traffic calming measures needed',
    'Road sign vandalized'
  ],
  'Water and Utilities': [
    'Water main leak flooding street',
    'No water pressure in apartment building',
    'Sewage smell from storm drain',
    'Fire hydrant leaking continuously',
    'Brown water coming from taps',
    'Sewage backup in residential area',
    'Broken water meter needs replacement',
    'Gas smell detected near building',
    'Storm drain completely blocked',
    'Water supply interruption for days',
    'Burst pipe in public area',
    'Water quality concerns - strange taste',
    'Hydrant damaged by vehicle',
    'Sewer grate broken',
    'Water fountain not working',
    'Underground leak suspected',
    'Low water pressure entire neighborhood',
    'Water discoloration after repairs',
    'Meter reading incorrect',
    'Flooding from broken sprinkler'
  ],
  'Parks and Recreation': [
    'Broken playground swing dangerous',
    'Park grass overgrown - attracting pests',
    'Graffiti on historical monument',
    'Dead tree about to fall',
    'Park bench completely destroyed',
    'Playground slide has sharp edges',
    'Park fountain stopped working',
    'Walking path severely eroded',
    'Sports field fence broken',
    'Picnic area needs maintenance',
    'Basketball hoop damaged',
    'Tennis court surface cracked',
    'Park lighting all broken',
    'Trash bins overflowing daily',
    'Dog park fence damaged',
    'Exercise equipment broken',
    'Garden beds need replanting',
    'Pond algae overgrowth problem',
    'Pavilion roof leaking',
    'Trail bridge unsafe'
  ],
  'Public Safety': [
    'Street lights out entire block',
    'Traffic light stuck on red',
    'Emergency phone not working',
    'Dark alley needs lighting urgently',
    'Speed camera vandalized',
    'Security camera offline for weeks',
    'Missing street name signs',
    'Pedestrian bridge dark at night',
    'School crossing guard needed',
    'Speeding problem on residential street',
    'Abandoned vehicle blocking road',
    'Illegal parking blocking emergency route',
    'Noise complaint - construction at night',
    'Dangerous intersection needs signal',
    'Emergency exit blocked',
    'Fire lane obstructed',
    'Warning signs needed',
    'Surveillance needed in park',
    'Traffic control during events',
    'Safety barrier damaged'
  ],
  'Waste Management': [
    'Missed garbage collection two weeks',
    'Illegal dumping site growing',
    'Recycling bins constantly overflowing',
    'Public bin damaged and unusable',
    'Hazardous waste dumped illegally',
    'Dead animal removal needed',
    'Bulk item pickup request',
    'Medical waste found in park',
    'Oil spill in parking lot',
    'Composting bin request for building',
    'Dumpster fire hazard',
    'Construction waste abandoned',
    'Toxic material disposal needed',
    'Bins blocking sidewalk',
    'Wrong collection schedule',
    'Recycling contamination issues',
    'Commercial waste in residential bins',
    'Bin lids all broken',
    'Collection truck leaking fluids',
    'Special waste pickup needed'
  ]
};

function getRandomBulgarianAddress() {
  const cities = Object.keys(BULGARIAN_CITIES);
  const cityName = cities[Math.floor(Math.random() * cities.length)];
  const city = BULGARIAN_CITIES[cityName as keyof typeof BULGARIAN_CITIES];
  const district = city.districts[Math.floor(Math.random() * city.districts.length)];
  const street = district.streets[Math.floor(Math.random() * district.streets.length)];
  const streetNumber = Math.floor(Math.random() * 200) + 1;
  
  // Add variance to coordinates for unique locations
  const latVariance = (Math.random() - 0.5) * 0.02;
  const lngVariance = (Math.random() - 0.5) * 0.02;
  
  return {
    city: cityName,
    district: district.name,
    street: `${streetNumber} ${street}`,
    fullAddress: `${streetNumber} ${street}, ${district.name}, ${cityName}`,
    lat: city.lat + latVariance,
    lng: city.lng + lngVariance
  };
}

function getRandomBulgarianName() {
  const firstName = BULGARIAN_NAMES.first[Math.floor(Math.random() * BULGARIAN_NAMES.first.length)];
  const lastName = BULGARIAN_NAMES.last[Math.floor(Math.random() * BULGARIAN_NAMES.last.length)];
  return { firstName, lastName, fullName: `${firstName} ${lastName}` };
}

function getRandomServiceIssue(departmentName: string): string {
  const issues = SERVICE_ISSUES[departmentName as keyof typeof SERVICE_ISSUES];
  if (!issues) return 'General service request requiring attention';
  return issues[Math.floor(Math.random() * issues.length)];
}

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  try {
    // Clear in dependency order
    await prisma.communityTrend.deleteMany({});
    await prisma.userAchievement.deleteMany({});
    await prisma.communityStats.deleteMany({});
    await prisma.achievement.deleteMany({});
    await prisma.partUsage.deleteMany({});
    await prisma.additionalIssue.deleteMany({});
    await prisma.agentTimeTracking.deleteMany({});
    await prisma.agentStatus.deleteMany({});
    await prisma.fieldPhoto.deleteMany({});
    await prisma.fieldWorkOrder.deleteMany({});
    await prisma.teamCollaboration.deleteMany({});
    await prisma.performanceGoal.deleteMany({});
    await prisma.workloadAssignment.deleteMany({});
    await prisma.staffPerformance.deleteMany({});
    await prisma.qualityReview.deleteMany({});
    await prisma.departmentMetrics.deleteMany({});
    await prisma.upvote.deleteMany({});
    await prisma.eventLog.deleteMany({});
    await prisma.assignment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.serviceRequest.deleteMany({});
    await prisma.user.deleteMany({});
    await prisma.department.deleteMany({});
    await prisma.featureFlag.deleteMany({});
  } catch (error) {
    console.error('   ⚠️  Some tables might not exist yet, continuing...');
  }
  
  console.log('   ✅ Database cleared successfully\n');
}

async function main() {
  console.log('🇧🇬 Starting Bulgarian-Enhanced Database Seeding...');
  console.log('================================================\n');
  const startTime = Date.now();
  
  try {
    await clearDatabase();
    
    // 1. Departments
    console.log('🏢 Creating departments...');
    const departments = await Promise.all([
      'Roads and Infrastructure',
      'Water and Utilities',
      'Parks and Recreation',
      'Public Safety',
      'Waste Management'
    ].map(name => 
      prisma.department.create({
        data: { name, slug: name.toLowerCase().replace(/\s+/g, '-') }
      })
    ));
    console.log(`   ✅ Created ${departments.length} departments`);
    
    // 2. Users with Bulgarian names
    console.log('\n👥 Creating users with Bulgarian names...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const users: any = { citizens: [], clerks: [], supervisors: [], fieldAgents: [], admins: [] };
    
    // Demo accounts (keep for testing)
    const demoAccounts = [
      { email: 'john@example.com', name: 'John Doe', role: 'CITIZEN' },
      { email: 'mary.clerk@city.gov', name: 'Mary Johnson', role: 'CLERK', departmentId: departments[0].id },
      { email: 'supervisor@city.gov', name: 'Tom Wilson', role: 'SUPERVISOR', departmentId: departments[0].id },
      { email: 'field.agent@city.gov', name: 'Bob Anderson', role: 'FIELD_AGENT', departmentId: departments[0].id },
      { email: 'admin@city.gov', name: 'Admin User', role: 'ADMIN' }
    ];
    
    for (const account of demoAccounts) {
      const user = await prisma.user.create({
        data: { ...account, passwordHash, isActive: true, emailConfirmed: true }
      });
      
      switch (user.role) {
        case 'CITIZEN': users.citizens.push(user); break;
        case 'CLERK': users.clerks.push(user); break;
        case 'SUPERVISOR': users.supervisors.push(user); break;
        case 'FIELD_AGENT': users.fieldAgents.push(user); break;
        case 'ADMIN': users.admins.push(user); break;
      }
    }
    
    // Bulgarian citizens
    for (let i = 0; i < 50; i++) {
      const name = getRandomBulgarianName();
      const address = getRandomBulgarianAddress();
      const user = await prisma.user.create({
        data: {
          email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i}@gmail.com`,
          name: name.fullName,
          role: 'CITIZEN',
          passwordHash,
          isActive: true,
          emailConfirmed: Math.random() > 0.2,
          phone: `+359 8${Math.floor(Math.random() * 90000000) + 10000000}`,
          streetAddress: address.street,
          city: address.city,
          postalCode: `${Math.floor(Math.random() * 9000) + 1000}`
        }
      });
      users.citizens.push(user);
    }
    
    // Bulgarian staff for each department
    for (const dept of departments) {
      // Clerks
      for (let i = 0; i < 5; i++) {
        const name = getRandomBulgarianName();
        users.clerks.push(await prisma.user.create({
          data: {
            email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}@${dept.slug}.gov`,
            name: name.fullName,
            role: 'CLERK',
            departmentId: dept.id,
            passwordHash,
            isActive: true,
            emailConfirmed: true,
            phone: `+359 2 ${Math.floor(Math.random() * 9000000) + 1000000}`
          }
        }));
      }
      
      // Supervisors
      for (let i = 0; i < 3; i++) {
        const name = getRandomBulgarianName();
        users.supervisors.push(await prisma.user.create({
          data: {
            email: `${name.firstName.toLowerCase()}.supervisor@${dept.slug}.gov`,
            name: name.fullName,
            role: 'SUPERVISOR',
            departmentId: dept.id,
            passwordHash,
            isActive: true,
            emailConfirmed: true,
            phone: `+359 2 ${Math.floor(Math.random() * 9000000) + 1000000}`
          }
        }));
      }
      
      // Field Agents
      for (let i = 0; i < 4; i++) {
        const name = getRandomBulgarianName();
        users.fieldAgents.push(await prisma.user.create({
          data: {
            email: `${name.firstName.toLowerCase()}.agent@${dept.slug}.gov`,
            name: name.fullName,
            role: 'FIELD_AGENT',
            departmentId: dept.id,
            passwordHash,
            isActive: true,
            emailConfirmed: true,
            phone: `+359 88 ${Math.floor(Math.random() * 9000000) + 1000000}`
          }
        }));
      }
    }
    
    const totalUsers = users.citizens.length + users.clerks.length + 
                      users.supervisors.length + users.fieldAgents.length + users.admins.length;
    console.log(`   ✅ Created ${totalUsers} users with Bulgarian names`);
    
    // 3. Service Requests with Bulgarian locations
    console.log('\n📋 Creating service requests with Bulgarian locations...');
    const requests = [];
    const statuses = ['SUBMITTED', 'IN_REVIEW', 'TRIAGED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    
    for (let i = 0; i < 500; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const citizen = users.citizens[Math.floor(Math.random() * users.citizens.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const address = getRandomBulgarianAddress();
      const issueTitle = getRandomServiceIssue(dept.name);
      
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90));
      
      let assignedTo = null;
      if (['APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
        const deptStaff = [...users.clerks, ...users.fieldAgents].filter((u: any) => u.departmentId === dept.id);
        if (deptStaff.length > 0) {
          assignedTo = deptStaff[Math.floor(Math.random() * deptStaff.length)].id;
        }
      }
      
      const request = await prisma.serviceRequest.create({
        data: {
          code: `SR-2024-${String(i + 1).padStart(5, '0')}`,
          title: issueTitle,
          description: `${issueTitle}. Location: ${address.fullAddress}. This issue requires immediate attention from the ${dept.name} department.`,
          category: dept.slug,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          status,
          departmentId: dept.id,
          createdBy: citizen.id,
          assignedTo,
          locationText: address.fullAddress,
          streetAddress: address.street,
          city: address.city,
          lat: address.lat,
          lng: address.lng,
          email: citizen.email,
          phone: citizen.phone,
          dateOfRequest: createdAt,
          createdAt,
          updatedAt: createdAt,
          closedAt: status === 'CLOSED' ? new Date() : null
        }
      });
      requests.push(request);
      
      if ((i + 1) % 100 === 0) {
        console.log(`   ✓ Created ${i + 1} requests...`);
      }
    }
    console.log(`   ✅ Created ${requests.length} service requests with Bulgarian locations`);
    
    // 4. Comments
    console.log('   Adding comments...');
    for (const request of requests.slice(0, 200)) {
      const numComments = Math.floor(Math.random() * 3);
      for (let i = 0; i < numComments; i++) {
        const commenter = Math.random() > 0.5 ? 
          users.citizens[Math.floor(Math.random() * users.citizens.length)] :
          users.clerks[Math.floor(Math.random() * users.clerks.length)];
        
        await prisma.comment.create({
          data: {
            requestId: request.id,
            userId: commenter.id,
            body: 'Our team is investigating this issue and will provide an update soon.',
            isInternal: commenter.role !== 'CITIZEN',
            visibility: commenter.role !== 'CITIZEN' ? 'INTERNAL' : 'PUBLIC'
          }
        });
      }
    }
    
    // 5. Feature Flags
    console.log('\n🚩 Creating feature flags...');
    const flags = [
      { key: 'API_Random500', value: JSON.stringify({ enabled: false }) },
      { key: 'UI_WrongDefaultSort', value: JSON.stringify({ enabled: false }) },
      { key: 'API_SlowRequests', value: JSON.stringify({ enabled: false }) }
    ];
    
    for (const flag of flags) {
      await prisma.featureFlag.upsert({
        where: { key: flag.key },
        update: flag,
        create: flag
      });
    }
    
    const endTime = Date.now();
    console.log(`\n✅ Bulgarian seeding complete in ${((endTime - startTime) / 1000).toFixed(2)}s`);
    console.log(`   • ${totalUsers} users with Bulgarian names`);
    console.log(`   • ${requests.length} requests in Bulgarian cities`);
    console.log(`   • Locations: Sofia, Plovdiv, Varna, Burgas, Ruse`);
    
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run full seed with additional data
async function runFullSeed() {
  await main();
  
  console.log('\n📦 Adding supervisor and field agent data...');
  try {
    execSync('npx tsx prisma/field-agent-seed.ts', { stdio: 'inherit' });
    execSync('npx tsx prisma/seed-community.ts', { stdio: 'inherit' });
    console.log('\n🎉 ALL SEEDING COMPLETE!');
  } catch (error) {
    console.error('Error in additional seeds:', error);
  }
}

runFullSeed().catch(e => {
  console.error(e);
  process.exit(1);
});