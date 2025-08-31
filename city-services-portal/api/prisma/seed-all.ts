import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting COMPREHENSIVE Database Seeding...');
  console.log('================================================\n');
  const startTime = Date.now();
  
  try {
    // Step 1: Reset database and run Bulgarian seed with real data
    console.log('📦 PHASE 1: Core Data Setup with Bulgarian Data');
    console.log('------------------------');
    console.log('Resetting database and running Bulgarian-enhanced seed...\n');
    execSync('npx prisma db push --force-reset', { stdio: 'inherit' });
    execSync('npm run db:seed:bulgarian', { stdio: 'inherit' });
    
    // Step 2: Add field agent data
    console.log('\n📦 PHASE 2: Field Agent Data');
    console.log('------------------------');
    console.log('Adding field agent work orders and tracking...\n');
    execSync('npx tsx prisma/field-agent-seed.ts', { stdio: 'inherit' });
    
    // Step 3: Add supervisor data
    console.log('\n📦 PHASE 3: Supervisor Data');
    console.log('------------------------');
    console.log('Adding supervisor metrics, reviews, and goals...\n');
    execSync('npx tsx prisma/seed-supervisor-fixed.ts', { stdio: 'inherit' });
    
    // Step 4: Add community data
    console.log('\n📦 PHASE 4: Community & Rankings');
    console.log('------------------------');
    console.log('Adding community stats, achievements, and rankings...\n');
    execSync('npx tsx prisma/seed-community.ts', { stdio: 'inherit' });
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    // Final summary
    console.log('\n🎉 COMPREHENSIVE SEEDING COMPLETE! 🎉');
    console.log('================================================');
    console.log(`⏱️  Total time: ${duration.toFixed(2)} seconds`);
    console.log('\n✅ All data successfully seeded:');
    console.log('   • Core data (departments, users, requests)');
    console.log('   • Supervisor data (metrics, reviews, goals)');
    console.log('   • Field agent data (work orders, tracking)');
    console.log('   • Community data (stats, achievements, rankings)');
    console.log('   • Feature flags for testing');
    console.log('\n🔐 Test Accounts (password: password123):');
    console.log('   👤 Citizen: john@example.com');
    console.log('   👔 Clerk: mary.clerk@city.gov');
    console.log('   👨‍💼 Supervisor: supervisor@city.gov');
    console.log('   🚐 Field Agent: field.agent@city.gov');
    console.log('   🔧 Admin: admin@city.gov');
    console.log('\n🌐 Access your application at: http://localhost:5173');
    console.log('================================================\n');
    
  } catch (error) {
    console.error('\n❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });