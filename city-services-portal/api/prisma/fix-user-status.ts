import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixUserStatus() {
  console.log('🔧 Fixing user status for all existing users...\n');
  
  try {
    // Update all users to have ACTIVE status and emailConfirmed = true
    // First, update users without proper status
    const result1 = await prisma.user.updateMany({
      where: {
        emailConfirmed: false
      },
      data: {
        status: 'ACTIVE',
        emailConfirmed: true,
        isActive: true
      }
    });
    
    // Then update users with non-ACTIVE status
    const result2 = await prisma.user.updateMany({
      where: {
        status: {
          not: 'ACTIVE'
        }
      },
      data: {
        status: 'ACTIVE',
        emailConfirmed: true,
        isActive: true
      }
    });
    
    const totalUpdated = result1.count + result2.count;
    
    console.log(`✅ Updated ${totalUpdated} users to ACTIVE status with confirmed emails`);
    
    // Get count of users by status
    const usersByStatus = await prisma.user.groupBy({
      by: ['status'],
      _count: true
    });
    
    console.log('\n📊 User Status Summary:');
    usersByStatus.forEach(group => {
      console.log(`   ${group.status || 'NULL'}: ${group._count} users`);
    });
    
    // List demo accounts
    const demoAccounts = await prisma.user.findMany({
      where: {
        email: {
          in: [
            'john@example.com',
            'mary.clerk@city.gov',
            'supervisor@city.gov',
            'field.agent@city.gov',
            'admin@city.gov'
          ]
        }
      },
      select: {
        email: true,
        name: true,
        role: true,
        status: true,
        emailConfirmed: true
      }
    });
    
    console.log('\n👥 Demo Account Status:');
    demoAccounts.forEach(user => {
      console.log(`   ${user.email}: ${user.status} (confirmed: ${user.emailConfirmed})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing user status:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixUserStatus().catch(console.error);