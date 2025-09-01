import { Router, Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import { PasswordService } from '../../services/password.service';
import { ValidationService } from '../../services/validation.service';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import {
  createPasswordResetRequestSchema,
  createPasswordResetSchema,
  createPasswordChangeSchema
} from '../../validation/schemas/auth.schema';
import { AUTH_ERROR_CODES, AUTH_HTTP_STATUS } from '../../constants/auth.constants';

const router = Router();
const authService = new AuthService();
const passwordService = new PasswordService();
const validationService = new ValidationService();

/**
 * POST /api/v1/auth/password/forgot
 * Request password reset
 */
router.post('/forgot', async (req: Request, res: Response) => {
  try {
    const lang = (req.headers['accept-language']?.includes('bg') ? 'bg' : 'en') as 'en' | 'bg';
    
    // Validate input
    const validation = await validationService.validate(
      createPasswordResetRequestSchema(lang),
      req.body,
      { sanitize: true, language: lang }
    );

    if (!validation.isValid) {
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid email address',
          details: validationService.formatValidationErrors(validation.errors!),
          correlationId: res.locals.correlationId
        }
      });
    }

    // Request password reset
    const result = await authService.requestPasswordReset(validation.data!.email);

    res.json({
      ...result,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Password reset request error:', error);
    res.status(AUTH_HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to process password reset request',
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * POST /api/v1/auth/password/reset
 * Reset password with token
 */
router.post('/reset', async (req: Request, res: Response) => {
  try {
    const lang = (req.headers['accept-language']?.includes('bg') ? 'bg' : 'en') as 'en' | 'bg';
    
    // Validate input
    const validation = await validationService.validate(
      createPasswordResetSchema(lang),
      req.body,
      { sanitize: true, language: lang }
    );

    if (!validation.isValid) {
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid reset data',
          details: validationService.formatValidationErrors(validation.errors!),
          correlationId: res.locals.correlationId
        }
      });
    }

    // Reset password
    const result = await authService.resetPassword(
      validation.data!.token,
      validation.data!.newPassword
    );

    res.json({
      ...result,
      correlationId: res.locals.correlationId
    });

  } catch (error: any) {
    console.error('Password reset error:', error);

    if (error.message === 'Invalid or expired reset token') {
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.TOKEN_EXPIRED,
          message: error.message,
          correlationId: res.locals.correlationId
        }
      });
    }

    res.status(AUTH_HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reset password',
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * POST /api/v1/auth/password/change
 * Change password (authenticated)
 */
router.post('/change', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const lang = (req.headers['accept-language']?.includes('bg') ? 'bg' : 'en') as 'en' | 'bg';
    
    // Validate input
    const validation = await validationService.validate(
      createPasswordChangeSchema(lang),
      req.body,
      { sanitize: true, language: lang }
    );

    if (!validation.isValid) {
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid password data',
          details: validationService.formatValidationErrors(validation.errors!),
          correlationId: res.locals.correlationId
        }
      });
    }

    // Change password
    const result = await authService.changePassword(
      req.user!.id,
      validation.data!.currentPassword,
      validation.data!.newPassword
    );

    res.json({
      ...result,
      correlationId: res.locals.correlationId
    });

  } catch (error: any) {
    console.error('Password change error:', error);

    const errorMessages: Record<string, { status: number; code: string }> = {
      'User not found': { 
        status: AUTH_HTTP_STATUS.NOT_FOUND, 
        code: AUTH_ERROR_CODES.USER_NOT_FOUND 
      },
      'Current password is incorrect': { 
        status: AUTH_HTTP_STATUS.BAD_REQUEST, 
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS 
      },
      'New password must be different from current password': { 
        status: AUTH_HTTP_STATUS.BAD_REQUEST, 
        code: AUTH_ERROR_CODES.PASSWORD_RECENTLY_USED 
      }
    };

    const errorConfig = errorMessages[error.message];
    if (errorConfig) {
      return res.status(errorConfig.status).json({
        error: {
          code: errorConfig.code,
          message: error.message,
          correlationId: res.locals.correlationId
        }
      });
    }

    res.status(AUTH_HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to change password',
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * GET /api/v1/auth/password/strength
 * Check password strength
 */
router.post('/strength', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Password is required',
          correlationId: res.locals.correlationId
        }
      });
    }

    const strength = passwordService.calculatePasswordStrength(password);

    res.json({
      strength,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Password strength check error:', error);
    res.status(AUTH_HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to check password strength',
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * POST /api/v1/auth/password/validate
 * Validate password against requirements
 */
router.post('/validate', async (req: Request, res: Response) => {
  try {
    const { password } = req.body;
    const lang = (req.headers['accept-language']?.includes('bg') ? 'bg' : 'en') as 'en' | 'bg';
    
    if (!password) {
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Password is required',
          correlationId: res.locals.correlationId
        }
      });
    }

    const result = validationService.validatePasswordComplexity(password);

    res.json({
      isValid: result.isValid,
      score: result.score,
      issues: result.issues,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Password validation error:', error);
    res.status(AUTH_HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to validate password',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;