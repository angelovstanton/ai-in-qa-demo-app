import { PrismaClient } from '@prisma/client';

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomElements<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

export async function seedSupervisorData(prisma: PrismaClient, departments: any[], users: any, requests: any[]) {
  console.log('📊 Creating MASSIVE supervisor data with 1000+ entries...');
  
  const { supervisors, staffUsers } = users;

  // 1. DEPARTMENT METRICS - Create 2000+ historical metrics records
  console.log('   📈 Creating department metrics (2000+ records)...');
  const departmentMetricsData = [];
  
  const metricTypes = ['avgResolutionTime', 'slaCompliance', 'firstCallResolution', 'citizenSatisfaction', 'requestVolume', 'escalationRate', 'staffUtilization'];
  const periods = ['daily', 'weekly', 'monthly', 'quarterly'];
  
  for (const department of departments) {
    for (const metricType of metricTypes) {
      for (const period of periods) {
        // Determine how many historical points to create
        let maxPeriods = 30;
        if (period === 'daily') maxPeriods = 90; // Last 3 months daily
        if (period === 'weekly') maxPeriods = 52; // Last year weekly
        if (period === 'monthly') maxPeriods = 24; // Last 2 years monthly
        if (period === 'quarterly') maxPeriods = 12; // Last 3 years quarterly
        
        for (let i = 0; i < maxPeriods; i++) {
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
            case 'quarterly':
              periodStart.setMonth(baseDate.getMonth() - (i * 3));
              periodEnd.setMonth(baseDate.getMonth() - (i * 3) + 3);
              break;
          }
          
          // Generate realistic metric values with trends and seasonality
          let baseValue = 0;
          const seasonalFactor = 1 + 0.3 * Math.sin((i / 12) * 2 * Math.PI); // Yearly cycle
          const trendFactor = 1 + (i * 0.003); // Gradual improvement over time
          const randomVariation = 0.7 + Math.random() * 0.6; // ±30% random variation
          const departmentFactor = 0.8 + (departments.indexOf(department) * 0.1); // Department differences
          
          switch (metricType) {
            case 'avgResolutionTime':
              baseValue = (45 * trendFactor * seasonalFactor * departmentFactor * randomVariation);
              break;
            case 'slaCompliance':
              baseValue = Math.min(100, Math.max(60, 88 + (15 / trendFactor) * randomVariation));
              break;
            case 'firstCallResolution':
              baseValue = Math.min(95, Math.max(30, (65 * (1/trendFactor) * randomVariation)));
              break;
            case 'citizenSatisfaction':
              baseValue = Math.min(5, Math.max(2, 3.8 + (0.8 / trendFactor) * randomVariation));
              break;
            case 'requestVolume':
              baseValue = Math.floor(Math.max(5, (30 * seasonalFactor * departmentFactor * randomVariation)));
              break;
            case 'escalationRate':
              baseValue = Math.max(0, Math.min(25, (12 * trendFactor * randomVariation)));
              break;
            case 'staffUtilization':
              baseValue = Math.min(150, Math.max(40, (85 * seasonalFactor * randomVariation)));
              break;
          }
          
          departmentMetricsData.push({
            id: `metric-${department.id}-${metricType}-${period}-${i}`,
            departmentId: department.id,
            metricType,
            value: Math.round(baseValue * 100) / 100,
            period,
            periodStart,
            periodEnd,
            calculatedAt: new Date(periodStart.getTime() + Math.random() * 86400000),
            createdAt: new Date()
          });
        }
      }
    }
  }
  
  await prisma.departmentMetrics.createMany({
    data: departmentMetricsData
  });
  
  console.log(`   ✅ Created ${departmentMetricsData.length} department metrics`);

  // 2. QUALITY REVIEWS - Create 300+ quality reviews
  console.log('   ⭐ Creating quality reviews (300+ records)...');
  const completedRequests = requests.filter(r => 
    ['RESOLVED', 'CLOSED'].includes(r.status)
  );
  
  const qualityReviewsData = [];
  const targetReviews = Math.min(300, completedRequests.length);
  
  for (let i = 0; i < targetReviews; i++) {
    const request = completedRequests[i];
    const supervisorsInDept = supervisors.filter(s => 
      s.departmentId === request.departmentId
    );
    
    if (supervisorsInDept.length > 0 && Math.random() > 0.2) { // 80% chance of review
      const reviewer = getRandomElement(supervisorsInDept);
      
      // Generate correlated scores (if one is high, others tend to be high too)
      const baseQuality = 6 + Math.random() * 4; // 6-10 base score
      const variation = (Math.random() - 0.5) * 2; // -1 to +1 variation
      
      qualityReviewsData.push({
        id: `review-${request.id}-${reviewer.id}`,
        requestId: request.id,
        reviewerId: reviewer.id,
        qualityScore: Math.max(1, Math.min(10, Math.round((baseQuality + variation) * 10) / 10)),
        communicationScore: Math.max(1, Math.min(10, Math.round((baseQuality + variation + (Math.random() - 0.5)) * 10) / 10)),
        technicalAccuracyScore: Math.max(1, Math.min(10, Math.round((baseQuality + variation + (Math.random() - 0.5)) * 10) / 10)),
        timelinessScore: Math.max(1, Math.min(10, Math.round((baseQuality + variation + (Math.random() - 0.5)) * 10) / 10)),
        citizenSatisfactionScore: Math.max(1, Math.min(10, Math.round((baseQuality + variation + (Math.random() - 0.5)) * 10) / 10)),
        improvementSuggestions: Math.random() > 0.7 ? `Consider ${getRandomElement(['improving response time', 'enhancing communication', 'better documentation', 'follow-up procedures', 'technical training'])}` : null,
        followUpRequired: Math.random() > 0.8,
        calibrationSession: Math.random() > 0.9 ? `CAL-${new Date().getFullYear()}-${Math.floor(Math.random() * 12) + 1}` : null,
        reviewStatus: getRandomElement(['COMPLETED', 'COMPLETED', 'COMPLETED', 'PENDING']),
        createdAt: new Date(request.updatedAt.getTime() + Math.random() * 86400000 * 7), // Within a week of completion
        updatedAt: new Date()
      });
    }
  }
  
  await prisma.qualityReview.createMany({
    data: qualityReviewsData
  });
  
  console.log(`   ✅ Created ${qualityReviewsData.length} quality reviews`);

  // 3. STAFF PERFORMANCE - Create 400+ staff performance records
  console.log('   👨‍💼 Creating staff performance records (400+ records)...');
  const performancePeriods = [
    '2024-Q4', '2024-Q3', '2024-Q2', '2024-Q1',
    '2023-Q4', '2023-Q3', '2023-Q2', '2023-Q1',
    '2024-12', '2024-11', '2024-10', '2024-09', '2024-08', '2024-07',
    '2024-06', '2024-05', '2024-04', '2024-03', '2024-02', '2024-01'
  ];
  
  const staffPerformanceData = [];
  
  for (const user of staffUsers) {
    // Create performance data for random periods
    const numPeriods = Math.floor(Math.random() * 8) + 3; // 3-10 periods per user
    const selectedPeriods = getRandomElements(performancePeriods, numPeriods);
    
    for (const period of selectedPeriods) {
      // Generate realistic performance metrics
      const basePerformance = 0.7 + Math.random() * 0.3; // 0.7-1.0 base performance
      const departmentFactor = user.departmentId ? 0.9 + Math.random() * 0.2 : 1;
      const roleFactor = user.role === 'SUPERVISOR' ? 1.1 : user.role === 'FIELD_AGENT' ? 0.9 : 1.0;
      
      staffPerformanceData.push({
        id: `perf-${user.id}-${period}`,
        userId: user.id,
        departmentId: user.departmentId,
        performancePeriod: period,
        averageHandlingTime: Math.floor(60 + Math.random() * 120), // 60-180 minutes
        completedRequests: Math.floor(2 + Math.random() * 12), // 2-14 requests
        qualityScore: Math.max(5, Math.min(10, (7 + Math.random() * 3) * basePerformance * departmentFactor)),
        citizenSatisfactionRating: Math.max(2, Math.min(5, (3.5 + Math.random() * 1.5) * basePerformance)),
        overtimeHours: Math.max(0, Math.random() * 20), // 0-20 hours
        productivityScore: Math.max(60, Math.min(100, (80 + Math.random() * 20) * basePerformance * roleFactor)),
        goalsAchieved: Math.floor(Math.random() * 8), // 0-7 goals
        goalsMissed: Math.floor(Math.random() * 3), // 0-2 goals
        trainingHoursCompleted: Math.floor(Math.random() * 40), // 0-40 hours
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
  
  await prisma.staffPerformance.createMany({
    data: staffPerformanceData
  });
  
  console.log(`   ✅ Created ${staffPerformanceData.length} staff performance records`);

  // 4. WORKLOAD ASSIGNMENTS - Create 200+ workload assignments
  console.log('   ⚖️ Creating workload assignments (200+ records)...');
  const workloadAssignmentsData = [];
  
  // Get requests that have been assigned
  const assignedRequests = requests.filter(r => r.assignedTo);
  const numAssignments = Math.min(200, assignedRequests.length);
  
  for (let i = 0; i < numAssignments; i++) {
    const request = assignedRequests[i];
    const supervisorsInDept = supervisors.filter(s => 
      s.departmentId === request.departmentId
    );
    
    if (supervisorsInDept.length > 0) {
      const supervisor = getRandomElement(supervisorsInDept);
      
      // Sometimes create reassignment history
      const hasReassignment = Math.random() > 0.8;
      let previousAssignee = null;
      
      if (hasReassignment) {
        const deptStaff = staffUsers.filter(s => s.departmentId === request.departmentId);
        previousAssignee = getRandomElement(deptStaff);
      }
      
      const skillsRequired = getRandomElements([
        'customer_service', 'technical_troubleshooting', 'field_work', 'documentation',
        'problem_solving', 'communication', 'time_management', 'conflict_resolution'
      ], Math.floor(Math.random() * 3) + 1);
      
      workloadAssignmentsData.push({
        id: `assignment-${request.id}-${Date.now()}-${i}`,
        requestId: request.id,
        assignedFrom: previousAssignee?.id || null,
        assignedTo: request.assignedTo,
        assignedBy: supervisor.id,
        assignmentReason: getRandomElement([
          'Skill match for category',
          'Workload balancing',
          'Geographic proximity',
          'Previous experience',
          'Availability',
          'Escalation required'
        ]),
        workloadScore: Math.random() * 100,
        estimatedEffort: Math.floor(1 + Math.random() * 8), // 1-8 hours
        skillsRequired: JSON.stringify(skillsRequired),
        priorityWeight: Math.random() * 100,
        isActive: ['IN_PROGRESS', 'TRIAGED'].includes(request.status),
        completedAt: ['RESOLVED', 'CLOSED'].includes(request.status) ? request.updatedAt : null,
        createdAt: new Date(request.createdAt.getTime() + Math.random() * 86400000)
      });
    }
  }
  
  await prisma.workloadAssignment.createMany({
    data: workloadAssignmentsData
  });
  
  console.log(`   ✅ Created ${workloadAssignmentsData.length} workload assignments`);

  // 5. PERFORMANCE GOALS - Create 150+ performance goals
  console.log('   🎯 Creating performance goals (150+ records)...');
  const performanceGoalsData = [];
  
  for (const supervisor of supervisors) {
    // Each supervisor creates goals for their department staff
    const deptStaff = staffUsers.filter(s => s.departmentId === supervisor.departmentId && s.id !== supervisor.id);
    
    for (const staff of deptStaff) {
      // Create 2-4 goals per staff member
      const numGoals = Math.floor(Math.random() * 3) + 2;
      
      for (let g = 0; g < numGoals; g++) {
        const goalTypes = [
          { title: 'Improve Resolution Time', description: 'Reduce average resolution time for assigned requests', unit: 'hours', targetValue: 24 + Math.random() * 48 },
          { title: 'Increase Customer Satisfaction', description: 'Achieve higher citizen satisfaction ratings', unit: 'rating', targetValue: 4.0 + Math.random() * 1.0 },
          { title: 'Complete Training Hours', description: 'Complete required professional development training', unit: 'hours', targetValue: 20 + Math.random() * 40 },
          { title: 'Reduce Escalation Rate', description: 'Minimize requests that need to be escalated', unit: 'percentage', targetValue: Math.random() * 10 },
          { title: 'Increase First Call Resolution', description: 'Resolve more requests on first contact', unit: 'percentage', targetValue: 60 + Math.random() * 30 }
        ];
        
        const goalType = getRandomElement(goalTypes);
        const createdDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000); // Created within last 6 months
        const dueDate = new Date(createdDate.getTime() + (30 + Math.random() * 270) * 24 * 60 * 60 * 1000); // Due in 1-9 months
        
        const isOverdue = dueDate < new Date();
        const isCompleted = Math.random() > 0.6;
        
        let status = 'ACTIVE';
        let completedAt = null;
        let currentValue = goalType.targetValue * (0.3 + Math.random() * 0.4); // 30-70% progress
        
        if (isCompleted) {
          status = Math.random() > 0.2 ? 'ACHIEVED' : 'MISSED';
          completedAt = new Date(createdDate.getTime() + Math.random() * (Date.now() - createdDate.getTime()));
          currentValue = status === 'ACHIEVED' ? goalType.targetValue * (1 + Math.random() * 0.2) : goalType.targetValue * (0.5 + Math.random() * 0.3);
        } else if (isOverdue) {
          status = 'MISSED';
          completedAt = dueDate;
        }
        
        performanceGoalsData.push({
          id: `goal-${supervisor.id}-${staff.id}-${g}-${Date.now()}`,
          userId: staff.id,
          supervisorId: supervisor.id,
          title: goalType.title,
          description: goalType.description,
          targetValue: goalType.targetValue,
          currentValue: currentValue,
          unit: goalType.unit,
          dueDate: dueDate,
          status: status,
          priority: getRandomElement(['LOW', 'MEDIUM', 'MEDIUM', 'HIGH']),
          createdAt: createdDate,
          updatedAt: completedAt || new Date(),
          completedAt: completedAt
        });
      }
    }
  }
  
  await prisma.performanceGoal.createMany({
    data: performanceGoalsData
  });
  
  console.log(`   ✅ Created ${performanceGoalsData.length} performance goals`);

  // 6. TEAM COLLABORATIONS - Create 100+ team collaboration records
  console.log('   🤝 Creating team collaborations (100+ records)...');
  const teamCollaborationsData = [];
  
  for (const department of departments) {
    const deptSupervisors = supervisors.filter(s => s.departmentId === department.id);
    const deptStaff = staffUsers.filter(s => s.departmentId === department.id);
    
    if (deptSupervisors.length > 0) {
      // Create various types of collaborations
      const collaborationTypes = [
        { type: 'STANDUP', title: 'Daily Standup Meeting', description: 'Daily team synchronization meeting' },
        { type: 'PEER_REVIEW', title: 'Peer Code Review Session', description: 'Review of processes and procedures' },
        { type: 'KNOWLEDGE_SHARE', title: 'Knowledge Sharing Session', description: 'Share expertise and best practices' },
        { type: 'TRAINING', title: 'Team Training Workshop', description: 'Skills development and training session' }
      ];
      
      // Create 15-25 collaborations per department
      const numCollaborations = Math.floor(Math.random() * 11) + 15;
      
      for (let c = 0; c < numCollaborations; c++) {
        const collaboration = getRandomElement(collaborationTypes);
        const creator = getRandomElement(deptSupervisors);
        
        // Select 3-8 participants
        const numParticipants = Math.floor(Math.random() * 6) + 3;
        const participants = getRandomElements(deptStaff, Math.min(numParticipants, deptStaff.length));
        
        const scheduledDate = new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000); // Last 3 months
        const isCompleted = Math.random() > 0.3;
        
        teamCollaborationsData.push({
          id: `collab-${department.id}-${c}-${Date.now()}`,
          departmentId: department.id,
          collaborationType: collaboration.type,
          title: collaboration.title,
          description: collaboration.description,
          participants: JSON.stringify(participants.map(p => p.id)),
          scheduledAt: scheduledDate,
          completedAt: isCompleted ? new Date(scheduledDate.getTime() + Math.random() * 3 * 60 * 60 * 1000) : null,
          outcome: isCompleted ? getRandomElement([
            'Successfully completed session with positive feedback',
            'Identified areas for improvement and next steps',
            'Shared valuable insights and best practices',
            'Completed training objectives and assessments'
          ]) : null,
          actionItems: isCompleted ? JSON.stringify(getRandomElements([
            'Follow up on discussed items',
            'Schedule additional training',
            'Implement suggested improvements',
            'Share documentation with team',
            'Schedule follow-up meeting'
          ], Math.floor(Math.random() * 3) + 1)) : null,
          createdBy: creator.id,
          createdAt: new Date(scheduledDate.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000),
          updatedAt: new Date()
        });
      }
    }
  }
  
  await prisma.teamCollaboration.createMany({
    data: teamCollaborationsData
  });
  
  console.log(`   ✅ Created ${teamCollaborationsData.length} team collaborations`);

  // Summary
  const totalSupervisorRecords = departmentMetricsData.length + qualityReviewsData.length + 
    staffPerformanceData.length + workloadAssignmentsData.length + performanceGoalsData.length + 
    teamCollaborationsData.length;
  
  console.log(`\n🎉 SUPERVISOR DATA SUMMARY:`);
  console.log(`   📈 ${departmentMetricsData.length} department metrics`);
  console.log(`   ⭐ ${qualityReviewsData.length} quality reviews`);
  console.log(`   👨‍💼 ${staffPerformanceData.length} staff performance records`);
  console.log(`   ⚖️ ${workloadAssignmentsData.length} workload assignments`);
  console.log(`   🎯 ${performanceGoalsData.length} performance goals`);
  console.log(`   🤝 ${teamCollaborationsData.length} team collaborations`);
  console.log(`   🏆 TOTAL: ${totalSupervisorRecords} supervisor records created!`);
  
  return totalSupervisorRecords;
}