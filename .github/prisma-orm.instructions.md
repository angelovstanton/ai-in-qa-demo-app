---
description: 'Prisma ORM development standards and best practices'
applyTo: '**/*.prisma, **/*.ts, **/*.js'
---

# Prisma ORM Development Instructions

Instructions for building robust database layers using Prisma ORM with TypeScript, focusing on type safety, performance, and comprehensive testing support.

## Project Context
- Prisma ORM with SQLite for development and testing (easily switchable to PostgreSQL/MySQL)
- Type-safe database operations with generated TypeScript client
- Database migrations and seeding for consistent development environment
- Optimistic locking for concurrent update handling
- Comprehensive audit trails with event logging
- Performance optimization with proper indexing and query patterns
- Testing support with database seeding and isolation

## Core Technologies
- **ORM**: Prisma 5+ with TypeScript integration
- **Database**: SQLite for development, PostgreSQL/MySQL for production
- **Migrations**: Prisma Migrate for schema versioning
- **Seeding**: Prisma seed scripts for test data generation
- **Client**: Auto-generated TypeScript client with full type safety
- **Studio**: Prisma Studio for database browsing and debugging

## Schema Design Standards

### Entity Modeling
```prisma
// User entity with authentication and role management
model User {
  id           String   @id @default(cuid())
  email        String   @unique
  name         String
  role         UserRole @default(CITIZEN)
  passwordHash String
  isActive     Boolean  @default(true)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  // Relationships
  createdRequests ServiceRequest[] @relation("RequestCreator")
  assignedRequests ServiceRequest[] @relation("RequestAssignee")
  comments        Comment[]
  eventLogs       EventLog[]

  @@map("users")
}

// Service request with comprehensive workflow support
model ServiceRequest {
  id          String        @id @default(cuid())
  code        String        @unique // Generated code like REQ-2024-001
  title       String
  description String
  category    String
  priority    Priority      @default(MEDIUM)
  status      RequestStatus @default(SUBMITTED)
  locationText String
  version     Int           @default(1) // For optimistic locking
  
  // Timestamps
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  closedAt    DateTime?
  
  // Foreign keys
  creatorId     String
  assigneeId    String?
  departmentId  String?
  
  // Relationships
  creator     User        @relation("RequestCreator", fields: [creatorId], references: [id])
  assignee    User?       @relation("RequestAssignee", fields: [assigneeId], references: [id])
  department  Department? @relation(fields: [departmentId], references: [id])
  comments    Comment[]
  attachments Attachment[]
  eventLogs   EventLog[]

  // Indexes for performance
  @@index([status])
  @@index([priority])
  @@index([category])
  @@index([createdAt])
  @@index([creatorId])
  @@index([assigneeId])
  @@map("service_requests")
}

// Audit trail for all changes
model EventLog {
  id        String   @id @default(cuid())
  type      String   // REQUEST_CREATED, STATUS_CHANGED, etc.
  payload   String   // JSON payload with change details
  createdAt DateTime @default(now())
  
  // Foreign keys
  requestId String?
  userId    String
  
  // Relationships
  request ServiceRequest? @relation(fields: [requestId], references: [id])
  user    User           @relation(fields: [userId], references: [id])

  @@index([requestId])
  @@index([type])
  @@index([createdAt])
  @@map("event_logs")
}

// Feature flags for testing scenarios
model FeatureFlag {
  id          String  @id @default(cuid())
  name        String  @unique
  enabled     Boolean @default(false)
  description String?
  category    String? // API, UI, PERFORMANCE, etc.
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("feature_flags")
}

// Enums for type safety
enum UserRole {
  CITIZEN
  CLERK
  SUPERVISOR
  FIELD_AGENT
  ADMIN
}

enum RequestStatus {
  SUBMITTED
  TRIAGED
  IN_PROGRESS
  WAITING_ON_CITIZEN
  RESOLVED
  CLOSED
  REJECTED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}
```

