import { PrismaClient, Department } from '@prisma/client';

const DEPARTMENTS_DATA = [
  'Roads and Infrastructure',
  'Water and Utilities',
  'Parks and Recreation',
  'Public Safety',
  'Waste Management',
  'Transportation',
  'Environmental Services',
  'Building and Permits'
];

export async function seedDepartments(prisma: PrismaClient): Promise<Department[]> {
  console.log('🏢 Seeding Departments...');
  
  const departments: Department[] = [];
  
  for (const deptName of DEPARTMENTS_DATA) {
    const department = await prisma.department.create({
      data: {
        name: deptName,
        slug: deptName.toLowerCase().replace(/\s+/g, '-')
      }
    });
    departments.push(department);
    console.log(`   ✓ Created department: ${department.name}`);
  }
  
  console.log(`   ✅ Created ${departments.length} departments\n`);
  return departments;
}