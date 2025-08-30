import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { authenticateToken, rbacGuard } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { ApiResponse, createApiResponse } from '../utils/response';

const router = Router();
const prisma = new PrismaClient();

/**
 * @swagger
 * components:
 *   schemas:
 *     Department:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *       required:
 *         - name
 *         - slug
 * 
 *     CreateDepartmentDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         slug:
 *           type: string
 *           pattern: '^[a-z0-9-]+$'
 *       required:
 *         - name
 *         - slug
 * 
 *     UpdateDepartmentDto:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           minLength: 2
 *           maxLength: 100
 *         slug:
 *           type: string
 *           pattern: '^[a-z0-9-]+$'
 */

// Validation schemas
const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
});

const updateDepartmentSchema = createDepartmentSchema.partial();

const departmentFiltersSchema = z.object({
  name: z.string().optional(),
  slug: z.string().optional(),
  search: z.string().optional(),
  page: z.string().transform(Number).default('1'),
  pageSize: z.string().transform(Number).default('10'),
  sortBy: z.enum(['name', 'slug', 'id']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
}).optional();

/**
 * @swagger
 * /api/departments:
 *   get:
 *     tags: [Departments]
 *     summary: Get all departments
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Filter by department name
 *       - in: query
 *         name: slug
 *         schema:
 *           type: string
 *         description: Filter by department slug
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in name and slug
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, slug, id]
 *           default: name
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: asc
 *     responses:
 *       200:
 *         description: List of departments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Department'
 *                 pagination:
 *                   type: object
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const filters = departmentFiltersSchema.parse(req.query);
    const { page = 1, pageSize = 10, sortBy = 'name', sortOrder = 'asc' } = filters || {};
    
    // Build where clause
    const where: any = {};
    if (filters?.name) {
      where.name = { contains: filters.name };
    }
    if (filters?.slug) {
      where.slug = filters.slug;
    }
    if (filters?.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { slug: { contains: filters.search } }
      ];
    }

    // Get total count
    const total = await prisma.department.count({ where });

    // Get departments with pagination
    const departments = await prisma.department.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { [sortBy]: sortOrder },
      include: {
        _count: {
          select: {
            users: true,
            serviceRequests: true
          }
        }
      }
    });

    res.json(createApiResponse(departments, {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    }));
  } catch (error) {
    console.error('Error fetching departments:', error);
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

/**
 * @swagger
 * /api/departments/{id}:
 *   get:
 *     tags: [Departments]
 *     summary: Get department by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID (UUID) or slug
 *     responses:
 *       200:
 *         description: Department details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *       404:
 *         description: Department not found
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    // Try to find by ID first, then by slug
    const department = await prisma.department.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      },
      include: {
        users: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        _count: {
          select: {
            serviceRequests: true,
            users: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    res.json(createApiResponse(department));
  } catch (error) {
    console.error('Error fetching department:', error);
    res.status(500).json({ error: 'Failed to fetch department' });
  }
});

/**
 * @swagger
 * /api/departments:
 *   post:
 *     tags: [Departments]
 *     summary: Create a new department
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateDepartmentDto'
 *     responses:
 *       201:
 *         description: Department created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *       400:
 *         description: Invalid input or slug already exists
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post(
  '/',
  authenticateToken,
  rbacGuard('ADMIN'),
  validateRequest(createDepartmentSchema),
  async (req: Request, res: Response) => {
    try {
      const { name, slug } = req.body;

      // Check if slug already exists
      const existing = await prisma.department.findUnique({
        where: { slug }
      });

      if (existing) {
        return res.status(400).json({ error: 'Department slug already exists' });
      }

      const department = await prisma.department.create({
        data: { name, slug }
      });

      res.status(201).json(createApiResponse(department));
    } catch (error) {
      console.error('Error creating department:', error);
      res.status(500).json({ error: 'Failed to create department' });
    }
  }
);

/**
 * @swagger
 * /api/departments/{id}:
 *   patch:
 *     tags: [Departments]
 *     summary: Update a department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID (UUID) or slug
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateDepartmentDto'
 *     responses:
 *       200:
 *         description: Department updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Department'
 *       400:
 *         description: Invalid input or slug already exists
 *       404:
 *         description: Department not found
 */
router.patch(
  '/:id',
  authenticateToken,
  rbacGuard('ADMIN'),
  validateRequest(updateDepartmentSchema),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Find department
      const department = await prisma.department.findFirst({
        where: {
          OR: [
            { id },
            { slug: id }
          ]
        }
      });

      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }

      // Check if new slug already exists
      if (updates.slug && updates.slug !== department.slug) {
        const existing = await prisma.department.findUnique({
          where: { slug: updates.slug }
        });

        if (existing) {
          return res.status(400).json({ error: 'Department slug already exists' });
        }
      }

      const updated = await prisma.department.update({
        where: { id: department.id },
        data: updates
      });

      res.json(createApiResponse(updated));
    } catch (error) {
      console.error('Error updating department:', error);
      res.status(500).json({ error: 'Failed to update department' });
    }
  }
);

