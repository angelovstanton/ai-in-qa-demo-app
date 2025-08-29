import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { generateCorrelationId } from '../utils/correlation';
import { createPaginatedResponse } from '../utils/pagination';

const router = Router();
const prisma = new PrismaClient();

// Schemas for validation
const WorkOrderFilterSchema = z.object({
  status: z.enum(['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['EMERGENCY', 'HIGH', 'NORMAL', 'LOW']).optional(),
  agentId: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['createdAt', 'priority', 'status', 'estimatedDuration']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

const CreateWorkOrderSchema = z.object({
  requestId: z.string().uuid(),
  assignedAgentId: z.string().uuid(),
  priority: z.enum(['EMERGENCY', 'HIGH', 'NORMAL', 'LOW']).default('NORMAL'),
  taskType: z.string().min(1),
  estimatedDuration: z.number().min(15).max(480), // 15 min to 8 hours
  requiredSkills: z.array(z.string()).optional(),
  requiredTools: z.array(z.string()).optional(),
  safetyNotes: z.string().optional(),
  gpsLat: z.number().min(-90).max(90).optional(),
  gpsLng: z.number().min(-180).max(180).optional(),
  navigationLink: z.string().url().optional()
});

const UpdateWorkOrderSchema = z.object({
  status: z.enum(['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  priority: z.enum(['EMERGENCY', 'HIGH', 'NORMAL', 'LOW']).optional(),
  completionNotes: z.string().optional(),
  citizenSignature: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  nextVisitScheduled: z.string().datetime().optional(),
  actualDuration: z.number().min(0).optional()
});

const UpdateLocationSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional()
});

// GET /api/v1/field-agent/work-orders - Get work orders for agent
router.get(
  '/work-orders',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  validateRequest({ query: WorkOrderFilterSchema }),
  async (req, res) => {
    try {
      const filters = req.query as z.infer<typeof WorkOrderFilterSchema>;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Build where clause
      const where: any = {};

      // Field agents only see their own work orders
      if (userRole === 'FIELD_AGENT') {
        where.assignedAgentId = userId;
      } else if (filters.agentId) {
        where.assignedAgentId = filters.agentId;
      }

      if (filters.status) where.status = filters.status;
      if (filters.priority) where.priority = filters.priority;

      if (filters.dateFrom || filters.dateTo) {
        where.createdAt = {};
        if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
      }

      // Get total count
      const total = await prisma.fieldWorkOrder.count({ where });

      // Get paginated results
      const workOrders = await prisma.fieldWorkOrder.findMany({
        where,
        include: {
          request: {
            include: {
              department: true,
              attachments: true
            }
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          photos: {
            select: {
              id: true,
              photoType: true,
              caption: true,
              timestamp: true
            }
          },
          timeTracking: {
            orderBy: { startTime: 'desc' },
            take: 1
          }
        },
        orderBy: { [filters.sortBy]: filters.sortOrder },
        skip: (filters.page - 1) * filters.limit,
        take: filters.limit
      });

      res.json(createPaginatedResponse(
        workOrders,
        total,
        filters.page,
        filters.limit,
        generateCorrelationId(req)
      ));
    } catch (error) {
      console.error('Error fetching work orders:', error);
      res.status(500).json({ 
        error: 'Failed to fetch work orders',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// GET /api/v1/field-agent/work-orders/:id - Get specific work order
router.get(
  '/work-orders/:id',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      const workOrder = await prisma.fieldWorkOrder.findUnique({
        where: { id },
        include: {
          request: {
            include: {
              department: true,
              creator: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  streetAddress: true,
                  city: true,
                  postalCode: true
                }
              },
              attachments: true,
              comments: {
                include: {
                  author: {
                    select: {
                      id: true,
                      name: true,
                      role: true
                    }
                  }
                },
                orderBy: { createdAt: 'desc' }
              }
            }
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          supervisor: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          photos: {
            include: {
              agent: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { timestamp: 'desc' }
          },
          timeTracking: {
            include: {
              agent: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { startTime: 'desc' }
          },
          additionalIssues: {
            include: {
              reportedBy: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          },
          partsUsed: {
            include: {
              agent: {
                select: {
                  id: true,
                  name: true
                }
              }
            },
            orderBy: { usedAt: 'desc' }
          }
        }
      });

      if (!workOrder) {
        return res.status(404).json({ 
          error: 'Work order not found',
          correlationId: generateCorrelationId(req)
        });
      }

      // Field agents can only see their own work orders
      if (userRole === 'FIELD_AGENT' && workOrder.assignedAgentId !== userId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      res.json({
        data: workOrder,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error fetching work order:', error);
      res.status(500).json({ 
        error: 'Failed to fetch work order',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// POST /api/v1/field-agent/work-orders - Create new work order
router.post(
  '/work-orders',
  authenticateToken,
  authorizeRoles(['SUPERVISOR', 'ADMIN']),
  validateRequest({ body: CreateWorkOrderSchema }),
  async (req, res) => {
    try {
      const data = req.body as z.infer<typeof CreateWorkOrderSchema>;
      const supervisorId = req.user!.id;

      // Verify the request exists
      const request = await prisma.serviceRequest.findUnique({
        where: { id: data.requestId }
      });

      if (!request) {
        return res.status(404).json({ 
          error: 'Service request not found',
          correlationId: generateCorrelationId(req)
        });
      }

      // Verify the agent exists and is a field agent
      const agent = await prisma.user.findUnique({
        where: { id: data.assignedAgentId }
      });

      if (!agent || agent.role !== 'FIELD_AGENT') {
        return res.status(400).json({ 
          error: 'Invalid field agent',
          correlationId: generateCorrelationId(req)
        });
      }

      // Create the work order
      const workOrder = await prisma.fieldWorkOrder.create({
        data: {
          requestId: data.requestId,
          assignedAgentId: data.assignedAgentId,
          supervisorId,
          priority: data.priority,
          taskType: data.taskType,
          estimatedDuration: data.estimatedDuration,
          requiredSkills: data.requiredSkills ? JSON.stringify(data.requiredSkills) : null,
          requiredTools: data.requiredTools ? JSON.stringify(data.requiredTools) : null,
          safetyNotes: data.safetyNotes,
          gpsLat: data.gpsLat,
          gpsLng: data.gpsLng,
          navigationLink: data.navigationLink,
          status: 'ASSIGNED'
        },
        include: {
          request: true,
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
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

      // Update the service request status
      await prisma.serviceRequest.update({
        where: { id: data.requestId },
        data: {
          status: 'IN_FIELD',
          assignedTo: data.assignedAgentId
        }
      });

      // Log the event
      await prisma.eventLog.create({
        data: {
          requestId: data.requestId,
          type: 'WORK_ORDER_CREATED',
          payload: JSON.stringify({
            workOrderId: workOrder.id,
            assignedTo: agent.name,
            priority: data.priority,
            taskType: data.taskType
          })
        }
      });

      res.status(201).json({
        data: workOrder,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error creating work order:', error);
      res.status(500).json({ 
        error: 'Failed to create work order',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// PATCH /api/v1/field-agent/work-orders/:id - Update work order
router.patch(
  '/work-orders/:id',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  validateRequest({ body: UpdateWorkOrderSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body as z.infer<typeof UpdateWorkOrderSchema>;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get the work order
      const workOrder = await prisma.fieldWorkOrder.findUnique({
        where: { id }
      });

      if (!workOrder) {
        return res.status(404).json({ 
          error: 'Work order not found',
          correlationId: generateCorrelationId(req)
        });
      }

      // Field agents can only update their own work orders
      if (userRole === 'FIELD_AGENT' && workOrder.assignedAgentId !== userId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      // Handle status transitions
      const updateData: any = { ...updates };
      
      if (updates.status) {
        switch (updates.status) {
          case 'EN_ROUTE':
            updateData.checkInTime = new Date();
            break;
          case 'ON_SITE':
            if (!workOrder.checkInTime) {
              updateData.checkInTime = new Date();
            }
            break;
          case 'COMPLETED':
            updateData.checkOutTime = new Date();
            updateData.completedAt = new Date();
            if (!workOrder.checkInTime) {
              updateData.checkInTime = new Date();
            }
            break;
        }
      }

      // Convert datetime string to Date object if provided
      if (updates.nextVisitScheduled) {
        updateData.nextVisitScheduled = new Date(updates.nextVisitScheduled);
      }

      // Update the work order
      const updatedWorkOrder = await prisma.fieldWorkOrder.update({
        where: { id },
        data: updateData,
        include: {
          request: true,
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
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

      // Update service request status if work order is completed
      if (updates.status === 'COMPLETED') {
        await prisma.serviceRequest.update({
          where: { id: workOrder.requestId },
          data: {
            status: 'COMPLETED',
            closedAt: new Date()
          }
        });
      }

      // Log the event
      await prisma.eventLog.create({
        data: {
          requestId: workOrder.requestId,
          type: 'WORK_ORDER_UPDATED',
          payload: JSON.stringify({
            workOrderId: id,
            updates,
            updatedBy: req.user!.name
          })
        }
      });

      res.json({
        data: updatedWorkOrder,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error updating work order:', error);
      res.status(500).json({ 
        error: 'Failed to update work order',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// POST /api/v1/field-agent/work-orders/:id/check-in - Check in at location
router.post(
  '/work-orders/:id/check-in',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  validateRequest({ body: UpdateLocationSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { lat, lng, accuracy } = req.body as z.infer<typeof UpdateLocationSchema>;
      const userId = req.user!.id;

      const workOrder = await prisma.fieldWorkOrder.findUnique({
        where: { id }
      });

      if (!workOrder) {
        return res.status(404).json({ 
          error: 'Work order not found',
          correlationId: generateCorrelationId(req)
        });
      }

      if (workOrder.assignedAgentId !== userId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      // Update work order with check-in
      const updated = await prisma.fieldWorkOrder.update({
        where: { id },
        data: {
          status: 'ON_SITE',
          checkInTime: new Date(),
          gpsLat: lat,
          gpsLng: lng,
          gpsAccuracy: accuracy
        }
      });

      // Start time tracking
      await prisma.agentTimeTracking.create({
        data: {
          workOrderId: id,
          agentId: userId,
          timeType: 'WORK',
          startTime: new Date()
        }
      });

      res.json({
        data: updated,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error checking in:', error);
      res.status(500).json({ 
        error: 'Failed to check in',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// POST /api/v1/field-agent/work-orders/:id/check-out - Check out from location
router.post(
  '/work-orders/:id/check-out',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;

      const workOrder = await prisma.fieldWorkOrder.findUnique({
        where: { id }
      });

      if (!workOrder) {
        return res.status(404).json({ 
          error: 'Work order not found',
          correlationId: generateCorrelationId(req)
        });
      }

      if (workOrder.assignedAgentId !== userId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      if (!workOrder.checkInTime) {
        return res.status(400).json({ 
          error: 'Must check in before checking out',
          correlationId: generateCorrelationId(req)
        });
      }

      // Calculate actual duration
      const duration = Math.floor(
        (new Date().getTime() - workOrder.checkInTime.getTime()) / 60000
      );

      // Update work order
      const updated = await prisma.fieldWorkOrder.update({
        where: { id },
        data: {
          checkOutTime: new Date(),
          actualDuration: duration
        }
      });

      // End time tracking
      const activeTracking = await prisma.agentTimeTracking.findFirst({
        where: {
          workOrderId: id,
          agentId: userId,
          endTime: null
        }
      });

      if (activeTracking) {
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

      res.json({
        data: updated,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error checking out:', error);
      res.status(500).json({ 
        error: 'Failed to check out',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// GET /api/v1/field-agent/dashboard - Get agent dashboard data
router.get(
  '/dashboard',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  async (req, res) => {
    try {
      const userId = req.user!.id;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Get today's work orders
      const todaysOrders = await prisma.fieldWorkOrder.findMany({
        where: {
          assignedAgentId: userId,
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        },
        include: {
          request: {
            select: {
              title: true,
              category: true,
              priority: true,
              streetAddress: true,
              city: true
            }
          }
        }
      });

      // Get statistics
      const stats = await prisma.fieldWorkOrder.groupBy({
        by: ['status'],
        where: {
          assignedAgentId: userId
        },
        _count: true
      });

      // Get recent time tracking
      const timeTracking = await prisma.agentTimeTracking.findMany({
        where: {
          agentId: userId,
          startTime: {
            gte: today
          }
        },
        orderBy: { startTime: 'desc' },
        take: 10
      });

      // Calculate today's total work time
      const todayWorkTime = timeTracking.reduce((total, track) => {
        return total + (track.duration || 0);
      }, 0);

      res.json({
        data: {
          todaysOrders,
          statistics: {
            total: stats.reduce((sum, s) => sum + s._count, 0),
            byStatus: stats.reduce((acc, s) => {
              acc[s.status.toLowerCase()] = s._count;
              return acc;
            }, {} as Record<string, number>),
            todayCompleted: stats.find(s => s.status === 'COMPLETED')?._count || 0,
            todayWorkTimeMinutes: todayWorkTime
          },
          recentActivity: timeTracking
        },
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      res.status(500).json({ 
        error: 'Failed to fetch dashboard data',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

export default router;