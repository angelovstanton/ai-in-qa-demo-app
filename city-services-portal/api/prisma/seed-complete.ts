import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

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
  
  console.log('   ✅ Database cleared successfully');
}

async function main() {
  console.log('🌱 Starting COMPLETE Database Seeding...\n');
  const startTime = Date.now();
  
  try {
    // Clear existing data
    await clearDatabase();
    
    // ========================================
    // PHASE 1: Core Data
    // ========================================
    console.log('\n📦 PHASE 1: Core Data');
    console.log('------------------------');
    
    // 1. Create Departments
    console.log('🏢 Creating departments...');
    const departments = await Promise.all([
      'Roads and Infrastructure',
      'Water and Utilities', 
      'Parks and Recreation',
      'Public Safety',
      'Waste Management'
    ].map(name => 
      prisma.department.create({
        data: {
          name,
          slug: name.toLowerCase().replace(/\s+/g, '-')
        }
      })
    ));
    console.log(`   ✅ Created ${departments.length} departments`);
    
    // 2. Create Users
    console.log('\n👥 Creating users...');
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = {
      citizens: [] as any[],
      clerks: [] as any[],
      supervisors: [] as any[],
      fieldAgents: [] as any[],
      admins: [] as any[]
    };
    
    // Demo accounts
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
    
    // Create additional users
    for (let i = 0; i < 50; i++) {
      const user = await prisma.user.create({
        data: {
          email: `citizen${i + 1}@example.com`,
          name: `Citizen ${i + 1}`,
          role: 'CITIZEN',
          passwordHash,
          isActive: true,
          emailConfirmed: Math.random() > 0.2
        }
      });
      users.citizens.push(user);
    }
    
    // Create staff for each department
    for (const dept of departments) {
      // Clerks
      for (let i = 0; i < 5; i++) {
        const user = await prisma.user.create({
          data: {
            email: `clerk${dept.slug}${i + 1}@city.gov`,
            name: `${dept.name} Clerk ${i + 1}`,
            role: 'CLERK',
            departmentId: dept.id,
            passwordHash,
            isActive: true,
            emailConfirmed: true
          }
        });
        users.clerks.push(user);
      }
      
      // Supervisors
      for (let i = 0; i < 3; i++) {
        const user = await prisma.user.create({
          data: {
            email: `supervisor${dept.slug}${i + 1}@city.gov`,
            name: `${dept.name} Supervisor ${i + 1}`,
            role: 'SUPERVISOR',
            departmentId: dept.id,
            passwordHash,
            isActive: true,
            emailConfirmed: true
          }
        });
        users.supervisors.push(user);
      }
      
      // Field Agents
      for (let i = 0; i < 4; i++) {
        const user = await prisma.user.create({
          data: {
            email: `agent${dept.slug}${i + 1}@city.gov`,
            name: `${dept.name} Agent ${i + 1}`,
            role: 'FIELD_AGENT',
            departmentId: dept.id,
            passwordHash,
            isActive: true,
            emailConfirmed: true
          }
        });
        users.fieldAgents.push(user);
      }
    }
    
    const totalUsers = users.citizens.length + users.clerks.length + users.supervisors.length + users.fieldAgents.length + users.admins.length;
    console.log(`   ✅ Created ${totalUsers} users`);
    
    // 3. Create Service Requests
    console.log('\n📋 Creating service requests...');
    const requests = [];
    const statuses = ['SUBMITTED', 'IN_REVIEW', 'TRIAGED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
    
    for (let i = 0; i < 500; i++) {
      const dept = departments[Math.floor(Math.random() * departments.length)];
      const citizen = users.citizens[Math.floor(Math.random() * users.citizens.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 90));
      
      let assignedTo = null;
      if (['APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
        const deptStaff = [...users.clerks, ...users.fieldAgents].filter(u => u.departmentId === dept.id);
        if (deptStaff.length > 0) {
          assignedTo = deptStaff[Math.floor(Math.random() * deptStaff.length)].id;
        }
      }
      
      const request = await prisma.serviceRequest.create({
        data: {
          code: `SR-2024-${String(i + 1).padStart(5, '0')}`,
          title: ['Pothole repair', 'Street light out', 'Water leak', 'Tree trimming', 'Garbage collection'][Math.floor(Math.random() * 5)],
          description: 'Service request description - needs attention',
          category: dept.slug,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          status,
          departmentId: dept.id,
          createdBy: citizen.id,
          assignedTo,
          locationText: 'Main Street, Downtown',
          dateOfRequest: createdAt,
          createdAt,
          updatedAt: createdAt,
          closedAt: status === 'CLOSED' ? new Date() : null
        }
      });
      requests.push(request);
    }
    console.log(`   ✅ Created ${requests.length} service requests`);
    
    // Add comments, attachments, upvotes
    console.log('   Adding request details...');
    for (const request of requests.slice(0, 200)) {
      // Comments
      const numComments = Math.floor(Math.random() * 5);
      for (let i = 0; i < numComments; i++) {
        const commenter = [...users.citizens, ...users.clerks][Math.floor(Math.random() * (users.citizens.length + users.clerks.length))];
        await prisma.comment.create({
          data: {
            requestId: request.id,
            userId: commenter.id,
            content: 'This is a comment on the service request.',
            isInternal: commenter.role !== 'CITIZEN'
          }
        });
      }
      
      // Upvotes
      if (Math.random() > 0.5) {
        const numUpvotes = Math.floor(Math.random() * 10) + 1;
        const upvoters = new Set<string>();
        for (let i = 0; i < numUpvotes; i++) {
          const upvoter = users.citizens[Math.floor(Math.random() * users.citizens.length)];
          if (!upvoters.has(upvoter.id)) {
            upvoters.add(upvoter.id);
            await prisma.upvote.create({
              data: {
                requestId: request.id,
                userId: upvoter.id
              }
            });
          }
        }
      }
    }
    
    // ========================================
    // PHASE 2: Feature Flags
    // ========================================
    console.log('\n📦 PHASE 2: System Configuration');
    console.log('------------------------');
    console.log('🚩 Creating feature flags...');
    
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
    console.log(`   ✅ Created ${featureFlags.length} feature flags`);
    
    // ========================================
    // PHASE 3: Supervisor Data
    // ========================================
    console.log('\n📦 PHASE 3: Supervisor Data');
    console.log('------------------------');
    
    // Department Metrics
    console.log('📈 Creating department metrics...');
    let supervisorRecords = 0;
    const metricTypes = ['avgResolutionTime', 'slaCompliance', 'citizenSatisfaction', 'requestVolume', 'staffUtilization'];
    const periods = ['daily', 'weekly', 'monthly'];
    
    for (const dept of departments) {
      for (const metricType of metricTypes) {
        for (const period of periods) {
          const periodStart = new Date();
          const periodEnd = new Date();
          periodStart.setDate(periodStart.getDate() - 7);
          
          await prisma.departmentMetrics.create({
            data: {
              departmentId: dept.id,
              metricType,
              value: Math.random() * 100,
              period,
              periodStart,
              periodEnd
            }
          });
          supervisorRecords++;
        }
      }
    }
    
    // Quality Reviews
    console.log('⭐ Creating quality reviews...');
    const completedRequests = requests.filter(r => ['RESOLVED', 'CLOSED'].includes(r.status));
    for (const request of completedRequests.slice(0, 50)) {
      if (!request.assignedTo) continue;
      const supervisor = users.supervisors.find(s => s.departmentId === request.departmentId);
      if (!supervisor) continue;
      
      await prisma.qualityReview.create({
        data: {
          requestId: request.id,
          reviewerId: supervisor.id,
          reviewedStaffId: request.assignedTo,
          qualityScore: 5 + Math.random() * 5,
          communicationScore: 5 + Math.random() * 5,
          technicalAccuracyScore: 5 + Math.random() * 5,
          timelinessScore: 5 + Math.random() * 5,
          citizenSatisfactionScore: 5 + Math.random() * 5,
          reviewStatus: 'COMPLETED'
        }
      });
      supervisorRecords++;
    }
    
    console.log(`   ✅ Created ${supervisorRecords} supervisor records`);
    
    // ========================================
    // PHASE 4: Field Agent Data
    // ========================================
    console.log('\n📦 PHASE 4: Field Agent Data');
    console.log('------------------------');
    console.log('🚐 Creating field work orders...');
    
    let fieldRecords = 0;
    const fieldRequests = requests.filter(r => 
      ['APPROVED', 'IN_PROGRESS'].includes(r.status) &&
      ['pothole', 'leak', 'light', 'tree'].some(term => 
        r.title.toLowerCase().includes(term)
      )
    );
    
    for (const request of fieldRequests.slice(0, 30)) {
      const agent = users.fieldAgents[Math.floor(Math.random() * users.fieldAgents.length)];
      const supervisor = users.supervisors.find(s => s.departmentId === agent.departmentId) || users.supervisors[0];
      
      const workOrder = await prisma.fieldWorkOrder.create({
        data: {
          requestId: request.id,
          assignedAgentId: agent.id,
          supervisorId: supervisor.id,
          priority: request.priority,
          gpsLat: 42.6977 + (Math.random() - 0.5) * 0.1,
          gpsLng: 23.3219 + (Math.random() - 0.5) * 0.1,
          taskType: 'Inspection',
          estimatedDuration: 60,
          status: ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'][Math.floor(Math.random() * 5)],
          orderNumber: `WO-2024-${String(fieldRecords + 1).padStart(6, '0')}`,
          scheduledFor: new Date()
        }
      });
      fieldRecords++;
      
      // Add field photos for some work orders
      if (Math.random() > 0.5) {
        await prisma.fieldPhoto.create({
          data: {
            workOrderId: workOrder.id,
            photoUrl: '/images/field/work-photo.jpg',
            photoType: 'BEFORE',
            caption: 'Before work started',
            takenBy: agent.id,
            takenAt: new Date()
          }
        });
        fieldRecords++;
      }
    }
    
    // Agent Status
    console.log('👤 Creating agent status records...');
    for (const agent of users.fieldAgents) {
      await prisma.agentStatus.create({
        data: {
          agentId: agent.id,
          status: 'AVAILABLE',
          lastKnownLat: 42.6977 + (Math.random() - 0.5) * 0.1,
          lastKnownLng: 23.3219 + (Math.random() - 0.5) * 0.1,
          lastUpdateTime: new Date(),
          batteryLevel: 50 + Math.floor(Math.random() * 50),
          isOnline: true
        }
      });
      fieldRecords++;
    }
    
    console.log(`   ✅ Created ${fieldRecords} field agent records`);
    
    // ========================================
    // PHASE 5: Community Data
    // ========================================
    console.log('\n📦 PHASE 5: Community Data');
    console.log('------------------------');
    console.log('🏆 Creating achievements...');
    
    const achievements = [
      { name: 'First Report', description: 'Submit your first request', icon: '🎯', category: 'contribution', tier: 'bronze', points: 10, requirement: '{}', isActive: true },
      { name: 'Active Reporter', description: 'Submit 5 requests', icon: '📝', category: 'contribution', tier: 'silver', points: 25, requirement: '{}', isActive: true },
      { name: 'Community Guardian', description: 'Submit 20 requests', icon: '🛡️', category: 'contribution', tier: 'gold', points: 100, requirement: '{}', isActive: true },
      { name: 'Problem Solver', description: 'Have 10 requests resolved', icon: '✅', category: 'quality', tier: 'silver', points: 30, requirement: '{}', isActive: true }
    ];
    
    for (const achievement of achievements) {
      await prisma.achievement.upsert({
        where: { name: achievement.name },
        update: achievement,
        create: achievement
      });
    }
    
    console.log('📊 Creating community stats...');
    let communityRecords = achievements.length;
    const topCitizens = users.citizens.slice(0, 20);
    
    for (const user of topCitizens) {
      for (const period of ['daily', 'weekly', 'monthly', 'all-time']) {
        const periodStart = new Date();
        const periodEnd = new Date();
        
        if (period === 'daily') {
          periodStart.setDate(periodStart.getDate() - 1);
        } else if (period === 'weekly') {
          periodStart.setDate(periodStart.getDate() - 7);
        } else if (period === 'monthly') {
          periodStart.setMonth(periodStart.getMonth() - 1);
        } else {
          periodStart.setFullYear(2024, 0, 1);
        }
        
        const stats = {
          userId: user.id,
          period,
          periodStart,
          periodEnd,
          requestsSubmitted: Math.floor(Math.random() * 20),
          requestsApproved: Math.floor(Math.random() * 15),
          requestsResolved: Math.floor(Math.random() * 10),
          commentsPosted: Math.floor(Math.random() * 30),
          upvotesReceived: Math.floor(Math.random() * 50),
          upvotesGiven: Math.floor(Math.random() * 20),
          contributionScore: Math.random() * 500,
          engagementScore: Math.random() * 300,
          qualityScore: Math.random() * 200,
          overallScore: Math.random() * 1000
        };
        
        await prisma.communityStats.upsert({
          where: {
            userId_period_periodStart: {
              userId: user.id,
              period,
              periodStart
            }
          },
          update: stats,
          create: stats
        });
        communityRecords++;
      }
    }
    
    // Assign ranks
    for (const period of ['daily', 'weekly', 'monthly', 'all-time']) {
      const stats = await prisma.communityStats.findMany({
        where: { period },
        orderBy: { overallScore: 'desc' }
      });
      
      let rank = 1;
      for (const stat of stats) {
        await prisma.communityStats.update({
          where: { id: stat.id },
          data: { rank }
        });
        rank++;
      }
    }
    
    // Grant achievements
    console.log('🏅 Granting achievements...');
    const allAchievements = await prisma.achievement.findMany();
    for (const user of topCitizens.slice(0, 10)) {
      for (const achievement of allAchievements.slice(0, 2)) {
        await prisma.userAchievement.upsert({
          where: {
            userId_achievementId: {
              userId: user.id,
              achievementId: achievement.id
            }
          },
          update: { progress: 100 },
          create: {
            userId: user.id,
            achievementId: achievement.id,
            progress: 100
          }
        });
        communityRecords++;
      }
    }
    
    console.log(`   ✅ Created ${communityRecords} community records`);
    
    // ========================================
    // SUMMARY
    // ========================================
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n🎉 DATABASE SEEDING COMPLETE! 🎉');
    console.log('================================================');
    console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
    console.log(`🏢 Departments: ${departments.length}`);
    console.log(`👥 Users: ${totalUsers}`);
    console.log(`   • ${users.citizens.length} citizens`);
    console.log(`   • ${users.clerks.length} clerks`);
    console.log(`   • ${users.supervisors.length} supervisors`);
    console.log(`   • ${users.fieldAgents.length} field agents`);
    console.log(`   • ${users.admins.length} admins`);
    console.log(`📋 Service Requests: ${requests.length}`);
    console.log(`📊 Supervisor Records: ${supervisorRecords}`);
    console.log(`🚐 Field Agent Records: ${fieldRecords}`);
    console.log(`🏆 Community Records: ${communityRecords}`);
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