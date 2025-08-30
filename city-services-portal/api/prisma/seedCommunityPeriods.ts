import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedCommunityPeriods() {
  console.log('🚀 Seeding community data for different periods...');

  try {
    // Get sample users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      take: 20
    });

    if (users.length === 0) {
      console.log('❌ No users found. Please run the main seed script first.');
      return;
    }

    const now = new Date();
    const periods = [
      {
        type: 'daily',
        start: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999),
        multiplier: 0.1
      },
      {
        type: 'weekly',
        start: new Date(now.setDate(now.getDate() - now.getDay())),
        end: new Date(now.getFullYear(), now.getMonth(), now.getDate() + (6 - now.getDay()), 23, 59, 59, 999),
        multiplier: 0.3
      },
      {
        type: 'yearly',
        start: new Date(now.getFullYear(), 0, 1),
        end: new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999),
        multiplier: 12
      },
      {
        type: 'all-time',
        start: new Date(2020, 0, 1),
        end: new Date(2030, 11, 31, 23, 59, 59, 999),
        multiplier: 50
      }
    ];

    for (const period of periods) {
      console.log(`Creating ${period.type} stats...`);
      
      const statsData = [];
      
      for (let i = 0; i < users.length; i++) {
        const user = users[i];
        const variance = Math.random() * 0.3 + 0.85;
        const position = i + 1;
        const baseScore = Math.max(100, 1000 - (position * 40));
        
        // Adjust values based on period multiplier
        const requestsSubmitted = Math.floor((30 - position) * variance * period.multiplier);
        const requestsApproved = Math.floor(requestsSubmitted * (0.7 + Math.random() * 0.3));
        const requestsResolved = Math.floor(requestsApproved * (0.6 + Math.random() * 0.4));
        const commentsPosted = Math.floor((50 - position * 2) * variance * period.multiplier);
        const upvotesReceived = Math.floor((100 - position * 4) * variance * period.multiplier);
        const upvotesGiven = Math.floor((60 - position * 2) * variance * period.multiplier);
        
        const contributionScore = requestsSubmitted * 10 + requestsApproved * 20 + requestsResolved * 30;
        const engagementScore = commentsPosted * 5 + upvotesGiven * 2 + upvotesReceived * 3;
        const qualityScore = requestsApproved > 0 ? (requestsApproved / requestsSubmitted) * 100 : 0;
        const overallScore = contributionScore * 0.4 + engagementScore * 0.3 + qualityScore * 0.3;
        
        const stats = {
          userId: user.id,
          period: period.type,
          periodStart: period.start,
          periodEnd: period.end,
          requestsSubmitted: Math.max(0, requestsSubmitted),
          requestsApproved: Math.max(0, requestsApproved),
          requestsResolved: Math.max(0, requestsResolved),
          commentsPosted: Math.max(0, commentsPosted),
          upvotesReceived: Math.max(0, upvotesReceived),
          upvotesGiven: Math.max(0, upvotesGiven),
          contributionScore: Math.max(0, contributionScore),
          engagementScore: Math.max(0, engagementScore),
          qualityScore: Math.max(0, qualityScore),
          overallScore: Math.max(0, overallScore),
          approvalRate: requestsSubmitted > 0 ? (requestsApproved / requestsSubmitted) * 100 : 0,
          resolutionRate: requestsApproved > 0 ? (requestsResolved / requestsApproved) * 100 : 0,
          satisfactionScore: 70 + Math.random() * 30,
          rank: 0
        };
        
        statsData.push(stats);
      }
      
      // Sort by overall score and assign ranks
      statsData.sort((a, b) => b.overallScore - a.overallScore);
      statsData.forEach((stat, index) => {
        stat.rank = index + 1;
      });
      
      // Upsert all stats
      for (const stat of statsData) {
        await prisma.communityStats.upsert({
          where: {
            userId_period_periodStart: {
              userId: stat.userId,
              period: stat.period,
              periodStart: stat.periodStart
            }
          },
          update: stat,
          create: stat
        });
      }
      
      console.log(`✅ Created ${period.type} stats for ${statsData.length} users`);
    }

    console.log('\n🎉 Community periods seeding completed!');

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Execute
seedCommunityPeriods()
  .catch(console.error)
  .finally(() => prisma.$disconnect());