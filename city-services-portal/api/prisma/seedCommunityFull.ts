import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

// Service request categories and their details
const CATEGORIES = [
  'Infrastructure',
  'Parks & Recreation', 
  'Public Safety',
  'Utilities',
  'Waste Management',
  'Transportation',
  'Street Lighting',
  'Environmental Services'
];

const ISSUE_TYPES = {
  'Infrastructure': ['Pothole', 'Sidewalk Damage', 'Bridge Repair', 'Road Marking'],
  'Parks & Recreation': ['Park Maintenance', 'Playground Repair', 'Trail Improvement', 'Sports Facility'],
  'Public Safety': ['Street Light Out', 'Traffic Signal', 'Crosswalk Issue', 'Speed Concern'],
  'Utilities': ['Water Leak', 'Power Outage', 'Gas Leak', 'Sewer Issue'],
  'Waste Management': ['Missed Pickup', 'Illegal Dumping', 'Recycling Issue', 'Bulk Item'],
  'Transportation': ['Bus Stop Issue', 'Parking Problem', 'Traffic Congestion', 'Road Closure'],
  'Street Lighting': ['Light Out', 'New Light Request', 'Light Too Bright', 'Damaged Pole'],
  'Environmental Services': ['Tree Trimming', 'Storm Damage', 'Flooding', 'Snow Removal']
};

const STATUSES = ['SUBMITTED', 'TRIAGED', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'];
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];

// Comments templates
const COMMENT_TEMPLATES = [
  'I have the same issue in my neighborhood.',
  'This has been a problem for months now.',
  'Thank you for reporting this!',
  'The city should prioritize this.',
  'I saw the crew working on this yesterday.',
  'Great job getting this resolved quickly!',
  'This affects many residents in the area.',
  'Is there an estimated timeline for resolution?',
  'I can provide additional photos if needed.',
  'This is a safety concern for children.',
  'Excellent communication from the city team.',
  'The temporary fix is working well.',
  'Looking forward to the permanent solution.',
  'This issue is getting worse.',
  'Thank you for the quick response!',
  'I appreciate the updates on this request.',
  'This should be marked as urgent.',
  'The problem has spread to adjacent areas.',
  'Wonderful work by the field team!',
  'Can we get a status update please?'
];

