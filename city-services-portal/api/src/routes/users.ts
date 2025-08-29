import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6).optional(), // Optional, will generate if not provided
  role: z.enum(['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  departmentId: z.string().uuid().optional(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  isTestUser: z.boolean().default(true), // Mark as test user for easy cleanup
});

const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  role: z.enum(['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']).optional(),
  departmentId: z.string().uuid().optional().nullable(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

const bulkCreateUsersSchema = z.object({
  users: z.array(createUserSchema).min(1).max(100), // Limit bulk operations
  defaultPassword: z.string().min(6).optional(),
});

const userQuerySchema = z.object({
  role: z.string().optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
  isTestUser: z.boolean().optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  size: z.string().optional().default('20'),
  sort: z.string().optional().default('createdAt:desc'),
});

// GET /api/v1/admin/users - List all users with filtering
router.get('/', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = userQuerySchema.parse(req.query);

    // Build where clause
    let where: any = {};
    
    if (query.role) {
      where.role = query.role;
    }
    
    if (query.department) {
      where.department = { slug: query.department };
    }
    
    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }
    
    if (query.isTestUser !== undefined) {
      where.isTestUser = query.isTestUser;
    }
    
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { firstName: { contains: query.search } },
        { lastName: { contains: query.search } }
      ];
    }

    // Parse sorting
    const sortParts = query.sort.split(':');
    const sortField = sortParts[0] || 'createdAt';
    const sortOrder = sortParts[1] === 'asc' ? 'asc' : 'desc';
    
    const allowedSortFields = ['createdAt', 'updatedAt', 'name', 'email', 'role'];
    const orderBy = allowedSortFields.includes(sortField) 
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { createdAt: 'desc' as const };

    // Pagination
    const page = Math.max(1, parseInt(query.page));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.size)));
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await prisma.user.count({ where });

    // Get users
    const users = await prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        department: {
          select: { id: true, name: true, slug: true }
        },
        _count: {
          select: {
            createdRequests: true,
            assignedRequests: true,
            comments: true
          }
        }
      }
    });

    // Remove sensitive data
    const sanitizedUsers = users.map(user => {
      const { passwordHash, securityAnswer, ...userWithoutSensitive } = user;
      return userWithoutSensitive;
    });

    res.setHeader('X-Total-Count', totalCount.toString());
    
    res.json({
      data: sanitizedUsers,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Users fetch error:', error);
    
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
        message: 'Failed to fetch users',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/admin/users - Create new user
router.post('/', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createUserSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (existingUser) {
      return res.status(409).json({
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Generate password if not provided
    const password = validatedData.password || generateRandomPassword();
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: validatedData.role,
        departmentId: validatedData.departmentId,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phone: validatedData.phone,
        isTestUser: validatedData.isTestUser,
      },
      include: {
        department: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    // Remove sensitive data from response
    const { passwordHash: _, securityAnswer: __, ...userResponse } = user;

    res.status(201).json({
      data: {
        ...userResponse,
        generatedPassword: validatedData.password ? undefined : password // Only return if we generated it
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('User creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create user',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/admin/users/bulk - Bulk create users
router.post('/bulk', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = bulkCreateUsersSchema.parse(req.body);
    const defaultPassword = validatedData.defaultPassword || 'TestPassword123!';

    const results = [];
    const errors = [];

    for (let i = 0; i < validatedData.users.length; i++) {
      try {
        const userData = validatedData.users[i];
        
        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });

        if (existingUser) {
          errors.push({
            index: i,
            email: userData.email,
            error: 'User already exists'
          });
          continue;
        }

        // Use provided password or default
        const password = userData.password || defaultPassword;
        const passwordHash = await bcrypt.hash(password, 10);

        // Create user
        const user = await prisma.user.create({
          data: {
            name: userData.name,
            email: userData.email,
            passwordHash,
            role: userData.role,
            departmentId: userData.departmentId,
            firstName: userData.firstName,
            lastName: userData.lastName,
            phone: userData.phone,
            isTestUser: userData.isTestUser,
          }
        });

        const { passwordHash: _, securityAnswer: __, ...userResponse } = user;
        results.push({
          ...userResponse,
          generatedPassword: userData.password ? undefined : password
        });

      } catch (error) {
        errors.push({
          index: i,
          email: validatedData.users[i].email,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    res.status(201).json({
      data: {
        created: results,
        errors: errors,
        summary: {
          total: validatedData.users.length,
          created: results.length,
          failed: errors.length
        }
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Bulk user creation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid bulk user data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create users',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/admin/users/:id - Get specific user
router.get('/:id', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        department: {
          select: { id: true, name: true, slug: true }
        },
        createdRequests: {
          select: { id: true, code: true, title: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        assignedRequests: {
          select: { id: true, code: true, title: true, status: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 10
        },
        _count: {
          select: {
            createdRequests: true,
            assignedRequests: true,
            comments: true,
            upvotes: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Remove sensitive data
    const { passwordHash, securityAnswer, ...userResponse } = user;

    res.json({
      data: userResponse,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('User fetch error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// PATCH /api/v1/admin/users/:id - Update user
router.patch('/:id', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateUserSchema.parse(req.body);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check email uniqueness if email is being changed
    if (validatedData.email && validatedData.email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({
        where: { email: validatedData.email }
      });

      if (emailExists) {
        return res.status(409).json({
          error: {
            code: 'EMAIL_EXISTS',
            message: 'Email already in use by another user',
            correlationId: res.locals.correlationId
          }
        });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id },
      data: validatedData,
      include: {
        department: {
          select: { id: true, name: true, slug: true }
        }
      }
    });

    // Remove sensitive data
    const { passwordHash, securityAnswer, ...userResponse } = updatedUser;

    res.json({
      data: userResponse,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('User update error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid user data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update user',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// DELETE /api/v1/admin/users/:id - Soft delete user
router.delete('/:id', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Prevent deleting the current admin
    if (id === req.user!.id) {
      return res.status(400).json({
        error: {
          code: 'CANNOT_DELETE_SELF',
          message: 'Cannot delete your own account',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Soft delete by deactivating the user
    await prisma.user.update({
      where: { id },
      data: { 
        isActive: false,
        email: `deleted_${Date.now()}_${existingUser.email}` // Prevent email conflicts
      }
    });

    res.json({
      message: 'User deleted successfully',
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('User deletion error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete user',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/admin/users/:id/reset-password - Reset user password
router.post('/:id/reset-password', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { password } = req.body;

    // Validate password if provided
    if (password && (typeof password !== 'string' || password.length < 6)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password must be at least 6 characters long',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Generate new password if not provided
    const newPassword = password || generateRandomPassword();
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id },
      data: { passwordHash }
    });

    res.json({
      message: 'Password reset successfully',
      newPassword: password ? undefined : newPassword, // Only return if we generated it
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Password reset error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reset password',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// DELETE /api/v1/admin/users/test-data - Clean up test users
router.delete('/test-data', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Get count of test users before deletion
    const testUserCount = await prisma.user.count({
      where: { isTestUser: true }
    });

    // Delete test users and their related data
    await prisma.$transaction(async (tx) => {
      // Delete upvotes by test users
      await tx.upvote.deleteMany({
        where: {
          user: { isTestUser: true }
        }
      });

      // Delete comments by test users
      await tx.comment.deleteMany({
        where: {
          author: { isTestUser: true }
        }
      });

      // Delete attachments by test users
      await tx.attachment.deleteMany({
        where: {
          uploadedBy: { isTestUser: true }
        }
      });

      // Delete service requests created by test users
      await tx.serviceRequest.deleteMany({
        where: {
          creator: { isTestUser: true }
        }
      });

      // Finally delete test users
      await tx.user.deleteMany({
        where: { isTestUser: true }
      });
    });

    res.json({
      message: `Cleaned up ${testUserCount} test users and their data`,
      deletedCount: testUserCount,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Test data cleanup error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to clean up test data',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// Helper function to generate random password
function generateRandomPassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export default router;