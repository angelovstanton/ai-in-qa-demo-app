import { Router, Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { PasswordService } from '../services/password.service';
import { ValidationService } from '../services/validation.service';
import { EmailSimulationService } from '../services/email-simulation.service';

const router = Router();
const authService = new AuthService();
const passwordService = new PasswordService();
const validationService = new ValidationService();
const emailService = new EmailSimulationService();

/**
 * GET /api/v1/auth-demo/test
 * Test the new authentication system
 */
router.get('/test', async (req: Request, res: Response) => {
  res.json({
    message: 'New authentication system is active!',
    features: {
      validation: 'Enhanced with Bulgarian support',
      passwordPolicy: 'Minimum 12 characters with complexity rules',
      emailSimulation: 'Console-based with colored output',
      userStatus: 'Lifecycle management with 6 states',
      services: [
        'AuthService',
        'UserService',
        'PasswordService',
        'EmailSimulationService',
        'ValidationService'
      ]
    },
    correlationId: res.locals.correlationId
  });
});

/**
 * POST /api/v1/auth-demo/test-registration
 * Test registration with new validation and email simulation
 */
router.post('/test-registration', async (req: Request, res: Response) => {
  try {
    // Demo registration data
    const demoData = {
      firstName: 'Demo',
      lastName: 'User',
      email: `demo${Date.now()}@example.com`,
      password: 'DemoPassword123!@#',
      phone: '+359888123456',
      preferredLanguage: 'en',
      agreesToTerms: true,
      agreesToPrivacy: true
    };

    console.log('\n🧪 TESTING NEW AUTHENTICATION SYSTEM\n');
    console.log('1️⃣ Testing Password Strength...');
    const passwordStrength = passwordService.calculatePasswordStrength(demoData.password);
    console.log(`   Score: ${passwordStrength.score}/100`);
    console.log(`   Meets Requirements: ${passwordStrength.meetsRequirements ? '✅' : '❌'}`);

    console.log('\n2️⃣ Testing Validation...');
    const validationResult = validationService.validatePasswordComplexity(demoData.password);
    console.log(`   Valid: ${validationResult.isValid ? '✅' : '❌'}`);
    console.log(`   Score: ${validationResult.score}/100`);

    console.log('\n3️⃣ Registering User...');
    const result = await authService.register(demoData);
    
    console.log('\n4️⃣ Email Simulation (check console above for colored output)');

    res.json({
      success: true,
      message: 'Test registration completed! Check console for email simulation.',
      testResults: {
        passwordStrength,
        validationResult,
        registrationResult: {
          success: result.success,
          message: result.message,
          user: result.user
        }
      },
      correlationId: res.locals.correlationId
    });

  } catch (error: any) {
    console.error('Test registration error:', error);
    res.status(500).json({
      error: {
        code: 'TEST_ERROR',
        message: error.message,
        correlationId: res.locals.correlationId
      }
    });
  }
});

/**
 * POST /api/v1/auth-demo/test-password-strength
 * Test password strength calculation
 */
router.post('/test-password-strength', async (req: Request, res: Response) => {
  const { password } = req.body;
  
  if (!password) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Password is required'
      }
    });
  }

  const strength = passwordService.calculatePasswordStrength(password);
  const complexity = validationService.validatePasswordComplexity(password);

  res.json({
    password: '***MASKED***',
    strength,
    complexity,
    correlationId: res.locals.correlationId
  });
});

/**
 * POST /api/v1/auth-demo/test-email-simulation
 * Test email simulation
 */
router.post('/test-email-simulation', async (req: Request, res: Response) => {
  const { type = 'VERIFICATION', email = 'test@example.com', name = 'Test User' } = req.body;

  await emailService.sendEmail({
    type: type as any,
    recipient: email,
    recipientName: name,
    token: 'demo-token-123456',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    additionalData: {
      newStatus: 'ACTIVE',
      previousStatus: 'PENDING_EMAIL_VERIFICATION',
      reason: 'Demo test'
    }
  });

  res.json({
    success: true,
    message: `${type} email simulation sent! Check the console for colored output.`,
    correlationId: res.locals.correlationId
  });
});

/**
 * GET /api/v1/auth-demo/test-validation-patterns
 * Test validation patterns with different inputs
 */
router.post('/test-validation-patterns', async (req: Request, res: Response) => {
  const { input, type = 'name' } = req.body;
  
  if (!input) {
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input is required'
      }
    });
  }

  const results: any = {};

  switch (type) {
    case 'name':
      results.isValidName = validationService.validateName(input);
      results.isValidNameWithCyrillic = validationService.validateName(input, { allowCyrillic: true });
      break;
    case 'email':
      results.isValidEmail = validationService.isValidEmail(input);
      break;
    case 'phone':
      results.isValidPhone = validationService.isValidPhone(input);
      results.isValidBulgarianPhone = validationService.isValidPhone(input, 'BG');
      break;
    case 'postalCode':
      results.isValidPostalCode = validationService.isValidPostalCode(input);
      results.isValidBulgarianPostalCode = validationService.isValidPostalCode(input, 'BG');
      break;
    case 'security':
      results.hasXSSAttempt = validationService.hasXSSAttempt(input);
      results.hasSQLInjectionAttempt = validationService.hasSQLInjectionAttempt(input);
      break;
  }

  res.json({
    input: '***MASKED***',
    type,
    results,
    correlationId: res.locals.correlationId
  });
});

export default router;