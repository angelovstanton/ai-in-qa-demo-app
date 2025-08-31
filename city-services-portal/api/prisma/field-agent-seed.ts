import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { BULGARIAN_CITIES } from './seeds/bulgarian-data';

const prisma = new PrismaClient();

async function seedFieldAgentData() {
  console.log('🚐 Creating comprehensive field agent data...');

  try {
    // Get all field agents
    const fieldAgents = await prisma.user.findMany({
      where: { role: 'FIELD_AGENT' },
      include: { department: true }
    });

    console.log(`   Found ${fieldAgents.length} field agents`);

    // Get all service requests that could become field work orders
    const serviceRequests = await prisma.serviceRequest.findMany({
      where: {
        status: {
          in: ['APPROVED', 'IN_PROGRESS', 'ASSIGNED', 'IN_FIELD']
        }
      },
      take: 100, // Create work orders for first 100 eligible requests
      orderBy: { createdAt: 'desc' }
    });

    console.log(`   Found ${serviceRequests.length} eligible service requests`);

    // Get supervisors to assign as work order supervisors
    const supervisors = await prisma.user.findMany({
      where: { role: 'SUPERVISOR' }
    });

    let workOrdersCreated = 0;
    let agentStatusCreated = 0;
    let timeTrackingCreated = 0;

    // Use real Bulgarian city coordinates
    const cities = Object.keys(BULGARIAN_CITIES);
    const cityCoordinates = [
      BULGARIAN_CITIES.Sofia,
      BULGARIAN_CITIES.Plovdiv,
      BULGARIAN_CITIES.Varna,
      BULGARIAN_CITIES.Burgas,
      BULGARIAN_CITIES.Ruse
    ];

    // Create work orders for each field agent
    for (let i = 0; i < fieldAgents.length && i < serviceRequests.length; i++) {
      const agent = fieldAgents[i];
      const supervisor = supervisors[Math.floor(Math.random() * supervisors.length)];

      // Create 3-5 work orders per agent
      const numOrders = Math.floor(Math.random() * 3) + 3; // 3-5 orders
      
      for (let j = 0; j < numOrders && (i * numOrders + j) < serviceRequests.length; j++) {
        const request = serviceRequests[i * numOrders + j];
        
        const statuses = ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED'];
        const priorities = ['EMERGENCY', 'HIGH', 'NORMAL', 'LOW'];
        const taskTypes = [
          'Street Light Repair', 'Pothole Filling', 'Park Maintenance', 
          'Sign Installation', 'Tree Trimming', 'Sidewalk Repair',
          'Traffic Signal Repair', 'Waste Collection', 'Graffiti Removal'
        ];
        
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const priority = priorities[Math.floor(Math.random() * priorities.length)];
        const taskType = taskTypes[Math.floor(Math.random() * taskTypes.length)];
        
        // Use actual Bulgarian city coordinates with small realistic variation
        const cityIndex = Math.floor(Math.random() * cityCoordinates.length);
        const city = cityCoordinates[cityIndex];
        const gpsLat = city.lat + (Math.random() - 0.5) * 0.02; // Small variation within city
        const gpsLng = city.lng + (Math.random() - 0.5) * 0.02;
        
        const estimatedDuration = Math.floor(Math.random() * 240) + 30; // 30-270 minutes
        
        // Create check-in times based on status
        let checkInTime = null;
        let checkOutTime = null;
        let actualDuration = null;
        
        if (['ON_SITE', 'IN_PROGRESS', 'COMPLETED'].includes(status)) {
          checkInTime = new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000); // Within last 24 hours
          
          if (status === 'COMPLETED') {
            checkOutTime = new Date(checkInTime.getTime() + (Math.random() * 4 * 60 * 60 * 1000)); // 0-4 hours later
            actualDuration = Math.floor((checkOutTime.getTime() - checkInTime.getTime()) / 60000);
          }
        }

        const workOrder = await prisma.fieldWorkOrder.create({
          data: {
            requestId: request.id,
            assignedAgentId: agent.id,
            supervisorId: supervisor.id,
            priority,
            taskType,
            estimatedDuration,
            requiredSkills: JSON.stringify([
              'Equipment Operation', 'Safety Protocols', 'Public Interaction'
            ]),
            requiredTools: JSON.stringify([
              'Safety Vest', 'Tool Kit', 'Radio Communication'
            ]),
            safetyNotes: 'Follow standard safety protocols. Use traffic cones for road work.',
            gpsLat,
            gpsLng,
            navigationLink: `https://www.google.com/maps/dir/?api=1&destination=${gpsLat},${gpsLng}`,
            status,
            checkInTime,
            checkOutTime,
            actualDuration,
            completionNotes: status === 'COMPLETED' ? 'Work completed successfully. Site cleaned up.' : null
          }
        });

        workOrdersCreated++;

        // Create time tracking entries for active work orders
        if (['ON_SITE', 'IN_PROGRESS'].includes(status) || (status === 'COMPLETED' && Math.random() > 0.3)) {
          const timeTypes = ['TRAVEL', 'SETUP', 'WORK', 'DOCUMENTATION'];
          const numTimeEntries = Math.floor(Math.random() * 3) + 1; // 1-3 entries
          
          for (let k = 0; k < numTimeEntries; k++) {
            const timeType = timeTypes[k % timeTypes.length];
            const startTime = new Date(checkInTime || Date.now() - Math.random() * 2 * 60 * 60 * 1000);
            const duration = Math.floor(Math.random() * 120) + 15; // 15-135 minutes
            const endTime = status === 'COMPLETED' || Math.random() > 0.3 
              ? new Date(startTime.getTime() + duration * 60000) 
              : null;

            await prisma.agentTimeTracking.create({
              data: {
                workOrderId: workOrder.id,
                agentId: agent.id,
                timeType,
                startTime,
                endTime,
                duration: endTime ? duration : null,
                notes: `${timeType.toLowerCase()} activity for ${taskType}`
              }
            });

            timeTrackingCreated++;
          }
        }

        // Update service request status
        await prisma.serviceRequest.update({
          where: { id: request.id },
          data: {
            status: status === 'COMPLETED' ? 'COMPLETED' : 'IN_FIELD',
            assignedTo: agent.id
          }
        });
      }

      // Create agent status
      const agentStatuses = ['AVAILABLE', 'BUSY', 'ON_BREAK', 'OFF_DUTY', 'EN_ROUTE'];
      const agentStatus = agentStatuses[Math.floor(Math.random() * agentStatuses.length)];
      
      // Get a current work order for this agent if they're busy
      const currentWorkOrder = await prisma.fieldWorkOrder.findFirst({
        where: {
          assignedAgentId: agent.id,
          status: { in: ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS'] }
        }
      });

      // Use Sofia as the base for agent locations
      const agentCity = BULGARIAN_CITIES.Sofia;
      const agentLat = agentCity.lat + (Math.random() - 0.5) * 0.01;
      const agentLng = agentCity.lng + (Math.random() - 0.5) * 0.01;

      await prisma.agentStatus.upsert({
        where: { agentId: agent.id },
        update: {
          status: currentWorkOrder ? 'BUSY' : agentStatus,
          currentTaskId: currentWorkOrder?.id || null,
          currentLocation: JSON.stringify({
            lat: agentLat,
            lng: agentLng,
            accuracy: 5
          }),
          vehicleStatus: Math.random() > 0.5 ? 'IN_TRANSIT' : 'PARKED',
          lastUpdateTime: new Date()
        },
        create: {
          agentId: agent.id,
          status: currentWorkOrder ? 'BUSY' : agentStatus,
          currentTaskId: currentWorkOrder?.id || null,
          currentLocation: JSON.stringify({
            lat: agentLat,
            lng: agentLng,
            accuracy: 5
          }),
          vehicleStatus: Math.random() > 0.5 ? 'IN_TRANSIT' : 'PARKED',
          lastUpdateTime: new Date()
        }
      });

      agentStatusCreated++;
    }

    // Create some field photos using real city incident images
    const activeWorkOrders = await prisma.fieldWorkOrder.findMany({
      where: {
        status: { in: ['ON_SITE', 'IN_PROGRESS', 'COMPLETED'] }
      },
      take: 20
    });

    // Load real city incident photos
    const cityPhotos = [
      'city_incident2.jpg',
      'city_incident5.jpg', 
      'city_incident6.jpg',
      'city_incident7.jpg',
      'city_incident8.jpg',
      'city_incident9.jpg'
    ];
    
    const photoBuffers: { [key: string]: Buffer } = {};
    for (const photoName of cityPhotos) {
      const photoPath = path.join(__dirname, '..', '..', 'ui', 'images', photoName);
      if (fs.existsSync(photoPath)) {
        photoBuffers[photoName] = fs.readFileSync(photoPath);
      }
    }

    let photosCreated = 0;
    for (const workOrder of activeWorkOrders) {
      const photoTypes = ['BEFORE', 'DURING', 'AFTER', 'DAMAGE', 'COMPLETION'];
      const numPhotos = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < numPhotos; i++) {
        // Use a random city incident photo
        const photoName = cityPhotos[Math.floor(Math.random() * cityPhotos.length)];
        const photoData = photoBuffers[photoName] || Buffer.from('placeholder');
        
        await prisma.fieldPhoto.create({
          data: {
            workOrderId: workOrder.id,
            agentId: workOrder.assignedAgentId,
            photoType: photoTypes[Math.floor(Math.random() * photoTypes.length)],
            filename: `work-${workOrder.id}-${i + 1}.jpg`,
            mime: 'image/jpeg',
            size: photoData.length,
            data: photoData,
            caption: `${workOrder.taskType} - Photo ${i + 1}`,
            timestamp: new Date(),
            gpsLat: workOrder.gpsLat,
            gpsLng: workOrder.gpsLng
          }
        });
        photosCreated++;
      }
    }

    console.log(`✅ Field agent data creation complete!`);
    console.log(`   📋 Work orders created: ${workOrdersCreated}`);
    console.log(`   👤 Agent statuses created: ${agentStatusCreated}`);
    console.log(`   ⏱️ Time tracking entries: ${timeTrackingCreated}`);
    console.log(`   📸 Field photos created: ${photosCreated}`);

  } catch (error) {
    console.error('❌ Error creating field agent data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedFieldAgentData()
    .then(() => {
      console.log('🎉 Field agent data seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Field agent data seeding failed:', error);
      process.exit(1);
    });
}

export { seedFieldAgentData };