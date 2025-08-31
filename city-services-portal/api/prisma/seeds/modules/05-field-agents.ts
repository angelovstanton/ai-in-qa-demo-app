import { PrismaClient, ServiceRequest } from '@prisma/client';
import { UsersSeedResult } from './02-users';
import { getRandomBulgarianAddress } from './bulgarian-addresses';

const TASK_TYPES = ['Inspection', 'Repair', 'Maintenance', 'Installation', 'Assessment', 'Emergency Response'];
const WORK_ORDER_STATUSES = ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'];

// Sample image URLs for field work documentation
const SAMPLE_IMAGES = [
  '/images/field/pothole-before.jpg',
  '/images/field/pothole-after.jpg',
  '/images/field/street-light-repair.jpg',
  '/images/field/water-leak-fixed.jpg',
  '/images/field/sidewalk-repair.jpg',
  '/images/field/tree-removal.jpg',
  '/images/field/graffiti-cleanup.jpg',
  '/images/field/sign-installation.jpg'
];

export async function seedFieldAgentData(
  prisma: PrismaClient,
  users: UsersSeedResult,
  requests: ServiceRequest[]
): Promise<number> {
  console.log('🚐 Seeding Field Agent Data...');
  
  let totalRecords = 0;
  const { fieldAgents, supervisors } = users;
  
  // Filter requests that need field work
  const fieldRequests = requests.filter(r => 
    ['APPROVED', 'IN_PROGRESS'].includes(r.status) &&
    ['pothole', 'leak', 'light', 'tree', 'repair', 'damage'].some(term => 
      r.title.toLowerCase().includes(term) || r.description.toLowerCase().includes(term)
    )
  );
  
  // 1. Create Work Orders
  console.log('   Creating field work orders...');
  const workOrdersToCreate = Math.min(fieldRequests.length, fieldAgents.length * 5); // 5 orders per agent max
  
  for (let i = 0; i < workOrdersToCreate; i++) {
    const request = fieldRequests[i];
    if (!request) break;
    
    const agent = fieldAgents[i % fieldAgents.length];
    const supervisor = supervisors.find(s => s.departmentId === agent.departmentId) || supervisors[0];
    const address = getRandomBulgarianAddress();
    
    const status = WORK_ORDER_STATUSES[Math.floor(Math.random() * WORK_ORDER_STATUSES.length)];
    const scheduledFor = new Date();
    scheduledFor.setHours(scheduledFor.getHours() + Math.floor(Math.random() * 72)); // Within 72 hours
    
    const workOrder = await prisma.fieldWorkOrder.create({
      data: {
        requestId: request.id,
        assignedAgentId: agent.id,
        supervisorId: supervisor.id,
        priority: request.priority,
        
        // Location with real Bulgarian coordinates
        gpsLat: address.lat,
        gpsLng: address.lng,
        gpsAccuracy: 5 + Math.random() * 10, // 5-15 meters accuracy
        navigationLink: `https://maps.google.com/?q=${address.lat},${address.lng}`,
        estimatedTravelTime: Math.floor(10 + Math.random() * 50), // 10-60 minutes
        optimalRoute: JSON.stringify({
          via: address.district,
          distance: `${(5 + Math.random() * 15).toFixed(1)} km`,
          traffic: ['Light', 'Moderate', 'Heavy'][Math.floor(Math.random() * 3)]
        }),
        
        // Task details
        taskType: TASK_TYPES[Math.floor(Math.random() * TASK_TYPES.length)],
        estimatedDuration: Math.floor(30 + Math.random() * 150), // 30-180 minutes
        requiredSkills: JSON.stringify(['Safety protocols', 'Equipment operation', 'Documentation']),
        requiredTools: JSON.stringify(['Basic toolkit', 'Safety equipment', 'Measuring tools']),
        safetyNotes: 'Wear PPE at all times. Set up safety perimeter before work.',
        
        // Status and timing
        status,
        orderNumber: `WO-2024-${String(i + 1).padStart(6, '0')}`,
        scheduledFor,
        
        // Progress tracking
        startedAt: ['EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'].includes(status) ? 
          new Date(scheduledFor.getTime() - Math.random() * 3600000) : null,
        arrivedAt: ['ON_SITE', 'IN_PROGRESS', 'COMPLETED'].includes(status) ?
          new Date(scheduledFor.getTime() + Math.random() * 3600000) : null,
        completedAt: status === 'COMPLETED' ?
          new Date(scheduledFor.getTime() + Math.random() * 7200000) : null,
        
        // Completion details
        actualDuration: status === 'COMPLETED' ? Math.floor(30 + Math.random() * 150) : null,
        completionNotes: status === 'COMPLETED' ? 'Work completed successfully. Area cleaned and secured.' : null,
        qualityScore: status === 'COMPLETED' ? (7 + Math.random() * 3) : null,
        citizenFeedback: status === 'COMPLETED' && Math.random() > 0.5 ? 
          'Great work! The issue has been resolved.' : null
      }
    });
    totalRecords++;
    
    // Add field photos for completed work orders
    if (status === 'COMPLETED' && Math.random() > 0.3) {
      const photoTypes = ['BEFORE', 'DURING', 'AFTER', 'ISSUE', 'SAFETY'];
      const numPhotos = Math.floor(Math.random() * 3) + 1;
      
      for (let p = 0; p < numPhotos; p++) {
        await prisma.fieldPhoto.create({
          data: {
            workOrderId: workOrder.id,
            photoUrl: SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)],
            photoType: photoTypes[p % photoTypes.length],
            caption: `${photoTypes[p % photoTypes.length]} photo for work order`,
            takenBy: agent.id,
            takenAt: workOrder.completedAt!,
            gpsLat: address.lat + (Math.random() - 0.5) * 0.001,
            gpsLng: address.lng + (Math.random() - 0.5) * 0.001
          }
        });
        totalRecords++;
      }
    }
  }
  
  // 2. Agent Status Tracking
  console.log('   Creating agent status records...');
  for (const agent of fieldAgents) {
    const statuses = ['AVAILABLE', 'ON_DUTY', 'ON_BREAK', 'OFF_DUTY', 'ON_ROUTE', 'AT_SITE'];
    const currentStatus = statuses[Math.floor(Math.random() * statuses.length)];
    const location = getRandomBulgarianAddress();
    
    await prisma.agentStatus.create({
      data: {
        agentId: agent.id,
        status: currentStatus,
        lastKnownLat: location.lat,
        lastKnownLng: location.lng,
        lastUpdateTime: new Date(),
        batteryLevel: Math.floor(20 + Math.random() * 80),
        isOnline: currentStatus !== 'OFF_DUTY',
        currentWorkOrderId: currentStatus === 'AT_SITE' ? 
          (await prisma.fieldWorkOrder.findFirst({ where: { assignedAgentId: agent.id }}))?.id : null
      }
    });
    totalRecords++;
  }
  
  // 3. Time Tracking
  console.log('   Creating time tracking records...');
  const today = new Date();
  
  for (const agent of fieldAgents) {
    // Create time entries for the past 7 days
    for (let d = 0; d < 7; d++) {
      const date = new Date(today);
      date.setDate(date.getDate() - d);
      
      if (date.getDay() === 0 || date.getDay() === 6) continue; // Skip weekends
      
      const clockIn = new Date(date);
      clockIn.setHours(7 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
      
      const clockOut = new Date(clockIn);
      clockOut.setHours(clockIn.getHours() + 8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 60), 0, 0);
      
      await prisma.agentTimeTracking.create({
        data: {
          agentId: agent.id,
          clockIn,
          clockOut,
          breakMinutes: 30 + Math.floor(Math.random() * 30),
          totalHours: (clockOut.getTime() - clockIn.getTime()) / (1000 * 60 * 60),
          overtimeHours: Math.random() > 0.7 ? Math.random() * 2 : 0,
          workOrdersCompleted: Math.floor(Math.random() * 5) + 1,
          distanceTraveled: 10 + Math.random() * 50 // 10-60 km
        }
      });
      totalRecords++;
    }
  }
  
  // 4. Additional Issues Found
  console.log('   Creating additional issues...');
  const completedOrders = await prisma.fieldWorkOrder.findMany({
    where: { status: 'COMPLETED' },
    take: 20
  });
  
  for (const order of completedOrders) {
    if (Math.random() > 0.6) {
      const issueTypes = [
        { type: 'Nearby pothole', severity: 'MEDIUM', description: 'Additional pothole found 20m away' },
        { type: 'Damaged curb', severity: 'LOW', description: 'Curb damage observed during repair' },
        { type: 'Tree branch hazard', severity: 'HIGH', description: 'Overhanging branch poses risk' },
        { type: 'Faded road marking', severity: 'LOW', description: 'Road markings need repainting' },
        { type: 'Drainage issue', severity: 'MEDIUM', description: 'Storm drain blocked nearby' }
      ];
      
      const issue = issueTypes[Math.floor(Math.random() * issueTypes.length)];
      const location = getRandomBulgarianAddress();
      
      await prisma.additionalIssue.create({
        data: {
          workOrderId: order.id,
          issueType: issue.type,
          description: issue.description,
          severity: issue.severity,
          photoUrl: Math.random() > 0.5 ? SAMPLE_IMAGES[0] : null,
          gpsLat: location.lat,
          gpsLng: location.lng,
          reportedBy: order.assignedAgentId,
          newRequestCreated: Math.random() > 0.7,
          newRequestId: null // Would link to new request if created
        }
      });
      totalRecords++;
    }
  }
  
  // 5. Parts Usage Tracking
  console.log('   Creating parts usage records...');
  const partsInventory = [
    { name: 'Asphalt Mix', unit: 'kg', unitCost: 2.5 },
    { name: 'Concrete', unit: 'kg', unitCost: 3.0 },
    { name: 'LED Street Light', unit: 'piece', unitCost: 150 },
    { name: 'Water Pipe 2"', unit: 'meter', unitCost: 25 },
    { name: 'Safety Cones', unit: 'piece', unitCost: 10 },
    { name: 'Paint Road Marking', unit: 'liter', unitCost: 15 },
    { name: 'Drainage Grate', unit: 'piece', unitCost: 75 }
  ];
  
  for (const order of completedOrders) {
    const numParts = Math.floor(Math.random() * 3) + 1;
    
    for (let i = 0; i < numParts; i++) {
      const part = partsInventory[Math.floor(Math.random() * partsInventory.length)];
      const quantity = Math.floor(Math.random() * 10) + 1;
      
      await prisma.partUsage.create({
        data: {
          workOrderId: order.id,
          partName: part.name,
          partNumber: `PN-${Math.floor(Math.random() * 9000) + 1000}`,
          quantity,
          unit: part.unit,
          unitCost: part.unitCost,
          totalCost: part.unitCost * quantity,
          supplierName: ['BuildMart Sofia', 'ProSupply Bulgaria', 'CityWorks Depot'][Math.floor(Math.random() * 3)],
          usedBy: order.assignedAgentId,
          usedAt: order.completedAt!
        }
      });
      totalRecords++;
    }
  }
  
  console.log(`   ✅ Created ${totalRecords} field agent data records\n`);
  return totalRecords;
}