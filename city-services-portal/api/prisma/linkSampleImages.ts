import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function linkSampleImages() {
  console.log('🖼️ Linking sample images to work orders...');

  try {
    // Sample image files and their corresponding photo types
    const sampleImages = [
      { file: 'city-incident1.jpg', types: ['BEFORE', 'ISSUE'] },
      { file: 'city_incident2.jpg', types: ['BEFORE', 'DURING'] },
      { file: 'city_incident5.jpg', types: ['DURING', 'SAFETY'] },
      { file: 'city_incident6.jpg', types: ['DURING', 'AFTER'] },
      { file: 'city_incident7.jpg', types: ['AFTER', 'DURING'] },
      { file: 'city_incident8.jpg', types: ['ISSUE', 'SAFETY'] },
      { file: 'city_incident9.jpg', types: ['AFTER', 'BEFORE'] }
    ];

    // Get all work orders that are not completed
    const workOrders = await prisma.fieldWorkOrder.findMany({
      where: {
        status: {
          in: ['ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED']
        }
      },
      include: {
        assignedAgent: true
      },
      take: 20 // Limit to first 20 work orders
    });

    console.log(`Found ${workOrders.length} work orders to add photos to`);

    let photosCreated = 0;
    
    // Delete existing field photos first (for clean test data)
    await prisma.fieldPhoto.deleteMany({});
    console.log('Cleared existing field photos');

    // Add photos to work orders
    for (let i = 0; i < workOrders.length; i++) {
      const workOrder = workOrders[i];
      const imageIndex = i % sampleImages.length;
      const sampleImage = sampleImages[imageIndex];
      
      // Path to the image file
      const imagePath = path.join(__dirname, '../../ui/images', sampleImage.file);
      
      // Check if file exists
      if (!fs.existsSync(imagePath)) {
        console.log(`Image file not found: ${imagePath}`);
        continue;
      }
      
      // Read the image file
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Determine number of photos based on work order status
      let numPhotos = 1;
      if (workOrder.status === 'IN_PROGRESS') numPhotos = 2;
      if (workOrder.status === 'COMPLETED') numPhotos = 3;
      
      // Create photos for this work order
      for (let j = 0; j < numPhotos && j < sampleImage.types.length; j++) {
        const photoType = sampleImage.types[j];
        
        // Generate GPS coordinates near the work order location
        const gpsLat = workOrder.gpsLat ? 
          workOrder.gpsLat + (Math.random() - 0.5) * 0.001 : 
          40.7128 + (Math.random() - 0.5) * 0.1;
        const gpsLng = workOrder.gpsLng ? 
          workOrder.gpsLng + (Math.random() - 0.5) * 0.001 : 
          -74.0060 + (Math.random() - 0.5) * 0.1;
        
        // Create captions based on photo type
        const captions: Record<string, string[]> = {
          BEFORE: [
            'Initial condition of the site',
            'Before starting work',
            'Site assessment photo',
            'Pre-work documentation'
          ],
          DURING: [
            'Work in progress',
            'Repair underway',
            'Active maintenance',
            'Field work documentation'
          ],
          AFTER: [
            'Work completed successfully',
            'Final result',
            'Repair completed',
            'Post-work condition'
          ],
          ISSUE: [
            'Problem identified',
            'Issue requiring attention',
            'Damage assessment',
            'Additional problem found'
          ],
          SAFETY: [
            'Safety hazard identified',
            'Safety equipment in use',
            'Traffic control setup',
            'Safety protocols followed'
          ]
        };
        
        const caption = captions[photoType][Math.floor(Math.random() * captions[photoType].length)];
        
        await prisma.fieldPhoto.create({
          data: {
            workOrderId: workOrder.id,
            agentId: workOrder.assignedAgentId,
            photoType,
            filename: sampleImage.file,
            mime: 'image/jpeg',
            size: imageBuffer.length,
            data: imageBuffer,
            caption,
            gpsLat,
            gpsLng,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000) // Random time in last 24 hours
          }
        });
        
        photosCreated++;
      }
    }

    // Also create some photos for completed work orders to show history
    const completedOrders = await prisma.fieldWorkOrder.findMany({
      where: { status: 'COMPLETED' },
      include: { assignedAgent: true },
      take: 10
    });

    for (const order of completedOrders) {
      const imageIndex = Math.floor(Math.random() * sampleImages.length);
      const sampleImage = sampleImages[imageIndex];
      const imagePath = path.join(__dirname, '../../ui/images', sampleImage.file);
      
      if (!fs.existsSync(imagePath)) continue;
      
      const imageBuffer = fs.readFileSync(imagePath);
      
      // Add BEFORE, DURING, and AFTER photos for completed orders
      const photoSequence = [
        { type: 'BEFORE', caption: 'Initial condition before work', timeOffset: -120 },
        { type: 'DURING', caption: 'Work in progress', timeOffset: -60 },
        { type: 'AFTER', caption: 'Work completed successfully', timeOffset: 0 }
      ];
      
      for (const photo of photoSequence) {
        await prisma.fieldPhoto.create({
          data: {
            workOrderId: order.id,
            agentId: order.assignedAgentId,
            photoType: photo.type as any,
            filename: sampleImage.file,
            mime: 'image/jpeg',
            size: imageBuffer.length,
            data: imageBuffer,
            caption: photo.caption,
            gpsLat: order.gpsLat || 40.7128 + (Math.random() - 0.5) * 0.1,
            gpsLng: order.gpsLng || -74.0060 + (Math.random() - 0.5) * 0.1,
            timestamp: new Date(Date.now() + photo.timeOffset * 60 * 1000)
          }
        });
        photosCreated++;
      }
    }

    console.log(`✅ Successfully created ${photosCreated} field photos!`);
    
    // Summary by type
    const photosByType = await prisma.fieldPhoto.groupBy({
      by: ['photoType'],
      _count: true
    });
    
    console.log('\n📊 Photos by type:');
    photosByType.forEach(p => {
      console.log(`   ${p.photoType}: ${p._count}`);
    });

  } catch (error) {
    console.error('❌ Error linking sample images:', error);
    throw error;
  }
}

// Execute if run directly
if (require.main === module) {
  linkSampleImages()
    .then(() => {
      console.log('🎉 Sample images linked successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Failed to link sample images:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export { linkSampleImages };