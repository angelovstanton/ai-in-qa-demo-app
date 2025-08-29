import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, generateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const validatedData = registerSchema.parse(req.body);
    
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

    // Hash password
    const passwordHash = await bcrypt.hash(validatedData.password, 10);

    // Create user (default role: CITIZEN)
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: 'CITIZEN'
      }
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to register user',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    res.json({
      accessToken: token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to login',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/auth/me
router.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        department: true
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

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          slug: user.department.slug
        } : null
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user profile',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// Profile update schema for API - matches frontend form fields
const profileUpdateSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  streetAddress: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  postalCode: z.string().optional(),
  country: z.string().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  serviceUpdates: z.boolean().optional(),
});

// PATCH /api/v1/auth/profile - Update user profile
router.patch('/profile', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = profileUpdateSchema.parse(req.body);
    
    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        ...validatedData,
        // Update name if firstName or lastName provided
        ...(validatedData.firstName || validatedData.lastName) && {
          name: `${validatedData.firstName || req.user!.name.split(' ')[0]} ${validatedData.lastName || req.user!.name.split(' ')[1] || ''}`.trim()
        }
      },
      include: {
        department: true
      }
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        alternatePhone: updatedUser.alternatePhone,
        streetAddress: updatedUser.streetAddress,
        city: updatedUser.city,
        state: updatedUser.state,
        postalCode: updatedUser.postalCode,
        country: updatedUser.country,
        preferredLanguage: updatedUser.preferredLanguage,
        communicationMethod: updatedUser.communicationMethod,
        emailNotifications: updatedUser.emailNotifications,
        smsNotifications: updatedUser.smsNotifications,
        marketingEmails: updatedUser.marketingEmails,
        serviceUpdates: updatedUser.serviceUpdates,
        twoFactorEnabled: updatedUser.twoFactorEnabled,
        securityQuestion: updatedUser.securityQuestion,
        department: updatedUser.department ? {
          id: updatedUser.department.id,
          name: updatedUser.department.name,
          slug: updatedUser.department.slug
        } : null
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    console.error('Profile update error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update profile',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// Password change schema
const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmNewPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

// POST /api/v1/auth/change-password - Change user password
router.post('/change-password', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = passwordChangeSchema.parse(req.body);
    
    // Get current user with password
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id }
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

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Current password is incorrect',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(validatedData.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: req.user!.id },
      data: { passwordHash: newPasswordHash }
    });

    res.json({
      message: 'Password changed successfully',
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid password data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    console.error('Password change error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to change password',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/auth/token - Get token for API testing (same as login but optimized for automation)
router.post('/token', async (req: Request, res: Response) => {
  try {
    const validatedData = loginSchema.parse(req.body);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(423).json({
        error: {
          code: 'ACCOUNT_LOCKED',
          message: 'Account is locked or deactivated',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Generate token
    const token = generateToken(user);
    
    // Remove sensitive data
    const { passwordHash, securityAnswer, ...userResponse } = user;

    // Return minimal response for API testing
    res.json({
      accessToken: token,
      tokenType: 'Bearer',
      expiresIn: '24h',
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Token generation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to generate token',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;