/**
 * @swagger
 * /api/departments/{id}:
 *   delete:
 *     tags: [Departments]
 *     summary: Delete a department
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID (UUID) or slug
 *     responses:
 *       200:
 *         description: Department deleted successfully
 *       400:
 *         description: Cannot delete department with active users or requests
 *       404:
 *         description: Department not found
 */
router.delete(
  '/:id',
  authenticateToken,
  rbacGuard('ADMIN'),
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Find department
      const department = await prisma.department.findFirst({
        where: {
          OR: [
            { id },
            { slug: id }
          ]
        },
        include: {
          _count: {
            select: {
              users: true,
              serviceRequests: true
            }
          }
        }
      });

      if (!department) {
        return res.status(404).json({ error: 'Department not found' });
      }

      // Check if department has users or requests
      if (department._count.users > 0 || department._count.serviceRequests > 0) {
        return res.status(400).json({ 
          error: 'Cannot delete department with active users or service requests',
          details: {
            users: department._count.users,
            requests: department._count.serviceRequests
          }
        });
      }

      await prisma.department.delete({
        where: { id: department.id }
      });

      res.json(createApiResponse({ message: 'Department deleted successfully' }));
    } catch (error) {
      console.error('Error deleting department:', error);
      res.status(500).json({ error: 'Failed to delete department' });
    }
  }
);

/**
 * @swagger
 * /api/departments/{id}/statistics:
 *   get:
 *     tags: [Departments]
 *     summary: Get department statistics
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Department ID (UUID) or slug
 *     responses:
 *       200:
 *         description: Department statistics
 *       404:
 *         description: Department not found
 */
router.get('/:id/statistics', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findFirst({
      where: {
        OR: [
          { id },
          { slug: id }
        ]
      }
    });

    if (!department) {
      return res.status(404).json({ error: 'Department not found' });
    }

    // Get statistics
    const [
      totalUsers,
      totalRequests,
      openRequests,
      resolvedRequests,
      avgResolutionTime
    ] = await Promise.all([
      prisma.user.count({ where: { departmentId: department.id } }),
      prisma.serviceRequest.count({ where: { departmentId: department.id } }),
      prisma.serviceRequest.count({ 
        where: { 
          departmentId: department.id,
          status: { in: ['SUBMITTED', 'TRIAGED', 'IN_REVIEW', 'APPROVED', 'IN_PROGRESS'] }
        } 
      }),
      prisma.serviceRequest.count({ 
        where: { 
          departmentId: department.id,
          status: { in: ['RESOLVED', 'CLOSED'] }
        } 
      }),
      prisma.serviceRequest.findMany({
        where: { 
          departmentId: department.id,
          status: 'CLOSED',
          closedAt: { not: null }
        },
        select: {
          createdAt: true,
          closedAt: true
        }
      }).then(requests => {
        if (requests.length === 0) return 0;
        const totalTime = requests.reduce((sum, req) => {
          const time = req.closedAt!.getTime() - req.createdAt.getTime();
          return sum + time;
        }, 0);
        return totalTime / requests.length / (1000 * 60 * 60); // Convert to hours
      })
    ]);

    const statistics = {
      department: {
        id: department.id,
        name: department.name,
        slug: department.slug
      },
      users: {
        total: totalUsers
      },
      requests: {
        total: totalRequests,
        open: openRequests,
        resolved: resolvedRequests,
        resolutionRate: totalRequests > 0 ? (resolvedRequests / totalRequests) * 100 : 0,
        averageResolutionTime: avgResolutionTime
      }
    };

    res.json(createApiResponse(statistics));
  } catch (error) {
    console.error('Error fetching department statistics:', error);
    res.status(500).json({ error: 'Failed to fetch department statistics' });
  }
});

export default router;