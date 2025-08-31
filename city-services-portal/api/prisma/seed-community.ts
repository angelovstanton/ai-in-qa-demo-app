import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🏆 Creating community data...');
  
  // Get existing users and requests
  const users = await prisma.user.findMany({ where: { role: 'CITIZEN' }, take: 30 });
  const requests = await prisma.serviceRequest.findMany({ take: 100 });
  
  // 1. Create Achievements
  console.log('   Creating achievements...');
  const achievements = [
    { name: 'First Report', description: 'Submit your first service request', icon: '🎯', category: 'contribution', tier: 'bronze', points: 10, requirement: JSON.stringify({ requestsSubmitted: 1 }), isActive: true },
    { name: 'Active Reporter', description: 'Submit 5 service requests', icon: '📝', category: 'contribution', tier: 'silver', points: 25, requirement: JSON.stringify({ requestsSubmitted: 5 }), isActive: true },
    { name: 'Community Guardian', description: 'Submit 20 service requests', icon: '🛡️', category: 'contribution', tier: 'gold', points: 100, requirement: JSON.stringify({ requestsSubmitted: 20 }), isActive: true },
    { name: 'First Comment', description: 'Post your first comment', icon: '💬', category: 'engagement', tier: 'bronze', points: 5, requirement: JSON.stringify({ commentsPosted: 1 }), isActive: true },
    { name: 'Active Participant', description: 'Post 10 comments', icon: '🗣️', category: 'engagement', tier: 'silver', points: 20, requirement: JSON.stringify({ commentsPosted: 10 }), isActive: true },
    { name: 'Supporter', description: 'Give 20 upvotes', icon: '👍', category: 'engagement', tier: 'silver', points: 15, requirement: JSON.stringify({ upvotesGiven: 20 }), isActive: true },
    { name: 'Problem Solver', description: 'Have 10 requests resolved', icon: '✅', category: 'quality', tier: 'silver', points: 30, requirement: JSON.stringify({ requestsResolved: 10 }), isActive: true },
    { name: 'Week Warrior', description: 'Participate for 7 consecutive days', icon: '📅', category: 'milestone', tier: 'bronze', points: 15, requirement: JSON.stringify({ participationDays: 7 }), isActive: true },
  ];
  
  for (const achievement of achievements) {
    await prisma.achievement.upsert({
      where: { name: achievement.name },
      update: achievement,
      create: achievement
    });
  }
  
  // 2. Create Community Stats for top users
  console.log('   Creating community stats...');
  const periods = ['daily', 'weekly', 'monthly', 'all-time'];
  
  for (const user of users) {
    for (const period of periods) {
      const periodStart = new Date();
      const periodEnd = new Date();
      
      if (period === 'daily') {
        periodStart.setDate(periodStart.getDate() - 1);
      } else if (period === 'weekly') {
        periodStart.setDate(periodStart.getDate() - 7);
      } else if (period === 'monthly') {
        periodStart.setMonth(periodStart.getMonth() - 1);
      } else {
        periodStart.setFullYear(2024, 0, 1);
      }
      
      const requestsSubmitted = Math.floor(Math.random() * 20);
      const requestsApproved = Math.floor(requestsSubmitted * 0.8);
      const requestsResolved = Math.floor(requestsApproved * 0.7);
      const commentsPosted = Math.floor(Math.random() * 30);
      const upvotesReceived = Math.floor(Math.random() * 50);
      const upvotesGiven = Math.floor(Math.random() * 20);
      
      const contributionScore = requestsSubmitted * 10 + requestsApproved * 5 + requestsResolved * 15;
      const engagementScore = commentsPosted * 3 + upvotesGiven * 1 + upvotesReceived * 2;
      const qualityScore = (requestsApproved / Math.max(requestsSubmitted, 1)) * 100;
      const overallScore = contributionScore + engagementScore + qualityScore;
      
      await prisma.communityStats.upsert({
        where: {
          userId_period_periodStart: {
            userId: user.id,
            period,
            periodStart
          }
        },
        update: {
          periodEnd,
          requestsSubmitted,
          requestsApproved,
          requestsResolved,
          commentsPosted,
          upvotesReceived,
          upvotesGiven,
          helpfulComments: Math.floor(commentsPosted * 0.3),
          solutionsProvided: Math.floor(requestsResolved * 0.2),
          averageResponseTime: 2 + Math.random() * 48,
          participationDays: Math.floor(Math.random() * 30) + 1,
          approvalRate: requestsSubmitted > 0 ? (requestsApproved / requestsSubmitted) * 100 : 0,
          resolutionRate: requestsApproved > 0 ? (requestsResolved / requestsApproved) * 100 : 0,
          satisfactionScore: 3 + Math.random() * 2,
          contributionScore,
          engagementScore,
          qualityScore,
          overallScore
        },
        create: {
          userId: user.id,
          period,
          periodStart,
          periodEnd,
          requestsSubmitted,
          requestsApproved,
          requestsResolved,
          commentsPosted,
          upvotesReceived,
          upvotesGiven,
          helpfulComments: Math.floor(commentsPosted * 0.3),
          solutionsProvided: Math.floor(requestsResolved * 0.2),
          averageResponseTime: 2 + Math.random() * 48,
          participationDays: Math.floor(Math.random() * 30) + 1,
          approvalRate: requestsSubmitted > 0 ? (requestsApproved / requestsSubmitted) * 100 : 0,
          resolutionRate: requestsApproved > 0 ? (requestsResolved / requestsApproved) * 100 : 0,
          satisfactionScore: 3 + Math.random() * 2,
          contributionScore,
          engagementScore,
          qualityScore,
          overallScore
        }
      });
    }
  }
  
  // 3. Assign ranks
  console.log('   Calculating rankings...');
  for (const period of periods) {
    const stats = await prisma.communityStats.findMany({
      where: { period },
      orderBy: { overallScore: 'desc' }
    });
    
    let rank = 1;
    for (const stat of stats) {
      await prisma.communityStats.update({
        where: { id: stat.id },
        data: { 
          rank,
          previousRank: rank + Math.floor(Math.random() * 5) - 2
        }
      });
      rank++;
    }
  }
  
  // 4. Grant achievements
  console.log('   Granting achievements...');
  const allAchievements = await prisma.achievement.findMany();
  
  for (const user of users.slice(0, 20)) {
    const userStats = await prisma.communityStats.findFirst({
      where: { userId: user.id, period: 'all-time' }
    });
    
    if (!userStats) continue;
    
    // Grant 2-4 achievements per user
    const numAchievements = 2 + Math.floor(Math.random() * 3);
    const shuffled = allAchievements.sort(() => Math.random() - 0.5);
    
    for (let i = 0; i < Math.min(numAchievements, shuffled.length); i++) {
      await prisma.userAchievement.upsert({
        where: {
          userId_achievementId: {
            userId: user.id,
            achievementId: shuffled[i].id
          }
        },
        update: {
          progress: 100
        },
        create: {
          userId: user.id,
          achievementId: shuffled[i].id,
          progress: 100
        }
      });
    }
  }
  
  // 5. Create Community Trends
  console.log('   Creating community trends...');
  const trendCategories = [
    { category: 'requests', metrics: ['volume', 'resolution_rate', 'avg_response_time'] },
    { category: 'engagement', metrics: ['active_users', 'comments_per_request', 'upvote_rate'] },
    { category: 'quality', metrics: ['approval_rate', 'satisfaction_score'] }
  ];
  
  for (const { category, metrics } of trendCategories) {
    for (const metric of metrics) {
      for (const period of ['daily', 'weekly', 'monthly']) {
        const periodStart = new Date();
        const periodEnd = new Date();
        
        if (period === 'daily') {
          periodStart.setDate(periodStart.getDate() - 1);
        } else if (period === 'weekly') {
          periodStart.setDate(periodStart.getDate() - 7);
        } else {
          periodStart.setMonth(periodStart.getMonth() - 1);
        }
        
        await prisma.communityTrend.upsert({
          where: {
            category_metric_period_periodStart: {
              category,
              metric,
              period,
              periodStart
            }
          },
          update: {
            value: Math.random() * 100,
            change: (Math.random() - 0.5) * 40,
            periodEnd
          },
          create: {
            category,
            metric,
            value: Math.random() * 100,
            change: (Math.random() - 0.5) * 40,
            period,
            periodStart,
            periodEnd
          }
        });
      }
    }
  }
  
  const statsCount = await prisma.communityStats.count();
  const achievementsCount = await prisma.userAchievement.count();
  const trendsCount = await prisma.communityTrend.count();
  
  console.log(`✅ Community data creation complete!`);
  console.log(`   📊 Community stats: ${statsCount}`);
  console.log(`   🏆 User achievements: ${achievementsCount}`);
  console.log(`   📈 Community trends: ${trendsCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });