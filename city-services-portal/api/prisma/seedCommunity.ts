import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCommunityData() {
  console.log('🌱 Seeding community data...');

  // Create default achievements
  const achievements = [
    // Contribution achievements
    {
      name: 'First Request',
      description: 'Submit your first service request',
      icon: '🎯',
      category: 'contribution',
      tier: 'bronze',
      points: 10,
      requirement: JSON.stringify({ requestsSubmitted: 1 })
    },
    {
      name: 'Request Veteran',
      description: 'Submit 10 service requests',
      icon: '📝',
      category: 'contribution',
      tier: 'silver',
      points: 50,
      requirement: JSON.stringify({ requestsSubmitted: 10 })
    },
    {
      name: 'Community Champion',
      description: 'Submit 50 service requests',
      icon: '🏆',
      category: 'contribution',
      tier: 'gold',
      points: 200,
      requirement: JSON.stringify({ requestsSubmitted: 50 })
    },
    {
      name: 'City Hero',
      description: 'Submit 100 service requests',
      icon: '🦸',
      category: 'contribution',
      tier: 'platinum',
      points: 500,
      requirement: JSON.stringify({ requestsSubmitted: 100 })
    },
    
    // Engagement achievements
    {
      name: 'Helpful Neighbor',
      description: 'Post 10 helpful comments',
      icon: '💬',
      category: 'engagement',
      tier: 'bronze',
      points: 20,
      requirement: JSON.stringify({ commentsPosted: 10 })
    },
    {
      name: 'Community Voice',
      description: 'Receive 25 upvotes on your requests',
      icon: '👍',
      category: 'engagement',
      tier: 'silver',
      points: 75,
      requirement: JSON.stringify({ upvotesReceived: 25 })
    },
    {
      name: 'Trusted Advisor',
      description: 'Post 50 comments and receive 100 upvotes',
      icon: '🎓',
      category: 'engagement',
      tier: 'gold',
      points: 300,
      requirement: JSON.stringify({ commentsPosted: 50, upvotesReceived: 100 })
    },
    
    // Quality achievements
    {
      name: 'Quality Contributor',
      description: 'Maintain 80% approval rate on requests',
      icon: '⭐',
      category: 'quality',
      tier: 'silver',
      points: 100,
      requirement: JSON.stringify({ approvalRate: 80 })
    },
    {
      name: 'Excellence Award',
      description: 'Achieve 90% satisfaction rating',
      icon: '🌟',
      category: 'quality',
      tier: 'gold',
      points: 250,
      requirement: JSON.stringify({ satisfactionScore: 90 })
    },
    {
      name: 'Perfect Record',
      description: '100% approval rate with 20+ requests',
      icon: '💎',
      category: 'quality',
      tier: 'platinum',
      points: 1000,
      requirement: JSON.stringify({ approvalRate: 100, minRequests: 20 })
    },
    
    // Milestone achievements
    {
      name: 'Early Adopter',
      description: 'Active member for 30 days',
      icon: '🌱',
      category: 'milestone',
      tier: 'bronze',
      points: 25,
      requirement: JSON.stringify({ daysActive: 30 })
    },
    {
      name: 'Veteran Member',
      description: 'Active member for 180 days',
      icon: '🌳',
      category: 'milestone',
      tier: 'silver',
      points: 150,
      requirement: JSON.stringify({ daysActive: 180 })
    },
    {
      name: 'Founding Member',
      description: 'Active member for 365 days',
      icon: '🏛️',
      category: 'milestone',
      tier: 'gold',
      points: 500,
      requirement: JSON.stringify({ daysActive: 365 })
    },
    {
      name: 'Problem Solver',
      description: 'Have 10 of your reported issues resolved',
      icon: '✅',
      category: 'milestone',
      tier: 'silver',
      points: 100,
      requirement: JSON.stringify({ requestsResolved: 10 })
    },
    {
      name: 'Top Contributor',
      description: 'Rank in top 10 for a month',
      icon: '🥇',
      category: 'milestone',
      tier: 'gold',
      points: 400,
      requirement: JSON.stringify({ topRank: 10, period: 'monthly' })
    },
    {
      name: 'Leaderboard Legend',
      description: 'Rank #1 for a month',
      icon: '👑',
      category: 'milestone',
      tier: 'platinum',
      points: 1500,
      requirement: JSON.stringify({ topRank: 1, period: 'monthly' })
    }
  ];

  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { 
        name: achievement.name 
      },
      update: achievement,
      create: achievement
    });
  }

  console.log(`✅ Created ${achievements.length} achievements`);

  // Initialize feature flags (all disabled by default)
  const featureFlags = [
    { key: 'UI_WrongDefaultSort', value: JSON.stringify(false) },
    { key: 'UI_MissingAria_Search', value: JSON.stringify(false) },
    { key: 'API_Random500', value: JSON.stringify(false) },
    { key: 'API_SlowRequests', value: JSON.stringify(false) },
    { key: 'API_UploadIntermittentFail', value: JSON.stringify(false) },
  ];

  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { value: flag.value },
      create: flag
    });
  }

  console.log(`✅ Initialized ${featureFlags.length} feature flags (all disabled)`);

  // Calculate initial community stats for existing users
  const users = await prisma.user.findMany({
    where: { isActive: true }
  });

  console.log(`📊 Calculating initial stats for ${users.length} users...`);

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  for (const user of users) {
    // Get user's service requests for this month
    const requests = await prisma.serviceRequest.findMany({
      where: {
        createdBy: user.id,
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // Get user's comments for this month
    const comments = await prisma.comment.findMany({
      where: {
        authorId: user.id,
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // Get upvotes received
    const upvotesReceived = await prisma.upvote.count({
      where: {
        request: {
          createdBy: user.id
        },
        createdAt: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    // Get upvotes given
    const upvotesGiven = await prisma.upvote.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: monthStart,
          lte: monthEnd
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

    // Create or update community stats
    await prisma.communityStats.upsert({
      where: {
        userId_period_periodStart: {
          userId: user.id,
          period: 'monthly',
          periodStart: monthStart
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
        userId: user.id,
        period: 'monthly',
        periodStart: monthStart,
        periodEnd: monthEnd,
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

    // Check and award achievements
    for (const achievement of achievements) {
      const requirement = JSON.parse(achievement.requirement);
      let qualified = true;

      // Check each requirement
      if (requirement.requestsSubmitted && requestsSubmitted < requirement.requestsSubmitted) {
        qualified = false;
      }
      if (requirement.commentsPosted && comments.length < requirement.commentsPosted) {
        qualified = false;
      }
      if (requirement.upvotesReceived && upvotesReceived < requirement.upvotesReceived) {
        qualified = false;
      }
      if (requirement.approvalRate && approvalRate < requirement.approvalRate) {
        qualified = false;
      }
      if (requirement.satisfactionScore && satisfactionScore < requirement.satisfactionScore) {
        qualified = false;
      }

      if (qualified && (requestsSubmitted > 0 || comments.length > 0)) {
        // Award achievement if qualified
        await prisma.userAchievement.upsert({
          where: {
            userId_achievementId: {
              userId: user.id,
              achievementId: achievement.id
            }
          },
          update: {},
          create: {
            userId: user.id,
            achievementId: achievement.id,
            progress: 100
          }
        });
      }
    }
  }

  // Update rankings
  const allStats = await prisma.communityStats.findMany({
    where: {
      period: 'monthly',
      periodStart: monthStart
    },
    orderBy: { overallScore: 'desc' }
  });

  // Update ranks
  for (let i = 0; i < allStats.length; i++) {
    await prisma.communityStats.update({
      where: { id: allStats[i].id },
      data: { rank: i + 1 }
    });
  }

  console.log('✅ Initial community stats calculated and rankings updated');

  // Create some sample community trends
  const trends = [
    {
      category: 'Infrastructure',
      metric: 'requests',
      value: 150,
      change: 12.5,
      period: 'monthly',
      periodStart: monthStart,
      periodEnd: monthEnd
    },
    {
      category: 'Parks & Recreation',
      metric: 'requests',
      value: 85,
      change: -5.2,
      period: 'monthly',
      periodStart: monthStart,
      periodEnd: monthEnd
    },
    {
      category: 'Public Safety',
      metric: 'requests',
      value: 120,
      change: 8.3,
      period: 'monthly',
      periodStart: monthStart,
      periodEnd: monthEnd
    },
    {
      category: 'Utilities',
      metric: 'requests',
      value: 200,
      change: 15.7,
      period: 'monthly',
      periodStart: monthStart,
      periodEnd: monthEnd
    }
  ];

  for (const trend of trends) {
    await prisma.communityTrend.upsert({
      where: {
        category_metric_period_periodStart: {
          category: trend.category,
          metric: trend.metric,
          period: trend.period,
          periodStart: trend.periodStart
        }
      },
      update: trend,
      create: trend
    });
  }

  console.log(`✅ Created ${trends.length} community trends`);
  console.log('🎉 Community data seeding completed!');
}

seedCommunityData()
  .catch((error) => {
    console.error('Error seeding community data:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });