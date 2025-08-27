import { Router, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Query validation schema
const rankingQuerySchema = z.object({
  timeframe: z.enum(['week', 'month', 'quarter', 'year', 'all']).optional().default('all'),
  category: z.string().optional(),
});

// GET /api/v1/rankings/users - Get user rankings
router.get('/users', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = rankingQuerySchema.parse(req.query);

    // Calculate date range based on timeframe
    let dateFilter = {};
    if (query.timeframe !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (query.timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      dateFilter = {
        createdAt: {
          gte: startDate
        }
      };
    }

    // Build where clause for category filter
    const requestFilter = {
      ...dateFilter,
      ...(query.category ? { category: query.category } : {})
    };

    // Get users with their request statistics
    const users = await prisma.user.findMany({
      where: {
        role: 'CITIZEN',
        createdRequests: {
          some: requestFilter
        }
      },
      include: {
        createdRequests: {
          where: requestFilter,
          select: {
            id: true,
            status: true,
            satisfactionRating: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    });

    // Calculate rankings
    const rankings = users.map(user => {
      const requests = user.createdRequests;
      const totalRequests = requests.length;
      const approvedRequests = requests.filter(r => 
        ['RESOLVED', 'CLOSED'].includes(r.status)
      ).length;
      const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;
      
      const ratingsWithValues = requests
        .map(r => r.satisfactionRating)
        .filter((rating): rating is number => rating !== null);
      
      const averageRating = ratingsWithValues.length > 0 
        ? ratingsWithValues.reduce((sum, rating) => sum + rating, 0) / ratingsWithValues.length 
        : 0;

      const lastRequestDate = requests.length > 0 
        ? Math.max(...requests.map(r => new Date(r.createdAt).getTime()))
        : null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        approvedRequestsCount: approvedRequests,
        totalRequestsCount: totalRequests,
        approvalRate: Math.round(approvalRate * 10) / 10,
        averageRating: Math.round(averageRating * 10) / 10,
        joinedDate: user.createdAt,
        lastRequestDate: lastRequestDate ? new Date(lastRequestDate) : null
      };
    }).filter(user => user.totalRequestsCount > 0); // Only include users with requests

    // Sort by approval rate, then by total requests
    rankings.sort((a, b) => {
      if (b.approvalRate !== a.approvalRate) {
        return b.approvalRate - a.approvalRate;
      }
      return b.totalRequestsCount - a.totalRequestsCount;
    });

    // Add ranks and badges
    const rankedUsers = rankings.map((user, index) => ({
      ...user,
      rank: index + 1,
      badge: index === 0 ? 'gold' as const : 
             index === 1 ? 'silver' as const : 
             index === 2 ? 'bronze' as const : 
             undefined
    }));

    res.json({
      data: rankedUsers.slice(0, 50), // Top 50 users
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
        message: 'Failed to fetch rankings',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/rankings/stats - Get ranking statistics
router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = rankingQuerySchema.parse(req.query);

    // Calculate date range based on timeframe
    let dateFilter = {};
    if (query.timeframe !== 'all') {
      const now = new Date();
      const startDate = new Date();
      
      switch (query.timeframe) {
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(now.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      
      dateFilter = {
        createdAt: {
          gte: startDate
        }
      };
    }

    // Build where clause
    const requestFilter = {
      ...dateFilter,
      ...(query.category ? { category: query.category } : {})
    };

    // Get statistics
    const [totalRequests, approvedRequests, activeUsers] = await Promise.all([
      prisma.serviceRequest.count({ where: requestFilter }),
      prisma.serviceRequest.count({ 
        where: { 
          ...requestFilter, 
          status: { in: ['RESOLVED', 'CLOSED'] } 
        } 
      }),
      prisma.user.count({
        where: {
          role: 'CITIZEN',
          createdRequests: {
            some: requestFilter
          }
        }
      })
    ]);

    // Calculate approval rate
    const approvalRate = totalRequests > 0 ? (approvedRequests / totalRequests) * 100 : 0;

    // Calculate growth (comparing to previous period)
    let growthRate = 0;
    if (query.timeframe !== 'all') {
      const previousPeriodStart = new Date();
      const previousPeriodEnd = new Date();
      
      switch (query.timeframe) {
        case 'week':
          previousPeriodStart.setDate(previousPeriodStart.getDate() - 14);
          previousPeriodEnd.setDate(previousPeriodEnd.getDate() - 7);
          break;
        case 'month':
          previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 2);
          previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 1);
          break;
        case 'quarter':
          previousPeriodStart.setMonth(previousPeriodStart.getMonth() - 6);
          previousPeriodEnd.setMonth(previousPeriodEnd.getMonth() - 3);
          break;
        case 'year':
          previousPeriodStart.setFullYear(previousPeriodStart.getFullYear() - 2);
          previousPeriodEnd.setFullYear(previousPeriodEnd.getFullYear() - 1);
          break;
      }

      const previousPeriodRequests = await prisma.serviceRequest.count({
        where: {
          ...requestFilter,
          createdAt: {
            gte: previousPeriodStart,
            lt: previousPeriodEnd
          }
        }
      });

      if (previousPeriodRequests > 0) {
        growthRate = ((totalRequests - previousPeriodRequests) / previousPeriodRequests) * 100;
      } else if (totalRequests > 0) {
        growthRate = 100; // New activity
      }
    }

    const stats = {
      activeCitizens: activeUsers,
      approvedRequests: approvedRequests,
      avgApprovalRate: Math.round(approvalRate * 10) / 10,
      topPerformerGrowth: Math.round(growthRate * 10) / 10
    };

    res.json({
      data: stats,
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
        message: 'Failed to fetch ranking statistics',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;
