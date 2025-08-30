import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { CommunityStatsRepository } from '../repositories/CommunityStatsRepository';
import { createApiResponse } from '../utils/response';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();
const statsRepo = new CommunityStatsRepository(prisma);

/**
 * @swagger
 * components:
 *   schemas:
 *     LeaderboardEntry:
 *       type: object
 *       properties:
 *         rank:
 *           type: integer
 *         userId:
 *           type: string
 *         userName:
 *           type: string
 *         overallScore:
 *           type: number
 *         contributionScore:
 *           type: number
 *         engagementScore:
 *           type: number
 *         qualityScore:
 *           type: number
 *         requestsSubmitted:
 *           type: integer
 *         requestsApproved:
 *           type: integer
 *         commentsPosted:
 *           type: integer
 *         upvotesReceived:
 *           type: integer
 *         badges:
 *           type: array
 *           items:
 *             type: object
 *         change:
 *           type: integer
 *           description: Rank change from previous period
 * 
 *     CommunityStats:
 *       type: object
 *       properties:
 *         period:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, all-time]
 *         periodStart:
 *           type: string
 *           format: date-time
 *         periodEnd:
 *           type: string
 *           format: date-time
 *         requestsSubmitted:
 *           type: integer
 *         requestsApproved:
 *           type: integer
 *         requestsResolved:
 *           type: integer
 *         commentsPosted:
 *           type: integer
 *         upvotesReceived:
 *           type: integer
 *         upvotesGiven:
 *           type: integer
 *         contributionScore:
 *           type: number
 *         engagementScore:
 *           type: number
 *         qualityScore:
 *           type: number
 *         overallScore:
 *           type: number
 *         rank:
 *           type: integer
 * 
 *     CategoryStats:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *         totalRequests:
 *           type: integer
 *         approvedRequests:
 *           type: integer
 *         averageResolutionTime:
 *           type: number
 *         topContributors:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/LeaderboardEntry'
 *         trends:
 *           type: array
 *           items:
 *             type: object
 */

// Validation schemas
const leaderboardQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'all-time']).default('monthly'),
  category: z.string().optional(),
  limit: z.string().transform(Number).default('100'),
  offset: z.string().transform(Number).default('0'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  minScore: z.string().transform(Number).optional()
});

const userStatsQuerySchema = z.object({
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly', 'all-time']).optional()
});

/**
 * @swagger
 * /api/community/leaderboard:
 *   get:
 *     tags: [Community]
 *     summary: Get community leaderboard
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, all-time]
 *           default: monthly
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by service request category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: minScore
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Leaderboard entries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/LeaderboardEntry'
 */
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const query = leaderboardQuerySchema.parse(req.query);
    const { category } = req.query;
    
    const filters: any = {};
    if (query.startDate) filters.startDate = new Date(query.startDate);
    if (query.endDate) filters.endDate = new Date(query.endDate);
    if (query.minScore !== undefined) filters.minScore = query.minScore;
    
    let leaderboard = await statsRepo.getLeaderboard(
      query.period,
      query.limit,
      query.offset,
      filters
    );
    
    // Filter by category if specified
    if (category) {
      const usersWithCategoryActivity = await prisma.serviceRequest.findMany({
        where: {
          category: category as string
        },
        select: {
          createdBy: true
        },
        distinct: ['createdBy']
      });
      
      const userIdsWithActivity = new Set(usersWithCategoryActivity.map(r => r.createdBy));
      leaderboard = leaderboard.filter(entry => userIdsWithActivity.has(entry.userId));
    }

    res.json(createApiResponse(leaderboard));
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

/**
 * @swagger
 * /api/community/users/{userId}/stats:
 *   get:
 *     tags: [Community]
 *     summary: Get user community statistics
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, all-time]
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommunityStats'
 *       404:
 *         description: User not found
 */
router.get('/users/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const query = userStatsQuerySchema.parse(req.query);
    
    const stats = await statsRepo.getUserStats(userId, query.period);
    
    if (!stats) {
      return res.status(404).json({ error: 'User statistics not found' });
    }

    res.json(createApiResponse(stats));
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

/**
 * @swagger
 * /api/community/my-stats:
 *   get:
 *     tags: [Community]
 *     summary: Get current user's community statistics
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, all-time]
 *     responses:
 *       200:
 *         description: User statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommunityStats'
 *       401:
 *         description: Unauthorized
 */
router.get('/my-stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const query = userStatsQuerySchema.parse(req.query);
    
    const stats = await statsRepo.getUserStats(userId, query.period);
    
    if (!stats) {
      // Calculate stats if not found
      const now = new Date();
      const period = query.period || 'monthly';
      const { periodStart, periodEnd } = getPeriodDates(period, now);
      
      const calculatedStats = await statsRepo.calculateUserStats(
        userId,
        period as any,
        periodStart,
        periodEnd
      );
      
      return res.json(createApiResponse(calculatedStats));
    }

    res.json(createApiResponse(stats));
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user statistics' });
  }
});

/**
 * @swagger
 * /api/community/categories/{category}/stats:
 *   get:
 *     tags: [Community]
 *     summary: Get statistics by category
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, all-time]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Category statistics
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CategoryStats'
 */
