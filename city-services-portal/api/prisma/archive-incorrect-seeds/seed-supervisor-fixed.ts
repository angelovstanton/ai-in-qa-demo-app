import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function seedSupervisorData() {
  console.log('👨‍💼 Creating comprehensive supervisor data...');
  
  try {
    // Get all supervisors and their departments
    const supervisors = await prisma.user.findMany({
      where: { role: 'SUPERVISOR' },
      include: { department: true }
    });
    
    console.log(`   Found ${supervisors.length} supervisors`);
    
    // Get all staff members (clerks and field agents)
    const staffUsers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'CLERK' },
          { role: 'FIELD_AGENT' }
        ]
      },
      include: { department: true }
    });
    
    console.log(`   Found ${staffUsers.length} staff members`);
    
    // Get all departments
    const departments = await prisma.department.findMany();
    
    // Get all requests for quality reviews
    const requests = await prisma.serviceRequest.findMany({
      include: {
        department: true
      }
    });
    
    // 1. DEPARTMENT METRICS - Create metrics for each department
    console.log('   📈 Creating department metrics...');
    const departmentMetricsData = [];
    
    const metricTypes = ['avgResolutionTime', 'slaCompliance', 'firstCallResolution', 'citizenSatisfaction', 'requestVolume'];
    const periods = ['daily', 'weekly', 'monthly'];
    
    for (const department of departments) {
      for (const metricType of metricTypes) {
        for (const period of periods) {
          // Create last 5 periods of each type
          for (let i = 0; i < 5; i++) {
            const baseDate = new Date();
            let periodStart = new Date(baseDate);
            let periodEnd = new Date(baseDate);
            
            // Calculate period dates
            switch (period) {
              case 'daily':
                periodStart.setDate(baseDate.getDate() - i);
                periodEnd.setDate(baseDate.getDate() - i);
                break;
              case 'weekly':
                periodStart.setDate(baseDate.getDate() - (i * 7));
                periodEnd.setDate(baseDate.getDate() - (i * 7) + 6);
                break;
              case 'monthly':
                periodStart.setMonth(baseDate.getMonth() - i);
                periodEnd.setMonth(baseDate.getMonth() - i + 1);
                break;
            }
            
            // Generate realistic metric values
            let baseValue = 0;
            switch (metricType) {
              case 'avgResolutionTime':
                baseValue = 45 + Math.random() * 30;
                break;
              case 'slaCompliance':
                baseValue = 75 + Math.random() * 20;
                break;
              case 'firstCallResolution':
                baseValue = 60 + Math.random() * 30;
                break;
              case 'citizenSatisfaction':
                baseValue = 3.5 + Math.random() * 1.5;
                break;
              case 'requestVolume':
                baseValue = 20 + Math.random() * 80;
                break;
            }
            
            await prisma.departmentMetrics.create({
              data: {
                departmentId: department.id,
                metricType,
                value: Math.round(baseValue * 100) / 100,
                period,
                periodStart,
                periodEnd
              }
            });
          }
        }
      }
    }
    
    console.log(`   ✅ Created department metrics for ${departments.length} departments`);
    
    // 2. QUALITY REVIEWS - Create quality reviews for completed requests
    console.log('   ⭐ Creating quality reviews...');
    const completedRequests = requests.filter(r => 
      ['RESOLVED', 'CLOSED'].includes(r.status)
    );
    
    let reviewCount = 0;
    for (const request of completedRequests.slice(0, 50)) { // First 50 completed requests
      if (Math.random() > 0.5) { // 50% of resolved requests get reviewed
        const supervisorsInDept = supervisors.filter(s => 
          s.departmentId === request.departmentId
        );
        
        const reviewer = supervisorsInDept.length > 0 ? 
          getRandomElement(supervisorsInDept) : 
          supervisors[0];
        
        if (reviewer) {
          const baseQuality = 6 + Math.random() * 4; // 6-10 base score
          
          await prisma.qualityReview.create({
            data: {
              requestId: request.id,
              reviewerId: reviewer.id,
              qualityScore: Math.max(1, Math.min(10, Math.round(baseQuality * 10) / 10)),
              communicationScore: Math.max(1, Math.min(10, Math.round((baseQuality + (Math.random() - 0.5)) * 10) / 10)),
              technicalAccuracyScore: Math.max(1, Math.min(10, Math.round((baseQuality + (Math.random() - 0.5)) * 10) / 10)),
              timelinessScore: Math.max(1, Math.min(10, Math.round((baseQuality + (Math.random() - 0.5)) * 10) / 10)),
              citizenSatisfactionScore: Math.max(1, Math.min(10, Math.round((baseQuality + (Math.random() - 0.5)) * 10) / 10)),
              improvementSuggestions: Math.random() > 0.7 ? 
                getRandomElement(['Improve response time', 'Enhance communication', 'Better documentation', 'Follow-up procedures']) : 
                null,
              followUpRequired: Math.random() > 0.8,
              reviewStatus: 'COMPLETED'
            }
          });
          reviewCount++;
        }
      }
    }
    
    console.log(`   ✅ Created ${reviewCount} quality reviews`);
    
    // 3. STAFF PERFORMANCE - Create performance records for staff
    console.log('   👨‍💼 Creating staff performance records...');
    const performancePeriods = ['2024-Q4', '2024-Q3', '2024-Q2', '2024-Q1'];
    
    for (const user of staffUsers) {
      // Create performance data for last 2-4 quarters
      const numPeriods = Math.floor(Math.random() * 3) + 2;
      const selectedPeriods = performancePeriods.slice(0, numPeriods);
      
      for (const period of selectedPeriods) {
        const basePerformance = 0.7 + Math.random() * 0.3; // 0.7-1.0 base performance
        
        await prisma.staffPerformance.create({
          data: {
            userId: user.id,
            departmentId: user.departmentId!,
            performancePeriod: period,
            averageHandlingTime: Math.floor(60 + Math.random() * 120), // 60-180 minutes
            completedRequests: Math.floor(5 + Math.random() * 20), // 5-25 requests
            qualityScore: Math.max(5, Math.min(10, 7 + Math.random() * 3)),
            citizenSatisfactionRating: Math.max(2, Math.min(5, 3.5 + Math.random() * 1.5)),
            overtimeHours: Math.max(0, Math.random() * 20), // 0-20 hours
            productivityScore: Math.max(60, Math.min(100, 80 + Math.random() * 20)),
            goalsAchieved: Math.floor(Math.random() * 5), // 0-4 goals
            goalsMissed: Math.floor(Math.random() * 2), // 0-1 goals
            trainingHoursCompleted: Math.floor(Math.random() * 20) // 0-20 hours
          }
        });
      }
    }
    
    console.log(`   ✅ Created performance records for ${staffUsers.length} staff members`);
    
    // 4. WORKLOAD ASSIGNMENTS - Create workload assignments
    console.log('   ⚖️ Creating workload assignments...');
    const assignedRequests = requests.filter(r => r.assignedTo).slice(0, 50); // First 50 assigned requests
    
    for (const request of assignedRequests) {
      const supervisorsInDept = supervisors.filter(s => 
        s.departmentId === request.departmentId
      );
      
      if (supervisorsInDept.length > 0) {
        const supervisor = getRandomElement(supervisorsInDept);
        
        await prisma.workloadAssignment.create({
          data: {
            requestId: request.id,
            assignedTo: request.assignedTo!,
            assignedBy: supervisor.id,
            assignmentReason: getRandomElement([
              'Skill match for category',
              'Workload balancing',
              'Geographic proximity',
              'Previous experience',
              'Availability'
            ]),
            workloadScore: Math.random() * 100,
            estimatedEffort: Math.floor(1 + Math.random() * 8), // 1-8 hours
            skillsRequired: JSON.stringify(['customer_service', 'technical_troubleshooting']),
            priorityWeight: Math.random() * 100,
            isActive: ['IN_PROGRESS', 'TRIAGED'].includes(request.status),
            completedAt: ['RESOLVED', 'CLOSED'].includes(request.status) ? request.updatedAt : null
          }
        });
      }
    }
    
    console.log(`   ✅ Created workload assignments`);
    
    // 5. PERFORMANCE GOALS - Create performance goals
    console.log('   🎯 Creating performance goals...');
    for (const supervisor of supervisors) {
      const deptStaff = staffUsers.filter(s => 
        s.departmentId === supervisor.departmentId && s.id !== supervisor.id
      );
      
      for (const staff of deptStaff.slice(0, 3)) { // First 3 staff per supervisor
        const goalTypes = [
          { title: 'Improve Resolution Time', description: 'Reduce average resolution time', unit: 'hours', targetValue: 24 },
          { title: 'Increase Customer Satisfaction', description: 'Achieve higher ratings', unit: 'rating', targetValue: 4.5 },
          { title: 'Complete Training Hours', description: 'Professional development', unit: 'hours', targetValue: 20 }
        ];
        
        const goal = getRandomElement(goalTypes);
        const dueDate = new Date();
        dueDate.setMonth(dueDate.getMonth() + 3); // Due in 3 months
        
        await prisma.performanceGoal.create({
          data: {
            userId: staff.id,
            supervisorId: supervisor.id,
            title: goal.title,
            description: goal.description,
            targetValue: goal.targetValue,
            currentValue: goal.targetValue * (0.3 + Math.random() * 0.4), // 30-70% progress
            unit: goal.unit,
            dueDate: dueDate,
            status: 'ACTIVE',
            priority: getRandomElement(['LOW', 'MEDIUM', 'HIGH'])
          }
        });
      }
    }
    
    console.log(`   ✅ Created performance goals`);
    
    // 6. TEAM COLLABORATIONS - Create team collaboration records
    console.log('   🤝 Creating team collaborations...');
    for (const department of departments) {
      const deptSupervisors = supervisors.filter(s => s.departmentId === department.id);
      const deptStaff = staffUsers.filter(s => s.departmentId === department.id);
      
      if (deptSupervisors.length > 0 && deptStaff.length >= 2) {
        const creator = deptSupervisors[0];
        const participants = deptStaff.slice(0, 5).map(s => s.id); // First 5 staff
        
        await prisma.teamCollaboration.create({
          data: {
            departmentId: department.id,
            collaborationType: 'STANDUP',
            title: 'Daily Team Standup',
            description: 'Daily synchronization meeting',
            participants: JSON.stringify(participants),
            scheduledAt: new Date(),
            createdBy: creator.id
          }
        });
      }
    }
    
    console.log(`   ✅ Created team collaborations`);
    
    console.log('✅ Supervisor data creation complete!');
    
  } catch (error) {
    console.error('Error creating supervisor data:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedSupervisorData()
    .then(() => {
      console.log('📊 Supervisor data seeding completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed to seed supervisor data:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}