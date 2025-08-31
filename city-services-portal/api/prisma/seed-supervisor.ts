import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedSupervisorData() {
  console.log('👨‍💼 Creating supervisor-specific data...');
  
  try {
    // Get all supervisors and their departments
    const supervisors = await prisma.user.findMany({
      where: { role: 'SUPERVISOR' },
      include: { department: true }
    });
    
    console.log(`   Found ${supervisors.length} supervisors`);
    
    // Get all staff members (clerks and field agents)
    const staffMembers = await prisma.user.findMany({
      where: {
        OR: [
          { role: 'CLERK' },
          { role: 'FIELD_AGENT' }
        ]
      },
      include: { department: true }
    });
    
    console.log(`   Found ${staffMembers.length} staff members`);
    
    // Create department metrics for each department
    const departments = await prisma.department.findMany();
    
    for (const dept of departments) {
      const deptRequests = await prisma.serviceRequest.findMany({
        where: { departmentId: dept.id }
      });
      
      const resolved = deptRequests.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED').length;
      const pending = deptRequests.filter(r => ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS'].includes(r.status)).length;
      
      const slaRate = 65 + Math.random() * 30;
      const now = new Date();
      const periodStart = new Date(now.getFullYear(), now.getMonth(), 1); // First day of current month
      const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
      
      await prisma.departmentMetrics.create({
        data: {
          departmentId: dept.id,
          metricType: 'PERFORMANCE',
          value: slaRate, // SLA compliance rate
          period: 'MONTHLY',
          periodStart: periodStart,
          periodEnd: periodEnd
        }
      });
    }
    
    console.log(`   ✅ Created department metrics for ${departments.length} departments`);
    
    // Create quality reviews
    const requests = await prisma.serviceRequest.findMany({
      where: {
        status: {
          in: ['RESOLVED', 'CLOSED']
        }
      },
      take: 100
    });
    
    let reviewCount = 0;
    for (const request of requests) {
      if (Math.random() > 0.5) { // 50% of resolved requests get reviewed
        const supervisor = supervisors.find(s => s.departmentId === request.departmentId) || supervisors[0];
        
        const qualityScore = Math.floor(Math.random() * 40) + 60; // 60-100
        await prisma.qualityReview.create({
          data: {
            requestId: request.id,
            reviewerId: supervisor.id,
            qualityScore: qualityScore,
            rating: Math.floor(Math.random() * 5) + 1,
            responseTimeRating: Math.floor(Math.random() * 5) + 1,
            resolutionQuality: Math.floor(Math.random() * 5) + 1,
            communicationRating: Math.floor(Math.random() * 5) + 1,
            notes: 'Quality review completed. ' + 
                   ['Good work', 'Needs improvement', 'Excellent service', 'Met expectations'][Math.floor(Math.random() * 4)],
            followUpRequired: Math.random() > 0.7
          }
        });
        reviewCount++;
      }
    }
    
    console.log(`   ✅ Created ${reviewCount} quality reviews`);
    
    // Create staff performance metrics
    for (const staff of staffMembers) {
      const staffRequests = await prisma.serviceRequest.findMany({
        where: { assignedTo: staff.id }
      });
      
      const resolved = staffRequests.filter(r => r.status === 'RESOLVED' || r.status === 'CLOSED').length;
      
      await prisma.staffPerformance.create({
        data: {
          userId: staff.id,
          departmentId: staff.departmentId!,
          casesHandled: staffRequests.length,
          casesResolved: resolved,
          avgResponseTime: Math.floor(Math.random() * 24) + 1, // 1-25 hours
          avgResolutionTime: Math.floor(Math.random() * 72) + 12, // 12-84 hours
          customerRating: 3.0 + Math.random() * 2.0, // 3.0-5.0
          slaComplianceRate: 70 + Math.random() * 30, // 70-100%
          period: 'MONTHLY',
          date: new Date()
        }
      });
    }
    
    console.log(`   ✅ Created performance metrics for ${staffMembers.length} staff members`);
    
    // Create workload assignments
    for (const supervisor of supervisors) {
      const deptStaff = staffMembers.filter(s => s.departmentId === supervisor.departmentId);
      
      for (const staff of deptStaff) {
        await prisma.workloadAssignment.create({
          data: {
            assigneeId: staff.id,
            assignedById: supervisor.id,
            maxCases: 10 + Math.floor(Math.random() * 20), // 10-30 cases
            priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as any,
            skillSet: JSON.stringify(['Customer Service', 'Technical Support', 'Field Work']),
            isActive: true
          }
        });
      }
    }
    
    console.log(`   ✅ Created workload assignments`);
    
    // Create performance goals
    for (const dept of departments) {
      const supervisor = supervisors.find(s => s.departmentId === dept.id);
      if (supervisor) {
        await prisma.performanceGoal.create({
          data: {
            departmentId: dept.id,
            createdById: supervisor.id,
            title: `Q1 ${new Date().getFullYear()} Performance Goals`,
            description: 'Improve department efficiency and customer satisfaction',
            targetMetric: 'slaComplianceRate',
            targetValue: 90,
            currentValue: 75 + Math.random() * 15,
            deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            status: 'ACTIVE'
          }
        });
        
        await prisma.performanceGoal.create({
          data: {
            departmentId: dept.id,
            createdById: supervisor.id,
            title: 'Customer Satisfaction Improvement',
            description: 'Achieve 4.5+ star average rating',
            targetMetric: 'customerSatisfaction',
            targetValue: 4.5,
            currentValue: 3.5 + Math.random() * 1.0,
            deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
            status: 'ACTIVE'
          }
        });
      }
    }
    
    console.log(`   ✅ Created performance goals`);
    
    // Create team collaborations
    for (const supervisor of supervisors) {
      const deptStaff = staffMembers.filter(s => s.departmentId === supervisor.departmentId);
      
      if (deptStaff.length >= 2) {
        const requests = await prisma.serviceRequest.findMany({
          where: {
            departmentId: supervisor.departmentId,
            status: 'IN_PROGRESS'
          },
          take: 5
        });
        
        for (const request of requests) {
          await prisma.teamCollaboration.create({
            data: {
              requestId: request.id,
              leaderId: deptStaff[0].id,
              members: JSON.stringify(deptStaff.slice(1, 3).map(s => s.id)),
              notes: 'Team collaboration for complex issue resolution',
              status: 'ACTIVE'
            }
          });
        }
      }
    }
    
    console.log(`   ✅ Created team collaborations`);
    
    console.log('✅ Supervisor data creation complete!');
    
    // Return summary
    return {
      supervisors: supervisors.length,
      staffMembers: staffMembers.length,
      departmentMetrics: departments.length,
      qualityReviews: reviewCount,
      performanceMetrics: staffMembers.length,
      workloadAssignments: supervisors.length * 3, // approximate
      performanceGoals: departments.length * 2
    };
    
  } catch (error) {
    console.error('Error creating supervisor data:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedSupervisorData()
    .then((result) => {
      console.log('📊 Supervisor data summary:', result);
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