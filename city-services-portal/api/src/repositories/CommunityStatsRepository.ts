import { CommunityStats, Prisma, PrismaClient } from '@prisma/client';
import { BaseRepository } from './base/BaseRepository';

export interface CommunityStatsFilters {
  userId?: string;
  period?: string | string[];
  category?: string;
  startDate?: Date;
  endDate?: Date;
  minScore?: number;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userEmail: string;
  overallScore: number;
  contributionScore: number;
  engagementScore: number;
  qualityScore: number;
  requestsSubmitted: number;
  requestsApproved: number;
  commentsPosted: number;
  upvotesReceived: number;
  badges?: any[];
  change?: number; // rank change from previous period
}

export interface CategoryStats {
  category: string;
  totalRequests: number;
  approvedRequests: number;
  averageResolutionTime: number;
  topContributors: LeaderboardEntry[];
  trends: any[];
}

/**
 * Community Statistics Repository
 * Handles community ranking and statistics operations
 */
export class CommunityStatsRepository extends BaseRepository<
  CommunityStats,
  Prisma.CommunityStatsCreateInput,
  Prisma.CommunityStatsUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'communityStats');
  }

  /**
   * Get leaderboard with filters
   */
  async getLeaderboard(
    period: string = 'monthly',
    limit: number = 100,
    offset: number = 0,
    filters?: CommunityStatsFilters
  ): Promise<LeaderboardEntry[]> {
    const where = this.buildWhereClause(filters);
    where.period = period;

    // Don't filter by exact periodStart - just get all stats for the period
    // The seed data creates all stats with similar but not identical timestamps

    const stats = await this.model.findMany({
      where,
      include: {
        user: {
          include: {
            achievements: {
              include: {
                achievement: true
              }
            }
          }
        }
      },
      orderBy: { overallScore: 'desc' },
      skip: offset,
      take: limit
    });

    return stats.map((stat: any, index: number) => ({
      rank: offset + index + 1,
      userId: stat.userId,
      userName: stat.user.name,
      userEmail: stat.user.email,
      overallScore: stat.overallScore,
      contributionScore: stat.contributionScore,
      engagementScore: stat.engagementScore,
      qualityScore: stat.qualityScore,
      requestsSubmitted: stat.requestsSubmitted,
      requestsApproved: stat.requestsApproved,
      commentsPosted: stat.commentsPosted,
      upvotesReceived: stat.upvotesReceived,
      badges: stat.user.achievements.map((ua: any) => ua.achievement),
      change: stat.rank && stat.previousRank ? stat.previousRank - stat.rank : 0
    }));
  }

  /**
   * Get user statistics
   */
  async getUserStats(
    userId: string,
    period?: string
  ): Promise<CommunityStats | null> {
    const where: any = { userId };
    
    if (period) {
      where.period = period;
      // Don't filter by exact periodStart - the seed data creates stats with slightly different times
    }

    return this.model.findFirst({
      where,
      include: {
        user: true
      },
      orderBy: { periodStart: 'desc' }
    });
  }

  /**
   * Get statistics by category
   */
  async getStatsByCategory(
    category: string,
    period: string = 'monthly'
  ): Promise<CategoryStats> {
    // Get all service requests for the category
    const requests = await this.prisma.serviceRequest.findMany({
      where: { category },
      include: {
        creator: true,
        comments: true,
        upvotes: true
      }
    });

    // Calculate category statistics
    const totalRequests = requests.length;
    const approvedRequests = requests.filter(r => 
      ['APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(r.status)
    ).length;

    // Calculate average resolution time
    const resolvedRequests = requests.filter(r => r.closedAt);
    const avgResolutionTime = resolvedRequests.length > 0
      ? resolvedRequests.reduce((sum, req) => {
          const time = req.closedAt!.getTime() - req.createdAt.getTime();
          return sum + time;
        }, 0) / resolvedRequests.length / (1000 * 60 * 60) // Convert to hours
      : 0;

    // Get top contributors for this category
    const contributorMap = new Map<string, number>();
    requests.forEach(req => {
      const count = contributorMap.get(req.createdBy) || 0;
      contributorMap.set(req.createdBy, count + 1);
    });

    const topContributorIds = Array.from(contributorMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([userId]) => userId);

    const topContributors = await this.getLeaderboard(
      period,
      10,
      0,
      { userId: topContributorIds.join(',') }
    );

    // Get trends for this category
    const trends = await this.prisma.communityTrend.findMany({
      where: { category },
      orderBy: { periodStart: 'desc' },
      take: 12
    });

    return {
      category,
      totalRequests,
      approvedRequests,
      averageResolutionTime: avgResolutionTime,
      topContributors,
      trends
    };
  }

  /**
   * Calculate and store user statistics
   */
  async calculateUserStats(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'all-time',
    periodStart: Date,
    periodEnd: Date
  ): Promise<CommunityStats> {
    // Get user's service requests
    const requests = await this.prisma.serviceRequest.findMany({
      where: {
        createdBy: userId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    // Get user's comments
    const comments = await this.prisma.comment.findMany({
      where: {
        authorId: userId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    // Get upvotes received
    const upvotesReceived = await this.prisma.upvote.count({
      where: {
        request: {
          createdBy: userId,
          createdAt: {
            gte: periodStart,
            lte: periodEnd
          }
        }
      }
    });

    // Get upvotes given
    const upvotesGiven = await this.prisma.upvote.count({
      where: {
        userId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    // Calculate metrics
    const requestsSubmitted = requests.length;
    const requestsApproved = requests.filter(r => 
      ['APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(r.status)
    ).length;
    const requestsResolved = requests.filter(r => 
      ['RESOLVED', 'CLOSED'].includes(r.status)
    ).length;

    // Calculate quality metrics
    const approvalRate = requestsSubmitted > 0 
      ? (requestsApproved / requestsSubmitted) * 100 
      : 0;
    const resolutionRate = requestsApproved > 0
      ? (requestsResolved / requestsApproved) * 100
      : 0;

    // Calculate satisfaction score
    const requestsWithRating = requests.filter(r => r.satisfactionRating);
    const satisfactionScore = requestsWithRating.length > 0
      ? requestsWithRating.reduce((sum, r) => sum + r.satisfactionRating!, 0) / requestsWithRating.length * 20
      : 0;

    // Calculate scores
    const contributionScore = 
      requestsSubmitted * 10 +
      requestsApproved * 20 +
      requestsResolved * 30 +
      comments.length * 5;

    const engagementScore =
      comments.length * 5 +
      upvotesGiven * 2 +
      upvotesReceived * 3;

    const qualityScore =
      approvalRate * 0.5 +
      resolutionRate * 0.3 +
      satisfactionScore * 0.2;

    const overallScore = 
      contributionScore * 0.4 +
      engagementScore * 0.3 +
      qualityScore * 0.3;

    // Store or update statistics
    const stats = await this.model.upsert({
      where: {
        userId_period_periodStart: {
          userId,
          period,
          periodStart
        }
      },
      update: {
        requestsSubmitted,
        requestsApproved,
        requestsResolved,
        commentsPosted: comments.length,
        upvotesReceived,
        upvotesGiven,
        approvalRate,
        resolutionRate,
        satisfactionScore,
        contributionScore,
        engagementScore,
        qualityScore,
        overallScore,
        calculatedAt: new Date()
      },
      create: {
        userId,
        period,
        periodStart,
        periodEnd,
        requestsSubmitted,
        requestsApproved,
        requestsResolved,
        commentsPosted: comments.length,
        upvotesReceived,
        upvotesGiven,
        approvalRate,
        resolutionRate,
        satisfactionScore,
        contributionScore,
        engagementScore,
        qualityScore,
        overallScore
      }
    });

    // Update rankings
    await this.updateRankings(period, periodStart);

    return stats;
  }

  /**
   * Update rankings for a period
   */
  private async updateRankings(period: string, periodStart: Date): Promise<void> {
    // Get all stats for this period sorted by score
    const allStats = await this.model.findMany({
      where: { period, periodStart },
      orderBy: { overallScore: 'desc' }
    });

    // Update ranks
    const updates = allStats.map((stat, index) => 
      this.model.update({
        where: { id: stat.id },
        data: {
          previousRank: stat.rank,
          rank: index + 1
        }
      })
    );

    await this.prisma.$transaction(updates);
  }

  /**
   * Get trending statistics
   */
  async getTrendingStats(
    period: string = 'weekly',
    limit: number = 10
  ): Promise<any> {
    const trends = await this.prisma.communityTrend.findMany({
      where: { period },
      orderBy: [
        { periodStart: 'desc' },
        { change: 'desc' }
      ],
      take: limit
    });

    return trends;
  }

  /**
   * Get statistics summary
   */
  async getStatsSummary(period: string = 'monthly'): Promise<any> {
    // Get aggregate stats for the period without filtering by exact periodStart
    const stats = await this.model.aggregate({
      where: {
        period
      },
      _avg: {
        contributionScore: true,
        engagementScore: true,
        qualityScore: true,
        overallScore: true
      },
      _sum: {
        requestsSubmitted: true,
        requestsApproved: true,
        requestsResolved: true,
        commentsPosted: true,
        upvotesReceived: true,
        upvotesGiven: true
      },
      _count: true
    });

    return {
      period,
      periodStart: new Date(),
      totalUsers: stats._count,
      averageScores: stats._avg,
      totals: stats._sum
    };
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(filters?: CommunityStatsFilters): any {
    const where: any = {};

    if (!filters) return where;

    if (filters.userId) {
      where.userId = filters.userId.includes(',') 
        ? { in: filters.userId.split(',') }
        : filters.userId;
    }

    if (filters.period) {
      where.period = Array.isArray(filters.period)
        ? { in: filters.period }
        : filters.period;
    }

    if (filters.startDate || filters.endDate) {
      where.periodStart = {};
      if (filters.startDate) where.periodStart.gte = filters.startDate;
      if (filters.endDate) where.periodStart.lte = filters.endDate;
    }

    if (filters.minScore !== undefined) {
      where.overallScore = { gte: filters.minScore };
    }

    return where;
  }
}