### Database Configuration
```typescript
// Database connection configuration
export const databaseConfig = {
  development: {
    url: "file:./dev.db",
    options: {
      // SQLite optimizations
      pragma: {
        journal_mode: 'WAL',
        synchronous: 'NORMAL',
        cache_size: 1000,
        foreign_keys: true,
        busy_timeout: 5000
      }
    }
  },
  test: {
    url: "file:./test.db",
    options: {
      pragma: {
        journal_mode: 'MEMORY',
        synchronous: 'OFF',
        cache_size: 1000,
        foreign_keys: true
      }
    }
  },
  production: {
    url: process.env.DATABASE_URL,
    options: {
      pool: {
        min: 2,
        max: 10,
        acquireTimeoutMillis: 60000,
        createTimeoutMillis: 30000,
        destroyTimeoutMillis: 5000,
        idleTimeoutMillis: 900000,
        reapIntervalMillis: 1000,
        createRetryIntervalMillis: 200
      }
    }
  }
};
```

## Database Operations

### Type-Safe Query Patterns
```typescript
// Service layer with proper error handling and type safety
export class DatabaseService {
  private prisma = new PrismaClient();

  // Create operations with proper relationship handling
  async createServiceRequest(data: CreateServiceRequestData): Promise<ServiceRequest> {
    return await this.prisma.$transaction(async (tx) => {
      // Generate unique request code
      const code = await this.generateRequestCode(tx);
      
      // Create the request
      const request = await tx.serviceRequest.create({
        data: {
          ...data,
          code,
          status: 'SUBMITTED',
          version: 1
        },
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true }
          },
          department: {
            select: { id: true, name: true, slug: true }
          }
        }
      });

      // Log the creation event
      await tx.eventLog.create({
        data: {
          type: 'REQUEST_CREATED',
          requestId: request.id,
          userId: data.creatorId,
          payload: JSON.stringify({
            action: 'create',
            status: 'SUBMITTED',
            metadata: { title: request.title, category: request.category }
          })
        }
      });

      return request;
    });
  }

  // Advanced querying with filtering and pagination
  async getServiceRequests(params: GetServiceRequestsParams): Promise<ServiceRequestsResult> {
    const {
      page = 1,
      limit = 25,
      status,
      priority,
      category,
      creatorId,
      assigneeId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;

    const skip = (page - 1) * limit;

    // Build dynamic where clause
    const where: Prisma.ServiceRequestWhereInput = {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category }),
      ...(creatorId && { creatorId }),
      ...(assigneeId && { assigneeId }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    // Execute count and data queries in parallel
    const [total, requests] = await Promise.all([
      this.prisma.serviceRequest.count({ where }),
      this.prisma.serviceRequest.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          assignee: {
            select: { id: true, name: true, email: true }
          },
          department: {
            select: { id: true, name: true }
          },
          _count: {
            select: { comments: true, attachments: true }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit
      })
    ]);

    return {
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };
  }

  // Optimistic locking for concurrent updates
  async updateServiceRequestStatus(
    requestId: string,
    newStatus: RequestStatus,
    userId: string,
    currentVersion: number,
    reason?: string
  ): Promise<ServiceRequest> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // First, get the current request to validate transition
        const currentRequest = await tx.serviceRequest.findUnique({
          where: { id: requestId },
          select: { status: true, version: true }
        });

        if (!currentRequest) {
          throw new Error('Service request not found');
        }

        if (currentRequest.version !== currentVersion) {
          throw new Error('Request was modified by another user. Please refresh and try again.');
        }

        // Validate status transition
        if (!this.isValidStatusTransition(currentRequest.status, newStatus)) {
          throw new Error(`Cannot transition from ${currentRequest.status} to ${newStatus}`);
        }

        // Update the request with version increment
        const updatedRequest = await tx.serviceRequest.update({
          where: { 
            id: requestId,
            version: currentVersion // Optimistic locking check
          },
          data: {
            status: newStatus,
            version: currentVersion + 1,
            ...(newStatus === 'CLOSED' && { closedAt: new Date() })
          },
          include: {
            creator: true,
            assignee: true,
            department: true
          }
        });

        // Log the status change
        await tx.eventLog.create({
          data: {
            type: 'STATUS_CHANGED',
            requestId,
            userId,
            payload: JSON.stringify({
              action: 'status_change',
              fromStatus: currentRequest.status,
              toStatus: newStatus,
              reason,
              timestamp: new Date().toISOString()
            })
          }
        });

        return updatedRequest;
      });
    } catch (error) {
      // Handle Prisma-specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new Error('Request not found or was modified by another user');
        }
      }
      throw error;
    }
  }

  // Bulk operations with proper error handling
  async bulkUpdateRequestStatus(
    requestIds: string[],
    newStatus: RequestStatus,
    userId: string
  ): Promise<{ updated: number; errors: string[] }> {
    const errors: string[] = [];
    let updated = 0;

    // Process in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < requestIds.length; i += batchSize) {
      const batch = requestIds.slice(i, i + batchSize);
      
      await Promise.allSettled(
        batch.map(async (requestId) => {
          try {
            await this.prisma.$transaction(async (tx) => {
              const request = await tx.serviceRequest.findUnique({
                where: { id: requestId },
                select: { status: true, version: true }
              });

              if (!request) {
                errors.push(`Request ${requestId} not found`);
                return;
              }

              if (!this.isValidStatusTransition(request.status, newStatus)) {
                errors.push(`Invalid status transition for request ${requestId}`);
                return;
              }

              await tx.serviceRequest.update({
                where: { id: requestId },
                data: {
                  status: newStatus,
                  version: request.version + 1
                }
              });

              await tx.eventLog.create({
                data: {
                  type: 'BULK_STATUS_CHANGE',
                  requestId,
                  userId,
                  payload: JSON.stringify({
                    action: 'bulk_status_change',
                    toStatus: newStatus,
                    batchId: `batch-${Date.now()}`
                  })
                }
              });

              updated++;
            });
          } catch (error) {
            errors.push(`Failed to update request ${requestId}: ${error.message}`);
          }
        })
      );
    }

    return { updated, errors };
  }
}
```

