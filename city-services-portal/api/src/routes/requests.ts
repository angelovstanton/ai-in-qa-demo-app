import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import { isValidStatusTransition, ACTION_TO_STATUS, StatusAction } from '../utils/statusMachine';
import { FeatureFlagService } from '../services/featureFlags';

const router = Router();
const prisma = new PrismaClient();

// Helper function to transform service request data
function transformServiceRequest(request: any) {
  return {
    ...request,
    affectedServices: request.affectedServices ? JSON.parse(request.affectedServices) : null,
    additionalContacts: request.additionalContacts ? JSON.parse(request.additionalContacts) : null,
    upvotes: request._count?.upvotes || 0,
    // Only use count if comments array is not present, otherwise preserve the comments
    ...(request.comments && Array.isArray(request.comments) ? {} : { comments: request._count?.comments || 0 }),
  };
}

// Validation schemas
const createRequestSchema = z.object({
  // Basic Information
  title: z.string().min(5).max(120),
  description: z.string().min(30),
  category: z.string(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  
  // Date fields
  dateOfRequest: z.string().datetime().optional(),
  
  // Location fields
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  locationText: z.string().min(1),
  landmark: z.string().optional(),
  accessInstructions: z.string().optional(),
  
  // Contact fields
  contactMethod: z.enum(['EMAIL', 'PHONE', 'SMS']).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  bestTimeToContact: z.string().optional(),
  
  // Mailing address
  mailingStreetAddress: z.string().optional(),
  mailingCity: z.string().optional(),
  mailingPostalCode: z.string().optional(),
  
  // Issue details
  issueType: z.string().optional(),
  severity: z.number().min(1).max(10).optional(),
  isRecurring: z.boolean().optional().default(false),
  isEmergency: z.boolean().optional().default(false),
  hasPermits: z.boolean().optional().default(false),
  
  // Service impact
  affectedServices: z.array(z.string()).optional(),
  estimatedValue: z.number().min(0).optional(),
  
  // Additional contacts
  additionalContacts: z.array(z.object({
    name: z.string(),
    phone: z.string(),
    relationship: z.string()
  })).optional(),
  
  // User experience
  satisfactionRating: z.number().min(1).max(5).optional(),
  formComments: z.string().optional(),
  
  // Legal and preferences
  agreesToTerms: z.boolean().optional().default(true),
  wantsUpdates: z.boolean().optional().default(true),
  
  // Scheduled service
  preferredDate: z.string().datetime().optional(),
  preferredTime: z.string().optional(),
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

const createCommentSchema = z.object({
  content: z.string().min(10).max(1000),
  isPrivate: z.boolean().default(false)
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
  createdBy: z.string().optional(),
  showAll: z.string().optional() // If 'true', don't filter by current user for citizens
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
  // Build where clause for filtering
  let where: any = {};
  
  try {
    const query = querySchema.parse(req.query);
    
    if (query.status) {
      // Handle comma-separated status values (e.g., "RESOLVED,CLOSED")
      if (query.status.includes(',')) {
        where.status = { in: query.status.split(',').map(s => s.trim()) };
      } else {
        where.status = query.status;
      }
    }
    
    if (query.category) {
      where.category = { contains: query.category,  };
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
        { title: { contains: query.text } },
        { description: { contains: query.text } },
        { code: { contains: query.text } },
        { locationText: { contains: query.text } },
        { category: { contains: query.text } }
      ];
    }

    // Filter by createdBy for citizens (unless showAll is specified)
    if (query.createdBy) {
      // Specific user filter requested
      where.createdBy = query.createdBy;
    } else if (req.user!.role === 'CITIZEN' && query.showAll !== 'true') {
      // Citizens can only see their own requests unless showAll=true is specified
      where.createdBy = req.user!.id;
    }
    // Staff and citizens with showAll=true can see all requests

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

    // Get requests - handle empty results gracefully
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
            attachments: true,
            upvotes: true
          }
        }
      }
    });

    res.setHeader('X-Total-Count', totalCount.toString());
    
    res.json({
      data: requests.map(transformServiceRequest),
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Service requests fetch error:', error);
    console.error('Query parameters:', req.query);
    console.error('Where clause:', JSON.stringify(where, null, 2));
    
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
        
        // Date fields
        dateOfRequest: validatedData.dateOfRequest ? new Date(validatedData.dateOfRequest) : new Date(),
        
        // Location fields
        streetAddress: validatedData.streetAddress,
        city: validatedData.city,
        postalCode: validatedData.postalCode,
        locationText: validatedData.locationText,
        landmark: validatedData.landmark,
        accessInstructions: validatedData.accessInstructions,
        
        // Contact fields
        contactMethod: validatedData.contactMethod,
        email: validatedData.email,
        phone: validatedData.phone,
        alternatePhone: validatedData.alternatePhone,
        bestTimeToContact: validatedData.bestTimeToContact,
        
        // Mailing address
        mailingStreetAddress: validatedData.mailingStreetAddress,
        mailingCity: validatedData.mailingCity,
        mailingPostalCode: validatedData.mailingPostalCode,
        
        // Issue details
        issueType: validatedData.issueType,
        severity: validatedData.severity,
        isRecurring: validatedData.isRecurring,
        isEmergency: validatedData.isEmergency,
        hasPermits: validatedData.hasPermits,
        
        // Service impact
        affectedServices: validatedData.affectedServices ? JSON.stringify(validatedData.affectedServices) : null,
        estimatedValue: validatedData.estimatedValue,
        
        // Additional contacts
        additionalContacts: validatedData.additionalContacts ? JSON.stringify(validatedData.additionalContacts) : null,
        
        // User experience
        satisfactionRating: validatedData.satisfactionRating,
        formComments: validatedData.formComments,
        
        // Legal and preferences
        agreesToTerms: validatedData.agreesToTerms,
        wantsUpdates: validatedData.wantsUpdates,
        
        // Scheduled service
        preferredDate: validatedData.preferredDate ? new Date(validatedData.preferredDate) : null,
        preferredTime: validatedData.preferredTime,
        
        // System fields
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
      data: transformServiceRequest(serviceRequest),
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
          where: {
            OR: [
              { visibility: 'PUBLIC' },
              // Staff can see internal comments
              ...(req.user!.role !== 'CITIZEN' ? [{ visibility: 'INTERNAL' }] : [])
            ]
          },
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
        },
        _count: {
          select: {
            comments: true,
            attachments: true,
            upvotes: true
          }
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

    // Citizens can view all requests for transparency (matching the list view permissions)
    // No additional authorization restrictions needed for viewing request details

    // Check if current user has upvoted this request
    let hasUserUpvoted = false;
    if (req.user!.role === 'CITIZEN') {
      const existingUpvote = await prisma.upvote.findUnique({
        where: {
          userId_requestId: {
            userId: req.user!.id,
            requestId: serviceRequest.id
          }
        }
      });
      hasUserUpvoted = !!existingUpvote;
    }

    const transformedRequest = transformServiceRequest(serviceRequest);
    transformedRequest.hasUserUpvoted = hasUserUpvoted;

    res.json({
      data: transformedRequest,
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
router.patch('/:id', authenticateToken, rbacGuard(['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
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

    // Additional permission checks for citizens
    if (req.user!.role === 'CITIZEN') {
      // Citizens can only edit their own requests
      if (currentRequest.createdBy !== req.user!.id) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You can only edit your own requests',
            correlationId: res.locals.correlationId
          }
        });
      }

      // Citizens can only edit within 10 minutes of creation
      const createdAt = new Date(currentRequest.createdAt);
      const now = new Date();
      const minutesSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
      
      if (minutesSinceCreation > 10) {
        return res.status(403).json({
          error: {
            code: 'EDIT_TIME_EXPIRED',
            message: 'Requests can only be edited within 10 minutes of creation',
            correlationId: res.locals.correlationId
          }
        });
      }
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

// POST /api/v1/requests/:id/comments - Add comment to service request
router.post('/:id/comments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: requestId } = req.params;
    const body = createCommentSchema.parse(req.body);

    // Check if request exists
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
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

    // Check permissions - citizens can only comment on their own requests or public requests
    if (req.user!.role === 'CITIZEN' && serviceRequest.createdBy !== req.user!.id) {
      // Allow comments on public requests, but restrict private comments
      if (body.isPrivate) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You cannot add private comments to requests you did not create',
            correlationId: res.locals.correlationId
          }
        });
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        requestId,
        authorId: req.user!.id,
        body: body.content,
        visibility: body.isPrivate ? 'INTERNAL' : 'PUBLIC'
      },
      include: {
        author: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    // Log the comment creation
    await prisma.eventLog.create({
      data: {
        requestId,
        type: 'COMMENT_ADDED',
        payload: JSON.stringify({
          commentId: comment.id,
          visibility: comment.visibility,
          authorId: req.user!.id,
          authorName: req.user!.name
        })
      }
    });

    res.status(201).json({
      data: comment,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid comment data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create comment',
        correlationId: res.locals.correlationId
      }
    });
  }
});





// POST /api/v1/requests/:id/upvote - Upvote a service request
router.post('/:id/upvote', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    
    // Check if request exists
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Service request not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Citizens can only upvote requests they didn't create
    if (req.user!.role === 'CITIZEN' && request.createdBy === req.user!.id) {
      return res.status(403).json({
        error: {
          code: 'CANNOT_UPVOTE_OWN_REQUEST',
          message: 'You cannot upvote your own request',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check if user has already upvoted this request
    const existingUpvote = await prisma.upvote.findUnique({
      where: {
        userId_requestId: {
          userId: req.user!.id,
          requestId: requestId
        }
      }
    });

    if (existingUpvote) {
      // Remove the upvote (toggle functionality)
      await prisma.upvote.delete({
        where: {
          userId_requestId: {
            userId: req.user!.id,
            requestId: requestId
          }
        }
      });

      // Get the updated upvote count
      const upvoteCount = await prisma.upvote.count({
        where: { requestId: requestId }
      });

      // Log the upvote removal event
      await prisma.eventLog.create({
        data: {
          type: 'UPVOTE_REMOVED',
          requestId: requestId,
          payload: JSON.stringify({
            removedBy: req.user!.id,
            removedByName: req.user!.name,
            newUpvoteCount: upvoteCount
          })
        }
      });

      return res.status(200).json({
        data: {
          hasUpvoted: false,
          upvoteCount: upvoteCount
        },
        message: 'Upvote removed successfully',
        correlationId: res.locals.correlationId
      });
    }

    // Create upvote
    await prisma.upvote.create({
      data: {
        userId: req.user!.id,
        requestId: requestId
      }
    });

    // Get the updated upvote count
    const upvoteCount = await prisma.upvote.count({
      where: { requestId: requestId }
    });

    // Log the upvote event
    await prisma.eventLog.create({
      data: {
        type: 'UPVOTE',
        requestId: requestId,
        payload: JSON.stringify({
          upvotedBy: req.user!.id,
          upvotedByName: req.user!.name,
          newUpvoteCount: upvoteCount
        })
      }
    });

    res.status(201).json({
      data: {
        hasUpvoted: true,
        upvoteCount: upvoteCount
      },
      message: 'Request upvoted successfully',
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Upvote error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upvote request',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/requests/:id/assign - Assign request to user
router.post('/:id/assign', authenticateToken, rbacGuard(['CLERK', 'SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const requestId = req.params.id;
    const { assignedTo, departmentId } = req.body;

    if (!assignedTo || !departmentId) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'assignedTo and departmentId are required',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check if request exists
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Service request not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Verify assignee exists and is active
    const assignee = await prisma.user.findUnique({
      where: { id: assignedTo }
    });

    if (!assignee || !assignee.isActive) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ASSIGNEE',
          message: 'Assignee not found or inactive',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Update request
    const updatedRequest = await prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        assignedTo,
        departmentId,
        status: request.status === 'SUBMITTED' ? 'TRIAGED' : request.status,
        version: { increment: 1 }
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        department: { select: { id: true, name: true, slug: true } }
      }
    });

    // Log assignment
    await prisma.eventLog.create({
      data: {
        requestId,
        type: 'ASSIGNMENT',
        payload: JSON.stringify({
          assignedTo,
          assignedBy: req.user!.id,
          assignedByName: req.user!.name,
          assigneeName: assignee.name,
          departmentId
        })
      }
    });

    res.json({
      data: updatedRequest,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Assignment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to assign request',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/requests/bulk - Create multiple requests
router.post('/bulk', authenticateToken, rbacGuard(['ADMIN', 'CLERK']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requests: requestsData } = req.body;

    if (!Array.isArray(requestsData) || requestsData.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'requests array is required and cannot be empty',
          correlationId: res.locals.correlationId
        }
      });
    }

    if (requestsData.length > 100) {
      return res.status(400).json({
        error: {
          code: 'BULK_LIMIT_EXCEEDED',
          message: 'Maximum 100 requests allowed per bulk operation',
          correlationId: res.locals.correlationId
        }
      });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < requestsData.length; i++) {
      try {
        const requestData = createRequestSchema.parse(requestsData[i]);
        
        // Generate unique code
        const requestCode = generateRequestCode();
        
        // Create request
        const request = await prisma.serviceRequest.create({
          data: {
            ...requestData,
            code: requestCode,
            createdBy: req.user!.id,
            status: 'SUBMITTED',
            affectedServices: requestData.affectedServices ? JSON.stringify(requestData.affectedServices) : null,
            additionalContacts: requestData.additionalContacts ? JSON.stringify(requestData.additionalContacts) : null
          },
          include: {
            creator: { select: { id: true, name: true, email: true } }
          }
        });

        results.push(request);

      } catch (error) {
        errors.push({
          index: i,
          error: error instanceof Error ? error.message : 'Unknown error',
          data: requestsData[i]
        });
      }
    }

    res.status(201).json({
      data: {
        created: results,
        errors: errors,
        summary: {
          total: requestsData.length,
          created: results.length,
          failed: errors.length
        }
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Bulk request creation error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create bulk requests',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// DELETE /api/v1/requests/bulk - Delete multiple requests
router.delete('/bulk', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { requestIds } = req.body;

    if (!Array.isArray(requestIds) || requestIds.length === 0) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'requestIds array is required and cannot be empty',
          correlationId: res.locals.correlationId
        }
      });
    }

    if (requestIds.length > 100) {
      return res.status(400).json({
        error: {
          code: 'BULK_LIMIT_EXCEEDED',
          message: 'Maximum 100 requests allowed per bulk delete operation',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Get requests to verify they exist
    const requests = await prisma.serviceRequest.findMany({
      where: { id: { in: requestIds } },
      select: { id: true, code: true, title: true, status: true }
    });

    if (requests.length !== requestIds.length) {
      return res.status(404).json({
        error: {
          code: 'SOME_REQUESTS_NOT_FOUND',
          message: `Found ${requests.length} out of ${requestIds.length} requests`,
          correlationId: res.locals.correlationId
        }
      });
    }

    // Delete related data first (in transaction)
    const deletedCount = await prisma.$transaction(async (tx) => {
      // Delete upvotes
      await tx.upvote.deleteMany({
        where: { requestId: { in: requestIds } }
      });

      // Delete comments
      await tx.comment.deleteMany({
        where: { requestId: { in: requestIds } }
      });

      // Delete attachments
      await tx.attachment.deleteMany({
        where: { requestId: { in: requestIds } }
      });

      // Delete event logs
      await tx.eventLog.deleteMany({
        where: { requestId: { in: requestIds } }
      });

      // Delete requests
      const result = await tx.serviceRequest.deleteMany({
        where: { id: { in: requestIds } }
      });

      return result.count;
    });

    res.json({
      message: `Successfully deleted ${deletedCount} requests`,
      data: {
        deletedCount,
        requestIds: requestIds
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Bulk request deletion error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete bulk requests',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;