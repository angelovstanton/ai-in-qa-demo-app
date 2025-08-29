import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import { MetricsCalculatorService } from '../services/metricsCalculator';
import NodeCache from 'node-cache';

const router = Router();
const prisma = new PrismaClient();
const metricsCalculator = new MetricsCalculatorService();

// Cache with 5-minute TTL for dashboard data
const dashboardCache = new NodeCache({ stdTTL: 300 }); // 5 minutes

// Validation schemas
const dashboardQuerySchema = z.object({
  period: z.enum(['today', '7days', '30days', '90days']).optional().default('30days'),
  refresh: z.boolean().optional().default(false)
});

const chartQuerySchema = z.object({
  period: z.enum(['7days', '30days', '90days', '12months']).optional().default('30days'),
  departmentId: z.string().uuid().optional(),
  granularity: z.enum(['daily', 'weekly', 'monthly']).optional()
});

interface CategoryStats {
  category: string;
  count: number;
  avgResolutionTime: number;
  percentage: number;
}

interface StaffUtilizationData {
  totalStaff: number;
  averageUtilization: number;
  overloadedStaff: number;
  underutilizedStaff: number;
  topPerformers: Array<{
    userId: string;
    name: string;
    utilizationRate: number;
    completedRequests: number;
  }>;
}

interface ActivitySummary {
  id: string;
  type: 'request_created' | 'request_assigned' | 'request_completed' | 'quality_review';
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  userName?: string;
  requestId?: string;
  requestCode?: string;
}

