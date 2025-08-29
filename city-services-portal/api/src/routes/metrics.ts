import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import { MetricsCalculatorService, TimePeriod } from '../services/metricsCalculator';
import { metricsScheduler } from '../services/metricsScheduler';

const router = Router();
const prisma = new PrismaClient();
const metricsCalculator = new MetricsCalculatorService();

// Validation schemas
const triggerCalculationSchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']),
  departmentId: z.string().uuid().optional()
});

const metricsQuerySchema = z.object({
  departmentId: z.string().uuid().optional(),
  metricType: z.enum(['avgResolutionTime', 'slaCompliance', 'firstCallResolution', 'citizenSatisfaction', 'requestVolume', 'escalationRate', 'staffUtilization']).optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'quarterly']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  limit: z.string().optional().default('50'),
  sort: z.string().optional().default('calculatedAt:desc'),
});

const jobControlSchema = z.object({
  action: z.enum(['start', 'stop', 'restart']),
  jobName: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'all']).optional()
});

// POST /api/v1/metrics/calculate - Trigger immediate metrics calculation
router.post('/calculate', authenticateToken, rbacGuard(['ADMIN', 'SUPERVISOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { period, departmentId } = triggerCalculationSchema.parse(req.body);

    if (departmentId) {
      // Calculate for specific department
      const metrics = await metricsCalculator.generateDepartmentReport(departmentId, period);
      await metricsCalculator.storeDepartmentMetrics(metrics);

      res.json({
        message: `${period} metrics calculated successfully for department ${departmentId}`,
        data: {
          departmentId,
          period,
          metricsCalculated: {
            avgResolutionTime: metrics.avgResolutionTime,
            slaCompliance: metrics.slaCompliance,
            firstCallResolution: metrics.firstCallResolution,
            citizenSatisfaction: metrics.citizenSatisfaction,
            requestVolume: metrics.requestVolume,
            escalationRate: metrics.escalationRate,
            staffUtilization: metrics.staffUtilization
          },
          calculatedAt: metrics.calculatedAt
        },
        correlationId: res.locals.correlationId
      });
    } else {
      // Trigger calculation for all departments
      await metricsScheduler.triggerImmediateCalculation(period);

      res.json({
        message: `${period} metrics calculation triggered for all departments`,
        correlationId: res.locals.correlationId
      });
    }

  } catch (error) {
    console.error('Metrics calculation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid calculation parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to calculate metrics',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/metrics/historical - Get historical metrics data
router.get('/historical', authenticateToken, rbacGuard(['ADMIN', 'SUPERVISOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = metricsQuerySchema.parse(req.query);
    
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
      where.calculatedAt = {};
      if (query.startDate) {
        where.calculatedAt.gte = new Date(query.startDate);
      }
      if (query.endDate) {
        where.calculatedAt.lte = new Date(query.endDate);
      }
    }

    // Parse sorting
    const sortParts = query.sort.split(':');
    const sortField = sortParts[0] || 'calculatedAt';
    const sortOrder = sortParts[1] === 'desc' ? 'desc' : 'asc';
    
    const allowedSortFields = ['metricType', 'value', 'period', 'periodStart', 'calculatedAt'];
    const orderBy = allowedSortFields.includes(sortField) 
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { calculatedAt: 'desc' as const };

    const limit = Math.min(1000, Math.max(1, parseInt(query.limit)));

    // Get historical metrics
    const metrics = await prisma.departmentMetrics.findMany({
      where,
      orderBy,
      take: limit,
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

    // Group metrics by department and metric type for trend analysis
    const trendAnalysis: Record<string, Record<string, any[]>> = {};
    
    metrics.forEach(metric => {
      const deptKey = metric.department.name;
      const metricKey = metric.metricType;
      
      if (!trendAnalysis[deptKey]) {
        trendAnalysis[deptKey] = {};
      }
      
      if (!trendAnalysis[deptKey][metricKey]) {
        trendAnalysis[deptKey][metricKey] = [];
      }
      
      trendAnalysis[deptKey][metricKey].push({
        value: metric.value,
        period: metric.period,
        periodStart: metric.periodStart,
        calculatedAt: metric.calculatedAt
      });
    });

    res.json({
      data: {
        metrics,
        trendAnalysis,
        summary: {
          totalRecords: metrics.length,
          departments: Object.keys(trendAnalysis).length,
          dateRange: {
            earliest: metrics.length > 0 ? metrics[metrics.length - 1]?.calculatedAt : null,
            latest: metrics.length > 0 ? metrics[0]?.calculatedAt : null
          }
        }
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Historical metrics fetch error:', error);
    
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
        message: 'Failed to fetch historical metrics',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/metrics/workloads - Get current staff workload analysis
router.get('/workloads', authenticateToken, rbacGuard(['ADMIN', 'SUPERVISOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { departmentId } = z.object({
      departmentId: z.string().uuid().optional()
    }).parse(req.query);

    let targetDepartmentId = departmentId;

    // For supervisors, restrict to their department
    if (req.user?.role === 'SUPERVISOR' && req.user?.departmentId) {
      targetDepartmentId = req.user.departmentId;
    }

    if (targetDepartmentId) {
      // Get workloads for specific department
      const workloads = await metricsCalculator.calculateStaffWorkloads(targetDepartmentId);
      
      const department = await prisma.department.findUnique({
        where: { id: targetDepartmentId },
        select: { name: true, slug: true }
      });

      res.json({
        data: {
          department: {
            id: targetDepartmentId,
            name: department?.name,
            slug: department?.slug
          },
          workloads,
          summary: {
            totalStaff: workloads.length,
            averageWorkloadScore: workloads.length > 0 ? workloads.reduce((sum, w) => sum + w.workloadScore, 0) / workloads.length : 0,
            averageUtilization: workloads.length > 0 ? workloads.reduce((sum, w) => sum + w.utilizationRate, 0) / workloads.length : 0,
            overloadedStaff: workloads.filter(w => w.utilizationRate > 100).length,
            underutilizedStaff: workloads.filter(w => w.utilizationRate < 50).length
          }
        },
        correlationId: res.locals.correlationId
      });
    } else {
      // Get workloads for all departments
      const departments = await prisma.department.findMany({
        select: { id: true, name: true, slug: true }
      });

      const allWorkloads = [];
      for (const dept of departments) {
        const workloads = await metricsCalculator.calculateStaffWorkloads(dept.id);
        allWorkloads.push({
          department: dept,
          workloads,
          summary: {
            totalStaff: workloads.length,
            averageWorkloadScore: workloads.length > 0 ? workloads.reduce((sum, w) => sum + w.workloadScore, 0) / workloads.length : 0,
            averageUtilization: workloads.length > 0 ? workloads.reduce((sum, w) => sum + w.utilizationRate, 0) / workloads.length : 0,
            overloadedStaff: workloads.filter(w => w.utilizationRate > 100).length,
            underutilizedStaff: workloads.filter(w => w.utilizationRate < 50).length
          }
        });
      }

      res.json({
        data: {
          departments: allWorkloads,
          overallSummary: {
            totalDepartments: departments.length,
            totalStaff: allWorkloads.reduce((sum, d) => sum + d.summary.totalStaff, 0),
            totalOverloaded: allWorkloads.reduce((sum, d) => sum + d.summary.overloadedStaff, 0),
            totalUnderutilized: allWorkloads.reduce((sum, d) => sum + d.summary.underutilizedStaff, 0)
          }
        },
        correlationId: res.locals.correlationId
      });
    }

  } catch (error) {
    console.error('Workloads analysis error:', error);
    
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
        message: 'Failed to analyze workloads',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/metrics/scheduler/status - Get scheduler job status
router.get('/scheduler/status', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const jobStatus = metricsScheduler.getJobStatus();
    
    // Get recent metrics calculation stats
    const recentMetrics = await prisma.departmentMetrics.findMany({
      orderBy: { calculatedAt: 'desc' },
      take: 10,
      include: {
        department: {
          select: { name: true }
        }
      }
    });

    res.json({
      data: {
        schedulerStatus: {
          jobs: jobStatus,
          lastCalculations: recentMetrics.map(m => ({
            department: m.department.name,
            metricType: m.metricType,
            period: m.period,
            value: m.value,
            calculatedAt: m.calculatedAt
          }))
        },
        systemInfo: {
          currentTime: new Date(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Scheduler status error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to get scheduler status',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/metrics/scheduler/control - Control scheduler jobs
router.post('/scheduler/control', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { action, jobName } = jobControlSchema.parse(req.body);

    let result: boolean = false;
    let message: string = '';

    switch (action) {
      case 'start':
        if (jobName === 'all') {
          metricsScheduler.restartAllJobs();
          result = true;
          message = 'All scheduler jobs started successfully';
        } else if (jobName) {
          result = metricsScheduler.startJob(jobName);
          message = result ? `${jobName} job started successfully` : `Failed to start ${jobName} job`;
        }
        break;

      case 'stop':
        if (jobName === 'all') {
          metricsScheduler.stopAllJobs();
          result = true;
          message = 'All scheduler jobs stopped successfully';
        } else if (jobName) {
          result = metricsScheduler.stopJob(jobName);
          message = result ? `${jobName} job stopped successfully` : `Failed to stop ${jobName} job`;
        }
        break;

      case 'restart':
        if (jobName === 'all') {
          metricsScheduler.stopAllJobs();
          setTimeout(() => metricsScheduler.restartAllJobs(), 1000);
          result = true;
          message = 'All scheduler jobs restarted successfully';
        } else if (jobName) {
          metricsScheduler.stopJob(jobName);
          setTimeout(() => metricsScheduler.startJob(jobName), 1000);
          result = true;
          message = `${jobName} job restarted successfully`;
        }
        break;
    }

    if (result) {
      res.json({
        message,
        data: {
          action,
          jobName: jobName || 'all',
          timestamp: new Date(),
          newStatus: metricsScheduler.getJobStatus()
        },
        correlationId: res.locals.correlationId
      });
    } else {
      res.status(400).json({
        error: {
          code: 'JOB_CONTROL_FAILED',
          message,
          correlationId: res.locals.correlationId
        }
      });
    }

  } catch (error) {
    console.error('Scheduler control error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid control parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to control scheduler',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;