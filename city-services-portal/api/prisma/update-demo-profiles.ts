import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function updateDemoProfiles() {
  console.log('📝 Updating demo account profiles with complete information...\n');
  
  try {
    // Define complete profile data for main demo accounts
    const demoProfiles = [
      {
        email: 'john@example.com',
        data: {
          firstName: 'John',
          lastName: 'Doe',
          phone: '+359888123456',
          alternatePhone: '+35929876543',
          streetAddress: '123 Alexander Nevsky Blvd',
          city: 'Sofia',
          state: 'Sofia',
          postalCode: '1000',
          country: 'Bulgaria',
          preferredLanguage: 'en',
          communicationMethod: 'EMAIL',
          emailNotifications: true,
          smsNotifications: false,
          marketingEmails: false,
          serviceUpdates: true,
          twoFactorEnabled: false
        }
      },
      {
        email: 'mary.clerk@city.gov',
        data: {
          firstName: 'Mary',
          lastName: 'Johnson',
          phone: '+35921234567',
          alternatePhone: '+359888765432',
          streetAddress: '45 Vitosha Boulevard',
          city: 'Sofia',
          state: 'Sofia',
          postalCode: '1463',
          country: 'Bulgaria',
          preferredLanguage: 'en',
          communicationMethod: 'EMAIL',
          emailNotifications: true,
          smsNotifications: true,
          marketingEmails: false,
          serviceUpdates: true,
          twoFactorEnabled: false
        }
      },
      {
        email: 'supervisor@city.gov',
        data: {
          firstName: 'Tom',
          lastName: 'Wilson',
          phone: '+35922345678',
          alternatePhone: '+359877234567',
          streetAddress: '78 Tsarigradsko Shose',
          city: 'Sofia',
          state: 'Sofia',
          postalCode: '1784',
          country: 'Bulgaria',
          preferredLanguage: 'en',
          communicationMethod: 'EMAIL',
          emailNotifications: true,
          smsNotifications: true,
          marketingEmails: false,
          serviceUpdates: true,
          twoFactorEnabled: true,
          securityQuestion: 'What was the name of your first pet?',
          securityAnswer: await bcrypt.hash('fluffy', 10)
        }
      },
      {
        email: 'field.agent@city.gov',
        data: {
          firstName: 'Bob',
          lastName: 'Anderson',
          phone: '+359888345678',
          alternatePhone: '+35928765432',
          streetAddress: '56 Bulgaria Boulevard',
          city: 'Sofia',
          state: 'Sofia',
          postalCode: '1404',
          country: 'Bulgaria',
          preferredLanguage: 'en',
          communicationMethod: 'SMS',
          emailNotifications: true,
          smsNotifications: true,
          marketingEmails: false,
          serviceUpdates: true,
          twoFactorEnabled: false
        }
      },
      {
        email: 'admin@city.gov',
        data: {
          firstName: 'Admin',
          lastName: 'User',
          phone: '+35929998888',
          alternatePhone: '+359888999888',
          streetAddress: '1 Council Building NDK',
          city: 'Sofia',
          state: 'Sofia',
          postalCode: '1421',
          country: 'Bulgaria',
          preferredLanguage: 'en',
          communicationMethod: 'EMAIL',
          emailNotifications: true,
          smsNotifications: true,
          marketingEmails: false,
          serviceUpdates: true,
          twoFactorEnabled: true,
          securityQuestion: 'What is your favorite color?',
          securityAnswer: await bcrypt.hash('blue', 10)
        }
      },
      // Additional demo accounts with basic info
      {
        email: 'supervisor1@city.gov',
        data: {
          firstName: 'Sarah',
          lastName: 'Thompson',
          phone: '+35923456789',
          streetAddress: '100 Graf Ignatiev Street',
          city: 'Sofia',
          state: 'Sofia',
          postalCode: '1000',
          country: 'Bulgaria',
          preferredLanguage: 'en',
          communicationMethod: 'EMAIL'
        }
      },
      {
        email: 'agent1@city.gov',
        data: {
          firstName: 'Mike',
          lastName: 'Roberts',
          phone: '+359888456789',
          streetAddress: '200 Oborishte Street',
          city: 'Sofia',
          state: 'Sofia',
          postalCode: '1000',
          country: 'Bulgaria',
          preferredLanguage: 'en',
          communicationMethod: 'SMS'
        }
      }
    ];

    let updatedCount = 0;
    for (const profile of demoProfiles) {
      try {
        await prisma.user.update({
          where: { email: profile.email },
          data: profile.data
        });
        console.log(`✅ Updated profile for ${profile.email}`);
        updatedCount++;
      } catch (error) {
        // User might not exist, that's okay
        console.log(`⚠️  User ${profile.email} not found, skipping...`);
      }
    }

    console.log(`\n📊 Summary: Updated ${updatedCount} demo account profiles`);

    // Show the updated profiles for main demo accounts
    const mainDemoAccounts = await prisma.user.findMany({
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
        firstName: true,
        lastName: true,
        phone: true,
        city: true,
        country: true,
        preferredLanguage: true,
        emailNotifications: true,
        twoFactorEnabled: true
      }
    });

    console.log('\n👥 Main Demo Account Profiles:');
    mainDemoAccounts.forEach(user => {
      console.log(`\n   ${user.email}:`);
      console.log(`   - Name: ${user.firstName} ${user.lastName}`);
      console.log(`   - Phone: ${user.phone || 'Not set'}`);
      console.log(`   - Location: ${user.city || 'Not set'}, ${user.country || 'Not set'}`);
      console.log(`   - Language: ${user.preferredLanguage || 'Not set'}`);
      console.log(`   - Notifications: Email=${user.emailNotifications}, 2FA=${user.twoFactorEnabled}`);
    });

  } catch (error) {
    console.error('❌ Error updating demo profiles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateDemoProfiles().catch(console.error);