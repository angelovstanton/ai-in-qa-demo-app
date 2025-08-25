---
description: 'Node.js and Express.js development standards with TypeScript'
applyTo: '**/*.js, **/*.ts, **/*.json'
---

# Node.js and Express Development Instructions

Instructions for building robust, scalable Node.js applications with Express.js framework, TypeScript, and comprehensive testing support following modern backend development practices.

## Project Context
- Node.js 18+ with TypeScript for type safety
- Express.js framework with middleware-based architecture
- Prisma ORM for type-safe database operations
- JWT-based authentication with role-based access control
- OpenAPI/Swagger documentation for API endpoints
- Comprehensive logging and error handling
- Feature flag system for controlled testing scenarios
- Docker containerization for consistent deployment

## Core Technologies
- **Runtime**: Node.js 18+ with TypeScript compilation
- **Framework**: Express.js with TypeScript decorators
- **Database**: Prisma ORM with SQLite/PostgreSQL support
- **Authentication**: JWT tokens with bcrypt password hashing
- **Validation**: Zod schemas for request/response validation
- **Documentation**: OpenAPI 3.0 with Swagger UI
- **Testing**: Jest for unit testing, Supertest for API testing
- **Logging**: Winston for structured logging with correlation IDs

## Development Standards

### Project Structure
```
src/
??? routes/              # API endpoint definitions
?   ??? auth.ts         # Authentication endpoints
?   ??? requests.ts     # Service request CRUD operations
?   ??? admin.ts        # Admin functionality
?   ??? attachments.ts  # File upload handling
??? middleware/          # Express middleware functions
?   ??? auth.ts         # JWT authentication and authorization
?   ??? error.ts        # Global error handling
?   ??? logging.ts      # Request/response logging
?   ??? validation.ts   # Input validation with Zod
?   ??? featureFlags.ts # Feature flag injection
??? services/            # Business logic and external integrations
?   ??? authService.ts  # Authentication business logic
?   ??? requestService.ts # Request management logic
?   ??? featureFlags.ts # Feature flag management
??? utils/               # Helper functions and utilities
?   ??? statusMachine.ts # Request status workflow
?   ??? logger.ts       # Logging configuration
?   ??? correlationId.ts # Request tracking
??? types/               # TypeScript type definitions
?   ??? api.ts          # API request/response types
?   ??? database.ts     # Database entity types
?   ??? auth.ts         # Authentication types
??? config/              # Configuration and documentation
    ??? database.ts     # Database configuration
    ??? swagger.ts      # OpenAPI documentation
    ??? environment.ts  # Environment variable validation
```

### TypeScript Configuration
- Use strict TypeScript configuration with all strict flags enabled
- Define proper interfaces for all API requests and responses
- Use union types for status enums and role-based permissions
- Implement generic types for reusable patterns
- Use proper error types for structured error handling
- Define database entity types that match Prisma schema

### API Design Patterns
```typescript
// Consistent API response structure
interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: PaginationMeta;
    correlationId: string;
    timestamp: string;
  };
}

// Standard endpoint structure
router.get('/requests', 
  authenticateToken,
  validateQuery(GetRequestsSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { page, limit, status, category } = req.query;
      const userId = req.user.id;
      
      const result = await requestService.getRequests({
        page: Number(page) || 1,
        limit: Number(limit) || 25,
        status,
        category,
        userId: req.user.role === 'CITIZEN' ? userId : undefined
      });
      
      res.json({
        data: result.requests,
        meta: {
          pagination: result.pagination,
          correlationId: res.locals.correlationId,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      next(error);
    }
  }
);
```

### Authentication and Authorization
```typescript
// JWT middleware with role-based access
interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: {
        code: 'MISSING_TOKEN',
        message: 'Access token is required',
        correlationId: res.locals.correlationId
      }
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, name: true }
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'User not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(403).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Token is invalid or expired',
        correlationId: res.locals.correlationId
      }
    });
  }
};

// Role-based authorization middleware
export const requireRole = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You do not have permission to perform this action',
          correlationId: res.locals.correlationId
        }
      });
    }
    next();
  };
};
```

