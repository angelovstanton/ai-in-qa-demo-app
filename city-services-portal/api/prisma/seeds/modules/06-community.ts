import { PrismaClient, ServiceRequest, User } from '@prisma/client';
import { UsersSeedResult } from './02-users';

export async function seedCommunityData(
  prisma: PrismaClient,
  users: UsersSeedResult,
  requests: ServiceRequest[]
): Promise<number> {
  console.log('🏆 Seeding Community Data...');
  
  let totalRecords = 0;
  const { citizens, clerks, fieldAgents, supervisors } = users;
  const allCommunityUsers = [...citizens, ...clerks.slice(0, 5), ...fieldAgents.slice(0, 3)]; // Some staff participate too
  
  // 1. Create Achievements
  console.log('   Creating achievements...');
  const achievements = [
    // Contribution achievements
    { name: 'First Report', description: 'Submit your first service request', category: 'contribution', tier: 'bronze', points: 10, requirement: JSON.stringify({ requestsSubmitted: 1 }) },
    { name: 'Active Reporter', description: 'Submit 5 service requests', category: 'contribution', tier: 'silver', points: 25, requirement: JSON.stringify({ requestsSubmitted: 5 }) },
    { name: 'Community Guardian', description: 'Submit 20 service requests', category: 'contribution', tier: 'gold', points: 100, requirement: JSON.stringify({ requestsSubmitted: 20 }) },
    { name: 'City Champion', description: 'Submit 50 service requests', category: 'contribution', tier: 'platinum', points: 250, requirement: JSON.stringify({ requestsSubmitted: 50 }) },
    
    // Engagement achievements
    { name: 'First Comment', description: 'Post your first comment', category: 'engagement', tier: 'bronze', points: 5, requirement: JSON.stringify({ commentsPosted: 1 }) },
    { name: 'Active Participant', description: 'Post 10 comments', category: 'engagement', tier: 'silver', points: 20, requirement: JSON.stringify({ commentsPosted: 10 }) },
    { name: 'Community Voice', description: 'Post 50 comments', category: 'engagement', tier: 'gold', points: 75, requirement: JSON.stringify({ commentsPosted: 50 }) },
    { name: 'Supporter', description: 'Give 20 upvotes', category: 'engagement', tier: 'silver', points: 15, requirement: JSON.stringify({ upvotesGiven: 20 }) },
    { name: 'Popular Contributor', description: 'Receive 30 upvotes', category: 'engagement', tier: 'gold', points: 50, requirement: JSON.stringify({ upvotesReceived: 30 }) },
    
    // Quality achievements
    { name: 'High Approval Rate', description: 'Get 90% of your requests approved', category: 'quality', tier: 'gold', points: 60, requirement: JSON.stringify({ approvalRate: 90 }) },
    { name: 'Problem Solver', description: 'Have 10 requests resolved', category: 'quality', tier: 'silver', points: 30, requirement: JSON.stringify({ requestsResolved: 10 }) },
    { name: 'Solution Expert', description: 'Have 25 requests resolved', category: 'quality', tier: 'gold', points: 80, requirement: JSON.stringify({ requestsResolved: 25 }) },
    
    // Milestone achievements
    { name: 'Week Warrior', description: 'Participate for 7 consecutive days', category: 'milestone', tier: 'bronze', points: 15, requirement: JSON.stringify({ participationDays: 7 }) },
    { name: 'Month Master', description: 'Participate for 30 days', category: 'milestone', tier: 'silver', points: 40, requirement: JSON.stringify({ participationDays: 30 }) },
    { name: 'Year Veteran', description: 'Active member for 1 year', category: 'milestone', tier: 'platinum', points: 200, requirement: JSON.stringify({ membershipDays: 365 }) }
  ];
  
  for (const achievement of achievements) {
    await prisma.achievement.create({ data: achievement });
    totalRecords++;
  }
  
  // 2. Create Community Stats for active users
  console.log('   Creating community stats...');
  const periods = ['daily', 'weekly', 'monthly', 'yearly', 'all-time'];
  const now = new Date();
  
  for (const user of allCommunityUsers.slice(0, 40)) { // Top 40 active users
    // Count user's actual activity
    const userRequests = requests.filter(r => r.createdBy === user.id);
    const userComments = await prisma.comment.count({ where: { authorId: user.id } });
    const userUpvotesReceived = await prisma.upvote.count({ 
      where: { request: { createdBy: user.id } } 
    });
    
    for (const period of periods) {
      let periodStart = new Date();
      let periodEnd = new Date();
      
      switch (period) {
        case 'daily':
          periodStart.setDate(periodStart.getDate() - 1);
          break;
        case 'weekly':
          periodStart.setDate(periodStart.getDate() - 7);
          break;
        case 'monthly':
          periodStart.setMonth(periodStart.getMonth() - 1);
          break;
        case 'yearly':
          periodStart.setFullYear(periodStart.getFullYear() - 1);
          break;
        case 'all-time':
          periodStart = new Date('2024-01-01');
          break;
      }
      
      // Calculate period-specific stats with some randomization
      const periodMultiplier = period === 'daily' ? 0.05 : 
                              period === 'weekly' ? 0.15 :
                              period === 'monthly' ? 0.4 :
                              period === 'yearly' ? 0.8 : 1;
      
      const requestsSubmitted = Math.floor(userRequests.length * periodMultiplier * (0.8 + Math.random() * 0.4));
      const requestsApproved = Math.floor(requestsSubmitted * (0.7 + Math.random() * 0.3));
      const requestsResolved = Math.floor(requestsApproved * (0.6 + Math.random() * 0.4));
      const commentsPosted = Math.floor(userComments * periodMultiplier * (0.8 + Math.random() * 0.4));
      const upvotesReceived = Math.floor(userUpvotesReceived * periodMultiplier * (0.8 + Math.random() * 0.4));
      const upvotesGiven = Math.floor(Math.random() * 20 * periodMultiplier);
      
      const contributionScore = requestsSubmitted * 10 + requestsApproved * 5 + requestsResolved * 15;
      const engagementScore = commentsPosted * 3 + upvotesGiven * 1 + upvotesReceived * 2;
      const qualityScore = (requestsApproved / Math.max(requestsSubmitted, 1)) * 100 + 
                          (requestsResolved / Math.max(requestsApproved, 1)) * 100;
      const overallScore = contributionScore + engagementScore + qualityScore;
      
      await prisma.communityStats.create({
        data: {
          userId: user.id,
          period,
          periodStart,
          periodEnd,
          
          // Contribution metrics
          requestsSubmitted,
          requestsApproved,
          requestsResolved,
          commentsPosted,
          upvotesReceived,
          upvotesGiven,
          
          // Engagement metrics
          helpfulComments: Math.floor(commentsPosted * 0.3),
          solutionsProvided: Math.floor(requestsResolved * 0.2),
          averageResponseTime: 2 + Math.random() * 48, // 2-50 hours
          participationDays: Math.floor(Math.random() * 30) + 1,
          
          // Quality metrics
          approvalRate: requestsSubmitted > 0 ? (requestsApproved / requestsSubmitted) * 100 : 0,
          resolutionRate: requestsApproved > 0 ? (requestsResolved / requestsApproved) * 100 : 0,
          satisfactionScore: 3 + Math.random() * 2, // 3-5 rating
          
          // Ranking scores
          contributionScore,
          engagementScore,
          qualityScore,
          overallScore
        }
      });
      totalRecords++;
    }
  }
  
  // 3. Assign ranks based on overall scores
  console.log('   Calculating community rankings...');
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
          previousRank: rank + Math.floor(Math.random() * 5) - 2 // Some movement in ranks
        }
      });
      rank++;
    }
  }
  
  // 4. Grant achievements to users
  console.log('   Granting user achievements...');
  const allAchievements = await prisma.achievement.findMany();
  
  for (const user of allCommunityUsers.slice(0, 30)) { // Top 30 users get achievements
    const userStats = await prisma.communityStats.findFirst({
      where: { userId: user.id, period: 'all-time' }
    });
    
    if (!userStats) continue;
    
    // Check and grant achievements based on stats
    for (const achievement of allAchievements) {
      const requirement = JSON.parse(achievement.requirement);
      let earned = false;
      
      // Check if user meets the requirement
      if (requirement.requestsSubmitted && userStats.requestsSubmitted >= requirement.requestsSubmitted) earned = true;
      if (requirement.commentsPosted && userStats.commentsPosted >= requirement.commentsPosted) earned = true;
      if (requirement.upvotesGiven && userStats.upvotesGiven >= requirement.upvotesGiven) earned = true;
      if (requirement.upvotesReceived && userStats.upvotesReceived >= requirement.upvotesReceived) earned = true;
      if (requirement.requestsResolved && userStats.requestsResolved >= requirement.requestsResolved) earned = true;
      if (requirement.approvalRate && userStats.approvalRate && userStats.approvalRate >= requirement.approvalRate) earned = true;
      if (requirement.participationDays && userStats.participationDays >= requirement.participationDays) earned = true;
      
      // Random chance for some achievements
      if (!earned && Math.random() > 0.7) earned = true;
      
      if (earned) {
        await prisma.userAchievement.create({
          data: {
            userId: user.id,
            achievementId: achievement.id,
            progress: 100,
            metadata: JSON.stringify({
              earnedFor: 'all-time',
              stats: {
                requests: userStats.requestsSubmitted,
                comments: userStats.commentsPosted,
                score: userStats.overallScore
              }
            })
          }
        });
        totalRecords++;
        
        // Limit achievements per user
        if (Math.random() > 0.6) break;
      }
    }
  }
  
  // 5. Create Community Trends
  console.log('   Creating community trends...');
  const trendCategories = [
    { category: 'requests', metrics: ['volume', 'resolution_rate', 'avg_response_time'] },
    { category: 'engagement', metrics: ['active_users', 'comments_per_request', 'upvote_rate'] },
    { category: 'quality', metrics: ['approval_rate', 'satisfaction_score', 'first_contact_resolution'] },
    { category: 'departments', metrics: ['most_active', 'fastest_response', 'highest_satisfaction'] }
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
        
        await prisma.communityTrend.create({
          data: {
            category,
            metric,
            value: Math.random() * 100,
            change: (Math.random() - 0.5) * 40, // -20% to +20% change
            period,
            periodStart,
            periodEnd,
            metadata: JSON.stringify({
              unit: metric.includes('rate') ? 'percentage' : 
                    metric.includes('time') ? 'hours' :
                    metric.includes('score') ? 'rating' : 'count',
              trend: Math.random() > 0.5 ? 'improving' : 'declining'
            })
          }
        });
        totalRecords++;
      }
    }
  }
  
  console.log(`   ✅ Created ${totalRecords} community data records\n`);
  return totalRecords;
}