async function seedFullCommunityData() {
  console.log('🌱 Starting comprehensive community data seeding...');

  try {
    // Get all users
    const users = await prisma.user.findMany({
      where: { isActive: true }
    });

    if (users.length === 0) {
      console.log('❌ No users found. Please run the main seed script first.');
      return;
    }

    console.log(`Found ${users.length} users to generate data for...`);

    // Create service requests for each user
    const allRequests = [];
    const requestsByUser = new Map();

    for (const user of users) {
      // Determine number of requests based on role
      let numRequests = 0;
      if (user.role === 'CITIZEN') {
        numRequests = faker.number.int({ min: 5, max: 30 });
      } else if (user.role === 'CLERK' || user.role === 'FIELD_AGENT') {
        numRequests = faker.number.int({ min: 2, max: 10 });
      } else if (user.role === 'SUPERVISOR' || user.role === 'ADMIN') {
        numRequests = faker.number.int({ min: 1, max: 5 });
      }

      const userRequests = [];

      for (let i = 0; i < numRequests; i++) {
        const category = faker.helpers.arrayElement(CATEGORIES);
        const issueType = faker.helpers.arrayElement(ISSUE_TYPES[category] || ['General Issue']);
        const status = faker.helpers.arrayElement(STATUSES);
        const priority = faker.helpers.arrayElement(PRIORITIES);
        
        // Generate dates
        const createdAt = faker.date.between({
          from: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
          to: new Date()
        });
        
        let closedAt = null;
        if (status === 'CLOSED' || status === 'RESOLVED') {
          closedAt = faker.date.between({
            from: createdAt,
            to: new Date()
          });
        }

        const request = await prisma.serviceRequest.create({
          data: {
            code: `REQ-${Date.now()}-${faker.string.alphanumeric(6).toUpperCase()}`,
            title: `${issueType} at ${faker.location.street()}`,
            description: faker.lorem.paragraph(),
            category,
            priority,
            status,
            dateOfRequest: createdAt,
            createdAt,
            streetAddress: faker.location.streetAddress(),
            city: faker.location.city(),
            postalCode: faker.location.zipCode(),
            locationText: faker.location.secondaryAddress(),
            landmark: faker.helpers.maybe(() => faker.location.nearbyGPSCoordinate().toString()),
            lat: parseFloat(faker.location.latitude()),
            lng: parseFloat(faker.location.longitude()),
            email: user.email,
            phone: faker.phone.number(),
            issueType,
            severity: faker.number.int({ min: 1, max: 10 }),
            isRecurring: faker.datatype.boolean(),
            isEmergency: priority === 'URGENT',
            satisfactionRating: status === 'CLOSED' ? faker.number.int({ min: 3, max: 5 }) : null,
            closedAt,
            createdBy: user.id,
            departmentId: user.departmentId,
            assignedTo: status !== 'SUBMITTED' ? faker.helpers.maybe(() => 
              faker.helpers.arrayElement(users.filter(u => u.role === 'CLERK' || u.role === 'FIELD_AGENT')).id
            ) : null
          }
        });

        userRequests.push(request);
        allRequests.push(request);
      }

      requestsByUser.set(user.id, userRequests);
      console.log(`✅ Created ${numRequests} requests for ${user.name}`);
    }

    console.log(`\n📝 Total requests created: ${allRequests.length}`);

    // Generate comments
    console.log('\n💬 Generating comments...');
    let totalComments = 0;

    for (const request of allRequests) {
      const numComments = faker.number.int({ min: 0, max: 8 });
      
      for (let i = 0; i < numComments; i++) {
        const commenter = faker.helpers.arrayElement(users);
        
        await prisma.comment.create({
          data: {
            requestId: request.id,
            authorId: commenter.id,
            body: faker.helpers.arrayElement(COMMENT_TEMPLATES),
            visibility: faker.helpers.arrayElement(['PUBLIC', 'INTERNAL']),
            createdAt: faker.date.between({
              from: request.createdAt,
              to: new Date()
            })
          }
        });
        totalComments++;
      }
    }

    console.log(`✅ Created ${totalComments} comments`);

    // Generate upvotes
    console.log('\n👍 Generating upvotes...');
    let totalUpvotes = 0;

    for (const request of allRequests) {
      // Popular requests get more upvotes
      const isPopular = faker.datatype.boolean();
      const numUpvotes = isPopular 
        ? faker.number.int({ min: 5, max: 20 })
        : faker.number.int({ min: 0, max: 5 });
      
      const upvoters = faker.helpers.arrayElements(users, numUpvotes);
      
      for (const upvoter of upvoters) {
        try {
          await prisma.upvote.create({
            data: {
              userId: upvoter.id,
              requestId: request.id,
              createdAt: faker.date.between({
                from: request.createdAt,
                to: new Date()
              })
            }
          });
          totalUpvotes++;
        } catch (error) {
          // Ignore duplicate upvote errors
        }
      }
    }

    console.log(`✅ Created ${totalUpvotes} upvotes`);

    // Create achievements if they don't exist
    console.log('\n🏆 Setting up achievements...');
    
    const achievements = [
      // Contribution achievements
      {
        name: 'First Steps',
        description: 'Submit your first service request',
        icon: '🎯',
        category: 'contribution',
        tier: 'bronze',
        points: 10,
        requirement: JSON.stringify({ requestsSubmitted: 1 }),
        isActive: true
      },
      {
        name: 'Active Reporter',
        description: 'Submit 5 service requests',
        icon: '📝',
        category: 'contribution',
        tier: 'bronze',
        points: 25,
        requirement: JSON.stringify({ requestsSubmitted: 5 }),
        isActive: true
      },
      {
        name: 'Community Helper',
        description: 'Submit 10 service requests',
        icon: '🤝',
        category: 'contribution',
        tier: 'silver',
        points: 50,
        requirement: JSON.stringify({ requestsSubmitted: 10 }),
        isActive: true
      },
      {
        name: 'Civic Champion',
        description: 'Submit 20 service requests',
        icon: '🏆',
        category: 'contribution',
        tier: 'gold',
        points: 100,
        requirement: JSON.stringify({ requestsSubmitted: 20 }),
        isActive: true
      },
      {
        name: 'City Guardian',
        description: 'Submit 50 service requests',
        icon: '🦸',
        category: 'contribution',
        tier: 'platinum',
        points: 500,
        requirement: JSON.stringify({ requestsSubmitted: 50 }),
        isActive: true
      },
      
      // Engagement achievements
      {
        name: 'Conversationalist',
        description: 'Post 10 comments',
        icon: '💬',
        category: 'engagement',
        tier: 'bronze',
        points: 20,
        requirement: JSON.stringify({ commentsPosted: 10 }),
        isActive: true
      },
      {
        name: 'Community Voice',
        description: 'Post 25 comments',
        icon: '📢',
        category: 'engagement',
        tier: 'silver',
        points: 50,
        requirement: JSON.stringify({ commentsPosted: 25 }),
        isActive: true
      },
      {
        name: 'Popular Contributor',
        description: 'Receive 20 upvotes',
        icon: '👍',
        category: 'engagement',
        tier: 'silver',
        points: 75,
        requirement: JSON.stringify({ upvotesReceived: 20 }),
        isActive: true
      },
      {
        name: 'Influencer',
        description: 'Receive 50 upvotes',
        icon: '⭐',
        category: 'engagement',
        tier: 'gold',
        points: 150,
        requirement: JSON.stringify({ upvotesReceived: 50 }),
        isActive: true
      },
      
      // Quality achievements
      {
        name: 'Quality Reporter',
        description: 'Have 5 requests approved',
        icon: '✅',
        category: 'quality',
        tier: 'bronze',
        points: 30,
        requirement: JSON.stringify({ requestsApproved: 5 }),
        isActive: true
      },
      {
        name: 'Trusted Source',
        description: 'Have 10 requests approved',
        icon: '🌟',
        category: 'quality',
        tier: 'silver',
        points: 75,
        requirement: JSON.stringify({ requestsApproved: 10 }),
        isActive: true
      },
      {
        name: 'Excellence Award',
        description: 'Have 20 requests approved',
        icon: '🏅',
        category: 'quality',
        tier: 'gold',
        points: 200,
        requirement: JSON.stringify({ requestsApproved: 20 }),
        isActive: true
      },
      {
        name: 'Perfect Record',
        description: 'Have 90% approval rate with 10+ requests',
        icon: '💎',
        category: 'quality',
        tier: 'platinum',
        points: 1000,
        requirement: JSON.stringify({ approvalRate: 90, minRequests: 10 }),
        isActive: true
      },
      
      // Milestone achievements
      {
        name: 'Early Adopter',
        description: 'Active member for 30 days',
        icon: '🌱',
        category: 'milestone',
        tier: 'bronze',
        points: 25,
        requirement: JSON.stringify({ daysActive: 30 }),
        isActive: true
      },
      {
        name: 'Veteran Member',
        description: 'Active member for 60 days',
        icon: '🌳',
        category: 'milestone',
        tier: 'silver',
        points: 100,
        requirement: JSON.stringify({ daysActive: 60 }),
        isActive: true
      },
      {
        name: 'Problem Solver',
        description: 'Have 5 requests resolved',
        icon: '🔧',
        category: 'milestone',
        tier: 'silver',
        points: 100,
        requirement: JSON.stringify({ requestsResolved: 5 }),
        isActive: true
      },
      {
        name: 'Top Contributor',
        description: 'Rank in top 10',
        icon: '🥇',
        category: 'milestone',
        tier: 'gold',
        points: 300,
        requirement: JSON.stringify({ topRank: 10 }),
        isActive: true
      },
      {
        name: 'Leaderboard Champion',
        description: 'Rank #1 on leaderboard',
        icon: '👑',
        category: 'milestone',
        tier: 'platinum',
        points: 1500,
        requirement: JSON.stringify({ topRank: 1 }),
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

    console.log(`✅ Created/updated ${achievements.length} achievements`);

    // Calculate community stats for each period
    console.log('\n📊 Calculating community statistics...');

    const periods = ['daily', 'weekly', 'monthly', 'yearly', 'all-time'];
    
    for (const period of periods) {
      console.log(`Calculating ${period} stats...`);
      
      const now = new Date();
      let periodStart = new Date();
      let periodEnd = new Date();
      
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
          periodEnd = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'yearly':
          periodStart.setMonth(0, 1);
          periodStart.setHours(0, 0, 0, 0);
          periodEnd.setMonth(11, 31);
          periodEnd.setHours(23, 59, 59, 999);
          break;
        case 'all-time':
          periodStart = new Date('2020-01-01');
          periodEnd = new Date('2030-12-31');
          break;
      }

      for (const user of users) {
        // Get user's requests for this period
        const userRequests = await prisma.serviceRequest.findMany({
          where: {
            createdBy: user.id,
            createdAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        });

        // Get user's comments for this period
        const userComments = await prisma.comment.findMany({
          where: {
            authorId: user.id,
            createdAt: {
              gte: periodStart,
              lte: periodEnd
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
              gte: periodStart,
              lte: periodEnd
            }
          }
        });

        // Get upvotes given
        const upvotesGiven = await prisma.upvote.count({
          where: {
            userId: user.id,
            createdAt: {
              gte: periodStart,
              lte: periodEnd
            }
          }
        });

        // Calculate metrics
        const requestsSubmitted = userRequests.length;
        const requestsApproved = userRequests.filter(r => 
          ['APPROVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'].includes(r.status)
        ).length;
        const requestsResolved = userRequests.filter(r => 
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
        const requestsWithRating = userRequests.filter(r => r.satisfactionRating);
        const satisfactionScore = requestsWithRating.length > 0
          ? requestsWithRating.reduce((sum, r) => sum + (r.satisfactionRating || 0), 0) / requestsWithRating.length * 20
          : 0;

        // Calculate scores with varied weights for different roles
        let contributionMultiplier = 1;
        let engagementMultiplier = 1;
        let qualityMultiplier = 1;

        if (user.role === 'CITIZEN') {
          contributionMultiplier = 1.2;
        } else if (user.role === 'CLERK' || user.role === 'FIELD_AGENT') {
          engagementMultiplier = 1.1;
          qualityMultiplier = 1.1;
        }

        const contributionScore = (
          requestsSubmitted * 10 +
          requestsApproved * 20 +
          requestsResolved * 30
        ) * contributionMultiplier;

        const engagementScore = (
          userComments.length * 5 +
          upvotesGiven * 2 +
          upvotesReceived * 3
        ) * engagementMultiplier;

        const qualityScore = (
          approvalRate * 0.5 +
          resolutionRate * 0.3 +
          satisfactionScore * 0.2
        ) * qualityMultiplier;

        const overallScore = 
          contributionScore * 0.4 +
          engagementScore * 0.3 +
          qualityScore * 0.3;

        // Store or update statistics
        await prisma.communityStats.upsert({
          where: {
            userId_period_periodStart: {
              userId: user.id,
              period,
              periodStart
            }
          },
          update: {
            requestsSubmitted,
            requestsApproved,
            requestsResolved,
            commentsPosted: userComments.length,
            upvotesReceived,
            upvotesGiven,
            approvalRate,
            resolutionRate,
            satisfactionScore,
            contributionScore,
            engagementScore,
            qualityScore,
            overallScore,
            periodEnd,
            calculatedAt: new Date()
          },
          create: {
            userId: user.id,
            period,
            periodStart,
            periodEnd,
            requestsSubmitted,
            requestsApproved,
            requestsResolved,
            commentsPosted: userComments.length,
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
      }

      // Update rankings for this period
      const allStats = await prisma.communityStats.findMany({
        where: { period, periodStart },
        orderBy: { overallScore: 'desc' }
      });

      for (let i = 0; i < allStats.length; i++) {
        await prisma.communityStats.update({
          where: { id: allStats[i].id },
          data: { 
            previousRank: allStats[i].rank,
            rank: i + 1 
          }
        });
      }

      console.log(`✅ Calculated ${period} stats for ${users.length} users`);
    }

    // Award achievements based on stats
    console.log('\n🏅 Awarding achievements...');
    
    const allAchievements = await prisma.achievement.findMany();
    let totalAchievementsAwarded = 0;

    for (const user of users) {
      const userStats = await prisma.communityStats.findFirst({
        where: {
          userId: user.id,
          period: 'all-time'
        },
        orderBy: { periodStart: 'desc' }
      });

      if (!userStats) continue;

      for (const achievement of allAchievements) {
        const requirement = JSON.parse(achievement.requirement);
        let qualified = true;

        // Check requirements
        if (requirement.requestsSubmitted && userStats.requestsSubmitted < requirement.requestsSubmitted) {
          qualified = false;
        }
        if (requirement.requestsApproved && userStats.requestsApproved < requirement.requestsApproved) {
          qualified = false;
        }
        if (requirement.requestsResolved && userStats.requestsResolved < requirement.requestsResolved) {
          qualified = false;
        }
        if (requirement.commentsPosted && userStats.commentsPosted < requirement.commentsPosted) {
          qualified = false;
        }
        if (requirement.upvotesReceived && userStats.upvotesReceived < requirement.upvotesReceived) {
          qualified = false;
        }
        if (requirement.approvalRate && userStats.approvalRate < requirement.approvalRate) {
          qualified = false;
        }
        if (requirement.minRequests && userStats.requestsSubmitted < requirement.minRequests) {
          qualified = false;
        }
        if (requirement.topRank && userStats.rank && userStats.rank > requirement.topRank) {
          qualified = false;
        }

        if (qualified && userStats.requestsSubmitted > 0) {
          try {
            await prisma.userAchievement.upsert({
              where: {
                userId_achievementId: {
                  userId: user.id,
                  achievementId: achievement.id
                }
              },
              update: { progress: 100 },
              create: {
                userId: user.id,
                achievementId: achievement.id,
                progress: 100
              }
            });
            totalAchievementsAwarded++;
          } catch (error) {
            // Ignore errors
          }
        }
      }
    }

    console.log(`✅ Awarded ${totalAchievementsAwarded} achievements`);

    // Create community trends
    console.log('\n📈 Creating community trends...');
    
    for (const category of CATEGORIES) {
      const categoryRequests = await prisma.serviceRequest.count({
        where: { category }
      });

      for (const period of ['daily', 'weekly', 'monthly']) {
        const now = new Date();
        let periodStart = new Date();
        let periodEnd = new Date();
        
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
            periodEnd = new Date(periodEnd.getFullYear(), periodEnd.getMonth() + 1, 0);
            periodEnd.setHours(23, 59, 59, 999);
            break;
        }

        await prisma.communityTrend.upsert({
          where: {
            category_metric_period_periodStart: {
              category,
              metric: 'requests',
              period,
              periodStart
            }
          },
          update: {
            value: categoryRequests,
            change: faker.number.float({ min: -20, max: 30, precision: 0.1 }),
            periodEnd
          },
          create: {
            category,
            metric: 'requests',
            value: categoryRequests,
            change: faker.number.float({ min: -20, max: 30, precision: 0.1 }),
            period,
            periodStart,
            periodEnd
          }
        });
      }
    }

    console.log(`✅ Created trends for ${CATEGORIES.length} categories`);

    // Summary
    console.log('\n🎉 Community data seeding completed successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Summary:`);
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Service Requests: ${allRequests.length}`);
    console.log(`   • Comments: ${totalComments}`);
    console.log(`   • Upvotes: ${totalUpvotes}`);
    console.log(`   • Achievements: ${achievements.length}`);
    console.log(`   • Awards Given: ${totalAchievementsAwarded}`);
    console.log(`   • Categories: ${CATEGORIES.length}`);
    console.log(`   • Periods Calculated: ${periods.length}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  } catch (error) {
    console.error('❌ Error seeding community data:', error);
    throw error;
  }
}

// Execute the seeding
seedFullCommunityData()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });