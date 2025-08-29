import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const departmentMetricsQuerySchema = z.object({
  departmentId: z.string().optional(),
  metricType: z.enum(['avgResolutionTime', 'slaCompliance', 'firstCallResolution', 'satisfaction', 'requestVolume', 'escalationRate']).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional().default('1'),
  size: z.string().optional().default('20'),
  sort: z.string().optional().default('periodStart:desc'),
});

const qualityReviewSchema = z.object({
  requestId: z.string().uuid(),
  qualityScore: z.number().min(1).max(10),
  communicationScore: z.number().min(1).max(10),
  technicalAccuracyScore: z.number().min(1).max(10),
  timelinessScore: z.number().min(1).max(10),
  citizenSatisfactionScore: z.number().min(1).max(10),
  improvementSuggestions: z.string().optional(),
  followUpRequired: z.boolean().optional().default(false),
  calibrationSession: z.string().optional(),
});

const workloadAssignmentSchema = z.object({
  requestId: z.string().uuid(),
  assignedTo: z.string().uuid(),
  assignedFrom: z.string().uuid().optional(),
  assignmentReason: z.string().optional(),
  estimatedEffort: z.number().min(0).optional(),
  skillsRequired: z.array(z.string()).optional(),
  priorityWeight: z.number().min(0).max(100).optional(),
});

const performanceGoalSchema = z.object({
  userId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(1000),
  targetValue: z.number().optional(),
  currentValue: z.number().optional().default(0),
  unit: z.string().optional().default('count'),
  dueDate: z.string().datetime(),
  status: z.enum(['ACTIVE', 'ACHIEVED', 'MISSED', 'PAUSED']).optional().default('ACTIVE'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional().default('MEDIUM'),
});

const staffPerformanceQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  performancePeriod: z.string().optional(),
  role: z.enum(['CLERK', 'FIELD_AGENT', 'SUPERVISOR']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().optional().default('1'),
  size: z.string().optional().default('20'),
  sort: z.string().optional().default('createdAt:desc'),
});

