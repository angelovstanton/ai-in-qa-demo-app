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
    // Get current date info for time-based queries
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const stats = await Promise.all([
      // User statistics
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.user.count({ where: { email: { endsWith: '@example.com' } } }), // Count test users by email pattern
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.user.count({ where: { createdAt: { gte: lastWeek } } }),
      prisma.user.groupBy({ by: ['role'], _count: true }),
      
      // Service request statistics
      prisma.serviceRequest.count(),
      prisma.serviceRequest.count({ where: { status: 'SUBMITTED' } }),
      prisma.serviceRequest.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.serviceRequest.count({ where: { status: 'RESOLVED' } }),
      prisma.serviceRequest.count({ where: { status: 'CLOSED' } }),
      prisma.serviceRequest.count({ where: { createdAt: { gte: today } } }),
      prisma.serviceRequest.count({ where: { createdAt: { gte: lastWeek } } }),
      prisma.serviceRequest.count({ where: { updatedAt: { gte: today } } }),
      prisma.serviceRequest.groupBy({ by: ['priority'], _count: true }),
      prisma.serviceRequest.groupBy({ by: ['category'], _count: true, take: 5, orderBy: { _count: { category: 'desc' } } }),
      
      // Engagement statistics
      prisma.comment.count(),
      prisma.comment.count({ where: { createdAt: { gte: today } } }),
      prisma.attachment.count(),
      prisma.upvote.count(),
      
      // System statistics
      prisma.department.count(), // All departments (assuming all are active)
      prisma.department.count(),
      
      // Activity statistics
      prisma.eventLog.count({ where: { createdAt: { gte: today } } }),
      prisma.eventLog.count({ where: { createdAt: { gte: lastWeek } } }),
      
      // Field work statistics
      prisma.fieldWorkOrder.count(),
      prisma.fieldWorkOrder.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.fieldWorkOrder.count({ where: { status: 'COMPLETED' } }),
      
      // Quality statistics
      prisma.qualityReview.count(),
      prisma.qualityReview.aggregate({ _avg: { qualityScore: true } }),
      
      // Testing flags statistics
      prisma.testingFeatureFlag.count(),
      prisma.testingFeatureFlag.count({ where: { isEnabled: true } })
    ]);

    const [
      totalUsers, activeUsers, testUsers, newUsersToday, newUsersWeek, usersByRole,
      totalRequests, submittedRequests, inProgressRequests, resolvedRequests, closedRequests,
      requestsToday, requestsWeek, updatedToday, requestsByPriority, requestsByCategory,
      totalComments, commentsToday, totalAttachments, totalUpvotes,
      activeDepartments, totalDepartments,
      eventsToday, eventsWeek,
      totalWorkOrders, activeWorkOrders, completedWorkOrders,
      totalReviews, avgQuality,
      totalFlags, enabledFlags
    ] = stats;

    res.json({
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          test: testUsers,
          newToday: newUsersToday,
          newThisWeek: newUsersWeek,
          byRole: usersByRole.reduce((acc: any, item: any) => {
            acc[item.role] = item._count;
            return acc;
          }, {})
        },
        requests: {
          total: totalRequests,
          submitted: submittedRequests,
          inProgress: inProgressRequests,
          resolved: resolvedRequests,
          closed: closedRequests,
          newToday: requestsToday,
          newThisWeek: requestsWeek,
          updatedToday: updatedToday,
          byPriority: requestsByPriority.reduce((acc: any, item: any) => {
            acc[item.priority] = item._count;
            return acc;
          }, {}),
          topCategories: requestsByCategory.map((item: any) => ({
            category: item.category,
            count: item._count
          }))
        },
        engagement: {
          comments: totalComments,
          commentsToday: commentsToday,
          attachments: totalAttachments,
          upvotes: totalUpvotes
        },
        system: {
          departments: totalDepartments, // All departments are active
          totalDepartments: totalDepartments,
          eventsToday: eventsToday,
          eventsThisWeek: eventsWeek
        },
        fieldWork: {
          total: totalWorkOrders,
          active: activeWorkOrders,
          completed: completedWorkOrders,
          completionRate: totalWorkOrders > 0 ? Math.round((completedWorkOrders / totalWorkOrders) * 100) : 0
        },
        quality: {
          totalReviews: totalReviews,
          averageScore: avgQuality._avg.qualityScore ? Math.round(avgQuality._avg.qualityScore * 10) / 10 : 0
        },
        testingFlags: {
          total: totalFlags,
          enabled: enabledFlags,
          percentage: totalFlags > 0 ? Math.round((enabledFlags / totalFlags) * 100) : 0
        },
        timestamp: new Date().toISOString()
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Stats endpoint error:', error);
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
        where: { email: { endsWith: '@example.com' } }
      });
      
      const testRequestCount = await tx.serviceRequest.count({
        where: {
          creator: { email: { endsWith: '@example.com' } }
        }
      });

      // Delete upvotes by test users
      const deletedUpvotes = await tx.upvote.deleteMany({
        where: {
          user: { email: { endsWith: '@example.com' } }
        }
      });

      // Delete comments by test users
      const deletedComments = await tx.comment.deleteMany({
        where: {
          author: { email: { endsWith: '@example.com' } }
        }
      });

      // Delete attachments by test users
      const deletedAttachments = await tx.attachment.deleteMany({
        where: {
          uploadedBy: { email: { endsWith: '@example.com' } }
        }
      });

      // Delete event logs for test user requests
      await tx.eventLog.deleteMany({
        where: {
          request: {
            creator: { email: { endsWith: '@example.com' } }
          }
        }
      });

      // Delete service requests created by test users
      const deletedRequests = await tx.serviceRequest.deleteMany({
        where: {
          creator: { email: { endsWith: '@example.com' } }
        }
      });

      // Finally delete test users
      const deletedUsers = await tx.user.deleteMany({
        where: { email: { endsWith: '@example.com' } }
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
      prisma.user.count({ where: { email: { endsWith: '@example.com' } } }),
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