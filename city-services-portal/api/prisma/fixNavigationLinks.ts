import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixNavigationLinks() {
  console.log('🔧 Fixing navigation links in work orders...');

  try {
    // Get all work orders with navigation links
    const workOrders = await prisma.fieldWorkOrder.findMany({
      where: {
        navigationLink: {
          contains: 'maps.google.com/directions'
        }
      }
    });

    console.log(`Found ${workOrders.length} work orders with old navigation link format`);

    // Update each work order with the correct URL format
    for (const workOrder of workOrders) {
      if (workOrder.gpsLat && workOrder.gpsLng) {
        const newNavigationLink = `https://www.google.com/maps/dir/?api=1&destination=${workOrder.gpsLat},${workOrder.gpsLng}`;
        
        await prisma.fieldWorkOrder.update({
          where: { id: workOrder.id },
          data: { navigationLink: newNavigationLink }
        });
        
        console.log(`✅ Updated work order ${workOrder.orderNumber}`);
      }
    }

    // Also update any work orders that have GPS coords but no navigation link
    const workOrdersWithoutLinks = await prisma.fieldWorkOrder.findMany({
      where: {
        AND: [
          { gpsLat: { not: null } },
          { gpsLng: { not: null } },
          { navigationLink: null }
        ]
      }
    });

    console.log(`Found ${workOrdersWithoutLinks.length} work orders with GPS but no navigation link`);

    for (const workOrder of workOrdersWithoutLinks) {
      if (workOrder.gpsLat && workOrder.gpsLng) {
        const navigationLink = `https://www.google.com/maps/dir/?api=1&destination=${workOrder.gpsLat},${workOrder.gpsLng}`;
        
        await prisma.fieldWorkOrder.update({
          where: { id: workOrder.id },
          data: { navigationLink }
        });
        
        console.log(`✅ Added navigation link to work order ${workOrder.orderNumber}`);
      }
    }

    console.log('🎉 Navigation links fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing navigation links:', error);
    throw error;
  }
}

// Execute
fixNavigationLinks()
  .catch(console.error)
  .finally(() => prisma.$disconnect());