### Input Validation with Zod
```typescript
// Define validation schemas
const CreateRequestSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be less than 120 characters'),
  description: z.string()
    .min(30, 'Description must be at least 30 characters')
    .max(2000, 'Description is too long'),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  locationText: z.string().min(1, 'Location is required')
});

// Validation middleware
export const validateBody = <T>(schema: z.ZodSchema<T>) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors.map(err => ({
              field: err.path.join('.'),
              message: err.message
            })),
            correlationId: res.locals.correlationId
          }
        });
      } else {
        next(error);
      }
    }
  };
};
```

### Database Operations with Prisma
```typescript
// Service layer with proper error handling
export class RequestService {
  async createRequest(data: CreateRequestData, userId: string): Promise<ServiceRequest> {
    try {
      // Generate unique request code
      const code = await this.generateRequestCode();
      
      const request = await prisma.$transaction(async (tx) => {
        // Create the request
        const newRequest = await tx.serviceRequest.create({
          data: {
            ...data,
            code,
            status: 'SUBMITTED',
            creatorId: userId,
            version: 1
          },
          include: {
            creator: {
              select: { id: true, name: true, email: true }
            }
          }
        });

        // Log the creation event
        await tx.eventLog.create({
          data: {
            type: 'REQUEST_CREATED',
            requestId: newRequest.id,
            userId,
            payload: JSON.stringify({ action: 'create', status: 'SUBMITTED' })
          }
        });

        return newRequest;
      });

      logger.info('Service request created', {
        requestId: request.id,
        userId,
        correlationId: this.correlationId
      });

      return request;
    } catch (error) {
      logger.error('Failed to create service request', {
        error: error.message,
        userId,
        correlationId: this.correlationId
      });
      throw new Error('Failed to create service request');
    }
  }

  async updateRequestStatus(
    requestId: string,
    newStatus: RequestStatus,
    userId: string,
    reason?: string
  ): Promise<ServiceRequest> {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      throw new NotFoundError('Service request not found');
    }

    // Validate status transition
    if (!isValidStatusTransition(request.status, newStatus)) {
      throw new ValidationError(`Cannot transition from ${request.status} to ${newStatus}`);
    }

    // Update with optimistic locking
    try {
      const updatedRequest = await prisma.$transaction(async (tx) => {
        const updated = await tx.serviceRequest.update({
          where: { 
            id: requestId,
            version: request.version // Optimistic locking
          },
          data: {
            status: newStatus,
            version: request.version + 1,
            ...(newStatus === 'CLOSED' && { closedAt: new Date() })
          },
          include: {
            creator: true,
            assignee: true,
            department: true
          }
        });

        // Log status change
        await tx.eventLog.create({
          data: {
            type: 'STATUS_CHANGED',
            requestId,
            userId,
            payload: JSON.stringify({
              action: 'status_change',
              fromStatus: request.status,
              toStatus: newStatus,
              reason
            })
          }
        });

        return updated;
      });

      return updatedRequest;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new ConflictError('Request was modified by another user');
      }
      throw error;
    }
  }
}
```

### Feature Flag System
```typescript
// Feature flag service for testing scenarios
export class FeatureFlagService {
  private flags: Map<string, boolean> = new Map();

  async loadFlags(): Promise<void> {
    const dbFlags = await prisma.featureFlag.findMany();
    dbFlags.forEach(flag => {
      this.flags.set(flag.name, flag.enabled);
    });
  }

  isEnabled(flagName: string): boolean {
    return this.flags.get(flagName) || false;
  }

  async toggleFlag(flagName: string, enabled: boolean): Promise<void> {
    await prisma.featureFlag.upsert({
      where: { name: flagName },
      update: { enabled },
      create: { name: flagName, enabled, description: '' }
    });
    
    this.flags.set(flagName, enabled);
  }
}

// Middleware for feature flag injection
export const injectFeatureFlags = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const featureFlags = await featureFlagService.getAllFlags();
  res.locals.featureFlags = featureFlags;
  
  // Simulate random errors for testing
  if (featureFlags.API_Random500 && Math.random() < 0.05) {
    return res.status(500).json({
      error: {
        code: 'SIMULATED_ERROR',
        message: 'Random error for testing purposes',
        correlationId: res.locals.correlationId
      }
    });
  }
  
  // Simulate slow requests
  if (featureFlags.API_SlowRequests && Math.random() < 0.1) {
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  next();
};
```

