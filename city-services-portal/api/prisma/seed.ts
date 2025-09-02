import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { 
  getRandomBulgarianAddress, 
  getRandomServiceIssue, 
  getRandomBulgarianName,
  BULGARIAN_CITIES 
} from './seeds/bulgarian-data';

const prisma = new PrismaClient();

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
    await prisma.testingFeatureFlag.deleteMany({});
  } catch (error) {
    console.error('   ⚠️  Some tables might not exist yet, continuing...');
  }
  
  console.log('   ✅ Database cleared successfully');
}

async function main() {
  console.log('🇧🇬 Starting Bulgarian-Enhanced Database Seeding...\n');
  const startTime = Date.now();
  
  try {
    await clearDatabase();
    
    // 1. Create Departments
    console.log('🏢 Creating departments...');
    const departmentNames = [
      'Roads and Infrastructure',
      'Water and Utilities',
      'Parks and Recreation',
      'Public Safety',
      'Waste Management'
    ];
    
    const departments = await Promise.all(
      departmentNames.map(name => 
        prisma.department.create({
          data: {
            name,
            slug: name.toLowerCase().replace(/\s+/g, '-')
          }
        })
      )
    );
    console.log(`   ✅ Created ${departments.length} departments`);
    
    // 2. Create Users with Bulgarian names
    console.log('\n👥 Creating users with Bulgarian names...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const users: any = {
      citizens: [],
      clerks: [],
      supervisors: [],
      fieldAgents: [],
      admins: []
    };
    
    // Demo accounts - Main accounts plus all accounts from login dropdown
    const demoAccounts = [
      // Main demo accounts with complete profile information
      { 
        email: 'john@example.com', 
        name: 'John Doe', 
        role: 'CITIZEN',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+359888123456',
        alternatePhone: '+35929876543',
        streetAddress: '123 Alexander Nevsky Blvd',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        smsNotifications: false,
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: false
      },
      { 
        email: 'mary.clerk@city.gov', 
        name: 'Mary Johnson', 
        role: 'CLERK', 
        departmentId: departments[0].id,
        firstName: 'Mary',
        lastName: 'Johnson',
        phone: '+35921234567',
        alternatePhone: '+359888765432',
        streetAddress: '45 Vitosha Boulevard',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1463',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: false
      },
      { 
        email: 'supervisor@city.gov', 
        name: 'Tom Wilson', 
        role: 'SUPERVISOR', 
        departmentId: departments[0].id,
        firstName: 'Tom',
        lastName: 'Wilson',
        phone: '+35922345678',
        alternatePhone: '+359877234567',
        streetAddress: '78 Tsarigradsko Shose',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1784',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: true,
        securityQuestion: 'What was the name of your first pet?',
        securityAnswer: await bcrypt.hash('fluffy', 10)
      },
      { 
        email: 'field.agent@city.gov', 
        name: 'Bob Anderson', 
        role: 'FIELD_AGENT', 
        departmentId: departments[0].id,
        firstName: 'Bob',
        lastName: 'Anderson',
        phone: '+359888345678',
        alternatePhone: '+35928765432',
        streetAddress: '56 Bulgaria Boulevard',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1404',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'SMS',
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: false
      },
      { 
        email: 'admin@city.gov', 
        name: 'Admin User', 
        role: 'ADMIN',
        firstName: 'Admin',
        lastName: 'User',
        phone: '+35929998888',
        alternatePhone: '+359888999888',
        streetAddress: '1 Council Building NDK',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1421',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL',
        emailNotifications: true,
        smsNotifications: true,
        marketingEmails: false,
        serviceUpdates: true,
        twoFactorEnabled: true,
        securityQuestion: 'What is your favorite color?',
        securityAnswer: await bcrypt.hash('blue', 10)
      },
      
      // Additional Clerks from login dropdown with basic profile info
      { 
        email: 'victoria.clerk4@public-safety.gov', 
        name: 'Victoria Petrov', 
        role: 'CLERK', 
        departmentId: departments[3].id,
        firstName: 'Victoria',
        lastName: 'Petrov',
        phone: '+35924567890',
        city: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria'
      },
      { 
        email: 'margarita.clerk2@waste-management.gov', 
        name: 'Margarita Ivanov', 
        role: 'CLERK', 
        departmentId: departments[4].id,
        firstName: 'Margarita',
        lastName: 'Ivanov',
        phone: '+35925678901',
        city: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria'
      },
      { 
        email: 'kristina.clerk4@roads-and-infrastructure.gov', 
        name: 'Kristina Dimitrov', 
        role: 'CLERK', 
        departmentId: departments[0].id,
        firstName: 'Kristina',
        lastName: 'Dimitrov',
        phone: '+35926789012',
        city: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria'
      },
      { 
        email: 'georgi.clerk4@parks-and-recreation.gov', 
        name: 'Georgi Nikolov', 
        role: 'CLERK', 
        departmentId: departments[2].id,
        firstName: 'Georgi',
        lastName: 'Nikolov',
        phone: '+35927890123',
        city: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria'
      },
      { 
        email: 'stoyan.clerk3@water-and-utilities.gov', 
        name: 'Stoyan Georgiev', 
        role: 'CLERK', 
        departmentId: departments[1].id,
        firstName: 'Stoyan',
        lastName: 'Georgiev',
        phone: '+35928901234',
        city: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria'
      },
      
      // Additional Supervisors from login dropdown with profile info
      { 
        email: 'victoria.supervisor1@parks-and-recreation.gov', 
        name: 'Victoria Stoyanov', 
        role: 'SUPERVISOR', 
        departmentId: departments[2].id,
        firstName: 'Victoria',
        lastName: 'Stoyanov',
        phone: '+35923456789',
        streetAddress: '100 Graf Ignatiev Street',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL'
      },
      { 
        email: 'rumyana.supervisor1@water-and-utilities.gov', 
        name: 'Rumyana Petkov', 
        role: 'SUPERVISOR', 
        departmentId: departments[1].id,
        firstName: 'Rumyana',
        lastName: 'Petkov',
        phone: '+35924567890',
        streetAddress: '120 Patriarch Evtimiy Blvd',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL'
      },
      { 
        email: 'yana.supervisor1@public-safety.gov', 
        name: 'Yana Vasilev', 
        role: 'SUPERVISOR', 
        departmentId: departments[3].id,
        firstName: 'Yana',
        lastName: 'Vasilev',
        phone: '+35925678901',
        streetAddress: '140 Cherni Vrah Blvd',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1407',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL'
      },
      { 
        email: 'stoyan.supervisor0@water-and-utilities.gov', 
        name: 'Stoyan Todorov', 
        role: 'SUPERVISOR', 
        departmentId: departments[1].id,
        firstName: 'Stoyan',
        lastName: 'Todorov',
        phone: '+35926789012',
        streetAddress: '160 Rakovski Street',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL'
      },
      { 
        email: 'angel.supervisor2@roads-and-infrastructure.gov', 
        name: 'Angel Kolev', 
        role: 'SUPERVISOR', 
        departmentId: departments[0].id,
        firstName: 'Angel',
        lastName: 'Kolev',
        phone: '+35927890123',
        streetAddress: '180 Slivnitsa Blvd',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1309',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL'
      },
      
      // Additional Field Agents from login dropdown with profile info
      { 
        email: 'gabriela.agent3@water-and-utilities.gov', 
        name: 'Gabriela Angelov', 
        role: 'FIELD_AGENT', 
        departmentId: departments[1].id,
        firstName: 'Gabriela',
        lastName: 'Angelov',
        phone: '+359888456789',
        streetAddress: '200 Oborishte Street',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'SMS'
      },
      { 
        email: 'asen.agent1@parks-and-recreation.gov', 
        name: 'Asen Dimitrov', 
        role: 'FIELD_AGENT', 
        departmentId: departments[2].id,
        firstName: 'Asen',
        lastName: 'Dimitrov',
        phone: '+359888567890',
        streetAddress: '220 Knyaz Boris I Street',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'SMS'
      },
      { 
        email: 'polina.agent3@roads-and-infrastructure.gov', 
        name: 'Polina Ivanov', 
        role: 'FIELD_AGENT', 
        departmentId: departments[0].id,
        firstName: 'Polina',
        lastName: 'Ivanov',
        phone: '+359888678901',
        streetAddress: '240 Stamboliyski Blvd',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1309',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'SMS'
      },
      { 
        email: 'daniela.agent1@waste-management.gov', 
        name: 'Daniela Petrov', 
        role: 'FIELD_AGENT', 
        departmentId: departments[4].id,
        firstName: 'Daniela',
        lastName: 'Petrov',
        phone: '+359888789012',
        streetAddress: '260 Maria Luisa Blvd',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1202',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'SMS'
      },
      { 
        email: 'simona.agent3@public-safety.gov', 
        name: 'Simona Nikolov', 
        role: 'FIELD_AGENT', 
        departmentId: departments[3].id,
        firstName: 'Simona',
        lastName: 'Nikolov',
        phone: '+359888890123',
        streetAddress: '280 Dondukov Blvd',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'SMS'
      },
      
      // Additional Citizens from login dropdown with profile info
      { 
        email: 'margarita.aleksandrov8@example.com', 
        name: 'Margarita Aleksandrov', 
        role: 'CITIZEN',
        firstName: 'Margarita',
        lastName: 'Aleksandrov',
        phone: '+359878901234',
        streetAddress: '300 Alabin Street',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL'
      },
      { 
        email: 'simona.penchev44@example.com', 
        name: 'Simona Penchev', 
        role: 'CITIZEN',
        firstName: 'Simona',
        lastName: 'Penchev',
        phone: '+359879012345',
        streetAddress: '320 Solunska Street',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL'
      },
      { 
        email: 'lilyana.yankov43@example.com', 
        name: 'Lilyana Yankov', 
        role: 'CITIZEN',
        firstName: 'Lilyana',
        lastName: 'Yankov',
        phone: '+359879123456',
        streetAddress: '340 Tsar Ivan Shishman Street',
        city: 'Sofia',
        state: 'Sofia',
        postalCode: '1000',
        country: 'Bulgaria',
        preferredLanguage: 'en',
        communicationMethod: 'EMAIL'
      }
    ];
    
    for (const account of demoAccounts) {
      const { email, name, role, ...rest } = account;
      const user = await prisma.user.create({
        data: {
          email,
          name,
          role,
          ...rest,
          passwordHash,
          isActive: true,
          status: 'ACTIVE',
          emailConfirmed: true
        }
      });
      
      switch (user.role) {
        case 'CITIZEN': users.citizens.push(user); break;
        case 'CLERK': users.clerks.push(user); break;
        case 'SUPERVISOR': users.supervisors.push(user); break;
        case 'FIELD_AGENT': users.fieldAgents.push(user); break;
        case 'ADMIN': users.admins.push(user); break;
      }
    }
    
    // Create citizens with Bulgarian names and addresses
    for (let i = 0; i < 50; i++) {
      const name = getRandomBulgarianName();
      const address = getRandomBulgarianAddress();
      
      const user = await prisma.user.create({
        data: {
          email: `${name.firstName.toLowerCase()}.${name.lastName.toLowerCase()}${i}@example.com`,
          name: name.fullName,
          role: 'CITIZEN',
          passwordHash,
          isActive: true,
          status: 'ACTIVE',
          emailConfirmed: true,
          phone: `+359${Math.floor(Math.random() * 9) + 1}${Math.floor(Math.random() * 90000000) + 10000000}`,
          streetAddress: address.street,
          city: address.city,
          postalCode: String(Math.floor(Math.random() * 9000) + 1000)
        }
      });
      users.citizens.push(user);
    }
    
    // Create additional staff with Bulgarian names for each department
    // We'll avoid creating duplicates of the demo accounts above
    const existingEmails = new Set(demoAccounts.map(a => a.email));
    
    for (const dept of departments) {
      // Clerks - create additional ones not in demo accounts
      for (let i = 5; i < 10; i++) { // Start from 5 to avoid conflicts
        const name = getRandomBulgarianName();
        const email = `${name.firstName.toLowerCase()}.clerk${i}@${dept.slug}.gov`;
        if (!existingEmails.has(email)) {
          const user = await prisma.user.create({
            data: {
              email,
              name: name.fullName,
              role: 'CLERK',
              departmentId: dept.id,
              passwordHash,
              isActive: true,
              status: 'ACTIVE',
              emailConfirmed: true,
              phone: `+3592${Math.floor(Math.random() * 9000000) + 1000000}`
            }
          });
          users.clerks.push(user);
        }
      }
      
      // Supervisors - create additional ones not in demo accounts
      for (let i = 3; i < 6; i++) { // Start from 3 to avoid conflicts
        const name = getRandomBulgarianName();
        const email = `${name.firstName.toLowerCase()}.supervisor${i}@${dept.slug}.gov`;
        if (!existingEmails.has(email)) {
          const user = await prisma.user.create({
            data: {
              email,
              name: name.fullName,
              role: 'SUPERVISOR',
              departmentId: dept.id,
              passwordHash,
              isActive: true,
              status: 'ACTIVE',
              emailConfirmed: true,
              phone: `+3592${Math.floor(Math.random() * 9000000) + 1000000}`
            }
          });
          users.supervisors.push(user);
        }
      }
      
      // Field Agents - create additional ones not in demo accounts
      for (let i = 4; i < 8; i++) { // Start from 4 to avoid conflicts
        const name = getRandomBulgarianName();
        const email = `${name.firstName.toLowerCase()}.agent${i}@${dept.slug}.gov`;
        if (!existingEmails.has(email)) {
          const user = await prisma.user.create({
            data: {
              email,
              name: name.fullName,
              role: 'FIELD_AGENT',
              departmentId: dept.id,
              passwordHash,
              isActive: true,
              status: 'ACTIVE',
              emailConfirmed: true,
              phone: `+35988${Math.floor(Math.random() * 9000000) + 1000000}`
            }
          });
          users.fieldAgents.push(user);
        }
      }
    }
    
    const totalUsers = users.citizens.length + users.clerks.length + 
                      users.supervisors.length + users.fieldAgents.length + users.admins.length;
    console.log(`   ✅ Created ${totalUsers} users with Bulgarian names`);
    
    // 3. Create Service Requests with real Bulgarian locations and diverse issues
    console.log('\n📋 Creating service requests with Bulgarian locations...');
    const requests = [];
    const statuses = ['SUBMITTED', 'IN_REVIEW', 'TRIAGED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    
    for (let i = 0; i < 500; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const citizen = users.citizens[Math.floor(Math.random() * users.citizens.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const address = getRandomBulgarianAddress();
      const issue = getRandomServiceIssue(dept.name);
      
      // Vary creation dates over past 90 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90));
      
      // Assign to staff for certain statuses
      let assignedTo = null;
      if (['APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
        const deptStaff = [...users.clerks, ...users.fieldAgents].filter(u => u.departmentId === dept.id);
        if (deptStaff.length > 0) {
          assignedTo = deptStaff[Math.floor(Math.random() * deptStaff.length)].id;
        }
      }
      
      // Make title unique by adding location context
      const uniqueTitle = `${issue.title} at ${address.street}`;
      const uniqueDescription = `${issue.description} Location: ${address.fullAddress}. Reported on ${createdAt.toLocaleDateString()}.`;
      
      const request = await prisma.serviceRequest.create({
        data: {
          code: `SR-2024-${String(i + 1).padStart(5, '0')}`,
          title: uniqueTitle,
          description: uniqueDescription,
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
      
      // Progress indicator
      if ((i + 1) % 100 === 0) {
        console.log(`   ✓ Created ${i + 1} requests...`);
      }
    }
    console.log(`   ✅ Created ${requests.length} service requests with Bulgarian locations`);
    
    // Add realistic comments
    console.log('   Adding realistic comments...');
    const comments = [
      'Thank you for reporting this issue. Our team will investigate.',
      'This has been a recurring problem in this area. We appreciate your patience.',
      'Our field team has been dispatched to assess the situation.',
      'Work is scheduled to begin next week, weather permitting.',
      'The issue has been temporarily resolved. Permanent fix coming soon.',
      'Could you please provide additional photos of the problem area?',
      'Similar issues reported nearby. We are coordinating a comprehensive solution.',
      'Update: Materials have been ordered for the repair.',
      'Work completed successfully. Please confirm if the issue is resolved.',
      'Due to high volume of requests, there may be delays. Thank you for understanding.'
    ];
    
    for (const request of requests.slice(0, 200)) {
      const numComments = Math.floor(Math.random() * 4);
      for (let i = 0; i < numComments; i++) {
        const commenter = Math.random() > 0.5 ? 
          users.citizens[Math.floor(Math.random() * users.citizens.length)] :
          users.clerks[Math.floor(Math.random() * users.clerks.length)];
        
        await prisma.comment.create({
          data: {
            requestId: request.id,
            authorId: commenter.id,
            body: comments[Math.floor(Math.random() * comments.length)],
            visibility: commenter.role !== 'CITIZEN' ? 'INTERNAL' : 'PUBLIC'
          }
        });
      }
    }
    
    // Add upvotes for popular issues
    for (const request of requests.slice(0, 100)) {
      if (Math.random() > 0.5) {
        const numUpvotes = Math.floor(Math.random() * 15) + 1;
        const upvoters = new Set<string>();
        
        for (let i = 0; i < numUpvotes; i++) {
          const upvoter = users.citizens[Math.floor(Math.random() * users.citizens.length)];
          if (!upvoters.has(upvoter.id)) {
            upvoters.add(upvoter.id);
            await prisma.upvote.create({
              data: {
                userId: upvoter.id,
                requestId: request.id
              }
            });
          }
        }
      }
    }
    
    // 4. Add Feature Flags
    console.log('\n🚩 Creating feature flags...');
    const featureFlags = [
      { key: 'API_Random500', value: JSON.stringify({ enabled: false, description: 'Randomly return 500 errors', percentage: 5 }) },
      { key: 'UI_WrongDefaultSort', value: JSON.stringify({ enabled: false, description: 'Wrong default sorting' }) },
      { key: 'API_SlowRequests', value: JSON.stringify({ enabled: false, description: 'Add artificial delay', percentage: 10, delayMs: 3000 }) },
      { key: 'API_UploadIntermittentFail', value: JSON.stringify({ enabled: false, description: 'File upload failures', failureRate: 30 }) }
    ];
    
    for (const flag of featureFlags) {
      await prisma.featureFlag.upsert({
        where: { key: flag.key },
        update: { value: flag.value },
        create: flag
      });
    }
    
    // Import and run field agent seeding with Bulgarian coordinates
    console.log('\n🚐 Creating field agent work orders...');
    const { seedFieldAgentData } = require('./field-agent-seed');
    await seedFieldAgentData();
    
    // Import and run supervisor data seeding
    console.log('\n📊 Creating supervisor data...');
    const { seedSupervisorData } = require('./seeds/supervisorData');
    await seedSupervisorData(
      prisma, 
      departments, 
      { 
        supervisors: users.supervisors, 
        staffUsers: [...users.clerks, ...users.fieldAgents] 
      },
      requests
    );
    
    // Import and run community data seeding (rankings, achievements, stats)
    console.log('\n🏆 Seeding Community Data...');
    const { seedCommunityData } = require('./seeds/modules/06-community');
    await seedCommunityData(prisma, users, requests);
    
    // Import and seed testing feature flags
    console.log('\n🔬 Seeding Testing Feature Flags...');
    const { seedTestingFeatureFlags } = require('./seeds/testingFeatureFlags');
    await seedTestingFeatureFlags();
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 BULGARIAN-ENHANCED SEEDING COMPLETE! 🎉');
    console.log('================================================');
    console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
    console.log(`🏢 Departments: ${departments.length}`);
    console.log(`👥 Users: ${totalUsers} (with Bulgarian names)`);
    console.log(`📋 Service Requests: ${requests.length} (with real Bulgarian locations)`);
    console.log(`🗺️  Locations: Sofia, Plovdiv, Varna, Burgas, Ruse`);
    console.log('================================================');
    console.log('\n🔐 Test Accounts (password: password123):');
    console.log('   👤 Citizen: john@example.com');
    console.log('   👔 Clerk: mary.clerk@city.gov');
    console.log('   👨‍💼 Supervisor: supervisor@city.gov');
    console.log('   🚐 Field Agent: field.agent@city.gov');
    console.log('   🔧 Admin: admin@city.gov');
    console.log('\n🌐 Access your application at: http://localhost:5173');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });