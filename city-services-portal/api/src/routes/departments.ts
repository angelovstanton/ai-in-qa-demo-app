import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional().default(true),
});

const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens').optional(),
  description: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

const querySchema = z.object({
  isActive: z.boolean().optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  size: z.string().optional().default('20'),
  sort: z.string().optional().default('name:asc'),
});

// GET /api/v1/departments - List all departments
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = querySchema.parse(req.query);

    // Build where clause
    let where: any = {};
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { slug: { contains: query.search } },
        { description: { contains: query.search } }
      ];
    }

    // Parse sorting
    const sortParts = query.sort.split(':');
    const sortField = sortParts[0] || 'name';
    const sortOrder = sortParts[1] === 'desc' ? 'desc' : 'asc';
    
    const allowedSortFields = ['name', 'slug', 'createdAt', 'updatedAt'];
    const orderBy = allowedSortFields.includes(sortField) 
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { name: 'asc' as const };

    // Pagination
    const page = Math.max(1, parseInt(query.page));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.size)));
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await prisma.department.count({ where });

    // Get departments with user counts
    const departments = await prisma.department.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        _count: {
          select: {
            users: true,
            serviceRequests: true
          }
        }
      }
    });

    res.setHeader('X-Total-Count', totalCount.toString());
    
    res.json({
      data: departments,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Departments fetch error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch departments',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/departments - Create new department
router.post('/', authenticateToken, rbacGuard(['ADMIN', 'SUPERVISOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createDepartmentSchema.parse(req.body);

    // Check if department with same name or slug already exists
    const existingDepartment = await prisma.department.findFirst({
      where: {
        OR: [
          { name: validatedData.name },
          { slug: validatedData.slug }
        ]
      }
    });

    if (existingDepartment) {
      return res.status(409).json({
        error: {
          code: 'DEPARTMENT_EXISTS',
          message: existingDepartment.name === validatedData.name 
            ? 'Department with this name already exists' 
            : 'Department with this slug already exists',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Create department
    const department = await prisma.department.create({
      data: validatedData,
      include: {
        _count: {
          select: {
            users: true,
            serviceRequests: true
          }
        }
      }
    });

    res.status(201).json({
      data: department,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Department creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid department data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create department',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/departments/:id - Get specific department
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        users: {
          select: { 
            id: true, 
            name: true, 
            email: true, 
            role: true, 
            isActive: true,
            createdAt: true
          },
          where: { isActive: true },
          orderBy: { name: 'asc' },
          take: 50 // Limit for performance
        },
        serviceRequests: {
          select: { 
            id: true, 
            code: true, 
            title: true, 
            status: true, 
            priority: true,
            createdAt: true 
          },
          orderBy: { createdAt: 'desc' },
          take: 20 // Recent requests
        },
        _count: {
          select: {
            users: true,
            serviceRequests: true
          }
        }
      }
    });

    if (!department) {
      return res.status(404).json({
        error: {
          code: 'DEPARTMENT_NOT_FOUND',
          message: 'Department not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    res.json({
      data: department,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Department fetch error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch department',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// PATCH /api/v1/departments/:id - Update department
router.patch('/:id', authenticateToken, rbacGuard(['ADMIN', 'SUPERVISOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateDepartmentSchema.parse(req.body);

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        error: {
          code: 'DEPARTMENT_NOT_FOUND',
          message: 'Department not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check for name/slug conflicts if being changed
    if (validatedData.name || validatedData.slug) {
      const conflicts = [];
      if (validatedData.name && validatedData.name !== existingDepartment.name) {
        const nameExists = await prisma.department.findFirst({
          where: { 
            name: validatedData.name,
            NOT: { id }
          }
        });
        if (nameExists) conflicts.push('name');
      }

      if (validatedData.slug && validatedData.slug !== existingDepartment.slug) {
        const slugExists = await prisma.department.findFirst({
          where: { 
            slug: validatedData.slug,
            NOT: { id }
          }
        });
        if (slugExists) conflicts.push('slug');
      }

      if (conflicts.length > 0) {
        return res.status(409).json({
          error: {
            code: 'DEPARTMENT_CONFLICT',
            message: `Department with this ${conflicts.join(' and ')} already exists`,
            correlationId: res.locals.correlationId
          }
        });
      }
    }

    // Update department
    const updatedDepartment = await prisma.department.update({
      where: { id },
      data: validatedData,
      include: {
        _count: {
          select: {
            users: true,
            serviceRequests: true
          }
        }
      }
    });

    res.json({
      data: updatedDepartment,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Department update error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid department data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update department',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// DELETE /api/v1/departments/:id - Soft delete department
router.delete('/:id', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const existingDepartment = await prisma.department.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            serviceRequests: true
          }
        }
      }
    });

    if (!existingDepartment) {
      return res.status(404).json({
        error: {
          code: 'DEPARTMENT_NOT_FOUND',
          message: 'Department not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check if department has active users or requests
    if (existingDepartment._count.users > 0) {
      return res.status(400).json({
        error: {
          code: 'DEPARTMENT_HAS_USERS',
          message: 'Cannot delete department with assigned users. Please reassign users first.',
          userCount: existingDepartment._count.users,
          correlationId: res.locals.correlationId
        }
      });
    }

    // Soft delete by deactivating the department
    await prisma.department.update({
      where: { id },
      data: { 
        isActive: false,
        slug: `deleted_${Date.now()}_${existingDepartment.slug}` // Prevent slug conflicts
      }
    });

    res.json({
      message: 'Department deleted successfully',
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Department deletion error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete department',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/departments/:id/users - Get users in department
router.get('/:id/users', authenticateToken, rbacGuard(['ADMIN', 'SUPERVISOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id }
    });

    if (!department) {
      return res.status(404).json({
        error: {
          code: 'DEPARTMENT_NOT_FOUND',
          message: 'Department not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Get users in department
    const users = await prisma.user.findMany({
      where: { departmentId: id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            createdRequests: true,
            assignedRequests: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({
      data: {
        department: {
          id: department.id,
          name: department.name,
          slug: department.slug
        },
        users: users,
        userCount: users.length
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Department users fetch error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch department users',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/departments/:id/stats - Get department statistics
router.get('/:id/stats', authenticateToken, rbacGuard(['ADMIN', 'SUPERVISOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Verify department exists
    const department = await prisma.department.findUnique({
      where: { id }
    });

    if (!department) {
      return res.status(404).json({
        error: {
          code: 'DEPARTMENT_NOT_FOUND',
          message: 'Department not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Get comprehensive statistics
    const [
      totalUsers,
      activeUsers,
      totalRequests,
      requestsByStatus,
      avgResolutionTime,
      topPerformers
    ] = await Promise.all([
      // Total users in department
      prisma.user.count({
        where: { departmentId: id }
      }),
      
      // Active users
      prisma.user.count({
        where: { departmentId: id, isActive: true }
      }),
      
      // Total requests assigned to department
      prisma.serviceRequest.count({
        where: { departmentId: id }
      }),
      
      // Requests by status
      prisma.serviceRequest.groupBy({
        by: ['status'],
        where: { departmentId: id },
        _count: { status: true }
      }),
      
      // Average resolution time (in hours)
      prisma.serviceRequest.aggregate({
        where: {
          departmentId: id,
          status: { in: ['RESOLVED', 'CLOSED'] },
          updatedAt: { not: null }
        },
        _avg: {
          // This would need a computed field in real implementation
          // For now, we'll return null and calculate client-side if needed
        }
      }),
      
      // Top 5 performers by resolved requests
      prisma.user.findMany({
        where: {
          departmentId: id,
          isActive: true,
          assignedRequests: {
            some: {
              status: { in: ['RESOLVED', 'CLOSED'] }
            }
          }
        },
        select: {
          id: true,
          name: true,
          email: true,
          _count: {
            select: {
              assignedRequests: {
                where: {
                  status: { in: ['RESOLVED', 'CLOSED'] }
                }
              }
            }
          }
        },
        orderBy: {
          assignedRequests: {
            _count: 'desc'
          }
        },
        take: 5
      })
    ]);

    // Format status counts
    const statusCounts = requestsByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    const stats = {
      department: {
        id: department.id,
        name: department.name,
        slug: department.slug
      },
      users: {
        total: totalUsers,
        active: activeUsers,
        inactive: totalUsers - activeUsers
      },
      requests: {
        total: totalRequests,
        byStatus: statusCounts
      },
      performance: {
        avgResolutionTimeHours: null, // Would need proper calculation
        topPerformers: topPerformers.map(user => ({
          ...user,
          resolvedRequests: user._count.assignedRequests
        }))
      },
      generatedAt: new Date().toISOString()
    };

    res.json({
      data: stats,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Department statistics error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch department statistics',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;