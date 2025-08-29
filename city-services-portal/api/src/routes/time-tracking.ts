import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { generateCorrelationId } from '../utils/correlation';

const router = Router();
const prisma = new PrismaClient();

// Schemas
const StartTimeTrackingSchema = z.object({
  workOrderId: z.string().uuid(),
  timeType: z.enum(['TRAVEL', 'SETUP', 'WORK', 'DOCUMENTATION', 'BREAK']),
  notes: z.string().optional()
});

const EndTimeTrackingSchema = z.object({
  notes: z.string().optional()
});

const TimeReportSchema = z.object({
  agentId: z.string().uuid().optional(),
  workOrderId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  timeType: z.enum(['TRAVEL', 'SETUP', 'WORK', 'DOCUMENTATION', 'BREAK']).optional()
});

// POST /api/v1/time-tracking/start - Start time tracking
router.post(
  '/start',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  validateRequest({ body: StartTimeTrackingSchema }),
  async (req, res) => {
    try {
      const { workOrderId, timeType, notes } = req.body as z.infer<typeof StartTimeTrackingSchema>;
      const agentId = req.user!.id;

      // Verify work order exists and is assigned to agent
      const workOrder = await prisma.fieldWorkOrder.findUnique({
        where: { id: workOrderId }
      });

      if (!workOrder) {
        return res.status(404).json({ 
          error: 'Work order not found',
          correlationId: generateCorrelationId(req)
        });
      }

      if (workOrder.assignedAgentId !== agentId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      // Check if there's already an active tracking session
      const activeTracking = await prisma.agentTimeTracking.findFirst({
        where: {
          agentId,
          endTime: null
        }
      });

      if (activeTracking) {
        // Auto-end the previous tracking
        await prisma.agentTimeTracking.update({
          where: { id: activeTracking.id },
          data: {
            endTime: new Date(),
            duration: Math.floor(
              (new Date().getTime() - activeTracking.startTime.getTime()) / 60000
            )
          }
        });
      }

      // Start new tracking
      const tracking = await prisma.agentTimeTracking.create({
        data: {
          workOrderId,
          agentId,
          timeType,
          startTime: new Date(),
          notes
        }
      });

      res.status(201).json({
        data: tracking,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error starting time tracking:', error);
      res.status(500).json({ 
        error: 'Failed to start time tracking',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// POST /api/v1/time-tracking/:id/end - End time tracking
router.post(
  '/:id/end',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  validateRequest({ body: EndTimeTrackingSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { notes } = req.body as z.infer<typeof EndTimeTrackingSchema>;
      const agentId = req.user!.id;

      // Get the tracking record
      const tracking = await prisma.agentTimeTracking.findUnique({
        where: { id }
      });

      if (!tracking) {
        return res.status(404).json({ 
          error: 'Time tracking record not found',
          correlationId: generateCorrelationId(req)
        });
      }

      if (tracking.agentId !== agentId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      if (tracking.endTime) {
        return res.status(400).json({ 
          error: 'Time tracking already ended',
          correlationId: generateCorrelationId(req)
        });
      }

      // Calculate duration
      const duration = Math.floor(
        (new Date().getTime() - tracking.startTime.getTime()) / 60000
      );

      // Update tracking
      const updated = await prisma.agentTimeTracking.update({
        where: { id },
        data: {
          endTime: new Date(),
          duration,
          notes: notes || tracking.notes
        }
      });

      res.json({
        data: updated,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error ending time tracking:', error);
      res.status(500).json({ 
        error: 'Failed to end time tracking',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// GET /api/v1/time-tracking/active - Get active time tracking
router.get(
  '/active',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  async (req, res) => {
    try {
      const agentId = req.user!.id;

      const activeTracking = await prisma.agentTimeTracking.findFirst({
        where: {
          agentId,
          endTime: null
        },
        include: {
          workOrder: {
            include: {
              request: {
                select: {
                  title: true,
                  code: true
                }
              }
            }
          }
        }
      });

      res.json({
        data: activeTracking,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error fetching active tracking:', error);
      res.status(500).json({ 
        error: 'Failed to fetch active tracking',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// GET /api/v1/time-tracking/report - Get time tracking report
router.get(
  '/report',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  validateRequest({ query: TimeReportSchema }),
  async (req, res) => {
    try {
      const filters = req.query as z.infer<typeof TimeReportSchema>;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Build where clause
      const where: any = {};

      // Field agents only see their own data
      if (userRole === 'FIELD_AGENT') {
        where.agentId = userId;
      } else if (filters.agentId) {
        where.agentId = filters.agentId;
      }

      if (filters.workOrderId) where.workOrderId = filters.workOrderId;
      if (filters.timeType) where.timeType = filters.timeType;

      if (filters.dateFrom || filters.dateTo) {
        where.startTime = {};
        if (filters.dateFrom) where.startTime.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.startTime.lte = new Date(filters.dateTo);
      }

      // Get time tracking records
      const records = await prisma.agentTimeTracking.findMany({
        where,
        include: {
          agent: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          workOrder: {
            include: {
              request: {
                select: {
                  id: true,
                  code: true,
                  title: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy: { startTime: 'desc' }
      });

      // Calculate summary statistics
      const summary = {
        totalRecords: records.length,
        totalMinutes: records.reduce((sum, r) => sum + (r.duration || 0), 0),
        byType: {} as Record<string, number>,
        byWorkOrder: {} as Record<string, { minutes: number; title: string }>
      };

      records.forEach(record => {
        // By type
        if (!summary.byType[record.timeType]) {
          summary.byType[record.timeType] = 0;
        }
        summary.byType[record.timeType] += record.duration || 0;

        // By work order
        if (!summary.byWorkOrder[record.workOrderId]) {
          summary.byWorkOrder[record.workOrderId] = {
            minutes: 0,
            title: record.workOrder.request.title
          };
        }
        summary.byWorkOrder[record.workOrderId].minutes += record.duration || 0;
      });

      res.json({
        data: {
          records,
          summary
        },
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error generating time report:', error);
      res.status(500).json({ 
        error: 'Failed to generate time report',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// GET /api/v1/time-tracking/productivity - Get productivity metrics
router.get(
  '/productivity',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const userRole = req.user!.role;
      const agentId = userRole === 'FIELD_AGENT' ? userId : req.query.agentId as string;

      if (!agentId && userRole !== 'FIELD_AGENT') {
        return res.status(400).json({ 
          error: 'Agent ID required',
          correlationId: generateCorrelationId(req)
        });
      }

      // Get last 30 days of data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Get time tracking data
      const timeData = await prisma.agentTimeTracking.findMany({
        where: {
          agentId,
          startTime: { gte: thirtyDaysAgo }
        }
      });

      // Get work orders
      const workOrders = await prisma.fieldWorkOrder.findMany({
        where: {
          assignedAgentId: agentId,
          createdAt: { gte: thirtyDaysAgo }
        }
      });

      // Calculate metrics
      const metrics = {
        totalWorkOrders: workOrders.length,
        completedWorkOrders: workOrders.filter(w => w.status === 'COMPLETED').length,
        averageCompletionTime: 0,
        totalWorkMinutes: 0,
        totalTravelMinutes: 0,
        totalBreakMinutes: 0,
        productivityScore: 0,
        dailyAverage: {
          workOrders: 0,
          workMinutes: 0
        }
      };

      // Sum up time by type
      timeData.forEach(t => {
        const duration = t.duration || 0;
        switch (t.timeType) {
          case 'WORK':
          case 'SETUP':
          case 'DOCUMENTATION':
            metrics.totalWorkMinutes += duration;
            break;
          case 'TRAVEL':
            metrics.totalTravelMinutes += duration;
            break;
          case 'BREAK':
            metrics.totalBreakMinutes += duration;
            break;
        }
      });

      // Calculate averages
      if (metrics.completedWorkOrders > 0) {
        const completedOrders = workOrders.filter(w => w.status === 'COMPLETED');
        const totalDuration = completedOrders.reduce((sum, w) => sum + (w.actualDuration || 0), 0);
        metrics.averageCompletionTime = Math.round(totalDuration / metrics.completedWorkOrders);
      }

      // Daily averages (30 days)
      metrics.dailyAverage.workOrders = Math.round(metrics.totalWorkOrders / 30 * 10) / 10;
      metrics.dailyAverage.workMinutes = Math.round(metrics.totalWorkMinutes / 30);

      // Simple productivity score (completed / total * efficiency)
      if (metrics.totalWorkOrders > 0) {
        const completionRate = metrics.completedWorkOrders / metrics.totalWorkOrders;
        const efficiency = metrics.totalWorkMinutes / (metrics.totalWorkMinutes + metrics.totalTravelMinutes + metrics.totalBreakMinutes);
        metrics.productivityScore = Math.round(completionRate * efficiency * 100);
      }

      res.json({
        data: metrics,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error calculating productivity:', error);
      res.status(500).json({ 
        error: 'Failed to calculate productivity metrics',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

export default router;