import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, generateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name cannot exceed 100 characters')
    .regex(/^[a-zA-ZÀ-ÿĀ-žА-я\s'-]+$/, 'Name can only contain letters, spaces, hyphens and apostrophes')
    .refine(val => val.trim().length >= 3, 'Name must be at least 3 characters (excluding spaces)')
    .refine(val => !val.includes('  '), 'Name cannot contain consecutive spaces'),
  email: z.string()
    .email('Invalid email address')
    .toLowerCase()
    .max(100, 'Email cannot exceed 100 characters')
    .refine(val => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(val), 'Email format is invalid'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password cannot exceed 72 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[@$!%*?&#^()]/, 'Password must contain at least one special character')
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

    // Generate email confirmation token
    const confirmationToken = Buffer.from(`confirm:${validatedData.email}:${Date.now()}`).toString('base64');
    const confirmationLink = `http://localhost:5173/confirm-email?token=${confirmationToken}`;
    
    // Create user (default role: CITIZEN, unconfirmed)
    const user = await prisma.user.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        passwordHash,
        role: 'CITIZEN',
        emailConfirmed: false,
        emailConfirmationToken: confirmationToken
      }
    });

    // Log confirmation link to console (in production, this would be sent via email)
    console.log('\n========================================');
    console.log('📧 EMAIL CONFIRMATION REQUIRED');
    console.log('========================================');
    console.log(`User: ${user.email}`);
    console.log(`Confirmation Link: ${confirmationLink}`);
    console.log('Please click the link above to confirm your email address.');
    console.log('========================================\n');

    res.status(201).json({
      message: 'Registration successful! Please check your email (console) to confirm your account.',
      requiresEmailConfirmation: true,
      // In development, include the confirmation link for testing (remove in production!)
      ...(process.env.NODE_ENV !== 'production' && { confirmationToken, confirmationLink }),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        emailConfirmed: false
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

    // Find user with department info
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email },
      include: {
        department: true
      }
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
        role: user.role,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          slug: user.department.slug
        } : undefined
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

// Profile update schema for API - with comprehensive validation
const profileUpdateSchema = z.object({
  firstName: z.string()
    .min(2, 'First name must be at least 2 characters')
    .max(50, 'First name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿĀ-žА-я\s'-]+$/, 'First name contains invalid characters')
    .optional(),
  lastName: z.string()
    .min(2, 'Last name must be at least 2 characters')
    .max(50, 'Last name cannot exceed 50 characters')
    .regex(/^[a-zA-ZÀ-ÿĀ-žА-я\s'-]+$/, 'Last name contains invalid characters')
    .optional(),
  phone: z.string()
    .regex(/^[+]?[0-9]{10,15}$/, 'Invalid phone number format')
    .optional(),
  alternatePhone: z.string()
    .regex(/^[+]?[0-9]{10,15}$/, 'Invalid phone number format')
    .optional(),
  streetAddress: z.string()
    .min(5, 'Street address must be at least 5 characters')
    .max(100, 'Street address cannot exceed 100 characters')
    .optional(),
  city: z.string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City cannot exceed 50 characters')
    .optional(),
  state: z.string()
    .min(2, 'State/Province must be at least 2 characters')
    .max(50, 'State/Province cannot exceed 50 characters')
    .optional(),
  postalCode: z.string()
    .regex(/^[A-Z0-9\s-]+$/i, 'Invalid postal code format')
    .optional(),
  country: z.string()
    .min(2, 'Country must be at least 2 characters')
    .max(50, 'Country cannot exceed 50 characters')
    .optional(),
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

// GET /api/v1/auth/confirm-email - Confirm email address
router.get('/confirm-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.query;
    
    if (!token || typeof token !== 'string') {
      return res.status(400).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or missing confirmation token',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: { emailConfirmationToken: token }
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'TOKEN_NOT_FOUND',
          message: 'Invalid or expired confirmation token',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Update user as confirmed
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailConfirmed: true,
        emailConfirmationToken: null
      }
    });

    res.json({
      message: 'Email confirmed successfully! You can now login.',
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to confirm email',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/auth/forgot-password - Request password reset
router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        error: {
          code: 'EMAIL_REQUIRED',
          message: 'Email address is required',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Always return success even if user doesn't exist (security best practice)
    if (!user) {
      return res.json({
        message: 'If an account exists with this email, a password reset link has been sent.',
        correlationId: res.locals.correlationId
      });
    }

    // Generate password reset token
    const resetToken = Buffer.from(`reset:${email}:${Date.now()}`).toString('base64');
    const resetLink = `http://localhost:5173/reset-password?token=${resetToken}`;

    // Save reset token to user
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: new Date(Date.now() + 3600000) // 1 hour expiry
      }
    });

    // Log reset link to console (in production, this would be sent via email)
    console.log('\n========================================');
    console.log('🔐 PASSWORD RESET REQUESTED');
    console.log('========================================');
    console.log(`User: ${user.email}`);
    console.log(`Reset Link: ${resetLink}`);
    console.log('This link will expire in 1 hour.');
    console.log('========================================\n');

    res.json({
      message: 'If an account exists with this email, a password reset link has been sent.',
      // In development, include the token for testing (remove in production!)
      ...(process.env.NODE_ENV !== 'production' && { resetToken, resetLink }),
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process password reset request',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/auth/reset-password - Reset password with token
router.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Token and new password are required',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Validate new password
    const passwordValidation = z.string()
      .min(8, 'Password must be at least 8 characters')
      .max(72, 'Password cannot exceed 72 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must contain uppercase, lowercase, number and special character');
    
    try {
      passwordValidation.parse(newPassword);
    } catch (validationError) {
      return res.status(400).json({
        error: {
          code: 'INVALID_PASSWORD',
          message: 'Password does not meet requirements',
          details: validationError,
          correlationId: res.locals.correlationId
        }
      });
    }

    // Find user with valid reset token
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(404).json({
        error: {
          code: 'INVALID_TOKEN',
          message: 'Invalid or expired reset token',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    console.log('\n========================================');
    console.log('✅ PASSWORD RESET SUCCESSFUL');
    console.log('========================================');
    console.log(`User: ${user.email}`);
    console.log('Password has been successfully reset.');
    console.log('========================================\n');

    res.json({
      message: 'Password has been reset successfully. Please login with your new password.',
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reset password',
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