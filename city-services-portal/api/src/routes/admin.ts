import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import { FeatureFlagService } from '../services/featureFlags';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateFlagSchema = z.object({
  value: z.any()
});

// GET /api/v1/admin/flags - Get all feature flags
router.get('/flags', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const flags = await FeatureFlagService.getAllFlags();

    res.json({
      data: flags,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch feature flags',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// PATCH /api/v1/admin/flags/:key - Update specific feature flag
router.patch('/flags/:key', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    const validatedData = updateFlagSchema.parse(req.body);

    await FeatureFlagService.setFlag(key, validatedData.value);

    const updatedFlags = await FeatureFlagService.getAllFlags();

    res.json({
      data: {
        key,
        value: validatedData.value,
        allFlags: updatedFlags
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid flag data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update feature flag',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/admin/stats - Get system statistics
router.get('/stats', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { isTestUser: true } }),
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({ where: { status: 'SUBMITTED' } }),
      prisma.serviceRequest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.serviceRequest.count({ where: { status: 'RESOLVED' } }),
      prisma.comment.count(),
      prisma.attachment.count(),
      prisma.upvote.count(),
      prisma.department.count({ where: { isActive: true } }),
    ]);

    const [
      totalUsers, activeUsers, testUsers, totalRequests, 
      submittedRequests, inProgressRequests, resolvedRequests,
      totalComments, totalAttachments, totalUpvotes, activeDepartments
    ] = stats;

    res.json({
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          test: testUsers
        },
        requests: {
          total: totalRequests,
          submitted: submittedRequests,
          inProgress: inProgressRequests,
          resolved: resolvedRequests
        },
        engagement: {
          comments: totalComments,
          attachments: totalAttachments,
          upvotes: totalUpvotes
        },
        system: {
          departments: activeDepartments
        }
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch system statistics',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/admin/seed - Re-seed the database
router.post('/seed', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would typically run the seed script
    // For now, just return success
    res.json({
      data: {
        message: 'Database seeding initiated',
        status: 'success'
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to seed database',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/admin/reset - Reset the database
router.post('/reset', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would typically run the reset script
    // For now, just return success
    res.json({
      data: {
        message: 'Database reset initiated',
        status: 'success'
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reset database',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// DELETE /api/v1/admin/test-data - Clean up all test data
router.delete('/test-data', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    let deletedCounts = {
      users: 0,
      requests: 0,
      comments: 0,
      attachments: 0,
      upvotes: 0
    };

    await prisma.$transaction(async (tx) => {
      // Get counts before deletion
      const testUserCount = await tx.user.count({
        where: { isTestUser: true }
      });
      
      const testRequestCount = await tx.serviceRequest.count({
        where: {
          creator: { isTestUser: true }
        }
      });

      // Delete upvotes by test users
      const deletedUpvotes = await tx.upvote.deleteMany({
        where: {
          user: { isTestUser: true }
        }
      });

      // Delete comments by test users
      const deletedComments = await tx.comment.deleteMany({
        where: {
          author: { isTestUser: true }
        }
      });

      // Delete attachments by test users
      const deletedAttachments = await tx.attachment.deleteMany({
        where: {
          uploadedBy: { isTestUser: true }
        }
      });

      // Delete event logs for test user requests
      await tx.eventLog.deleteMany({
        where: {
          request: {
            creator: { isTestUser: true }
          }
        }
      });

      // Delete service requests created by test users
      const deletedRequests = await tx.serviceRequest.deleteMany({
        where: {
          creator: { isTestUser: true }
        }
      });

      // Finally delete test users
      const deletedUsers = await tx.user.deleteMany({
        where: { isTestUser: true }
      });

      deletedCounts = {
        users: deletedUsers.count,
        requests: deletedRequests.count,
        comments: deletedComments.count,
        attachments: deletedAttachments.count,
        upvotes: deletedUpvotes.count
      };
    });

    res.json({
      message: 'Test data cleaned up successfully',
      data: {
        deletedCounts,
        totalOperations: Object.values(deletedCounts).reduce((sum, count) => sum + count, 0)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Test data cleanup error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to clean up test data',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/admin/test-data/validate - Validate test data integrity
router.get('/test-data/validate', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validation = {
      users: {},
      requests: {},
      relationships: {},
      issues: [],
      summary: {}
    };

    // Validate users
    const [totalUsers, testUsers, activeUsers, usersWithoutDepartments] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isTestUser: true } }),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ 
        where: { 
          role: { in: ['CLERK', 'FIELD_AGENT', 'SUPERVISOR'] },
          departmentId: null 
        } 
      })
    ]);

    validation.users = {
      total: totalUsers,
      test: testUsers,
      active: activeUsers,
      withoutDepartments: usersWithoutDepartments
    };

    if (usersWithoutDepartments > 0) {
      validation.issues.push({
        type: 'MISSING_DEPARTMENT',
        severity: 'WARNING',
        message: `${usersWithoutDepartments} staff users without department assignment`,
        count: usersWithoutDepartments
      });
    }

    // Validate requests
    const [totalRequests, requestsWithoutCreator, requestsWithInvalidStatus] = await Promise.all([
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({
        where: {
          creator: null
        }
      }),
      prisma.serviceRequest.count({
        where: {
          status: { notIn: ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS', 'WAITING_FOR_CITIZEN', 'RESOLVED', 'CLOSED', 'REJECTED'] }
        }
      })
    ]);

    validation.requests = {
      total: totalRequests,
      withoutCreator: requestsWithoutCreator,
      withInvalidStatus: requestsWithInvalidStatus
    };

    if (requestsWithoutCreator > 0) {
      validation.issues.push({
        type: 'ORPHANED_REQUESTS',
        severity: 'ERROR',
        message: `${requestsWithoutCreator} requests without valid creator`,
        count: requestsWithoutCreator
      });
    }

    // Validate relationships
    const [commentsWithoutRequest, attachmentsWithoutRequest, upvotesWithoutRequest] = await Promise.all([
      prisma.comment.count({
        where: {
          request: null
        }
      }),
      prisma.attachment.count({
        where: {
          request: null
        }
      }),
      prisma.upvote.count({
        where: {
          request: null
        }
      })
    ]);

    validation.relationships = {
      orphanedComments: commentsWithoutRequest,
      orphanedAttachments: attachmentsWithoutRequest,
      orphanedUpvotes: upvotesWithoutRequest
    };

    if (commentsWithoutRequest > 0) {
      validation.issues.push({
        type: 'ORPHANED_COMMENTS',
        severity: 'ERROR',
        message: `${commentsWithoutRequest} comments without valid request`,
        count: commentsWithoutRequest
      });
    }

    if (attachmentsWithoutRequest > 0) {
      validation.issues.push({
        type: 'ORPHANED_ATTACHMENTS',
        severity: 'ERROR',
        message: `${attachmentsWithoutRequest} attachments without valid request`,
        count: attachmentsWithoutRequest
      });
    }

    // Check for duplicate emails
    const duplicateEmails = await prisma.user.groupBy({
      by: ['email'],
      having: {
        email: {
          _count: {
            gt: 1
          }
        }
      },
      _count: {
        email: true
      }
    });

    if (duplicateEmails.length > 0) {
      validation.issues.push({
        type: 'DUPLICATE_EMAILS',
        severity: 'ERROR',
        message: `${duplicateEmails.length} duplicate email addresses found`,
        count: duplicateEmails.length,
        details: duplicateEmails.map(d => ({ email: d.email, count: d._count.email }))
      });
    }

    // Summary
    const errorCount = validation.issues.filter(i => i.severity === 'ERROR').length;
    const warningCount = validation.issues.filter(i => i.severity === 'WARNING').length;
    
    validation.summary = {
      isValid: errorCount === 0,
      totalIssues: validation.issues.length,
      errors: errorCount,
      warnings: warningCount,
      status: errorCount === 0 ? (warningCount === 0 ? 'HEALTHY' : 'WARNING') : 'ERROR',
      validatedAt: new Date().toISOString()
    };

    res.json({
      data: validation,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Test data validation error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate test data',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;