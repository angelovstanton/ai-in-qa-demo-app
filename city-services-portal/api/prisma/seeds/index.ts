import { PrismaClient } from '@prisma/client';
import { seedDepartments } from './departments';
import { seedUsers } from './users';
import { seedRequests } from './requests';
import { seedSupervisorData } from './supervisorData';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  // Clear in dependency order (supervisor tables first due to foreign keys)
  await prisma.teamCollaboration.deleteMany({});
  await prisma.performanceGoal.deleteMany({});
  await prisma.workloadAssignment.deleteMany({});
  await prisma.staffPerformance.deleteMany({});
  await prisma.qualityReview.deleteMany({});
  await prisma.departmentMetrics.deleteMany({});
  
  // Clear main application tables
  await prisma.upvote.deleteMany({});
  await prisma.eventLog.deleteMany({});
  await prisma.assignment.deleteMany({});
  await prisma.attachment.deleteMany({});
  await prisma.comment.deleteMany({});
  await prisma.serviceRequest.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.department.deleteMany({});
  await prisma.featureFlag.deleteMany({});
  
  console.log('   ✅ Database cleared successfully');
}

async function seedFeatureFlags() {
  console.log('🚩 Creating feature flags...');
  
  const featureFlags = [
    {
      key: 'API_Random500',
      value: JSON.stringify({
        enabled: false,
        description: 'Randomly return 500 errors for 5% of API requests',
        percentage: 5
      })
    },
    {
      key: 'UI_WrongDefaultSort',
      value: JSON.stringify({
        enabled: false,
        description: 'Use wrong default sorting in data grids',
        sortField: 'id',
        sortOrder: 'desc'
      })
    },
    {
      key: 'API_SlowRequests',
      value: JSON.stringify({
        enabled: false,
        description: 'Add artificial delay to 10% of API requests',
        percentage: 10,
        delayMs: 3000
      })
    },
    {
      key: 'API_UploadIntermittentFail',
      value: JSON.stringify({
        enabled: false,
        description: 'Cause file uploads to fail intermittently',
        failureRate: 30
      })
    },
    {
      key: 'UI_IncorrectValidation',
      value: JSON.stringify({
        enabled: false,
        description: 'Show incorrect validation messages on forms',
        fields: ['email', 'phone', 'description']
      })
    },
    {
      key: 'API_DataInconsistency',
      value: JSON.stringify({
        enabled: false,
        description: 'Return inconsistent data between related endpoints',
        endpoints: ['/api/v1/requests', '/api/v1/supervisor/dashboard']
      })
    },
    {
      key: 'UI_MissingTranslations',
      value: JSON.stringify({
        enabled: false,
        description: 'Show translation keys instead of translated text',
        percentage: 15
      })
    },
    {
      key: 'API_AuthorizationBypass',
      value: JSON.stringify({
        enabled: false,
        description: 'Occasionally bypass role-based authorization checks',
        bypassRate: 5
      })
    },
    {
      key: 'SUPERVISOR_MetricsDelay',
      value: JSON.stringify({
        enabled: false,
        description: 'Add delay to supervisor metrics calculations',
        delayMs: 2000
      })
    },
    {
      key: 'SUPERVISOR_WrongChartData',
      value: JSON.stringify({
        enabled: false,
        description: 'Return incorrect data for dashboard charts',
        affectedCharts: ['trends', 'performance']
      })
    }
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { value: flag.value },
      create: flag
    });
  }

  console.log(`   ✅ Created ${featureFlags.length} feature flags`);
}

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');
  
  const startTime = Date.now();

  try {
    // Clear existing data
    await clearDatabase();

    // Seed core data
    const departments = await seedDepartments(prisma);
    const users = await seedUsers(prisma, departments);
    const requests = await seedRequests(prisma, departments, users);
    
    // Seed feature flags
    await seedFeatureFlags();
    
    // Seed massive supervisor data
    const supervisorRecordCount = await seedSupervisorData(prisma, departments, users, requests);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    console.log('\n🎉 DATABASE SEEDING COMPLETE! 🎉');
    console.log('================================================');
    console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
    console.log(`🏢 Departments: ${departments.length}`);
    console.log(`👥 Users: ${users.allUsers.length} (${users.citizens.length} citizens, ${users.clerks.length} clerks, ${users.supervisors.length} supervisors, ${users.fieldAgents.length} field agents)`);
    console.log(`📋 Service Requests: ${requests.length}`);
    console.log(`📊 Supervisor Records: ${supervisorRecordCount}`);
    console.log('================================================');
    console.log('🚀 Your AI-in-QA Demo App is now ready with realistic data!');
    console.log('\n📝 Test Accounts (password: password123):');
    console.log('   👤 Citizen: john@example.com');
    console.log('   👔 Clerk: mary.clerk@city.gov');
    console.log('   👨‍💼 Supervisor: supervisor@city.gov');
    console.log('   🚐 Field Agent: field.agent@city.gov');
    console.log('   🔧 Admin: admin@city.gov');
    console.log('\n🌐 Access your application at: http://localhost:5173');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
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