import { PrismaClient, Department, ServiceRequest } from '@prisma/client';
import { UsersSeedResult } from './02-users';
import { getRandomBulgarianAddress, getRandomServiceIssue } from './bulgarian-addresses';

const STATUSES = ['SUBMITTED', 'IN_REVIEW', 'TRIAGED', 'APPROVED', 'REJECTED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

function generateUniqueRequestNumber(index: number): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  return `SR-${year}${month}-${String(index + 1).padStart(5, '0')}`;
}

function getRealisticStatus(createdDaysAgo: number): string {
  // Older requests more likely to be resolved/closed
  if (createdDaysAgo > 30) {
    const statuses = ['RESOLVED', 'CLOSED', 'REJECTED'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  } else if (createdDaysAgo > 14) {
    const statuses = ['IN_PROGRESS', 'RESOLVED', 'APPROVED', 'TRIAGED'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  } else if (createdDaysAgo > 7) {
    const statuses = ['TRIAGED', 'APPROVED', 'IN_PROGRESS', 'IN_REVIEW'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  } else {
    const statuses = ['SUBMITTED', 'IN_REVIEW', 'TRIAGED'];
    return statuses[Math.floor(Math.random() * statuses.length)];
  }
}

export async function seedServiceRequests(
  prisma: PrismaClient,
  departments: Department[],
  users: UsersSeedResult,
  numRequests: number = 500
): Promise<ServiceRequest[]> {
  console.log(`📋 Seeding ${numRequests} Service Requests...`);
  
  const requests: ServiceRequest[] = [];
  const { citizens, clerks, fieldAgents } = users;
  
  for (let i = 0; i < numRequests; i++) {
    // Progress indicator
    if (i % 50 === 0 && i > 0) {
      console.log(`   ✓ Created ${i} requests...`);
    }
    
    const address = getRandomBulgarianAddress();
    const department = departments[Math.floor(Math.random() * departments.length)];
    const issue = getRandomServiceIssue(department.name);
    const citizen = citizens[Math.floor(Math.random() * citizens.length)];
    
    // Create request with varying age (0-90 days old)
    const daysAgo = Math.floor(Math.random() * 90);
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - daysAgo);
    
    const status = getRealisticStatus(daysAgo);
    const priority = issue.urgency === 'HIGH' ? 
      (Math.random() > 0.3 ? 'URGENT' : 'HIGH') :
      issue.urgency === 'MEDIUM' ? 
      (Math.random() > 0.5 ? 'MEDIUM' : 'HIGH') :
      (Math.random() > 0.7 ? 'MEDIUM' : 'LOW');
    
    // Assign to staff based on status
    let assignedTo = null;
    let assignedBy = null;
    
    if (['APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      const deptClerks = clerks.filter(c => c.departmentId === department.id);
      const deptFieldAgents = fieldAgents.filter(f => f.departmentId === department.id);
      
      // Field work typically assigned to field agents
      if (['pothole', 'water leak', 'street light', 'tree'].some(term => 
        issue.type.toLowerCase().includes(term)) && deptFieldAgents.length > 0) {
        assignedTo = deptFieldAgents[Math.floor(Math.random() * deptFieldAgents.length)].id;
      } else if (deptClerks.length > 0) {
        assignedTo = deptClerks[Math.floor(Math.random() * deptClerks.length)].id;
      }
      
      if (assignedTo && deptClerks.length > 0) {
        assignedBy = deptClerks[0].id; // Supervisor or senior clerk assigns
      }
    }
    
    // Calculate dates based on status
    let approvedAt = null;
    let inProgressAt = null;
    let resolvedAt = null;
    let closedAt = null;
    
    if (['APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      approvedAt = new Date(createdAt.getTime() + Math.random() * 3 * 24 * 60 * 60 * 1000);
    }
    if (['IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(status)) {
      inProgressAt = new Date(approvedAt!.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
    }
    if (['RESOLVED', 'CLOSED'].includes(status)) {
      resolvedAt = new Date(inProgressAt!.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);
    }
    if (status === 'CLOSED') {
      closedAt = new Date(resolvedAt!.getTime() + Math.random() * 2 * 24 * 60 * 60 * 1000);
    }
    
    const request = await prisma.serviceRequest.create({
      data: {
        code: generateUniqueRequestNumber(i),
        title: issue.type,
        description: issue.description,
        category: department.name.toLowerCase().replace(/ /g, '-'),
        status,
        priority,
        departmentId: department.id,
        createdBy: citizen.id,
        assignedTo,
        
        // Location data
        locationText: `${address.street}, ${address.district}, ${address.city}`,
        lat: address.lat,
        lng: address.lng,
        streetAddress: address.street,
        city: address.city,
        postalCode: address.postalCode,
        
        // Contact info from citizen
        email: citizen.email,
        phone: citizen.phone || '+359 888 000000',
        
        // Timestamps
        dateOfRequest: createdAt,
        createdAt,
        updatedAt: closedAt || resolvedAt || inProgressAt || approvedAt || createdAt,
        closedAt
      }
    });
    
    requests.push(request);
  }
  
  console.log(`   ✅ Created ${requests.length} service requests\n`);
  
  // Add comments, attachments, and event logs
  console.log('   Adding request details...');
  
  for (const request of requests.slice(0, 200)) { // Add details to first 200 requests
    // Add 0-5 comments per request
    const numComments = Math.floor(Math.random() * 6);
    for (let i = 0; i < numComments; i++) {
      const commenter = Math.random() > 0.5 ? 
        citizens[Math.floor(Math.random() * citizens.length)] :
        clerks.find(c => c.departmentId === request.departmentId) || clerks[0];
      
      const comments = [
        'Thank you for reporting this issue. We will investigate.',
        'This has been a recurring problem in this area.',
        'Our team has been dispatched to address this issue.',
        'Work is scheduled to begin next week.',
        'The issue has been temporarily resolved. Permanent fix coming soon.',
        'Please provide additional photos if possible.',
        'Similar issue reported nearby. Combining requests.',
        'Weather conditions are delaying the repair work.',
        'Materials have been ordered for the repair.',
        'Work completed. Please confirm resolution.'
      ];
      
      await prisma.comment.create({
        data: {
          requestId: request.id,
          userId: commenter.id,
          content: comments[Math.floor(Math.random() * comments.length)],
          isInternal: commenter.role !== 'CITIZEN',
          createdAt: new Date(request.createdAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000)
        }
      });
    }
    
    // Add 0-3 attachments
    const numAttachments = Math.floor(Math.random() * 4);
    for (let i = 0; i < numAttachments; i++) {
      const fileTypes = [
        { name: 'photo.jpg', type: 'image/jpeg', size: 2048576 },
        { name: 'issue-image.png', type: 'image/png', size: 1536000 },
        { name: 'location-photo.jpg', type: 'image/jpeg', size: 3072000 },
        { name: 'damage-assessment.pdf', type: 'application/pdf', size: 512000 },
        { name: 'work-order.pdf', type: 'application/pdf', size: 256000 }
      ];
      
      const file = fileTypes[Math.floor(Math.random() * fileTypes.length)];
      
      await prisma.attachment.create({
        data: {
          requestId: request.id,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl: `/uploads/${request.id}/${file.name}`,
          uploadedBy: request.createdBy
        }
      });
    }
    
    // Add event logs
    const events = [];
    events.push({ action: 'CREATED', timestamp: request.createdAt });
    
    if (request.approvedAt) {
      events.push({ action: 'APPROVED', timestamp: request.approvedAt });
    }
    if (request.inProgressAt) {
      events.push({ action: 'WORK_STARTED', timestamp: request.inProgressAt });
    }
    if (request.resolvedAt) {
      events.push({ action: 'RESOLVED', timestamp: request.resolvedAt });
    }
    if (request.closedAt) {
      events.push({ action: 'CLOSED', timestamp: request.closedAt });
    }
    
    for (const event of events) {
      await prisma.eventLog.create({
        data: {
          requestId: request.id,
          userId: request.assignedTo || request.createdBy,
          action: event.action,
          details: `Request ${event.action.toLowerCase().replace('_', ' ')}`,
          createdAt: event.timestamp
        }
      });
    }
    
    // Add upvotes (citizen support)
    if (Math.random() > 0.5) {
      const numUpvotes = Math.floor(Math.random() * 10) + 1;
      const upvoters = new Set<string>();
      
      for (let i = 0; i < numUpvotes; i++) {
        const upvoter = citizens[Math.floor(Math.random() * citizens.length)];
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
  
  console.log(`   ✅ Added comments, attachments, and event logs\n`);
  
  return requests;
}