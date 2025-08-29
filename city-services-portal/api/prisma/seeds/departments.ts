import { PrismaClient } from '@prisma/client';

export async function seedDepartments(prisma: PrismaClient) {
  console.log('🏢 Creating departments...');
  
  const departments = await prisma.$transaction([
    prisma.department.create({
      data: { name: 'Public Works', slug: 'public-works' }
    }),
    prisma.department.create({
      data: { name: 'Parks & Recreation', slug: 'parks-recreation' }
    }),
    prisma.department.create({
      data: { name: 'Streets & Transportation', slug: 'streets-transportation' }
    }),
    prisma.department.create({
      data: { name: 'Water & Sewer', slug: 'water-sewer' }
    }),
    prisma.department.create({
      data: { name: 'Building & Permits', slug: 'building-permits' }
    })
  ]);
  
  console.log(`   ✅ Created ${departments.length} departments`);
  
  return departments;
}