router.get('/categories/:category/stats', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;
    const { period = 'monthly' } = req.query;
    
    const stats = await statsRepo.getStatsByCategory(category, period as string);
    
    res.json(createApiResponse(stats));
  } catch (error) {
    console.error('Error fetching category stats:', error);
    res.status(500).json({ error: 'Failed to fetch category statistics' });
  }
});

/**
 * @swagger
 * /api/community/trends:
 *   get:
 *     tags: [Community]
 *     summary: Get trending statistics
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly]
 *           default: weekly
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Trending statistics
 */
router.get('/trends', async (req: Request, res: Response) => {
  try {
    const { period = 'weekly', limit = '10' } = req.query;
    
    const trends = await statsRepo.getTrendingStats(
      period as string,
      parseInt(limit as string)
    );
    
    res.json(createApiResponse(trends));
  } catch (error) {
    console.error('Error fetching trends:', error);
    res.status(500).json({ error: 'Failed to fetch trends' });
  }
});

/**
 * @swagger
 * /api/community/summary:
 *   get:
 *     tags: [Community]
 *     summary: Get community statistics summary
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, all-time]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Community summary
 */
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const { period = 'monthly' } = req.query;
    
    const summary = await statsRepo.getStatsSummary(period as string);
    
    if (!summary) {
      return res.json(createApiResponse({
        period,
        totalUsers: 0,
        averageScores: {},
        totals: {}
      }));
    }
    
    res.json(createApiResponse(summary));
  } catch (error) {
    console.error('Error fetching summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary' });
  }
});

/**
 * @swagger
 * /api/community/achievements:
 *   get:
 *     tags: [Community]
 *     summary: Get all available achievements
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [contribution, engagement, quality, milestone]
 *       - in: query
 *         name: tier
 *         schema:
 *           type: string
 *           enum: [bronze, silver, gold, platinum]
 *     responses:
 *       200:
 *         description: List of achievements
 */
router.get('/achievements', async (req: Request, res: Response) => {
  try {
    const { category, tier } = req.query;
    
    const where: any = { isActive: true };
    if (category) where.category = category;
    if (tier) where.tier = tier;
    
    const achievements = await prisma.achievement.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { points: 'asc' }
      ]
    });
    
    res.json(createApiResponse(achievements));
  } catch (error) {
    console.error('Error fetching achievements:', error);
    res.status(500).json({ error: 'Failed to fetch achievements' });
  }
});

/**
 * @swagger
 * /api/community/users/{userId}/achievements:
 *   get:
 *     tags: [Community]
 *     summary: Get user achievements
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User achievements
 */
router.get('/users/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { period = 'monthly' } = req.query;
    
    const stats = await prisma.communityStats.findFirst({
      where: {
        userId,
        period: period as string,
      },
      orderBy: { periodStart: 'desc' },
    });
    
    res.json(createApiResponse(stats));
  } catch (error) {
    console.error('Error fetching user stats:', error);
    res.status(500).json({ error: 'Failed to fetch user stats' });
  }
});

router.get('/users/:userId/requests', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = '10' } = req.query;
    
    const requests = await prisma.serviceRequest.findMany({
      where: { createdBy: userId },
      include: {
        _count: {
          select: { comments: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });
    
    const formattedRequests = requests.map(request => ({
      id: request.id,
      title: request.title,
      description: request.description,
      category: request.category,
      status: request.status,
      createdAt: request.createdAt,
      upvotes: request.upvotes || 0,
      commentCount: request._count.comments
    }));
    
    res.json(createApiResponse(formattedRequests));
  } catch (error) {
    console.error('Error fetching user requests:', error);
    res.status(500).json({ error: 'Failed to fetch user requests' });
  }
});

router.get('/users/:userId/achievements', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const userAchievements = await prisma.userAchievement.findMany({
      where: { userId },
      include: {
        achievement: true
      },
      orderBy: { unlockedAt: 'desc' }
    });
    
    const formattedAchievements = userAchievements.map(ua => ({
      id: ua.achievement.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      tier: ua.achievement.tier,
      category: ua.achievement.category,
      points: ua.achievement.points,
      unlockedAt: ua.unlockedAt,
      progress: ua.progress
    }));
    
    res.json(createApiResponse(formattedAchievements));
  } catch (error) {
    console.error('Error fetching user achievements:', error);
    res.status(500).json({ error: 'Failed to fetch user achievements' });
  }
});

/**
 * @swagger
 * /api/community/statistics/overview:
 *   get:
 *     tags: [Community]
 *     summary: Get comprehensive community statistics overview
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [daily, weekly, monthly, yearly, all-time]
 *           default: monthly
 *     responses:
 *       200:
 *         description: Statistics overview with charts data
 */