### Database Seeding for Testing
```typescript
// Comprehensive seed script for testing scenarios
import { PrismaClient, UserRole, RequestStatus, Priority } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function seed() {
  console.log('?? Starting database seeding...');

  // Clean existing data
  await prisma.eventLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.attachment.deleteMany();
  await prisma.serviceRequest.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();
  await prisma.featureFlag.deleteMany();

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({
      data: {
        name: 'Public Works',
        slug: 'public-works',
        description: 'Roads, utilities, and infrastructure'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Parks and Recreation',
        slug: 'parks-recreation',
        description: 'Parks, playgrounds, and recreational facilities'
      }
    }),
    prisma.department.create({
      data: {
        name: 'Environmental Services',
        slug: 'environmental',
        description: 'Waste management and environmental issues'
      }
    })
  ]);

  // Create users for each role
  const users = await Promise.all([
    // Citizen user
    prisma.user.create({
      data: {
        email: 'john@example.com',
        name: 'John Citizen',
        role: 'CITIZEN',
        passwordHash: await hash('password123', 12)
      }
    }),
    // Clerk user
    prisma.user.create({
      data: {
        email: 'mary.clerk@city.gov',
        name: 'Mary Clerk',
        role: 'CLERK',
        passwordHash: await hash('password123', 12)
      }
    }),
    // Supervisor user
    prisma.user.create({
      data: {
        email: 'supervisor@city.gov',
        name: 'Sarah Supervisor',
        role: 'SUPERVISOR',
        passwordHash: await hash('password123', 12)
      }
    }),
    // Field agent user
    prisma.user.create({
      data: {
        email: 'field.agent@city.gov',
        name: 'Mike Agent',
        role: 'FIELD_AGENT',
        passwordHash: await hash('password123', 12)
      }
    }),
    // Admin user
    prisma.user.create({
      data: {
        email: 'admin@city.gov',
        name: 'Admin User',
        role: 'ADMIN',
        passwordHash: await hash('password123', 12)
      }
    })
  ]);

  const [citizen, clerk, supervisor, fieldAgent, admin] = users;

  // Create service requests with various statuses
  const requests = [];
  const categories = [
    'Roads and Transportation',
    'Street Lighting',
    'Waste Management',
    'Water and Sewer',
    'Parks and Recreation'
  ];

  const priorities: Priority[] = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
  const statuses: RequestStatus[] = [
    'SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
  ];

  for (let i = 1; i <= 25; i++) {
    const category = categories[i % categories.length];
    const priority = priorities[i % priorities.length];
    const status = statuses[i % statuses.length];
    
    const request = await prisma.serviceRequest.create({
      data: {
        code: `REQ-2024-${String(i).padStart(3, '0')}`,
        title: `Sample Request ${i}: ${category} Issue`,
        description: `This is a detailed description for request ${i}. It describes a ${category.toLowerCase()} issue that needs attention from the city services team. The issue was reported by a citizen and requires proper handling according to city protocols.`,
        category,
        priority,
        status,
        locationText: `${100 + i} Main Street, City Center, Postal Code ${10000 + i}`,
        creatorId: citizen.id,
        assigneeId: status === 'SUBMITTED' ? null : fieldAgent.id,
        departmentId: departments[i % departments.length].id,
        version: 1,
        createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000), // Spread over last 25 days
        ...(status === 'CLOSED' && { 
          closedAt: new Date(Date.now() - (i - 5) * 24 * 60 * 60 * 1000) 
        })
      }
    });

    requests.push(request);

    // Add event logs for request lifecycle
    await prisma.eventLog.create({
      data: {
        type: 'REQUEST_CREATED',
        requestId: request.id,
        userId: citizen.id,
        payload: JSON.stringify({
          action: 'create',
          status: 'SUBMITTED',
          category,
          priority
        }),
        createdAt: request.createdAt
      }
    });

    if (status !== 'SUBMITTED') {
      await prisma.eventLog.create({
        data: {
          type: 'STATUS_CHANGED',
          requestId: request.id,
          userId: clerk.id,
          payload: JSON.stringify({
            action: 'status_change',
            fromStatus: 'SUBMITTED',
            toStatus: 'TRIAGED'
          }),
          createdAt: new Date(request.createdAt.getTime() + 2 * 60 * 60 * 1000)
        }
      });
    }

    // Add comments to some requests
    if (i % 3 === 0) {
      await prisma.comment.create({
        data: {
          content: `This is a sample comment for request ${i}. The citizen provided additional details about the issue.`,
          requestId: request.id,
          authorId: citizen.id,
          createdAt: new Date(request.createdAt.getTime() + 4 * 60 * 60 * 1000)
        }
      });

      await prisma.comment.create({
        data: {
          content: `Staff response: We have reviewed the request and will assign it to the appropriate department for handling.`,
          requestId: request.id,
          authorId: clerk.id,
          createdAt: new Date(request.createdAt.getTime() + 6 * 60 * 60 * 1000)
        }
      });
    }
  }

  // Create feature flags for testing
  const featureFlags = [
    {
      name: 'API_Random500',
      enabled: false,
      description: 'Introduces 5% random server errors for testing',
      category: 'API'
    },
    {
      name: 'UI_WrongDefaultSort',
      enabled: false,
      description: 'Wrong default sorting behavior for testing',
      category: 'UI'
    },
    {
      name: 'API_SlowRequests',
      enabled: false,
      description: 'Simulates 10% slow API responses',
      category: 'PERFORMANCE'
    },
    {
      name: 'API_UploadIntermittentFail',
      enabled: false,
      description: 'Random file upload failures for testing',
      category: 'UPLOAD'
    }
  ];

  await Promise.all(
    featureFlags.map(flag => prisma.featureFlag.create({ data: flag }))
  );

  console.log('? Database seeding completed!');
  console.log(`Created ${users.length} users, ${requests.length} requests, ${departments.length} departments`);
  console.log(`Created ${featureFlags.length} feature flags for testing scenarios`);
}

// Execute seeding if run directly
if (require.main === module) {
  seed()
    .catch((e) => {
      console.error('? Seeding failed:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
```

