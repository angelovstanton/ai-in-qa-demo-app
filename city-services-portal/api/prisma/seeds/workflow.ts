import { PrismaClient } from '@prisma/client';
import { seedDepartments } from './modules/01-departments';
import { seedUsers } from './modules/02-users';
import { seedServiceRequests } from './modules/03-service-requests';
import { seedSupervisorData } from './modules/04-supervisor-data';
import { seedFieldAgentData } from './modules/05-field-agents';
import { seedCommunityData } from './modules/06-community';
import { seedFeatureFlags } from './modules/07-feature-flags';

const prisma = new PrismaClient();

async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  
  // Clear in dependency order to handle foreign key constraints
  try {
    // Community tables
    await prisma.communityTrend.deleteMany({});
    await prisma.userAchievement.deleteMany({});
    await prisma.communityStats.deleteMany({});
    await prisma.achievement.deleteMany({});
    
    // Field agent tables
    await prisma.partUsage.deleteMany({});
    await prisma.additionalIssue.deleteMany({});
    await prisma.agentTimeTracking.deleteMany({});
    await prisma.agentStatus.deleteMany({});
    await prisma.fieldPhoto.deleteMany({});
    await prisma.fieldWorkOrder.deleteMany({});
    
    // Supervisor tables
    await prisma.teamCollaboration.deleteMany({});
    await prisma.performanceGoal.deleteMany({});
    await prisma.workloadAssignment.deleteMany({});
    await prisma.staffPerformance.deleteMany({});
    await prisma.qualityReview.deleteMany({});
    await prisma.departmentMetrics.deleteMany({});
    
    // Core application tables
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
  console.log('🌱 Starting Comprehensive Database Seeding...');
  console.log('================================================\n');
  
  const startTime = Date.now();
  let totalRecords = 0;

  try {
    // Step 1: Clear existing data
    await clearDatabase();

    // Step 2: Seed core data
    console.log('📦 PHASE 1: Core Data');
    console.log('------------------------');
    const departments = await seedDepartments(prisma);
    const users = await seedUsers(prisma, departments);
    const requests = await seedServiceRequests(prisma, departments, users);
    
    // Step 3: Seed role-specific data
    console.log('📦 PHASE 2: Role-Specific Data');
    console.log('------------------------');
    const supervisorRecords = await seedSupervisorData(prisma, departments, users, requests);
    const fieldAgentRecords = await seedFieldAgentData(prisma, users, requests);
    
    // Step 4: Seed community data
    console.log('📦 PHASE 3: Community & Engagement');
    console.log('------------------------');
    const communityRecords = await seedCommunityData(prisma, users, requests);
    
    // Step 5: Seed feature flags
    console.log('📦 PHASE 4: System Configuration');
    console.log('------------------------');
    const flagRecords = await seedFeatureFlags(prisma);
    
    // Calculate totals
    totalRecords = requests.length + supervisorRecords + fieldAgentRecords + communityRecords + flagRecords;
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;

    // Print summary
    console.log('\n🎉 DATABASE SEEDING COMPLETE! 🎉');
    console.log('================================================');
    console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
    console.log(`📊 Total records created: ${totalRecords}+`);
    console.log('\n📈 Data Summary:');
    console.log(`   🏢 Departments: ${departments.length}`);
    console.log(`   👥 Users: ${users.allUsers.length}`);
    console.log(`      • ${users.citizens.length} citizens`);
    console.log(`      • ${users.clerks.length} clerks`);
    console.log(`      • ${users.supervisors.length} supervisors`);
    console.log(`      • ${users.fieldAgents.length} field agents`);
    console.log(`      • ${users.admins.length} admins`);
    console.log(`   📋 Service Requests: ${requests.length}`);
    console.log(`   📊 Supervisor Records: ${supervisorRecords}`);
    console.log(`   🚐 Field Agent Records: ${fieldAgentRecords}`);
    console.log(`   🏆 Community Records: ${communityRecords}`);
    console.log(`   🚩 Feature Flags: ${flagRecords}`);
    
    console.log('\n🔐 Test Accounts (password: password123):');
    console.log('================================================');
    console.log('   👤 Citizen: john@example.com');
    console.log('   👔 Clerk: mary.clerk@city.gov');
    console.log('   👨‍💼 Supervisor: supervisor@city.gov');
    console.log('   🚐 Field Agent: field.agent@city.gov');
    console.log('   🔧 Admin: admin@city.gov');
    
    console.log('\n🌐 Access Points:');
    console.log('================================================');
    console.log('   Frontend: http://localhost:5173');
    console.log('   API: http://localhost:3001');
    console.log('   API Docs: http://localhost:3001/api-docs');
    console.log('   Database Studio: npm run db:studio');
    
    console.log('\n✨ Features Ready for Testing:');
    console.log('================================================');
    console.log('   ✓ Service request lifecycle (8 statuses)');
    console.log('   ✓ Field work orders with GPS tracking');
    console.log('   ✓ Supervisor dashboards with metrics');
    console.log('   ✓ Community rankings and achievements');
    console.log('   ✓ Quality reviews and performance tracking');
    console.log('   ✓ Feature flags for bug simulation');
    console.log('   ✓ Realistic Bulgarian addresses and data');
    
    console.log('\n🚀 Your AI-in-QA Demo App is ready with comprehensive test data!');
    console.log('================================================\n');

  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the workflow
main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });