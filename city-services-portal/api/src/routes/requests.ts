import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import { isValidStatusTransition, ACTION_TO_STATUS, StatusAction } from '../utils/statusMachine';
import { FeatureFlagService } from '../services/featureFlags';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createRequestSchema = z.object({
  title: z.string().min(5).max(120),
  description: z.string().min(30),
  category: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  locationText: z.string().min(1)
});

const updateRequestSchema = z.object({
  title: z.string().min(5).max(120).optional(),
  description: z.string().min(30).optional(),
  category: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  locationText: z.string().min(1).optional()
});

const statusActionSchema = z.object({
  action: z.enum(['triage', 'start', 'wait_for_citizen', 'resolve', 'close', 'reject', 'reopen']),
  reason: z.string().optional(),
  assignedTo: z.string().optional()
});

const querySchema = z.object({
  status: z.string().optional(),
  category: z.string().optional(),
  priority: z.string().optional(),
  department: z.string().optional(),
  assignedTo: z.string().optional(),
  text: z.string().optional(),
  page: z.string().optional().default('1'),
  size: z.string().optional().default('10'),
  sort: z.string().optional().default('createdAt:desc'),
  createdBy: z.string().optional()
});

// Idempotency key storage (in production, use Redis or database)
const idempotencyKeys = new Map<string, any>();

// Generate request code
function generateRequestCode(): string {
  const year = new Date().getFullYear();
  const timestamp = Date.now().toString().slice(-6);
  return `REQ-${year}-${timestamp}`;
}

