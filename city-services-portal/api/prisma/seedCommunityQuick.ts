import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedQuickCommunityData() {
  console.log('🚀 Quick community data seeding...');

  try {
    // Get sample users
    const users = await prisma.user.findMany({
      where: { isActive: true },
      take: 20 // Limit to 20 users for quick seeding
    });

    if (users.length === 0) {
      console.log('❌ No users found. Please run the main seed script first.');
      return;
    }

    console.log(`Found ${users.length} users for quick seeding...`);

    // Calculate stats for monthly period only
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
    periodStart.setHours(0, 0, 0, 0);
    const periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    periodEnd.setHours(23, 59, 59, 999);

    const statsData = [];
    
    // Create varied community stats for each user
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      
      // Create varied scores based on position
      const variance = Math.random() * 0.3 + 0.85; // 0.85 to 1.15
      const position = i + 1;
      
      // Higher scores for top users
      const baseScore = Math.max(100, 1000 - (position * 40));
      
      const requestsSubmitted = Math.floor((30 - position) * variance);
      const requestsApproved = Math.floor(requestsSubmitted * (0.7 + Math.random() * 0.3));
      const requestsResolved = Math.floor(requestsApproved * (0.6 + Math.random() * 0.4));
      const commentsPosted = Math.floor((50 - position * 2) * variance);
      const upvotesReceived = Math.floor((100 - position * 4) * variance);
      const upvotesGiven = Math.floor((60 - position * 2) * variance);
      
      const contributionScore = requestsSubmitted * 10 + requestsApproved * 20 + requestsResolved * 30;
      const engagementScore = commentsPosted * 5 + upvotesGiven * 2 + upvotesReceived * 3;
      const qualityScore = requestsApproved > 0 ? (requestsApproved / requestsSubmitted) * 100 : 0;
      const overallScore = contributionScore * 0.4 + engagementScore * 0.3 + qualityScore * 0.3;
      
      const stats = {
        userId: user.id,
        period: 'monthly',
        periodStart,
        periodEnd,
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
        satisfactionScore: 70 + Math.random() * 30, // 70-100
        rank: 0 // Will be updated later
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
    
    console.log(`✅ Created monthly stats for ${statsData.length} users`);

    // Create achievements if they don't exist
    const achievements = [
      {
        name: 'First Steps',
        description: 'Submit your first service request',
        category: 'contribution',
        tier: 'bronze',
        points: 10,
        requirement: JSON.stringify({ requestsSubmitted: 1 }),
        isActive: true
      },
      {
        name: 'Active Reporter',
        description: 'Submit 5 service requests',
        category: 'contribution',
        tier: 'silver',
        points: 50,
        requirement: JSON.stringify({ requestsSubmitted: 5 }),
        isActive: true
      },
      {
        name: 'Community Champion',
        description: 'Submit 10 service requests',
        category: 'contribution',
        tier: 'gold',
        points: 100,
        requirement: JSON.stringify({ requestsSubmitted: 10 }),
        isActive: true
      },
      {
        name: 'Engaged Citizen',
        description: 'Post 10 comments',
        category: 'engagement',
        tier: 'bronze',
        points: 20,
        requirement: JSON.stringify({ commentsPosted: 10 }),
        isActive: true
      },
      {
        name: 'Popular Voice',
        description: 'Receive 20 upvotes',
        category: 'engagement',
        tier: 'silver',
        points: 75,
        requirement: JSON.stringify({ upvotesReceived: 20 }),
        isActive: true
      },
      {
        name: 'Quality Reporter',
        description: 'Have 5 requests approved',
        category: 'quality',
        tier: 'bronze',
        points: 30,
        requirement: JSON.stringify({ requestsApproved: 5 }),
        isActive: true
      },
      {
        name: 'Top Contributor',
        description: 'Rank in top 10',
        category: 'milestone',
        tier: 'gold',
        points: 300,
        requirement: JSON.stringify({ topRank: 10 }),
        isActive: true
      },
      {
        name: 'Leader',
        description: 'Rank in top 3',
        category: 'milestone',
        tier: 'platinum',
        points: 1000,
        requirement: JSON.stringify({ topRank: 3 }),
        isActive: true
      }
    ];

    for (const achievement of achievements) {
      await prisma.achievement.upsert({
        where: { name: achievement.name },
        update: achievement,
        create: achievement
      });
    }
    
    console.log(`✅ Created ${achievements.length} achievements`);

    // Award achievements based on stats
    const allAchievements = await prisma.achievement.findMany();
    let awardsGiven = 0;
    
    for (const stat of statsData) {
      for (const achievement of allAchievements) {
        const req = JSON.parse(achievement.requirement);
        let qualified = false;
        
        if (req.requestsSubmitted && stat.requestsSubmitted >= req.requestsSubmitted) qualified = true;
        if (req.requestsApproved && stat.requestsApproved >= req.requestsApproved) qualified = true;
        if (req.commentsPosted && stat.commentsPosted >= req.commentsPosted) qualified = true;
        if (req.upvotesReceived && stat.upvotesReceived >= req.upvotesReceived) qualified = true;
        if (req.topRank && stat.rank <= req.topRank) qualified = true;
        
        if (qualified) {
          try {
            await prisma.userAchievement.upsert({
              where: {
                userId_achievementId: {
                  userId: stat.userId,
                  achievementId: achievement.id
                }
              },
              update: {},
              create: {
                userId: stat.userId,
                achievementId: achievement.id,
                progress: 100
              }
            });
            awardsGiven++;
          } catch (e) {
            // Ignore duplicates
          }
        }
      }
    }
    
    console.log(`✅ Awarded ${awardsGiven} achievements`);

    // Create sample trends
    const categories = ['Infrastructure', 'Parks & Recreation', 'Public Safety', 'Utilities'];
    
    for (const category of categories) {
      const value = Math.floor(Math.random() * 200 + 50);
      const change = (Math.random() * 40 - 20); // -20 to +20
      
      await prisma.communityTrend.upsert({
        where: {
          category_metric_period_periodStart: {
            category,
            metric: 'requests',
            period: 'monthly',
            periodStart
          }
        },
        update: { value, change },
        create: {
          category,
          metric: 'requests',
          value,
          change,
          period: 'monthly',
          periodStart,
          periodEnd
        }
      });
    }
    
    console.log(`✅ Created trends for ${categories.length} categories`);

    console.log('\n🎉 Quick community data seeding completed!');
    
    // Show top 5 users
    const topUsers = await prisma.communityStats.findMany({
      where: { period: 'monthly', periodStart },
      orderBy: { overallScore: 'desc' },
      take: 5,
      include: { user: true }
    });
    
    console.log('\n🏆 Top 5 Users:');
    topUsers.forEach((stat, i) => {
      console.log(`   ${i + 1}. ${stat.user.name} - Score: ${stat.overallScore.toFixed(0)}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

// Execute
seedQuickCommunityData()
  .catch(console.error)
  .finally(() => prisma.$disconnect());