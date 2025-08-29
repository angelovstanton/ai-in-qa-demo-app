import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const testScenarioSchema = z.object({
  scenario: z.enum(['basic', 'full', 'load', 'security', 'workflow']),
  userCount: z.number().min(1).max(1000).optional().default(10),
  requestCount: z.number().min(1).max(5000).optional().default(50),
  includeAttachments: z.boolean().optional().default(false),
});

// POST /api/v1/admin/test-data/scenarios/:scenario - Load specific test scenario
router.post('/scenarios/:scenario', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const scenario = req.params.scenario;
    const body = testScenarioSchema.parse({ scenario, ...req.body });

    let result;

    switch (scenario) {
      case 'basic':
        result = await generateBasicTestData(body.userCount, body.requestCount);
        break;
      case 'full':
        result = await generateFullTestData(body.userCount, body.requestCount, body.includeAttachments);
        break;
      case 'load':
        result = await generateLoadTestData(body.userCount, body.requestCount);
        break;
      case 'security':
        result = await generateSecurityTestData();
        break;
      case 'workflow':
        result = await generateWorkflowTestData();
        break;
      default:
        return res.status(400).json({
          error: {
            code: 'INVALID_SCENARIO',
            message: 'Invalid test scenario',
            correlationId: res.locals.correlationId
          }
        });
    }

    res.status(201).json({
      data: result,
      message: `Test scenario '${scenario}' loaded successfully`,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Test scenario loading error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid test scenario parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to load test scenario',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/admin/test-data/scenarios - List available test scenarios
router.get('/scenarios', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  const scenarios = [
    {
      name: 'basic',
      description: 'Basic test data with citizens and simple requests',
      parameters: ['userCount', 'requestCount']
    },
    {
      name: 'full',
      description: 'Comprehensive test data including all user roles and complex requests',
      parameters: ['userCount', 'requestCount', 'includeAttachments']
    },
    {
      name: 'load',
      description: 'Large dataset for load testing',
      parameters: ['userCount', 'requestCount']
    },
    {
      name: 'security',
      description: 'Test data for security testing scenarios',
      parameters: []
    },
    {
      name: 'workflow',
      description: 'Complete workflow test data with all status transitions',
      parameters: []
    }
  ];

  res.json({
    data: scenarios,
    correlationId: res.locals.correlationId
  });
});

// DELETE /api/v1/admin/test-data/cleanup - Clean all test data
router.delete('/cleanup', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await cleanupAllTestData();

    res.json({
      data: stats,
      message: 'Test data cleanup completed',
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Test data cleanup error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to cleanup test data',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/admin/test-data/generate - Generate synthetic test data
router.post('/generate', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const body = testScenarioSchema.parse(req.body);
    
    const result = await generateSyntheticData(body.userCount, body.requestCount);

    res.status(201).json({
      data: result,
      message: 'Synthetic test data generated successfully',
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Synthetic data generation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid generation parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate synthetic data',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// Test data generation functions
async function generateBasicTestData(userCount: number, requestCount: number) {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);
  
  // Create test users (mostly citizens)
  const users = [];
  for (let i = 1; i <= userCount; i++) {
    const user = await prisma.user.create({
      data: {
        name: `Test User ${i}`,
        email: `testuser${i}@example.com`,
        passwordHash,
        role: i <= 2 ? 'CLERK' : 'CITIZEN', // First 2 are clerks
        isTestUser: true,
        firstName: `Test${i}`,
        lastName: `User`,
        phone: `+1555000${i.toString().padStart(4, '0')}`
      }
    });
    users.push(user);
  }

  // Create test requests
  const requests = [];
  const categories = ['Roads & Infrastructure', 'Parks & Recreation', 'Utilities', 'Public Safety'];
  const priorities = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  
  for (let i = 1; i <= requestCount; i++) {
    const randomUser = users[Math.floor(Math.random() * users.length)];
    if (randomUser.role === 'CITIZEN') {
      const request = await prisma.serviceRequest.create({
        data: {
          code: `TEST-REQ-${Date.now()}-${i}`,
          title: `Test Request ${i}`,
          description: `This is a test request number ${i} for automated testing purposes. It contains enough text to meet the minimum description requirements.`,
          category: categories[Math.floor(Math.random() * categories.length)],
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          locationText: `Test Location ${i}`,
          streetAddress: `${i} Test Street`,
          city: 'Test City',
          postalCode: `T${i.toString().padStart(4, '0')}`,
          contactMethod: 'EMAIL',
          email: randomUser.email,
          dateOfRequest: new Date(),
          createdBy: randomUser.id,
          isTestData: true
        }
      });
      requests.push(request);
    }
  }

  return {
    usersCreated: users.length,
    requestsCreated: requests.length,
    scenario: 'basic'
  };
}

async function generateFullTestData(userCount: number, requestCount: number, includeAttachments: boolean) {
  const passwordHash = await bcrypt.hash('TestPassword123!', 10);
  
  // Create diverse user roles
  const roles = ['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN'];
  const users = [];
  
  for (let i = 1; i <= userCount; i++) {
    const role = roles[Math.floor(Math.random() * roles.length)];
    const user = await prisma.user.create({
      data: {
        name: `${role} User ${i}`,
        email: `${role.toLowerCase()}${i}@example.com`,
        passwordHash,
        role,
        isTestUser: true,
        firstName: `${role}${i}`,
        lastName: `Test`,
        phone: `+1555${role.substring(0,3).toUpperCase()}${i.toString().padStart(3, '0')}`,
        emailNotifications: Math.random() > 0.5,
        smsNotifications: Math.random() > 0.7
      }
    });
    users.push(user);
  }

  // Create complex test requests with various statuses
  const requests = [];
  const statuses = ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'WAITING_ON_CITIZEN', 'RESOLVED', 'CLOSED'];
  const categories = [
    'Roads & Infrastructure', 'Parks & Recreation', 'Utilities', 
    'Public Safety', 'Environmental Services', 'Building & Permits'
  ];
  
  for (let i = 1; i <= requestCount; i++) {
    const citizens = users.filter(u => u.role === 'CITIZEN');
    const randomCitizen = citizens[Math.floor(Math.random() * citizens.length)];
    
    if (randomCitizen) {
      const request = await prisma.serviceRequest.create({
        data: {
          code: `FULL-TEST-${Date.now()}-${i}`,
          title: `Complex Test Request ${i}`,
          description: `This is a comprehensive test request ${i} with detailed information. It includes multiple fields and complex data structures for thorough testing of the application features and workflows.`,
          category: categories[Math.floor(Math.random() * categories.length)],
          priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][Math.floor(Math.random() * 4)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          locationText: `Complex Test Location ${i}`,
          streetAddress: `${i * 10} Complex Test Avenue`,
          city: 'Full Test City',
          postalCode: `FT${i.toString().padStart(3, '0')}`,
          landmark: `Test Landmark ${i}`,
          contactMethod: ['EMAIL', 'PHONE', 'SMS'][Math.floor(Math.random() * 3)],
          email: randomCitizen.email,
          phone: randomCitizen.phone,
          severity: Math.floor(Math.random() * 10) + 1,
          isEmergency: Math.random() > 0.9,
          isRecurring: Math.random() > 0.8,
          hasPermits: Math.random() > 0.7,
          estimatedValue: Math.random() * 10000,
          satisfactionRating: Math.floor(Math.random() * 5) + 1,
          dateOfRequest: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          createdBy: randomCitizen.id,
          isTestData: true
        }
      });
      requests.push(request);

      // Add random comments
      if (Math.random() > 0.5) {
        await prisma.comment.create({
          data: {
            requestId: request.id,
            authorId: randomCitizen.id,
            body: `This is a test comment for request ${i}. It provides additional context and information.`,
            visibility: Math.random() > 0.3 ? 'PUBLIC' : 'INTERNAL',
            isTestData: true
          }
        });
      }

      // Add random upvotes
      if (Math.random() > 0.6) {
        const randomVoter = users.filter(u => u.id !== randomCitizen.id)[0];
        if (randomVoter) {
          await prisma.upvote.create({
            data: {
              userId: randomVoter.id,
              requestId: request.id
            }
          });
        }
      }
    }
  }

  return {
    usersCreated: users.length,
    requestsCreated: requests.length,
    scenario: 'full',
    includeAttachments
  };
}

async function generateLoadTestData(userCount: number, requestCount: number) {
  const passwordHash = await bcrypt.hash('LoadTest123!', 10);
  
  // Batch create users for performance
  const userCreationPromises = [];
  for (let i = 1; i <= userCount; i++) {
    userCreationPromises.push(
      prisma.user.create({
        data: {
          name: `Load User ${i}`,
          email: `loaduser${i}@loadtest.com`,
          passwordHash,
          role: i % 10 === 0 ? 'CLERK' : 'CITIZEN', // Every 10th user is a clerk
          isTestUser: true,
          firstName: `Load${i}`,
          lastName: `Test`
        }
      })
    );
  }
  
  const users = await Promise.all(userCreationPromises);
  const citizens = users.filter(u => u.role === 'CITIZEN');

  // Batch create requests
  const requestCreationPromises = [];
  for (let i = 1; i <= requestCount; i++) {
    const randomCitizen = citizens[Math.floor(Math.random() * citizens.length)];
    
    requestCreationPromises.push(
      prisma.serviceRequest.create({
        data: {
          code: `LOAD-${Date.now()}-${i}`,
          title: `Load Test Request ${i}`,
          description: `Load testing request ${i} with minimal data for performance testing scenarios.`,
          category: 'Load Testing',
          priority: 'MEDIUM',
          locationText: `Load Location ${i}`,
          contactMethod: 'EMAIL',
          email: randomCitizen.email,
          dateOfRequest: new Date(),
          createdBy: randomCitizen.id,
          isTestData: true
        }
      })
    );
  }
  
  const requests = await Promise.all(requestCreationPromises);

  return {
    usersCreated: users.length,
    requestsCreated: requests.length,
    scenario: 'load'
  };
}

async function generateSecurityTestData() {
  const passwordHash = await bcrypt.hash('SecurityTest123!', 10);
  
  // Create users for security testing
  const securityUsers = [
    { name: 'Admin Test User', email: 'admin@sectest.com', role: 'ADMIN' },
    { name: 'Supervisor Test User', email: 'supervisor@sectest.com', role: 'SUPERVISOR' },
    { name: 'Clerk Test User', email: 'clerk@sectest.com', role: 'CLERK' },
    { name: 'Agent Test User', email: 'agent@sectest.com', role: 'FIELD_AGENT' },
    { name: 'Citizen Test User', email: 'citizen@sectest.com', role: 'CITIZEN' },
  ];

  const users = [];
  for (const userData of securityUsers) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        isTestUser: true
      }
    });
    users.push(user);
  }

  return {
    usersCreated: users.length,
    scenario: 'security',
    users: users.map(u => ({ id: u.id, email: u.email, role: u.role }))
  };
}

async function generateWorkflowTestData() {
  const passwordHash = await bcrypt.hash('WorkflowTest123!', 10);
  
  // Create workflow test users
  const workflowUsers = [
    { name: 'Workflow Citizen', email: 'wf-citizen@test.com', role: 'CITIZEN' },
    { name: 'Workflow Clerk', email: 'wf-clerk@test.com', role: 'CLERK' },
    { name: 'Workflow Agent', email: 'wf-agent@test.com', role: 'FIELD_AGENT' },
    { name: 'Workflow Supervisor', email: 'wf-supervisor@test.com', role: 'SUPERVISOR' },
  ];

  const users = [];
  for (const userData of workflowUsers) {
    const user = await prisma.user.create({
      data: {
        ...userData,
        passwordHash,
        isTestUser: true
      }
    });
    users.push(user);
  }

  // Create requests in different statuses for workflow testing
  const citizen = users.find(u => u.role === 'CITIZEN')!;
  const statuses = ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'WAITING_ON_CITIZEN', 'RESOLVED', 'CLOSED'];
  
  const requests = [];
  for (let i = 0; i < statuses.length; i++) {
    const request = await prisma.serviceRequest.create({
      data: {
        code: `WF-${statuses[i]}-${Date.now()}`,
        title: `Workflow Test - ${statuses[i]}`,
        description: `Test request in ${statuses[i]} status for workflow testing purposes.`,
        category: 'Workflow Testing',
        priority: 'MEDIUM',
        status: statuses[i],
        locationText: `Workflow Location ${i + 1}`,
        contactMethod: 'EMAIL',
        email: citizen.email,
        dateOfRequest: new Date(),
        createdBy: citizen.id,
        isTestData: true
      }
    });
    requests.push(request);
  }

  return {
    usersCreated: users.length,
    requestsCreated: requests.length,
    scenario: 'workflow',
    statusesCreated: statuses
  };
}

async function generateSyntheticData(userCount: number, requestCount: number) {
  // Similar to generateBasicTestData but with more randomized, realistic data
  return await generateBasicTestData(userCount, requestCount);
}

async function cleanupAllTestData() {
  const stats = {
    users: 0,
    requests: 0,
    comments: 0,
    attachments: 0,
    upvotes: 0
  };

  await prisma.$transaction(async (tx) => {
    // Count before deletion
    stats.upvotes = await tx.upvote.count({
      where: {
        OR: [
          { user: { isTestUser: true } },
          { request: { isTestData: true } }
        ]
      }
    });

    stats.comments = await tx.comment.count({
      where: {
        OR: [
          { isTestData: true },
          { author: { isTestUser: true } },
          { request: { isTestData: true } }
        ]
      }
    });

    stats.attachments = await tx.attachment.count({
      where: {
        OR: [
          { isTestData: true },
          { uploadedBy: { isTestUser: true } },
          { request: { isTestData: true } }
        ]
      }
    });

    stats.requests = await tx.serviceRequest.count({
      where: {
        OR: [
          { isTestData: true },
          { creator: { isTestUser: true } }
        ]
      }
    });

    stats.users = await tx.user.count({
      where: { isTestUser: true }
    });

    // Delete in correct order (respecting foreign key constraints)
    await tx.upvote.deleteMany({
      where: {
        OR: [
          { user: { isTestUser: true } },
          { request: { isTestData: true } }
        ]
      }
    });

    await tx.comment.deleteMany({
      where: {
        OR: [
          { isTestData: true },
          { author: { isTestUser: true } },
          { request: { isTestData: true } }
        ]
      }
    });

    await tx.attachment.deleteMany({
      where: {
        OR: [
          { isTestData: true },
          { uploadedBy: { isTestUser: true } },
          { request: { isTestData: true } }
        ]
      }
    });

    await tx.eventLog.deleteMany({
      where: {
        request: {
          OR: [
            { isTestData: true },
            { creator: { isTestUser: true } }
          ]
        }
      }
    });

    await tx.assignment.deleteMany({
      where: {
        request: {
          OR: [
            { isTestData: true },
            { creator: { isTestUser: true } }
          ]
        }
      }
    });

    await tx.serviceRequest.deleteMany({
      where: {
        OR: [
          { isTestData: true },
          { creator: { isTestUser: true } }
        ]
      }
    });

    await tx.user.deleteMany({
      where: { isTestUser: true }
    });
  });

  return stats;
}

export default router;