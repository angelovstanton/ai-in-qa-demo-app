import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { generateCorrelationId } from '../utils/correlation';

const router = Router();
const prisma = new PrismaClient();

// Schemas
const UpdateStatusSchema = z.object({
  status: z.enum(['AVAILABLE', 'BUSY', 'BREAK', 'OFF_DUTY', 'EN_ROUTE']),
  currentTaskId: z.string().uuid().optional().nullable(),
  currentLocation: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180)
  }).optional(),
  vehicleStatus: z.enum(['IN_TRANSIT', 'PARKED', 'MAINTENANCE']).optional().nullable(),
  estimatedAvailableTime: z.string().datetime().optional().nullable()
});

const LocationUpdateSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracy: z.number().optional(),
  speed: z.number().optional(),
  heading: z.number().min(0).max(360).optional()
});

const TeamStatusFilterSchema = z.object({
  departmentId: z.string().uuid().optional(),
  status: z.enum(['AVAILABLE', 'BUSY', 'BREAK', 'OFF_DUTY', 'EN_ROUTE']).optional(),
  includeLocation: z.coerce.boolean().default(true)
});

// GET /api/v1/agent-status/current - Get current agent status
router.get(
  '/current',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  async (req, res) => {
    try {
      const agentId = req.user!.id;

      let status = await prisma.agentStatus.findUnique({
        where: { agentId }
      });

      // Create default status if doesn't exist
      if (!status) {
        status = await prisma.agentStatus.create({
          data: {
            agentId,
            status: 'OFF_DUTY',
            lastUpdateTime: new Date()
          }
        });
      }

      // Parse current location if exists
      let currentLocation = null;
      if (status.currentLocation) {
        try {
          currentLocation = JSON.parse(status.currentLocation);
        } catch (e) {
          console.error('Failed to parse location:', e);
        }
      }

      // Get current active work order if any
      let activeWorkOrder = null;
      if (status.currentTaskId) {
        activeWorkOrder = await prisma.fieldWorkOrder.findUnique({
          where: { id: status.currentTaskId },
          include: {
            request: {
              select: {
                id: true,
                code: true,
                title: true,
                category: true,
                priority: true,
                streetAddress: true,
                city: true
              }
            }
          }
        });
      }

      res.json({
        data: {
          ...status,
          currentLocation,
          activeWorkOrder
        },
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error fetching agent status:', error);
      res.status(500).json({ 
        error: 'Failed to fetch agent status',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// PUT /api/v1/agent-status - Update agent status
router.put(
  '/',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  validateRequest({ body: UpdateStatusSchema }),
  async (req, res) => {
    try {
      const agentId = req.user!.id;
      const updates = req.body as z.infer<typeof UpdateStatusSchema>;

      // Prepare update data
      const updateData: any = {
        status: updates.status,
        lastUpdateTime: new Date()
      };

      if (updates.currentTaskId !== undefined) {
        updateData.currentTaskId = updates.currentTaskId;
      }

      if (updates.currentLocation) {
        updateData.currentLocation = JSON.stringify(updates.currentLocation);
      }

      if (updates.vehicleStatus !== undefined) {
        updateData.vehicleStatus = updates.vehicleStatus;
      }

      if (updates.estimatedAvailableTime !== undefined) {
        updateData.estimatedAvailableTime = updates.estimatedAvailableTime 
          ? new Date(updates.estimatedAvailableTime) 
          : null;
      }

      // Update or create status
      const status = await prisma.agentStatus.upsert({
        where: { agentId },
        update: updateData,
        create: {
          agentId,
          ...updateData
        }
      });

      // If going off duty, end any active time tracking
      if (updates.status === 'OFF_DUTY') {
        const activeTracking = await prisma.agentTimeTracking.findFirst({
          where: {
            agentId,
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
              ),
              notes: 'Auto-ended due to going off duty'
            }
          });
        }
      }

      res.json({
        data: status,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error updating agent status:', error);
      res.status(500).json({ 
        error: 'Failed to update agent status',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// POST /api/v1/agent-status/location - Update agent location
router.post(
  '/location',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  validateRequest({ body: LocationUpdateSchema }),
  async (req, res) => {
    try {
      const agentId = req.user!.id;
      const location = req.body as z.infer<typeof LocationUpdateSchema>;

      // Update location in status
      const status = await prisma.agentStatus.upsert({
        where: { agentId },
        update: {
          currentLocation: JSON.stringify(location),
          lastUpdateTime: new Date()
        },
        create: {
          agentId,
          status: 'AVAILABLE',
          currentLocation: JSON.stringify(location),
          lastUpdateTime: new Date()
        }
      });

      res.json({
        data: {
          ...status,
          currentLocation: location
        },
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error updating location:', error);
      res.status(500).json({ 
        error: 'Failed to update location',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// GET /api/v1/agent-status/team - Get team status (for supervisors)
router.get(
  '/team',
  authenticateToken,
  authorizeRoles(['SUPERVISOR', 'ADMIN']),
  validateRequest({ query: TeamStatusFilterSchema }),
  async (req, res) => {
    try {
      const filters = req.query as z.infer<typeof TeamStatusFilterSchema>;
      const userId = req.user!.id;

      // Build where clause for agents
      const agentWhere: any = {
        role: 'FIELD_AGENT'
      };

      if (filters.departmentId) {
        agentWhere.departmentId = filters.departmentId;
      } else if (req.user!.role === 'SUPERVISOR') {
        // Supervisors see only their department's agents
        const supervisor = await prisma.user.findUnique({
          where: { id: userId },
          select: { departmentId: true }
        });
        if (supervisor?.departmentId) {
          agentWhere.departmentId = supervisor.departmentId;
        }
      }

      // Get all field agents with their status
      const agents = await prisma.user.findMany({
        where: agentWhere,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: {
            select: {
              id: true,
              name: true
            }
          },
          agentStatusUpdates: {
            take: 1,
            orderBy: { lastUpdateTime: 'desc' }
          },
          fieldWorkOrders: {
            where: {
              status: {
                in: ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS']
              }
            },
            select: {
              id: true,
              status: true,
              priority: true,
              taskType: true,
              request: {
                select: {
                  title: true,
                  streetAddress: true,
                  city: true
                }
              }
            }
          }
        }
      });

      // Format response
      const teamStatus = agents.map(agent => {
        const currentStatus = agent.agentStatusUpdates[0] || {
          status: 'OFF_DUTY',
          lastUpdateTime: null,
          currentLocation: null,
          vehicleStatus: null,
          estimatedAvailableTime: null
        };

        let location = null;
        if (filters.includeLocation && currentStatus.currentLocation) {
          try {
            location = JSON.parse(currentStatus.currentLocation as string);
          } catch (e) {
            console.error('Failed to parse location:', e);
          }
        }

        return {
          agent: {
            id: agent.id,
            name: agent.name,
            email: agent.email,
            phone: agent.phone,
            department: agent.department
          },
          status: currentStatus.status,
          lastUpdateTime: currentStatus.lastUpdateTime,
          location: location,
          vehicleStatus: currentStatus.vehicleStatus,
          estimatedAvailableTime: currentStatus.estimatedAvailableTime,
          activeWorkOrders: agent.fieldWorkOrders,
          workload: {
            active: agent.fieldWorkOrders.length,
            emergency: agent.fieldWorkOrders.filter(w => w.priority === 'EMERGENCY').length,
            high: agent.fieldWorkOrders.filter(w => w.priority === 'HIGH').length
          }
        };
      });

      // Apply status filter if provided
      const filtered = filters.status 
        ? teamStatus.filter(t => t.status === filters.status)
        : teamStatus;

      // Calculate summary statistics
      const summary = {
        total: filtered.length,
        available: filtered.filter(t => t.status === 'AVAILABLE').length,
        busy: filtered.filter(t => t.status === 'BUSY').length,
        enRoute: filtered.filter(t => t.status === 'EN_ROUTE').length,
        onBreak: filtered.filter(t => t.status === 'BREAK').length,
        offDuty: filtered.filter(t => t.status === 'OFF_DUTY').length,
        totalActiveOrders: filtered.reduce((sum, t) => sum + t.workload.active, 0)
      };

      res.json({
        data: {
          agents: filtered,
          summary
        },
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error fetching team status:', error);
      res.status(500).json({ 
        error: 'Failed to fetch team status',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// POST /api/v1/agent-status/check-in - Quick check-in for starting work
router.post(
  '/check-in',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  async (req, res) => {
    try {
      const agentId = req.user!.id;

      // Update status to available
      const status = await prisma.agentStatus.upsert({
        where: { agentId },
        update: {
          status: 'AVAILABLE',
          lastUpdateTime: new Date()
        },
        create: {
          agentId,
          status: 'AVAILABLE',
          lastUpdateTime: new Date()
        }
      });

      res.json({
        data: status,
        message: 'Checked in successfully',
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

// POST /api/v1/agent-status/check-out - Quick check-out for ending work
router.post(
  '/check-out',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  async (req, res) => {
    try {
      const agentId = req.user!.id;

      // Update status to off duty
      const status = await prisma.agentStatus.upsert({
        where: { agentId },
        update: {
          status: 'OFF_DUTY',
          currentTaskId: null,
          vehicleStatus: null,
          lastUpdateTime: new Date()
        },
        create: {
          agentId,
          status: 'OFF_DUTY',
          lastUpdateTime: new Date()
        }
      });

      // End any active time tracking
      const activeTracking = await prisma.agentTimeTracking.findFirst({
        where: {
          agentId,
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
            ),
            notes: 'Auto-ended at check-out'
          }
        });
      }

      res.json({
        data: status,
        message: 'Checked out successfully',
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

// GET /api/v1/agent-status/availability - Get agent availability for assignment
router.get(
  '/availability',
  authenticateToken,
  authorizeRoles(['SUPERVISOR', 'ADMIN']),
  async (req, res) => {
    try {
      const { skills, location } = req.query;

      // Get available agents
      const availableAgents = await prisma.user.findMany({
        where: {
          role: 'FIELD_AGENT',
          agentStatusUpdates: {
            some: {
              status: 'AVAILABLE'
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          department: {
            select: {
              name: true
            }
          },
          agentStatusUpdates: {
            take: 1,
            orderBy: { lastUpdateTime: 'desc' }
          },
          fieldWorkOrders: {
            where: {
              status: {
                in: ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS']
              },
              createdAt: {
                gte: new Date(new Date().setHours(0, 0, 0, 0))
              }
            }
          }
        }
      });

      // Calculate distance if location provided
      let agentsWithDistance = availableAgents.map(agent => {
        const status = agent.agentStatusUpdates[0];
        let distance = null;
        
        if (location && status?.currentLocation) {
          try {
            const agentLocation = JSON.parse(status.currentLocation as string);
            const targetLocation = JSON.parse(location as string);
            
            // Simple distance calculation (Haversine formula)
            const R = 6371; // Earth's radius in km
            const dLat = (targetLocation.lat - agentLocation.lat) * Math.PI / 180;
            const dLon = (targetLocation.lng - agentLocation.lng) * Math.PI / 180;
            const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                      Math.cos(agentLocation.lat * Math.PI / 180) * 
                      Math.cos(targetLocation.lat * Math.PI / 180) *
                      Math.sin(dLon/2) * Math.sin(dLon/2);
            const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
            distance = R * c;
          } catch (e) {
            console.error('Failed to calculate distance:', e);
          }
        }

        return {
          ...agent,
          distance,
          currentWorkload: agent.fieldWorkOrders.length
        };
      });

      // Sort by distance if available, otherwise by workload
      agentsWithDistance.sort((a, b) => {
        if (a.distance !== null && b.distance !== null) {
          return a.distance - b.distance;
        }
        return a.currentWorkload - b.currentWorkload;
      });

      res.json({
        data: agentsWithDistance,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error fetching availability:', error);
      res.status(500).json({ 
        error: 'Failed to fetch agent availability',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

export default router;