### Database Testing Utilities
```typescript
// Test utilities for database isolation and setup
export class DatabaseTestUtils {
  private static prisma = new PrismaClient();

  // Clean database for test isolation
  static async cleanDatabase(): Promise<void> {
    const tablenames = await this.prisma.$queryRaw<Array<{ name: string }>>`
      SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name != '_prisma_migrations';
    `;

    for (const { name } of tablenames) {
      await this.prisma.$executeRawUnsafe(`DELETE FROM ${name};`);
    }
  }

  // Create test user with specific role
  static async createTestUser(
    role: UserRole = 'CITIZEN',
    overrides: Partial<User> = {}
  ): Promise<User> {
    return await this.prisma.user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        name: `Test User ${role}`,
        role,
        passwordHash: await hash('testpassword', 12),
        ...overrides
      }
    });
  }

  // Create test service request
  static async createTestRequest(
    creatorId: string,
    overrides: Partial<ServiceRequest> = {}
  ): Promise<ServiceRequest> {
    return await this.prisma.serviceRequest.create({
      data: {
        code: `TEST-${Date.now()}`,
        title: 'Test Request',
        description: 'This is a test request description for testing purposes.',
        category: 'Roads and Transportation',
        priority: 'MEDIUM',
        status: 'SUBMITTED',
        locationText: '123 Test Street',
        creatorId,
        version: 1,
        ...overrides
      },
      include: {
        creator: true,
        assignee: true,
        department: true
      }
    });
  }

  // Setup test database with minimal data
  static async setupTestData(): Promise<{
    citizen: User;
    clerk: User;
    admin: User;
    department: Department;
  }> {
    const [citizen, clerk, admin] = await Promise.all([
      this.createTestUser('CITIZEN'),
      this.createTestUser('CLERK'),
      this.createTestUser('ADMIN')
    ]);

    const department = await this.prisma.department.create({
      data: {
        name: 'Test Department',
        slug: 'test-dept',
        description: 'Test department for testing'
      }
    });

    return { citizen, clerk, admin, department };
  }

  // Disconnect from database
  static async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

// Example test using the utilities
describe('Service Request Database Operations', () => {
  beforeEach(async () => {
    await DatabaseTestUtils.cleanDatabase();
  });

  afterAll(async () => {
    await DatabaseTestUtils.disconnect();
  });

  it('should create service request with proper audit trail', async () => {
    const { citizen } = await DatabaseTestUtils.setupTestData();
    
    const request = await DatabaseTestUtils.createTestRequest(citizen.id, {
      title: 'Pothole on Main Street',
      priority: 'HIGH'
    });

    expect(request.title).toBe('Pothole on Main Street');
    expect(request.priority).toBe('HIGH');
    expect(request.status).toBe('SUBMITTED');
    expect(request.version).toBe(1);

    // Verify audit trail was created
    const eventLogs = await prisma.eventLog.findMany({
      where: { requestId: request.id }
    });

    expect(eventLogs).toHaveLength(1);
    expect(eventLogs[0].type).toBe('REQUEST_CREATED');
  });
});
```

## Performance Optimization

### Query Optimization
- Use proper indexes on frequently queried columns
- Implement pagination for large datasets
- Use `select` and `include` to fetch only needed data
- Leverage Prisma's query optimization features
- Use database transactions for data consistency
- Implement connection pooling for production environments

### Monitoring and Debugging
- Enable Prisma query logging in development
- Use Prisma Studio for database inspection
- Monitor slow queries and optimize accordingly
- Implement proper error handling for database operations
- Use database connection pooling and timeout configurations

This Prisma ORM development approach ensures type-safe, performant, and maintainable database operations while supporting comprehensive testing scenarios and audit trails for the AI in QA Demo Application.