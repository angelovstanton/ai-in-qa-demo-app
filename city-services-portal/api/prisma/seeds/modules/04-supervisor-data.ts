import { PrismaClient, Department, ServiceRequest } from '@prisma/client';
import { UsersSeedResult } from './02-users';

export async function seedSupervisorData(
  prisma: PrismaClient,
  departments: Department[],
  users: UsersSeedResult,
  requests: ServiceRequest[]
): Promise<number> {
  console.log('📊 Seeding Supervisor Data...');
  
  let totalRecords = 0;
  const { supervisors, clerks, fieldAgents } = users;
  
  // 1. Department Metrics - Create historical data for trends
  console.log('   Creating department metrics...');
  const metricTypes = ['avgResolutionTime', 'slaCompliance', 'citizenSatisfaction', 'requestVolume', 'staffUtilization'];
  const periods = ['daily', 'weekly', 'monthly'];
  
  for (const dept of departments) {
    for (const metricType of metricTypes) {
      for (const period of periods) {
        let numPeriods = 7; // Default for daily
        if (period === 'weekly') numPeriods = 12;
        if (period === 'monthly') numPeriods = 6;
        
        for (let i = 0; i < numPeriods; i++) {
          const periodStart = new Date();
          const periodEnd = new Date();
          
          if (period === 'daily') {
            periodStart.setDate(periodStart.getDate() - i - 1);
            periodEnd.setDate(periodEnd.getDate() - i);
          } else if (period === 'weekly') {
            periodStart.setDate(periodStart.getDate() - (i + 1) * 7);
            periodEnd.setDate(periodEnd.getDate() - i * 7);
          } else {
            periodStart.setMonth(periodStart.getMonth() - i - 1);
            periodEnd.setMonth(periodEnd.getMonth() - i);
          }
          
          let value = 0;
          switch (metricType) {
            case 'avgResolutionTime':
              value = 24 + Math.random() * 72; // 24-96 hours
              break;
            case 'slaCompliance':
              value = 70 + Math.random() * 30; // 70-100%
              break;
            case 'citizenSatisfaction':
              value = 3 + Math.random() * 2; // 3-5 rating
              break;
            case 'requestVolume':
              value = Math.floor(20 + Math.random() * 80); // 20-100 requests
              break;
            case 'staffUtilization':
              value = 60 + Math.random() * 40; // 60-100%
              break;
          }
          
          await prisma.departmentMetrics.create({
            data: {
              departmentId: dept.id,
              metricType,
              value,
              period,
              periodStart,
              periodEnd,
              calculatedAt: new Date()
            }
          });
          totalRecords++;
        }
      }
    }
  }
  
  // 2. Quality Reviews - Review completed requests
  console.log('   Creating quality reviews...');
  const completedRequests = requests.filter(r => ['RESOLVED', 'CLOSED'].includes(r.status));
  const reviewSample = completedRequests.slice(0, Math.min(100, completedRequests.length));
  
  for (const request of reviewSample) {
    if (!request.assignedTo) continue;
    
    const deptSupervisors = supervisors.filter(s => s.departmentId === request.departmentId);
    if (deptSupervisors.length === 0) continue;
    
    const reviewer = deptSupervisors[Math.floor(Math.random() * deptSupervisors.length)];
    
    await prisma.qualityReview.create({
      data: {
        requestId: request.id,
        reviewerId: reviewer.id,
        reviewedStaffId: request.assignedTo,
        qualityScore: 5 + Math.random() * 5, // 5-10 score
        communicationScore: 5 + Math.random() * 5,
        technicalAccuracyScore: 5 + Math.random() * 5,
        timelinessScore: 5 + Math.random() * 5,
        citizenSatisfactionScore: 5 + Math.random() * 5,
        improvementSuggestions: Math.random() > 0.7 ? 'Consider improving response time' : null,
        followUpRequired: Math.random() > 0.9,
        reviewStatus: 'COMPLETED',
        createdAt: request.closedAt || request.resolvedAt || new Date()
      }
    });
    totalRecords++;
  }
  
  // 3. Staff Performance Records
  console.log('   Creating staff performance records...');
  const allStaff = [...clerks, ...fieldAgents];
  const performancePeriods = ['2024-Q1', '2024-Q2', '2024-Q3', '2024-Q4'];
  
  for (const staff of allStaff) {
    for (const period of performancePeriods) {
      await prisma.staffPerformance.create({
        data: {
          userId: staff.id,
          departmentId: staff.departmentId!,
          performancePeriod: period,
          averageHandlingTime: 60 + Math.random() * 120, // 60-180 minutes
          completedRequests: Math.floor(5 + Math.random() * 25),
          qualityScore: 6 + Math.random() * 4, // 6-10
          citizenSatisfactionRating: 3 + Math.random() * 2, // 3-5
          overtimeHours: Math.random() * 20,
          productivityScore: 60 + Math.random() * 40, // 60-100
          goalsAchieved: Math.floor(Math.random() * 5),
          goalsMissed: Math.floor(Math.random() * 2),
          trainingHoursCompleted: Math.floor(Math.random() * 40)
        }
      });
      totalRecords++;
    }
  }
  
  // 4. Workload Assignments
  console.log('   Creating workload assignments...');
  const activeRequests = requests.filter(r => ['APPROVED', 'IN_PROGRESS'].includes(r.status));
  
  for (const request of activeRequests.slice(0, 50)) {
    if (!request.assignedTo || !request.departmentId) continue;
    
    const deptSupervisors = supervisors.filter(s => s.departmentId === request.departmentId);
    if (deptSupervisors.length === 0) continue;
    
    const supervisor = deptSupervisors[0];
    
    await prisma.workloadAssignment.create({
      data: {
        requestId: request.id,
        assignedTo: request.assignedTo,
        assignedBy: supervisor.id,
        assignmentReason: 'Skill match for request type',
        workloadScore: Math.random() * 100,
        estimatedEffort: 1 + Math.random() * 7, // 1-8 hours
        skillsRequired: JSON.stringify(['technical', 'communication']),
        priorityWeight: Math.random() * 100,
        isActive: true,
        createdAt: request.approvedAt || request.createdAt
      }
    });
    totalRecords++;
  }
  
  // 5. Performance Goals
  console.log('   Creating performance goals...');
  for (const staff of allStaff.slice(0, 20)) { // Top 20 staff get goals
    const supervisor = supervisors.find(s => s.departmentId === staff.departmentId);
    if (!supervisor) continue;
    
    const goals = [
      { title: 'Improve Response Time', targetValue: 2, unit: 'hours' },
      { title: 'Increase Resolution Rate', targetValue: 90, unit: 'percentage' },
      { title: 'Customer Satisfaction', targetValue: 4.5, unit: 'rating' },
      { title: 'Complete Training', targetValue: 40, unit: 'hours' }
    ];
    
    for (const goal of goals.slice(0, 2)) { // 2 goals per person
      await prisma.performanceGoal.create({
        data: {
          userId: staff.id,
          setBy: supervisor.id,
          title: goal.title,
          description: `Achieve ${goal.title.toLowerCase()} target`,
          targetValue: goal.targetValue,
          currentValue: goal.targetValue * (0.3 + Math.random() * 0.6),
          unit: goal.unit,
          status: Math.random() > 0.7 ? 'COMPLETED' : 'ACTIVE',
          dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
        }
      });
      totalRecords++;
    }
  }
  
  // 6. Team Collaborations
  console.log('   Creating team collaborations...');
  const complexRequests = requests.filter(r => r.priority === 'URGENT' || r.priority === 'HIGH');
  
  for (const request of complexRequests.slice(0, 30)) {
    const deptStaff = [...clerks, ...fieldAgents].filter(s => s.departmentId === request.departmentId);
    if (deptStaff.length < 2) continue;
    
    await prisma.teamCollaboration.create({
      data: {
        requestId: request.id,
        primaryStaffId: deptStaff[0].id,
        secondaryStaffId: deptStaff[1].id,
        role: 'SUPPORT',
        notes: 'Collaboration for high-priority request',
        startDate: request.createdAt,
        endDate: request.closedAt
      }
    });
    totalRecords++;
  }
  
  console.log(`   ✅ Created ${totalRecords} supervisor data records\n`);
  return totalRecords;
}