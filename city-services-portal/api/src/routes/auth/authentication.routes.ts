import { Router, Request, Response } from 'express';
import { AuthService } from '../../services/auth.service';
import { ValidationService } from '../../services/validation.service';
import { 
  createLoginSchema, 
  createRegistrationSchema,
  createEmailVerificationSchema,
  createResendVerificationSchema
} from '../../validation/schemas/auth.schema';
import { AUTH_ERROR_CODES, AUTH_HTTP_STATUS } from '../../constants/auth.constants';
import { maskSensitiveData } from '../../utils/auth.utils';

const router = Router();
const authService = new AuthService();
const validationService = new ValidationService();

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    // Detect language preference
    const lang = (req.headers['accept-language']?.includes('bg') ? 'bg' : 'en') as 'en' | 'bg';
    
    // Validate input
    const validation = await validationService.validate(
      createRegistrationSchema(lang),
      req.body,
      { sanitize: true, language: lang }
    );

    if (!validation.isValid) {
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid registration data',
          details: validationService.formatValidationErrors(validation.errors!),
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check for security threats
    if (validationService.hasXSSAttempt(JSON.stringify(req.body))) {
      console.warn('XSS attempt detected in registration', {
        ip: req.ip,
        correlationId: res.locals.correlationId
      });
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid input detected',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Register user
    const result = await authService.register(validation.data!);

    // Log successful registration (masked sensitive data)
    console.log('User registered successfully', maskSensitiveData({
      email: validation.data!.email,
      correlationId: res.locals.correlationId
    }));

    res.status(AUTH_HTTP_STATUS.CREATED).json({
      ...result,
      correlationId: res.locals.correlationId
    });

  } catch (error: any) {
    console.error('Registration error:', error);

    if (error.message === 'User with this email already exists') {
      return res.status(AUTH_HTTP_STATUS.CONFLICT).json({
        error: {
          code: AUTH_ERROR_CODES.USER_EXISTS,
          message: error.message,
          correlationId: res.locals.correlationId
        }
      });
    }

    res.status(AUTH_HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to register user',
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const lang = (req.headers['accept-language']?.includes('bg') ? 'bg' : 'en') as 'en' | 'bg';
    
    // Validate input
    const validation = await validationService.validate(
      createLoginSchema(lang),
      req.body,
      { sanitize: true, language: lang }
    );

    if (!validation.isValid) {
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.VALIDATION_ERROR,
          message: 'Invalid login data',
          details: validationService.formatValidationErrors(validation.errors!),
          correlationId: res.locals.correlationId
        }
      });
    }

    // Attempt login
    const result = await authService.login(validation.data!);

    // Handle different login scenarios
    if (!result.success) {
      switch (result.requiresAction) {
        case 'EMAIL_VERIFICATION_REQUIRED':
          return res.status(AUTH_HTTP_STATUS.FORBIDDEN).json({
            error: {
              code: AUTH_ERROR_CODES.EMAIL_NOT_VERIFIED,
              message: result.message,
              requiresAction: result.requiresAction,
              correlationId: res.locals.correlationId
            }
          });
        
        case 'PASSWORD_RESET_REQUIRED':
          return res.status(AUTH_HTTP_STATUS.FORBIDDEN).json({
            error: {
              code: AUTH_ERROR_CODES.PASSWORD_RECENTLY_USED,
              message: result.message,
              requiresAction: result.requiresAction,
              correlationId: res.locals.correlationId
            }
          });
        
        default:
          return res.status(AUTH_HTTP_STATUS.UNAUTHORIZED).json({
            error: {
              code: AUTH_ERROR_CODES.INVALID_CREDENTIALS,
              message: result.message || 'Authentication failed',
              correlationId: res.locals.correlationId
            }
          });
      }
    }

    // Set secure cookie for refresh token (optional)
    if (result.tokens?.refreshToken) {
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json({
      ...result,
      correlationId: res.locals.correlationId
    });

  } catch (error: any) {
    console.error('Login error:', error);

    const errorMessages: Record<string, { status: number; code: string }> = {
      'Invalid email or password': { 
        status: AUTH_HTTP_STATUS.UNAUTHORIZED, 
        code: AUTH_ERROR_CODES.INVALID_CREDENTIALS 
      },
      'Your account has been suspended. Please contact support.': { 
        status: AUTH_HTTP_STATUS.LOCKED, 
        code: AUTH_ERROR_CODES.ACCOUNT_SUSPENDED 
      },
      'This account no longer exists': { 
        status: AUTH_HTTP_STATUS.NOT_FOUND, 
        code: AUTH_ERROR_CODES.ACCOUNT_ARCHIVED 
      },
      'Your account is inactive. Please contact support.': { 
        status: AUTH_HTTP_STATUS.FORBIDDEN, 
        code: AUTH_ERROR_CODES.ACCOUNT_LOCKED 
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
        message: 'Failed to login',
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * POST /api/v1/auth/logout
 * Logout user and invalidate tokens
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    // Clear refresh token cookie
    res.clearCookie('refreshToken');
    
    // In a real app, you'd also:
    // 1. Invalidate the access token (add to blacklist)
    // 2. Clear server-side session
    // 3. Log the logout event
    
    res.json({
      success: true,
      message: 'Logged out successfully',
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(AUTH_HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to logout',
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * GET /api/v1/auth/verify-email
 * Verify email address with token
 */
router.get('/verify-email', async (req: Request, res: Response) => {
  try {
    const lang = (req.headers['accept-language']?.includes('bg') ? 'bg' : 'en') as 'en' | 'bg';
    
    // Validate token
    const validation = await validationService.validate(
      createEmailVerificationSchema(lang),
      req.query,
      { language: lang }
    );

    if (!validation.isValid) {
      return res.status(AUTH_HTTP_STATUS.BAD_REQUEST).json({
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Invalid or missing verification token',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Verify email
    const result = await authService.verifyEmail(validation.data!.token);

    res.json({
      ...result,
      correlationId: res.locals.correlationId
    });

  } catch (error: any) {
    console.error('Email verification error:', error);

    if (error.message === 'Invalid or expired confirmation token') {
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
        message: 'Failed to verify email',
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * POST /api/v1/auth/resend-verification
 * Resend email verification link
 */
router.post('/resend-verification', async (req: Request, res: Response) => {
  try {
    const lang = (req.headers['accept-language']?.includes('bg') ? 'bg' : 'en') as 'en' | 'bg';
    
    // Validate input
    const validation = await validationService.validate(
      createResendVerificationSchema(lang),
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

    // Resend verification
    const result = await authService.resendVerificationEmail(validation.data!.email);

    res.json({
      ...result,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(AUTH_HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to resend verification email',
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const refreshToken = req.body.refreshToken || req.cookies.refreshToken;
    
    if (!refreshToken) {
      return res.status(AUTH_HTTP_STATUS.UNAUTHORIZED).json({
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: 'Refresh token is required',
          correlationId: res.locals.correlationId
        }
      });
    }

    const tokens = await authService.refreshToken(refreshToken);

    // Update refresh token cookie
    if (tokens.refreshToken) {
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    res.json({
      success: true,
      tokens,
      correlationId: res.locals.correlationId
    });

  } catch (error: any) {
    console.error('Token refresh error:', error);

    if (error.message === 'Invalid refresh token') {
      return res.status(AUTH_HTTP_STATUS.UNAUTHORIZED).json({
        error: {
          code: AUTH_ERROR_CODES.TOKEN_INVALID,
          message: error.message,
          correlationId: res.locals.correlationId
        }
      });
    }

    res.status(AUTH_HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to refresh token',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;