### Error Handling
```typescript
// Custom error classes
export class AppError extends Error {
  public statusCode: number;
  public code: string;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND');
  }
}

// Global error handler middleware
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const correlationId = res.locals.correlationId;
  
  logger.error('API Error', {
    error: error.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    correlationId
  });

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        correlationId
      }
    });
  }

  // Prisma errors
  if (error.constructor.name === 'PrismaClientKnownRequestError') {
    const prismaError = error as any;
    if (prismaError.code === 'P2002') {
      return res.status(409).json({
        error: {
          code: 'DUPLICATE_ENTRY',
          message: 'A record with this data already exists',
          correlationId
        }
      });
    }
  }

  // Default error
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      correlationId
    }
  });
};
```

### Logging and Monitoring
```typescript
// Structured logging with Winston
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: {
    service: 'city-services-api',
    version: process.env.npm_package_version
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const correlationId = uuidv4();
  
  res.locals.correlationId = correlationId;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      method: req.method,
      url: req.originalUrl,
      statusCode: res.statusCode,
      duration,
      correlationId,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
};
```

### OpenAPI Documentation
```typescript
// Swagger configuration
export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'City Services API',
    version: '1.0.0',
    description: 'Municipal service management system API',
    contact: {
      name: 'API Support',
      email: 'support@cityservices.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001/api/v1',
      description: 'Development server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ServiceRequest: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          code: { type: 'string', example: 'REQ-2024-001' },
          title: { type: 'string', example: 'Pothole on Main Street' },
          description: { type: 'string' },
          status: { 
            type: 'string', 
            enum: ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']
          },
          priority: {
            type: 'string',
            enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT']
          },
          category: { type: 'string' },
          locationText: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' }
        },
        required: ['id', 'title', 'description', 'status', 'priority']
      }
    }
  },
  security: [{ bearerAuth: [] }]
};

// Route documentation example
/**
 * @swagger
 * /requests:
 *   get:
 *     summary: List service requests
 *     tags: [Service Requests]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of items per page
 *     responses:
 *       200:
 *         description: List of service requests
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/ServiceRequest'
 */
```

### Testing Integration
```typescript
// API testing with Jest and Supertest
describe('Service Requests API', () => {
  let authToken: string;
  
  beforeAll(async () => {
    // Setup test database
    await prisma.$executeRaw`DELETE FROM ServiceRequest`;
    await prisma.$executeRaw`DELETE FROM User`;
    
    // Create test user
    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        name: 'Test User',
        role: 'CITIZEN',
        passwordHash: await bcrypt.hash('password123', 12)
      }
    });
    
    // Generate auth token
    authToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '1h' }
    );
  });

  describe('POST /requests', () => {
    it('should create a new service request', async () => {
      const requestData = {
        title: 'Test Request',
        description: 'This is a test request description that is long enough',
        category: 'roads-transportation',
        priority: 'MEDIUM',
        locationText: '123 Main Street, City'
      };

      const response = await request(app)
        .post('/api/v1/requests')
        .set('Authorization', `Bearer ${authToken}`)
        .send(requestData)
        .expect(201);

      expect(response.body.data).toMatchObject({
        title: requestData.title,
        description: requestData.description,
        status: 'SUBMITTED',
        priority: 'MEDIUM'
      });
      
      expect(response.body.data.code).toMatch(/^REQ-\d{4}-\d{3}$/);
      expect(response.body.meta.correlationId).toBeDefined();
    });
  });
});
```

## Implementation Guidelines

### Development Process
1. **API Design**: Define OpenAPI specification first
2. **Database Schema**: Create Prisma models with proper relationships
3. **Validation**: Implement Zod schemas for request validation
4. **Authentication**: Add proper JWT middleware and role checks
5. **Business Logic**: Implement service layer with error handling
6. **Testing**: Write comprehensive API tests
7. **Documentation**: Update OpenAPI docs and add code comments
8. **Logging**: Add structured logging for monitoring
9. **Feature Flags**: Consider testing scenarios and error conditions

### Quality Gates
- [ ] TypeScript compilation passes without errors
- [ ] All API endpoints have OpenAPI documentation
- [ ] Input validation implemented with Zod schemas
- [ ] Proper error handling with structured responses
- [ ] Authentication and authorization properly implemented
- [ ] Database operations use transactions where appropriate
- [ ] Comprehensive logging with correlation IDs
- [ ] API tests cover happy path and error scenarios
- [ ] Feature flags integrated for testing scenarios
- [ ] Performance considerations for database queries

This Node.js and Express development approach ensures robust, secure, and well-documented APIs that support comprehensive testing and monitoring while maintaining high code quality standards.