// GET /api/v1/supervisor/department-metrics - Get department performance metrics
router.get('/department-metrics', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = departmentMetricsQuerySchema.parse(req.query);
    
    // Build where clause
    let where: any = {};
    
    // For supervisors, restrict to their department
    if (req.user?.role === 'SUPERVISOR' && req.user?.departmentId) {
      where.departmentId = req.user.departmentId;
    } else if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    
    if (query.metricType) {
      where.metricType = query.metricType;
    }
    
    if (query.period) {
      where.period = query.period;
    }
    
    if (query.startDate || query.endDate) {
      where.periodStart = {};
      if (query.startDate) {
        where.periodStart.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.periodStart.lte = new Date(query.endDate);
      }
    }

    // Parse sorting
    const sortParts = query.sort.split(':');
    const sortField = sortParts[0] || 'periodStart';
    const sortOrder = sortParts[1] === 'desc' ? 'desc' : 'asc';
    
    const allowedSortFields = ['metricType', 'value', 'period', 'periodStart', 'periodEnd', 'calculatedAt'];
    const orderBy = allowedSortFields.includes(sortField) 
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { periodStart: 'desc' as const };

    // Pagination
    const page = Math.max(1, parseInt(query.page));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.size)));
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await prisma.departmentMetrics.count({ where });

    // Get metrics with department info
    const metrics = await prisma.departmentMetrics.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        department: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.setHeader('X-Total-Count', totalCount.toString());
    
    res.json({
      data: metrics,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Department metrics fetch error:', error);
    
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
        message: 'Failed to fetch department metrics',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/supervisor/quality-reviews - Create quality review
router.post('/quality-reviews', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = qualityReviewSchema.parse(req.body);

    // Check if request exists and user has permission
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: validatedData.requestId },
      include: {
        department: true,
        assignee: true
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

    // Supervisors can only review requests in their department
    if (req.user?.role === 'SUPERVISOR' && req.user?.departmentId !== serviceRequest.departmentId) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only review requests in your department',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check if review already exists
    const existingReview = await prisma.qualityReview.findUnique({
      where: {
        requestId_reviewerId: {
          requestId: validatedData.requestId,
          reviewerId: req.user!.id
        }
      }
    });

    if (existingReview) {
      return res.status(409).json({
        error: {
          code: 'REVIEW_EXISTS',
          message: 'Quality review already exists for this request',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Create quality review
    const qualityReview = await prisma.qualityReview.create({
      data: {
        ...validatedData,
        reviewerId: req.user!.id,
      },
      include: {
        request: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      data: qualityReview,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Quality review creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid quality review data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create quality review',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/supervisor/quality-reviews - Get quality reviews
router.get('/quality-reviews', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = z.object({
      requestId: z.string().uuid().optional(),
      reviewerId: z.string().uuid().optional(),
      reviewStatus: z.enum(['PENDING', 'COMPLETED', 'ARCHIVED']).optional(),
      minQualityScore: z.string().optional(),
      maxQualityScore: z.string().optional(),
      page: z.string().optional().default('1'),
      size: z.string().optional().default('20'),
      sort: z.string().optional().default('createdAt:desc'),
    }).parse(req.query);
    
    // Build where clause
    let where: any = {};
    
    // For supervisors, restrict to their department's requests
    if (req.user?.role === 'SUPERVISOR' && req.user?.departmentId) {
      where.request = {
        departmentId: req.user.departmentId
      };
    }
    
    if (query.requestId) {
      where.requestId = query.requestId;
    }
    
    if (query.reviewerId) {
      where.reviewerId = query.reviewerId;
    }
    
    if (query.reviewStatus) {
      where.reviewStatus = query.reviewStatus;
    }
    
    if (query.minQualityScore || query.maxQualityScore) {
      where.qualityScore = {};
      if (query.minQualityScore) {
        where.qualityScore.gte = parseInt(query.minQualityScore);
      }
      if (query.maxQualityScore) {
        where.qualityScore.lte = parseInt(query.maxQualityScore);
      }
    }

    // Parse sorting
    const sortParts = query.sort.split(':');
    const sortField = sortParts[0] || 'createdAt';
    const sortOrder = sortParts[1] === 'desc' ? 'desc' : 'asc';
    
    const allowedSortFields = ['qualityScore', 'createdAt', 'updatedAt', 'communicationScore', 'technicalAccuracyScore'];
    const orderBy = allowedSortFields.includes(sortField) 
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { createdAt: 'desc' as const };

    // Pagination
    const page = Math.max(1, parseInt(query.page));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.size)));
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await prisma.qualityReview.count({ where });

    // Get reviews with related data
    const reviews = await prisma.qualityReview.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        request: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            category: true,
            priority: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.setHeader('X-Total-Count', totalCount.toString());
    
    res.json({
      data: reviews,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Quality reviews fetch error:', error);
    
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
        message: 'Failed to fetch quality reviews',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// PUT /api/v1/supervisor/quality-reviews/:id - Update quality review
router.put('/quality-reviews/:id', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const reviewId = req.params.id;
    const updateData = qualityReviewSchema.partial().parse(req.body);
    
    // Check if review exists and user has permission
    const existingReview = await prisma.qualityReview.findUnique({
      where: { id: reviewId },
      include: {
        request: {
          include: {
            department: true
          }
        }
      }
    });

    if (!existingReview) {
      return res.status(404).json({
        error: {
          code: 'REVIEW_NOT_FOUND',
          message: 'Quality review not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check edit permissions
    // Allow: 1) Admin, 2) Original reviewer, 3) Supervisor in same department
    const canEdit = 
      req.user?.role === 'ADMIN' || 
      existingReview.reviewerId === req.user?.id ||
      (req.user?.role === 'SUPERVISOR' && req.user?.departmentId === existingReview.request.department?.id);
    
    if (!canEdit) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only edit your own reviews or reviews in your department',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Update the review
    const updatedReview = await prisma.qualityReview.update({
      where: { id: reviewId },
      data: {
        ...updateData,
        updatedAt: new Date()
      },
      include: {
        request: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            category: true
          }
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      data: updatedReview,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Quality review update error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid quality review data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update quality review',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/supervisor/workload-assignments - Create workload assignment
router.post('/workload-assignments', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = workloadAssignmentSchema.parse(req.body);

    // Verify request exists and get current assignment
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: validatedData.requestId },
      include: {
        department: true,
        assignee: true
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

    // Supervisors can only assign requests in their department
    if (req.user?.role === 'SUPERVISOR' && req.user?.departmentId !== serviceRequest.departmentId) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only assign requests in your department',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Verify assignee exists and is in the same department
    const assignee = await prisma.user.findUnique({
      where: { id: validatedData.assignedTo }
    });

    if (!assignee) {
      return res.status(404).json({
        error: {
          code: 'ASSIGNEE_NOT_FOUND',
          message: 'Assignee not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    if (assignee.departmentId !== serviceRequest.departmentId) {
      return res.status(400).json({
        error: {
          code: 'INVALID_ASSIGNMENT',
          message: 'Cannot assign request to user from different department',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Deactivate any existing active assignments for this request
    await prisma.workloadAssignment.updateMany({
      where: {
        requestId: validatedData.requestId,
        isActive: true
      },
      data: {
        isActive: false,
        completedAt: new Date()
      }
    });

    // Create new workload assignment
    const workloadAssignment = await prisma.workloadAssignment.create({
      data: {
        ...validatedData,
        assignedBy: req.user!.id,
        assignedFrom: serviceRequest.assignedTo || undefined,
        skillsRequired: validatedData.skillsRequired ? JSON.stringify(validatedData.skillsRequired) : null,
      },
      include: {
        request: {
          select: {
            id: true,
            code: true,
            title: true,
            status: true,
            priority: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        previousUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // Update the service request assignment
    await prisma.serviceRequest.update({
      where: { id: validatedData.requestId },
      data: { assignedTo: validatedData.assignedTo }
    });

    res.status(201).json({
      data: workloadAssignment,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Workload assignment creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid workload assignment data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create workload assignment',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/supervisor/staff-performance - Get staff performance data
router.get('/staff-performance', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = staffPerformanceQuerySchema.parse(req.query);
    
    // Build where clause
    let where: any = {};
    
    // For supervisors, restrict to their department
    if (req.user?.role === 'SUPERVISOR' && req.user?.departmentId) {
      where.departmentId = req.user.departmentId;
    } else if (query.departmentId) {
      where.departmentId = query.departmentId;
    }
    
    if (query.userId) {
      where.userId = query.userId;
    }
    
    if (query.performancePeriod) {
      where.performancePeriod = query.performancePeriod;
    }
    
    if (query.role) {
      where.user = {
        role: query.role
      };
    }
    
    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate);
      }
    }

    // Parse sorting
    const sortParts = query.sort.split(':');
    const sortField = sortParts[0] || 'createdAt';
    const sortOrder = sortParts[1] === 'desc' ? 'desc' : 'asc';
    
    const allowedSortFields = ['performancePeriod', 'qualityScore', 'productivityScore', 'createdAt', 'updatedAt'];
    const orderBy = allowedSortFields.includes(sortField) 
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { createdAt: 'desc' as const };

    // Pagination
    const page = Math.max(1, parseInt(query.page));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.size)));
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await prisma.staffPerformance.count({ where });

    // Get performance data with user and department info
    const performance = await prisma.staffPerformance.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.setHeader('X-Total-Count', totalCount.toString());
    
    res.json({
      data: performance,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Staff performance fetch error:', error);
    
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
        message: 'Failed to fetch staff performance',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// PUT /api/v1/supervisor/staff-performance/:id/skills - Update staff skills assessment
router.put('/staff-performance/:id/skills', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const performanceId = req.params.id;
    const skillsData = req.body;

    // Check if the performance record exists
    const existingPerformance = await prisma.staffPerformance.findUnique({
      where: { id: performanceId },
      include: {
        user: true,
        department: true
      }
    });

    if (!existingPerformance) {
      return res.status(404).json({
        error: {
          code: 'PERFORMANCE_NOT_FOUND',
          message: 'Staff performance record not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check permission - supervisors can only update performance in their department
    if (req.user?.role === 'SUPERVISOR' && req.user?.departmentId !== existingPerformance.departmentId) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only update performance records in your department',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Update the skills assessment data
    const updatedPerformance = await prisma.staffPerformance.update({
      where: { id: performanceId },
      data: {
        // Store skills as additional metrics
        // In a real app, you might have a separate skills table
        qualityScore: (skillsData.communication + skillsData.problemSolving + skillsData.technical + 
                      skillsData.teamwork + skillsData.timeManagement + skillsData.customerService) / 6,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    res.json({
      data: updatedPerformance,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Skills assessment update error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update skills assessment',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/supervisor/performance-goals - Create performance goal
router.post('/performance-goals', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = performanceGoalSchema.parse(req.body);

    // Verify user exists and is in supervisor's department
    const targetUser = await prisma.user.findUnique({
      where: { id: validatedData.userId },
      include: { department: true }
    });

    if (!targetUser) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'Target user not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Supervisors can only create goals for users in their department
    if (req.user?.role === 'SUPERVISOR' && req.user?.departmentId !== targetUser.departmentId) {
      return res.status(403).json({
        error: {
          code: 'INSUFFICIENT_PERMISSIONS',
          message: 'You can only create goals for users in your department',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Create performance goal
    const performanceGoal = await prisma.performanceGoal.create({
      data: {
        ...validatedData,
        supervisorId: req.user!.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.status(201).json({
      data: performanceGoal,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Performance goal creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid performance goal data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create performance goal',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/supervisor/performance-goals - Get performance goals
router.get('/performance-goals', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = z.object({
      userId: z.string().uuid().optional(),
      status: z.enum(['ACTIVE', 'ACHIEVED', 'MISSED', 'CANCELLED']).optional(),
      priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
      dueSoon: z.boolean().optional(), // Goals due within 30 days
      page: z.string().optional().default('1'),
      size: z.string().optional().default('20'),
      sort: z.string().optional().default('dueDate:asc'),
    }).parse(req.query);
    
    // Build where clause
    let where: any = {};
    
    // For supervisors, restrict to their supervised goals
    if (req.user?.role === 'SUPERVISOR') {
      where.supervisorId = req.user.id;
    }
    
    if (query.userId) {
      where.userId = query.userId;
    }
    
    if (query.status) {
      where.status = query.status;
    }
    
    if (query.priority) {
      where.priority = query.priority;
    }
    
    if (query.dueSoon) {
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      where.dueDate = { lte: thirtyDaysFromNow };
      where.status = 'ACTIVE';
    }

    // Parse sorting
    const sortParts = query.sort.split(':');
    const sortField = sortParts[0] || 'dueDate';
    const sortOrder = sortParts[1] === 'desc' ? 'desc' : 'asc';
    
    const allowedSortFields = ['title', 'dueDate', 'status', 'priority', 'createdAt', 'targetValue', 'currentValue'];
    const orderBy = allowedSortFields.includes(sortField) 
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { dueDate: 'asc' as const };

    // Pagination
    const page = Math.max(1, parseInt(query.page));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.size)));
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await prisma.performanceGoal.count({ where });

    // Get goals with user info
    const goals = await prisma.performanceGoal.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.setHeader('X-Total-Count', totalCount.toString());
    
    res.json({
      data: goals,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Performance goals fetch error:', error);
    
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
        message: 'Failed to fetch performance goals',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// PUT /api/v1/supervisor/performance-goals/:id - Update performance goal
router.put('/performance-goals/:id', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const goalId = req.params.id;
    const updateData = req.body;

    // Check if goal exists
    const existingGoal = await prisma.performanceGoal.findUnique({
      where: { id: goalId },
      include: {
        user: true
      }
    });

    if (!existingGoal) {
      return res.status(404).json({
        error: {
          code: 'GOAL_NOT_FOUND',
          message: 'Performance goal not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check permission - supervisors can only update goals in their department
    if (req.user?.role === 'SUPERVISOR') {
      if (existingGoal.user.departmentId !== req.user.departmentId) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'You can only update goals for users in your department',
            correlationId: res.locals.correlationId
          }
        });
      }
    }

    // Update the goal
    const updatedGoal = await prisma.performanceGoal.update({
      where: { id: goalId },
      data: {
        title: updateData.title || existingGoal.title,
        description: updateData.description || existingGoal.description,
        targetValue: updateData.targetValue !== undefined ? updateData.targetValue : existingGoal.targetValue,
        currentValue: updateData.currentValue !== undefined ? updateData.currentValue : existingGoal.currentValue,
        unit: updateData.unit || existingGoal.unit,
        dueDate: updateData.dueDate ? new Date(updateData.dueDate) : existingGoal.dueDate,
        status: updateData.status || existingGoal.status,
        priority: updateData.priority || existingGoal.priority,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            firstName: true,
            lastName: true
          }
        },
        supervisor: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      data: updatedGoal,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Performance goal update error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update performance goal',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/supervisor/dashboard-summary - Get supervisor dashboard summary
router.get('/dashboard-summary', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // For supervisors, get data for their department only
    const departmentFilter = req.user?.role === 'SUPERVISOR' && req.user?.departmentId 
      ? { departmentId: req.user.departmentId }
      : {};

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get various metrics in parallel
    const [
      totalRequests,
      pendingRequests,
      resolvedRequests,
      avgQualityScore,
      activeGoals,
      overdueGoals,
      recentPerformance,
      upcomingDeadlines
    ] = await Promise.all([
      // Total requests in department (last 30 days)
      prisma.serviceRequest.count({
        where: {
          ...departmentFilter,
          createdAt: { gte: thirtyDaysAgo }
        }
      }),

      // Pending requests
      prisma.serviceRequest.count({
        where: {
          ...departmentFilter,
          status: { in: ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS'] }
        }
      }),

      // Resolved requests (last 30 days)
      prisma.serviceRequest.count({
        where: {
          ...departmentFilter,
          status: { in: ['RESOLVED', 'CLOSED'] },
          updatedAt: { gte: thirtyDaysAgo }
        }
      }),

      // Average quality score (last 30 days)
      prisma.qualityReview.aggregate({
        where: {
          createdAt: { gte: thirtyDaysAgo },
          ...(req.user?.role === 'SUPERVISOR' ? { reviewerId: req.user.id } : {})
        },
        _avg: { qualityScore: true }
      }),

      // Active performance goals
      prisma.performanceGoal.count({
        where: {
          ...(req.user?.role === 'SUPERVISOR' ? { supervisorId: req.user.id } : {}),
          status: 'ACTIVE'
        }
      }),

      // Overdue goals
      prisma.performanceGoal.count({
        where: {
          ...(req.user?.role === 'SUPERVISOR' ? { supervisorId: req.user.id } : {}),
          status: 'ACTIVE',
          dueDate: { lt: new Date() }
        }
      }),

      // Recent staff performance (if supervisor)
      req.user?.departmentId ? prisma.staffPerformance.findMany({
        where: {
          departmentId: req.user.departmentId,
          createdAt: { gte: thirtyDaysAgo }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { qualityScore: 'desc' },
        take: 5
      }) : [],

      // Upcoming goal deadlines (next 7 days)
      prisma.performanceGoal.findMany({
        where: {
          ...(req.user?.role === 'SUPERVISOR' ? { supervisorId: req.user.id } : {}),
          status: 'ACTIVE',
          dueDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
          }
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { dueDate: 'asc' },
        take: 5
      })
    ]);

    const summary = {
      departmentMetrics: {
        totalRequests,
        pendingRequests,
        resolvedRequests,
        resolutionRate: totalRequests > 0 ? (resolvedRequests / totalRequests * 100) : 0,
        avgQualityScore: avgQualityScore._avg.qualityScore || 0
      },
      performanceGoals: {
        active: activeGoals,
        overdue: overdueGoals,
        upcomingDeadlines: upcomingDeadlines.length
      },
      teamPerformance: {
        recentScores: recentPerformance,
        topPerformers: recentPerformance.slice(0, 3)
      },
      alerts: {
        overdueGoals,
        upcomingDeadlines: upcomingDeadlines.length,
        lowQualityAlerts: recentPerformance.filter(p => p.qualityScore && p.qualityScore < 3).length
      },
      recentActivity: {
        upcomingDeadlines
      }
    };

    res.json({
      data: summary,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Dashboard summary error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch dashboard summary',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;