router.get('/statistics/overview', async (req: Request, res: Response) => {
  try {
    const { period = 'monthly', category } = req.query;
    
    // Get various statistics for overview
    const [
      leaderboard,
      summary,
      trends,
      topCategories,
      recentAchievements
    ] = await Promise.all([
      statsRepo.getLeaderboard(period as string, 10, 0),
      statsRepo.getStatsSummary(period as string),
      statsRepo.getTrendingStats(period as string, 10),
      prisma.serviceRequest.groupBy({
        by: ['category'],
        _count: true,
        orderBy: { _count: { category: 'desc' } },
        take: 5
      }),
      prisma.userAchievement.findMany({
        include: {
          user: true,
          achievement: true
        },
        orderBy: { unlockedAt: 'desc' },
        take: 10
      })
    ]);

    // Filter leaderboard by category if specified
    let filteredLeaderboard = leaderboard;
    if (category) {
      // Get users who have submitted requests in the specified category
      const usersWithCategoryActivity = await prisma.serviceRequest.findMany({
        where: {
          category: category as string
        },
        select: {
          createdBy: true
        },
        distinct: ['createdBy']
      });
      
      const userIdsWithActivity = new Set(usersWithCategoryActivity.map(r => r.createdBy));
      filteredLeaderboard = leaderboard.filter(entry => userIdsWithActivity.has(entry.userId));
    }
    
    // Calculate time series data for charts
    const timeSeriesData = await getTimeSeriesData(period as string);
    
    const overview = {
      period,
      leaderboard: filteredLeaderboard,
      summary,
      trends,
      topCategories: topCategories.map(c => ({
        category: c.category,
        count: c._count
      })),
      recentAchievements: recentAchievements.map(ua => ({
        userId: ua.userId,
        userName: ua.user.name,
        achievement: ua.achievement.name,
        tier: ua.achievement.tier,
        unlockedAt: ua.unlockedAt
      })),
      charts: {
        contributionTrend: timeSeriesData.contributions,
        engagementTrend: timeSeriesData.engagement,
        qualityTrend: timeSeriesData.quality,
        categoryDistribution: topCategories.map(c => ({
          name: c.category,
          value: c._count
        }))
      }
    };
    
    res.json(createApiResponse(overview));
  } catch (error) {
    console.error('Error fetching overview:', error);
    res.status(500).json({ error: 'Failed to fetch statistics overview' });
  }
});

// Helper functions
function getPeriodDates(period: string, date: Date) {
  const periodStart = new Date(date);
  const periodEnd = new Date(date);
  
  switch (period) {
    case 'daily':
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setHours(23, 59, 59, 999);
      break;
    case 'weekly':
      const dayOfWeek = periodStart.getDay();
      periodStart.setDate(periodStart.getDate() - dayOfWeek);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setDate(periodStart.getDate() + 6);
      periodEnd.setHours(23, 59, 59, 999);
      break;
    case 'monthly':
      periodStart.setDate(1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setMonth(periodEnd.getMonth() + 1, 0);
      periodEnd.setHours(23, 59, 59, 999);
      break;
    case 'yearly':
      periodStart.setMonth(0, 1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setMonth(11, 31);
      periodEnd.setHours(23, 59, 59, 999);
      break;
    case 'all-time':
      periodStart.setFullYear(2020, 0, 1);
      periodStart.setHours(0, 0, 0, 0);
      periodEnd.setFullYear(2030, 11, 31);
      periodEnd.setHours(23, 59, 59, 999);
      break;
  }
  
  return { periodStart, periodEnd };
}

async function getTimeSeriesData(period: string) {
  const now = new Date();
  const dataPoints = period === 'daily' ? 24 : period === 'weekly' ? 7 : period === 'monthly' ? 30 : 12;
  
  const contributions = [];
  const engagement = [];
  const quality = [];
  
  for (let i = dataPoints - 1; i >= 0; i--) {
    const date = new Date(now);
    
    if (period === 'daily') {
      date.setHours(date.getHours() - i);
    } else if (period === 'weekly') {
      date.setDate(date.getDate() - i);
    } else if (period === 'monthly') {
      date.setDate(date.getDate() - i);
    } else {
      date.setMonth(date.getMonth() - i);
    }
    
    // Get counts for this period (simplified for example)
    const requests = await prisma.serviceRequest.count({
      where: {
        createdAt: {
          gte: new Date(date.setHours(0, 0, 0, 0)),
          lte: new Date(date.setHours(23, 59, 59, 999))
        }
      }
    });
    
    contributions.push({
      date: date.toISOString(),
      value: requests
    });
    
    engagement.push({
      date: date.toISOString(),
      value: Math.floor(Math.random() * 100) // Placeholder
    });
    
    quality.push({
      date: date.toISOString(),
      value: 75 + Math.floor(Math.random() * 25) // Placeholder
    });
  }
  
  return {
    contributions,
    engagement,
    quality
  };
}

router.get('/comments', async (req: Request, res: Response) => {
  try {
    const { userId, limit = '10' } = req.query;
    
    const comments = await prisma.comment.findMany({
      where: userId ? { authorId: userId as string } : undefined,
      include: {
        request: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string)
    });
    
    const formattedComments = comments.map(comment => ({
      id: comment.id,
      content: comment.body,
      requestTitle: comment.request?.title,
      createdAt: comment.createdAt,
      upvotes: 0 // Would need to implement upvote tracking
    }));
    
    res.json(createApiResponse(formattedComments));
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

export default router;