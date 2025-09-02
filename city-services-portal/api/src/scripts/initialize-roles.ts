import { PrismaClient } from '@prisma/client';
import { PermissionService } from '../services/permissionService';

const prisma = new PrismaClient();

async function initializeRoles() {
  try {
    console.log('🚀 Initializing roles and permissions...');
    
    await PermissionService.initializeRolesAndPermissions();
    
    console.log('✅ Roles and permissions initialized successfully');
    
    // Display summary
    const roles = await prisma.role.findMany();
    const permissions = await prisma.permission.findMany();
    
    console.log(`\n📊 Summary:`);
    console.log(`  - Roles created: ${roles.length}`);
    console.log(`  - Permissions created: ${permissions.length}`);
    
    console.log('\n📋 Roles:');
    roles.forEach(role => {
      console.log(`  - ${role.name}: ${role.displayName} (hierarchy: ${role.hierarchy})`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing roles:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  initializeRoles();
}

export { initializeRoles };