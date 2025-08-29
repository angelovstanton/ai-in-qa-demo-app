import { PrismaClient } from '@prisma/client';

const CATEGORIES = [
  'pothole', 'street-light', 'trash-pickup', 'water-leak', 'noise-complaint',
  'tree-removal', 'graffiti', 'sidewalk-repair', 'traffic-signal', 'other'
];

const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const STATUSES = ['DRAFT', 'SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'CANCELLED'];

const SAMPLE_TITLES = [
  'Pothole on Main Street needs repair',
  'Street light out on Oak Avenue',
  'Missed trash pickup on Elm Street',
  'Water leak at intersection',
  'Loud construction noise complaint',
  'Dead tree needs removal',
  'Graffiti on public building',
  'Broken sidewalk near school',
  'Traffic signal malfunction',
  'General service request'
];

function getRandomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRequestCode(): string {
  const year = new Date().getFullYear();
  const randomNum = Math.floor(Math.random() * 999999).toString().padStart(6, '0');
  return `REQ-${year}-${randomNum}`;
}

export async function seedRequests(prisma: PrismaClient, departments: any[], users: any) {
  console.log('📋 Creating service requests...');
  
  const { allUsers: users_array, citizens, staffUsers } = users;
  const requests = [];

  // Create 500+ service requests for comprehensive data
  const numRequests = 500;
  console.log(`   📝 Creating ${numRequests} service requests...`);
  
  for (let i = 0; i < numRequests; i++) {
    const creator = getRandomElement(citizens);
    const category = getRandomElement(CATEGORIES);
    const title = SAMPLE_TITLES[CATEGORIES.indexOf(category)] || getRandomElement(SAMPLE_TITLES);
    
    // Create request date within last year
    const createdAt = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
    
    // Determine status based on age (older requests more likely to be completed)
    const ageInDays = (Date.now() - createdAt.getTime()) / (24 * 60 * 60 * 1000);
    let status = 'SUBMITTED';
    
    if (ageInDays > 60) {
      status = getRandomElement(['RESOLVED', 'CLOSED', 'RESOLVED', 'CLOSED']);
    } else if (ageInDays > 30) {
      status = getRandomElement(['IN_PROGRESS', 'RESOLVED', 'IN_PROGRESS', 'TRIAGED']);
    } else if (ageInDays > 7) {
      status = getRandomElement(['TRIAGED', 'IN_PROGRESS', 'TRIAGED']);
    } else {
      status = getRandomElement(['SUBMITTED', 'TRIAGED', 'SUBMITTED']);
    }
    
    // Assign to staff if not in initial states
    let assignedTo = null;
    let departmentId = null;
    
    if (!['DRAFT', 'SUBMITTED'].includes(status)) {
      departmentId = getRandomElement(departments).id;
      const departmentStaff = staffUsers.filter(s => s.departmentId === departmentId);
      if (departmentStaff.length > 0) {
        assignedTo = getRandomElement(departmentStaff).id;
      }
    }
    
    // Set completion date for resolved/closed requests
    let closedAt = null;
    if (['RESOLVED', 'CLOSED'].includes(status)) {
      closedAt = new Date(createdAt.getTime() + Math.random() * (Date.now() - createdAt.getTime()));
    }
    
    // Set SLA due date
    const priority = getRandomElement(PRIORITIES);
    const slaDueAt = new Date(createdAt);
    switch (priority) {
      case 'URGENT':
        slaDueAt.setHours(slaDueAt.getHours() + 4);
        break;
      case 'HIGH':
        slaDueAt.setDate(slaDueAt.getDate() + 1);
        break;
      case 'MEDIUM':
        slaDueAt.setDate(slaDueAt.getDate() + 3);
        break;
      case 'LOW':
        slaDueAt.setDate(slaDueAt.getDate() + 7);
        break;
    }
    
    const request = await prisma.serviceRequest.create({
      data: {
        code: generateRequestCode(),
        title: title,
        description: `Detailed description for ${title.toLowerCase()}. This issue was reported by a citizen and requires attention from the appropriate department.`,
        category: category,
        priority: priority,
        status: status,
        dateOfRequest: createdAt.toISOString(),
        locationText: `${Math.floor(Math.random() * 999) + 1} ${getRandomElement(['Main St', 'Oak Ave', 'Elm St', 'Park Blvd', 'First Ave'])}`,
        lat: 40.7128 + (Math.random() - 0.5) * 0.1,
        lng: -74.0060 + (Math.random() - 0.5) * 0.1,
        contactMethod: getRandomElement(['EMAIL', 'PHONE', 'SMS']),
        email: creator.email,
        phone: creator.phone,
        isEmergency: priority === 'URGENT' && Math.random() > 0.8,
        satisfactionRating: closedAt ? Math.floor(Math.random() * 5) + 1 : null,
        createdBy: creator.id,
        assignedTo: assignedTo,
        departmentId: departmentId,
        slaDueAt: slaDueAt,
        closedAt: closedAt,
        createdAt: createdAt,
        updatedAt: closedAt || new Date(),
      }
    });
    
    requests.push(request);
  }
  
  console.log(`   ✅ Created ${requests.length} service requests`);
  
  // Create comments for requests
  console.log('   💬 Creating comments...');
  const commentCount = Math.floor(requests.length * 0.3); // 30% of requests have comments
  for (let i = 0; i < commentCount; i++) {
    const request = requests[i];
    const commenter = Math.random() > 0.5 ? 
      users_array.find(u => u.id === request.createdBy) : // Original creator
      getRandomElement(staffUsers); // Staff member
    
    if (commenter) {
      await prisma.comment.create({
        data: {
          requestId: request.id,
          authorId: commenter.id,
          body: `This is a comment about the ${request.title.toLowerCase()}. ${commenter.role === 'CITIZEN' ? 'I wanted to provide additional information about this issue.' : 'We are reviewing this request and will provide updates soon.'}`,
          visibility: commenter.role === 'CITIZEN' ? 'PUBLIC' : (Math.random() > 0.5 ? 'PUBLIC' : 'INTERNAL'),
        }
      });
    }
  }
  
  // Create assignments
  console.log('   📋 Creating assignments...');
  const assignedRequests = requests.filter(r => r.assignedTo);
  for (const request of assignedRequests) {
    if (request.assignedTo && request.departmentId) {
      const departmentSupervisors = users.supervisors.filter(s => s.departmentId === request.departmentId);
      const supervisor = departmentSupervisors.length > 0 ? 
        getRandomElement(departmentSupervisors) : 
        getRandomElement(users.supervisors);
        
      await prisma.assignment.create({
        data: {
          requestId: request.id,
          assigneeId: request.assignedTo,
          assignedById: supervisor.id,
        }
      });
    }
  }
  
  // Create event logs
  console.log('   📝 Creating event logs...');
  for (const request of requests) {
    // Initial submission event
    await prisma.eventLog.create({
      data: {
        requestId: request.id,
        type: 'REQUEST_CREATED',
        payload: JSON.stringify({
          title: request.title,
          category: request.category,
          priority: request.priority,
          createdBy: request.createdBy
        }),
        createdAt: request.createdAt,
      }
    });

    // Status change events
    if (request.status !== 'SUBMITTED') {
      await prisma.eventLog.create({
        data: {
          requestId: request.id,
          type: 'STATUS_CHANGED',
          payload: JSON.stringify({
            fromStatus: 'SUBMITTED',
            toStatus: request.status,
            changedBy: request.assignedTo || request.createdBy
          }),
          createdAt: request.updatedAt,
        }
      });
    }

    // Assignment events
    if (request.assignedTo) {
      await prisma.eventLog.create({
        data: {
          requestId: request.id,
          type: 'REQUEST_ASSIGNED',
          payload: JSON.stringify({
            assignedTo: request.assignedTo,
            assignedBy: request.assignedTo // Simplified
          }),
          createdAt: request.updatedAt,
        }
      });
    }
  }
  
  // Create upvotes
  console.log('   👍 Creating upvotes...');
  const upvoteCount = Math.floor(requests.length * 0.4); // 40% of requests have upvotes
  for (let i = 0; i < upvoteCount; i++) {
    const request = requests[i];
    const numUpvotes = Math.floor(Math.random() * 5) + 1; // 1-5 upvotes per request
    const upvoters = [];
    
    // Select random citizens for upvotes
    while (upvoters.length < numUpvotes && upvoters.length < citizens.length) {
      const upvoter = getRandomElement(citizens);
      if (upvoter.id !== request.createdBy && !upvoters.some(u => u.id === upvoter.id)) {
        upvoters.push(upvoter);
      }
    }
    
    for (const upvoter of upvoters) {
      try {
        await prisma.upvote.create({
          data: {
            userId: upvoter.id,
            requestId: request.id,
          }
        });
      } catch (error) {
        // Ignore duplicate upvotes
      }
    }
  }
  
  // Create attachments for some requests
  console.log('   📎 Creating attachments...');
  const attachmentCount = Math.floor(requests.length * 0.2); // 20% of requests have attachments
  const dummyImageBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64');
  
  for (let i = 0; i < attachmentCount; i++) {
    const request = requests[i];
    const uploader = users_array.find(u => u.id === request.createdBy) || getRandomElement(users_array);
    
    await prisma.attachment.create({
      data: {
        requestId: request.id,
        uploadedById: uploader.id,
        filename: `photo_${i + 1}.jpg`,
        mime: 'image/jpeg',
        size: 1024 + Math.floor(Math.random() * 5000),
        data: dummyImageBuffer
      }
    });
  }
  
  console.log(`   ✅ Service requests setup complete - ${requests.length} requests with full ecosystem`);
  
  return requests;
}