// GET /api/v1/dashboard/overview - Main dashboard overview data
router.get('/overview', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = dashboardQuerySchema.parse(req.query);
    
    // For supervisors, restrict to their department
    let departmentId: string | undefined = undefined;
    if (req.user?.role === 'SUPERVISOR' && req.user?.departmentId) {
      departmentId = req.user.departmentId;
    }

    const cacheKey = `overview_${departmentId || 'all'}_${query.period}`;
    
    // Check cache unless refresh is requested
    if (!query.refresh) {
      const cachedData = dashboardCache.get(cacheKey);
      if (cachedData) {
        return res.json({
          data: cachedData,
          cached: true,
          correlationId: res.locals.correlationId
        });
      }
    }

    // Calculate period boundaries
    const endDate = new Date();
    let startDate = new Date();
    
    switch (query.period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
    }

    const departmentFilter = departmentId ? { departmentId } : {};

    // Fetch all required data in parallel
    const [
      totalRequestsResult,
      pendingRequestsResult,
      overdueRequestsResult,
      completedRequestsResult,
      categoryStatsResult,
      recentActivitiesResult,
      departmentInfo
    ] = await Promise.all([
      // Total requests in period
      prisma.serviceRequest.count({
        where: {
          ...departmentFilter,
          createdAt: { gte: startDate, lte: endDate }
        }
      }),

      // Pending requests
      prisma.serviceRequest.count({
        where: {
          ...departmentFilter,
          status: { in: ['SUBMITTED', 'TRIAGED', 'IN_PROGRESS'] }
        }
      }),

      // Overdue requests (past SLA due date)
      prisma.serviceRequest.count({
        where: {
          ...departmentFilter,
          status: { notIn: ['RESOLVED', 'CLOSED', 'CANCELLED'] },
          slaDueAt: { lt: new Date() }
        }
      }),

      // Completed requests in period with resolution times
      prisma.serviceRequest.findMany({
        where: {
          ...departmentFilter,
          status: { in: ['RESOLVED', 'CLOSED'] },
          closedAt: { gte: startDate, lte: endDate }
        },
        select: {
          createdAt: true,
          closedAt: true,
          category: true
        }
      }),

      // Category distribution and stats
      prisma.serviceRequest.groupBy({
        by: ['category'],
        where: {
          ...departmentFilter,
          createdAt: { gte: startDate, lte: endDate }
        },
        _count: { category: true },
        _avg: { satisfactionRating: true },
        orderBy: { _count: { category: 'desc' } },
        take: 10
      }),

      // Recent activities
      prisma.eventLog.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // Last 24 hours
          request: departmentId ? { departmentId } : undefined
        },
        include: {
          request: {
            select: {
              code: true,
              title: true,
              creator: { select: { name: true } },
              assignee: { select: { name: true } }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),

      // Department info if filtering by department
      departmentId ? prisma.department.findUnique({
        where: { id: departmentId },
        select: { name: true, slug: true }
      }) : null
    ]);

    // Calculate average resolution time
    let avgResolutionTime = 0;
    if (completedRequestsResult.length > 0) {
      const totalTime = completedRequestsResult.reduce((sum, req) => {
        if (req.closedAt) {
          return sum + (req.closedAt.getTime() - req.createdAt.getTime());
        }
        return sum;
      }, 0);
      avgResolutionTime = totalTime / completedRequestsResult.length / (1000 * 60 * 60); // Convert to hours
    }

    // Calculate SLA compliance rate
    const slaEligibleRequests = await prisma.serviceRequest.count({
      where: {
        ...departmentFilter,
        createdAt: { gte: startDate, lte: endDate },
        slaDueAt: { not: null }
      }
    });

    const slaCompliantRequests = await prisma.serviceRequest.count({
      where: {
        ...departmentFilter,
        createdAt: { gte: startDate, lte: endDate },
        slaDueAt: { not: null },
        OR: [
          { closedAt: { not: null }, closedAt: { lte: prisma.serviceRequest.fields.slaDueAt } },
          { status: { notIn: ['RESOLVED', 'CLOSED'] }, slaDueAt: { gte: new Date() } }
        ]
      }
    });

    const slaComplianceRate = slaEligibleRequests > 0 ? (slaCompliantRequests / slaEligibleRequests) * 100 : 100;

    // Process category stats
    const totalCategoryRequests = categoryStatsResult.reduce((sum, cat) => sum + cat._count.category, 0);
    const topCategories: CategoryStats[] = categoryStatsResult.map(cat => {
      const categoryCompleted = completedRequestsResult.filter(req => req.category === cat.category);
      const avgTime = categoryCompleted.length > 0 
        ? categoryCompleted.reduce((sum, req) => {
            return sum + (req.closedAt ? req.closedAt.getTime() - req.createdAt.getTime() : 0);
          }, 0) / categoryCompleted.length / (1000 * 60 * 60)
        : 0;

      return {
        category: cat.category,
        count: cat._count.category,
        avgResolutionTime: avgTime,
        percentage: (cat._count.category / totalCategoryRequests) * 100
      };
    });

    // Get staff utilization data
    let staffUtilization: StaffUtilizationData = {
      totalStaff: 0,
      averageUtilization: 0,
      overloadedStaff: 0,
      underutilizedStaff: 0,
      topPerformers: []
    };

    if (departmentId) {
      const workloads = await metricsCalculator.calculateStaffWorkloads(departmentId);
      staffUtilization = {
        totalStaff: workloads.length,
        averageUtilization: workloads.length > 0 ? workloads.reduce((sum, w) => sum + w.utilizationRate, 0) / workloads.length : 0,
        overloadedStaff: workloads.filter(w => w.utilizationRate > 100).length,
        underutilizedStaff: workloads.filter(w => w.utilizationRate < 50).length,
        topPerformers: workloads.slice(0, 5).map(w => ({
          userId: w.userId,
          name: w.name,
          utilizationRate: w.utilizationRate,
          completedRequests: w.completedRequests
        }))
      };
    }

    // Process recent activities
    const recentActivity: ActivitySummary[] = recentActivitiesResult.map(log => {
      const payload = JSON.parse(log.payload);
      
      return {
        id: log.id,
        type: log.type as any,
        title: payload.title || `${log.type.replace('_', ' ')} activity`,
        description: payload.description || `Request ${log.request?.code}`,
        timestamp: log.createdAt,
        requestId: log.requestId,
        requestCode: log.request?.code,
        userName: payload.userName || log.request?.assignee?.name || log.request?.creator?.name
      };
    });

    const overviewData = {
      period: query.period,
      department: departmentInfo,
      metrics: {
        totalRequests: totalRequestsResult,
        pendingRequests: pendingRequestsResult,
        overdueRequests: overdueRequestsResult,
        completedRequests: completedRequestsResult.length,
        avgResolutionTime,
        slaComplianceRate
      },
      topCategories,
      staffUtilization,
      recentActivity,
      calculatedAt: new Date()
    };

    // Cache the result
    dashboardCache.set(cacheKey, overviewData);

    res.json({
      data: overviewData,
      cached: false,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Dashboard overview error:', error);
    
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
        message: 'Failed to fetch dashboard overview',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/dashboard/charts/request-trends - Request volume trends over time
router.get('/charts/request-trends', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = chartQuerySchema.parse(req.query);
    
    const departmentId = req.user?.role === 'SUPERVISOR' && req.user?.departmentId 
      ? req.user.departmentId 
      : query.departmentId;

    const cacheKey = `trends_${departmentId || 'all'}_${query.period}_${query.granularity}`;
    const cachedData = dashboardCache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        data: cachedData,
        cached: true,
        correlationId: res.locals.correlationId
      });
    }

    // Calculate date ranges and granularity
    const endDate = new Date();
    let startDate = new Date();
    let granularity = query.granularity || 'daily';

    switch (query.period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        granularity = 'daily';
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        granularity = granularity || 'daily';
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        granularity = granularity || 'weekly';
        break;
      case '12months':
        startDate.setFullYear(endDate.getFullYear() - 1);
        granularity = 'monthly';
        break;
    }

    const departmentFilter = departmentId ? { departmentId } : {};

    // Get raw request data
    const requests = await prisma.serviceRequest.findMany({
      where: {
        ...departmentFilter,
        createdAt: { gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        status: true,
        priority: true,
        category: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group data by time periods
    const trendsData = [];
    const current = new Date(startDate);
    
    while (current <= endDate) {
      const periodStart = new Date(current);
      let periodEnd = new Date(current);
      let label = '';

      switch (granularity) {
        case 'daily':
          periodEnd.setDate(current.getDate() + 1);
          label = current.toISOString().split('T')[0];
          current.setDate(current.getDate() + 1);
          break;
        case 'weekly':
          periodEnd.setDate(current.getDate() + 7);
          label = `Week of ${current.toISOString().split('T')[0]}`;
          current.setDate(current.getDate() + 7);
          break;
        case 'monthly':
          periodEnd.setMonth(current.getMonth() + 1);
          label = current.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
          current.setMonth(current.getMonth() + 1);
          break;
      }

      const periodRequests = requests.filter(req => 
        req.createdAt >= periodStart && req.createdAt < periodEnd
      );

      trendsData.push({
        period: label,
        periodStart,
        periodEnd,
        total: periodRequests.length,
        byPriority: {
          LOW: periodRequests.filter(r => r.priority === 'LOW').length,
          MEDIUM: periodRequests.filter(r => r.priority === 'MEDIUM').length,
          HIGH: periodRequests.filter(r => r.priority === 'HIGH').length,
          URGENT: periodRequests.filter(r => r.priority === 'URGENT').length
        },
        byStatus: {
          DRAFT: periodRequests.filter(r => r.status === 'DRAFT').length,
          SUBMITTED: periodRequests.filter(r => r.status === 'SUBMITTED').length,
          TRIAGED: periodRequests.filter(r => r.status === 'TRIAGED').length,
          IN_PROGRESS: periodRequests.filter(r => r.status === 'IN_PROGRESS').length,
          RESOLVED: periodRequests.filter(r => r.status === 'RESOLVED').length,
          CLOSED: periodRequests.filter(r => r.status === 'CLOSED').length,
          CANCELLED: periodRequests.filter(r => r.status === 'CANCELLED').length
        }
      });
    }

    const chartData = {
      period: query.period,
      granularity,
      trends: trendsData,
      summary: {
        totalRequests: requests.length,
        averagePerPeriod: trendsData.length > 0 ? requests.length / trendsData.length : 0,
        peakPeriod: trendsData.reduce((max, current) => 
          current.total > max.total ? current : max, trendsData[0] || { total: 0 }
        )
      }
    };

    dashboardCache.set(cacheKey, chartData);

    res.json({
      data: chartData,
      cached: false,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Request trends chart error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid chart parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate request trends chart',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/dashboard/charts/resolution-times - Resolution time analysis
router.get('/charts/resolution-times', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = chartQuerySchema.parse(req.query);
    
    const departmentId = req.user?.role === 'SUPERVISOR' && req.user?.departmentId 
      ? req.user.departmentId 
      : query.departmentId;

    const cacheKey = `resolution_times_${departmentId || 'all'}_${query.period}`;
    const cachedData = dashboardCache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        data: cachedData,
        cached: true,
        correlationId: res.locals.correlationId
      });
    }

    // Calculate date range
    const endDate = new Date();
    let startDate = new Date();
    
    switch (query.period) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '12months':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
    }

    const departmentFilter = departmentId ? { departmentId } : {};

    // Get resolved requests with timing data
    const resolvedRequests = await prisma.serviceRequest.findMany({
      where: {
        ...departmentFilter,
        status: { in: ['RESOLVED', 'CLOSED'] },
        closedAt: { not: null, gte: startDate, lte: endDate }
      },
      select: {
        createdAt: true,
        closedAt: true,
        category: true,
        priority: true,
        assignee: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Calculate resolution times
    const resolutionData = resolvedRequests.map(req => {
      const resolutionTime = req.closedAt 
        ? (req.closedAt.getTime() - req.createdAt.getTime()) / (1000 * 60 * 60) // Convert to hours
        : 0;

      return {
        requestId: req.createdAt.toISOString(), // Use as ID placeholder
        resolutionTime,
        category: req.category,
        priority: req.priority,
        assignee: req.assignee?.name || 'Unassigned',
        assigneeId: req.assignee?.id
      };
    });

    // Group by category
    const byCategory = resolutionData.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item.resolutionTime);
      return acc;
    }, {} as Record<string, number[]>);

    const categoryStats = Object.entries(byCategory).map(([category, times]) => ({
      category,
      average: times.reduce((sum, time) => sum + time, 0) / times.length,
      median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length
    }));

    // Group by assignee
    const byAssignee = resolutionData.reduce((acc, item) => {
      const key = item.assigneeId || 'unassigned';
      if (!acc[key]) {
        acc[key] = { name: item.assignee, times: [] };
      }
      acc[key].times.push(item.resolutionTime);
      return acc;
    }, {} as Record<string, { name: string; times: number[] }>);

    const assigneeStats = Object.entries(byAssignee).map(([id, data]) => ({
      assigneeId: id,
      assigneeName: data.name,
      average: data.times.reduce((sum, time) => sum + time, 0) / data.times.length,
      count: data.times.length
    }));

    const chartData = {
      period: query.period,
      summary: {
        totalResolved: resolvedRequests.length,
        averageResolutionTime: resolutionData.reduce((sum, r) => sum + r.resolutionTime, 0) / resolutionData.length || 0,
        medianResolutionTime: resolutionData.map(r => r.resolutionTime).sort((a, b) => a - b)[Math.floor(resolutionData.length / 2)] || 0
      },
      byCategory: categoryStats,
      byAssignee: assigneeStats.sort((a, b) => a.average - b.average),
      distribution: {
        under1Hour: resolutionData.filter(r => r.resolutionTime < 1).length,
        '1to4Hours': resolutionData.filter(r => r.resolutionTime >= 1 && r.resolutionTime < 4).length,
        '4to24Hours': resolutionData.filter(r => r.resolutionTime >= 4 && r.resolutionTime < 24).length,
        '1to7Days': resolutionData.filter(r => r.resolutionTime >= 24 && r.resolutionTime < 168).length,
        over7Days: resolutionData.filter(r => r.resolutionTime >= 168).length
      }
    };

    dashboardCache.set(cacheKey, chartData);

    res.json({
      data: chartData,
      cached: false,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Resolution times chart error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid chart parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate resolution times chart',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/dashboard/charts/staff-performance - Staff performance metrics
router.get('/charts/staff-performance', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = chartQuerySchema.parse(req.query);
    
    const departmentId = req.user?.role === 'SUPERVISOR' && req.user?.departmentId 
      ? req.user.departmentId 
      : query.departmentId;

    if (!departmentId) {
      return res.status(400).json({
        error: {
          code: 'DEPARTMENT_REQUIRED',
          message: 'Department ID is required for staff performance charts',
          correlationId: res.locals.correlationId
        }
      });
    }

    const cacheKey = `staff_performance_${departmentId}_${query.period}`;
    const cachedData = dashboardCache.get(cacheKey);
    
    if (cachedData) {
      return res.json({
        data: cachedData,
        cached: true,
        correlationId: res.locals.correlationId
      });
    }

    // Get current workloads
    const workloads = await metricsCalculator.calculateStaffWorkloads(departmentId);
    
    // Get historical performance data
    const performanceData = await prisma.staffPerformance.findMany({
      where: {
        departmentId,
        createdAt: {
          gte: new Date(Date.now() - (query.period === '7days' ? 7 : query.period === '30days' ? 30 : 90) * 24 * 60 * 60 * 1000)
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
      orderBy: { createdAt: 'desc' }
    });

    const chartData = {
      period: query.period,
      departmentId,
      currentWorkloads: workloads,
      historicalPerformance: performanceData,
      performanceSummary: {
        totalStaff: workloads.length,
        averageUtilization: workloads.length > 0 ? workloads.reduce((sum, w) => sum + w.utilizationRate, 0) / workloads.length : 0,
        topPerformer: workloads.length > 0 ? workloads.reduce((best, current) => 
          current.completedRequests > best.completedRequests ? current : best
        ) : null,
        performanceTrends: performanceData.reduce((acc, perf) => {
          const userId = perf.user.id;
          if (!acc[userId]) {
            acc[userId] = {
              userName: perf.user.name,
              periods: []
            };
          }
          acc[userId].periods.push({
            period: perf.performancePeriod,
            qualityScore: perf.qualityScore,
            productivityScore: perf.productivityScore,
            completedRequests: perf.completedRequests,
            createdAt: perf.createdAt
          });
          return acc;
        }, {} as Record<string, any>)
      }
    };

    dashboardCache.set(cacheKey, chartData);

    res.json({
      data: chartData,
      cached: false,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Staff performance chart error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid chart parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate staff performance chart',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/dashboard/refresh - Force refresh all cached dashboard data
router.post('/refresh', authenticateToken, rbacGuard(['SUPERVISOR', 'ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Clear all dashboard cache
    dashboardCache.flushAll();

    res.json({
      message: 'Dashboard cache refreshed successfully',
      timestamp: new Date(),
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Dashboard refresh error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to refresh dashboard cache',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;