// GET /api/v1/requests - List service requests with filtering, sorting, pagination
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = querySchema.parse(req.query);
    
    // Build where clause for filtering
    const where: any = {};
    
    if (query.status) {
      where.status = query.status;
    }
    
    if (query.category) {
      where.category = { contains: query.category, mode: 'insensitive' };
    }
    
    if (query.priority) {
      where.priority = query.priority;
    }
    
    if (query.department) {
      where.department = { slug: query.department };
    }
    
    if (query.assignedTo) {
      where.assignedTo = query.assignedTo;
    }
    
    if (query.text) {
      where.OR = [
        { title: { contains: query.text, mode: 'insensitive' } },
        { description: { contains: query.text, mode: 'insensitive' } },
        { code: { contains: query.text, mode: 'insensitive' } }
      ];
    }

    // Filter by createdBy for citizens
    if (req.user!.role === 'CITIZEN' || query.createdBy) {
      const createdBy = query.createdBy || req.user!.id;
      where.createdBy = createdBy;
    }

    // Parse sorting - apply feature flag for wrong default sort
    const sortParts = query.sort.split(':');
    let sortField = sortParts[0] || 'createdAt';
    let sortOrder = sortParts[1] === 'asc' ? 'asc' : 'desc';
    
    // Feature flag: UI_WrongDefaultSort
    const shouldApplyWrongSort = await FeatureFlagService.shouldApplyWrongDefaultSort();
    if (shouldApplyWrongSort && query.sort === 'createdAt:desc') {
      sortField = 'title';
      sortOrder = 'asc';
    }
    
    // Whitelist allowed sort fields
    const allowedSortFields = ['createdAt', 'updatedAt', 'priority', 'status', 'title'];
    const orderBy = allowedSortFields.includes(sortField) 
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { createdAt: 'desc' as const };

    // Pagination
    const page = Math.max(1, parseInt(query.page));
    const pageSize = Math.min(50, Math.max(1, parseInt(query.size)));
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await prisma.serviceRequest.count({ where });

    // Get requests
    const requests = await prisma.serviceRequest.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        department: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: {
            comments: true,
            attachments: true
          }
        }
      }
    });

    res.setHeader('X-Total-Count', totalCount.toString());
    
    res.json({
      data: requests,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch service requests',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/requests - Create new service request
router.post('/', authenticateToken, rbacGuard(['CITIZEN', 'CLERK']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createRequestSchema.parse(req.body);
    const idempotencyKey = req.headers['idempotency-key'] as string;

    // Check idempotency key if provided
    if (idempotencyKey) {
      const existing = idempotencyKeys.get(idempotencyKey);
      if (existing) {
        return res.status(200).json({
          ...existing,
          correlationId: res.locals.correlationId
        });
      }
    }

    // Generate unique code
    let requestCode;
    let codeExists = true;
    let attempts = 0;
    
    while (codeExists && attempts < 10) {
      requestCode = generateRequestCode();
      const existing = await prisma.serviceRequest.findUnique({
        where: { code: requestCode }
      });
      codeExists = !!existing;
      attempts++;
    }

    if (codeExists) {
      return res.status(500).json({
        error: {
          code: 'CODE_GENERATION_FAILED',
          message: 'Failed to generate unique request code',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Create the request
    const serviceRequest = await prisma.serviceRequest.create({
      data: {
        code: requestCode!,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        priority: validatedData.priority,
        locationText: validatedData.locationText,
        createdBy: req.user!.id,
        status: 'SUBMITTED'
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        department: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    const response = {
      data: serviceRequest,
      correlationId: res.locals.correlationId
    };

    // Store idempotency key if provided
    if (idempotencyKey) {
      idempotencyKeys.set(idempotencyKey, response);
      // Clean up old keys after some time (simple approach)
      setTimeout(() => {
        idempotencyKeys.delete(idempotencyKey);
      }, 60 * 60 * 1000); // 1 hour
    }

    res.status(201).json(response);

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create service request',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/requests/:id - Get specific service request
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        department: {
          select: { id: true, name: true, slug: true }
        },
        comments: {
          include: {
            author: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        eventLogs: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!serviceRequest) {
      return res.status(404).json({
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Service request not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check permissions - citizens can only see their own requests
    if (req.user!.role === 'CITIZEN' && serviceRequest.createdBy !== req.user!.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view your own requests',
          correlationId: res.locals.correlationId
        }
      });
    }

    res.json({
      data: serviceRequest,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch service request',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// PATCH /api/v1/requests/:id - Update basic fields with optimistic locking
router.patch('/:id', authenticateToken, rbacGuard(['CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const ifMatch = req.headers['if-match'] as string;
    const validatedData = updateRequestSchema.parse(req.body);

    if (!ifMatch) {
      return res.status(400).json({
        error: {
          code: 'MISSING_IF_MATCH',
          message: 'If-Match header is required for optimistic locking',
          correlationId: res.locals.correlationId
        }
      });
    }

    const expectedVersion = parseInt(ifMatch);
    if (isNaN(expectedVersion)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_IF_MATCH',
          message: 'If-Match header must be a valid version number',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Get current request
    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!currentRequest) {
      return res.status(404).json({
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Service request not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check version for optimistic locking
    if (currentRequest.version !== expectedVersion) {
      return res.status(409).json({
        error: {
          code: 'VERSION_CONFLICT',
          message: 'Request has been modified by another user',
          details: {
            currentVersion: currentRequest.version,
            expectedVersion
          },
          correlationId: res.locals.correlationId
        }
      });
    }

    // Update the request
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id },
      data: {
        ...validatedData,
        version: { increment: 1 },
        updatedAt: new Date()
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true }
        },
        assignee: {
          select: { id: true, name: true, email: true }
        },
        department: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    res.json({
      data: updatedRequest,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update service request',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/requests/:id/status - Change request status with state machine validation
router.post('/:id/status', authenticateToken, rbacGuard(['CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = statusActionSchema.parse(req.body);
    const { action, reason, assignedTo } = validatedData;

    // Get current request
    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id }
    });

    if (!currentRequest) {
      return res.status(404).json({
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Service request not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Get target status from action
    const targetStatus = ACTION_TO_STATUS[action as StatusAction];
    
    // Validate state transition
    if (!isValidStatusTransition(currentRequest.status, targetStatus)) {
      return res.status(422).json({
        error: {
          code: 'INVALID_STATUS_TRANSITION',
          message: `Cannot transition from ${currentRequest.status} to ${targetStatus}`,
          details: {
            currentStatus: currentRequest.status,
            targetStatus,
            action
          },
          correlationId: res.locals.correlationId
        }
      });
    }

    // Prepare update data
    const updateData: any = {
      status: targetStatus,
      version: { increment: 1 },
      updatedAt: new Date()
    };

    // Handle special status changes
    if (targetStatus === 'RESOLVED' || targetStatus === 'CLOSED') {
      updateData.closedAt = new Date();
    }

    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }

    // Update the request in a transaction with event log
    const result = await prisma.$transaction(async (tx) => {
      // Update the request
      const updatedRequest = await tx.serviceRequest.update({
        where: { id },
        data: updateData,
        include: {
          creator: {
            select: { id: true, name: true, email: true }
          },
          assignee: {
            select: { id: true, name: true, email: true }
          },
          department: {
            select: { id: true, name: true, slug: true }
          }
        }
      });

      // Create event log entry
      await tx.eventLog.create({
        data: {
          requestId: id,
          type: 'STATUS_CHANGE',
          payload: JSON.stringify({
            action,
            fromStatus: currentRequest.status,
            toStatus: targetStatus,
            reason,
            assignedTo,
            userId: req.user!.id,
            timestamp: new Date()
          })
        }
      });

      return updatedRequest;
    });

    res.json({
      data: result,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid status action data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to change request status',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;