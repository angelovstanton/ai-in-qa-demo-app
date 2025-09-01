import { z } from 'zod';
import {
  namePattern,
  emailPattern,
  phoneE164Pattern,
  bulgarianPhonePattern,
  internationalPhonePattern,
  bulgarianPostalCodePattern,
  internationalPostalCodePattern,
  addressPattern,
  uppercasePattern,
  lowercasePattern,
  numberPattern,
  specialCharPattern,
  hasConsecutiveCharacters,
  hasRepeatedCharacters,
  isCommonPassword,
  hasSequentialCharacters,
  postalCodeValidators,
  getValidationMessage,
  ValidationLanguage
} from '../shared/patterns';

// Environment variables for password requirements
const PASSWORD_MIN_LENGTH = parseInt(process.env.PASSWORD_MIN_LENGTH || '12');
const PASSWORD_MAX_CONSECUTIVE = parseInt(process.env.PASSWORD_MAX_CONSECUTIVE_CHARS || '2');
const PASSWORD_MAX_REPEATED = parseInt(process.env.PASSWORD_MAX_REPEATED_CHARS || '3');

// ============================================================================
// Field Validators
// ============================================================================

export const createNameValidator = (lang: ValidationLanguage = 'en') => 
  z.string()
    .min(2, getValidationMessage('nameTooShort', lang, { min: 2 }))
    .max(50, getValidationMessage('nameTooLong', lang, { max: 50 }))
    .regex(namePattern, getValidationMessage('nameInvalidCharacters', lang))
    .refine(val => val.trim().length >= 2, getValidationMessage('nameTooShort', lang, { min: 2 }))
    .refine(val => !val.includes('  '), 'Name cannot contain consecutive spaces')
    .transform(val => val.trim());

export const createEmailValidator = (lang: ValidationLanguage = 'en') =>
  z.string()
    .email(getValidationMessage('invalidEmail', lang))
    .toLowerCase()
    .min(5, 'Email must be at least 5 characters')
    .max(254, 'Email cannot exceed 254 characters')
    .regex(emailPattern, getValidationMessage('invalidEmail', lang))
    .transform(val => val.toLowerCase().trim());

export const createPhoneValidator = (lang: ValidationLanguage = 'en', country?: string) => {
  let validator = z.string();
  
  if (country === 'BG') {
    validator = validator.regex(bulgarianPhonePattern, getValidationMessage('invalidPhone', lang));
  } else {
    validator = validator.regex(internationalPhonePattern, getValidationMessage('invalidPhone', lang));
  }
  
  return validator
    .transform(val => val.replace(/[\s()-]/g, ''))
    .refine(val => phoneE164Pattern.test(val) || bulgarianPhonePattern.test(val), 
      getValidationMessage('invalidPhone', lang));
};

export const createPostalCodeValidator = (lang: ValidationLanguage = 'en', country: string = 'DEFAULT') => {
  const pattern = postalCodeValidators[country] || postalCodeValidators.DEFAULT;
  return z.string()
    .regex(pattern, getValidationMessage('invalidPostalCode', lang))
    .transform(val => val.toUpperCase().trim());
};

export const createAddressValidator = (lang: ValidationLanguage = 'en') =>
  z.string()
    .min(5, 'Address must be at least 5 characters')
    .max(200, 'Address cannot exceed 200 characters')
    .regex(addressPattern, getValidationMessage('addressInvalid', lang))
    .transform(val => val.trim());

export const createPasswordValidator = (lang: ValidationLanguage = 'en') =>
  z.string()
    .min(PASSWORD_MIN_LENGTH, getValidationMessage('passwordTooShort', lang, { min: PASSWORD_MIN_LENGTH }))
    .max(128, getValidationMessage('passwordTooLong', lang, { max: 128 }))
    .refine(val => uppercasePattern.test(val), getValidationMessage('passwordRequiresUppercase', lang))
    .refine(val => lowercasePattern.test(val), getValidationMessage('passwordRequiresLowercase', lang))
    .refine(val => numberPattern.test(val), getValidationMessage('passwordRequiresNumber', lang))
    .refine(val => specialCharPattern.test(val), getValidationMessage('passwordRequiresSpecial', lang))
    .refine(val => !hasConsecutiveCharacters(val, PASSWORD_MAX_CONSECUTIVE), 
      getValidationMessage('passwordHasConsecutive', lang, { max: PASSWORD_MAX_CONSECUTIVE }))
    .refine(val => !hasRepeatedCharacters(val, PASSWORD_MAX_REPEATED),
      getValidationMessage('passwordHasRepeated', lang, { max: PASSWORD_MAX_REPEATED }))
    .refine(val => !isCommonPassword(val), getValidationMessage('passwordTooCommon', lang))
    .refine(val => !hasSequentialCharacters(val), getValidationMessage('passwordHasSequential', lang));

// ============================================================================
// Authentication Schemas
// ============================================================================

export const createRegistrationSchema = (lang: ValidationLanguage = 'en') => z.object({
  // Personal Information
  firstName: createNameValidator(lang),
  lastName: createNameValidator(lang),
  email: createEmailValidator(lang),
  password: createPasswordValidator(lang),
  confirmPassword: z.string(),
  
  // Contact Information
  phone: createPhoneValidator(lang).optional(),
  alternatePhone: createPhoneValidator(lang).optional(),
  
  // Address Information
  streetAddress: createAddressValidator(lang).optional(),
  city: createNameValidator(lang).optional(),
  state: createNameValidator(lang).optional(),
  postalCode: createPostalCodeValidator(lang).optional(),
  country: z.string().min(2).max(2).default('BG').optional(),
  
  // Preferences
  preferredLanguage: z.enum(['en', 'bg']).default('en'),
  communicationMethod: z.enum(['EMAIL', 'PHONE', 'SMS']).default('EMAIL'),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  serviceUpdates: z.boolean().default(true),
  
  // Security
  securityQuestion: z.string().min(5).max(200).optional(),
  securityAnswer: z.string().min(2).max(100).optional(),
  twoFactorEnabled: z.boolean().default(false),
  
  // Terms & Conditions
  agreesToTerms: z.boolean().refine(val => val === true, 'You must agree to the terms and conditions'),
  agreesToPrivacy: z.boolean().refine(val => val === true, 'You must agree to the privacy policy'),
  
  // Anti-bot measures
  captchaToken: z.string().optional(),
  honeypot: z.string().max(0, 'Invalid form submission').optional()
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine(data => {
  if (data.phone && data.alternatePhone) {
    return data.phone !== data.alternatePhone;
  }
  return true;
}, {
  message: 'Alternate phone must be different from primary phone',
  path: ['alternatePhone']
});

export const createLoginSchema = (lang: ValidationLanguage = 'en') => z.object({
  email: createEmailValidator(lang),
  password: z.string().min(1, getValidationMessage('required', lang)),
  rememberMe: z.boolean().default(false),
  captchaToken: z.string().optional()
});

export const createPasswordResetRequestSchema = (lang: ValidationLanguage = 'en') => z.object({
  email: createEmailValidator(lang),
  captchaToken: z.string().optional()
});

export const createPasswordResetSchema = (lang: ValidationLanguage = 'en') => z.object({
  token: z.string().min(1, getValidationMessage('required', lang)),
  newPassword: createPasswordValidator(lang),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

export const createPasswordChangeSchema = (lang: ValidationLanguage = 'en') => z.object({
  currentPassword: z.string().min(1, getValidationMessage('required', lang)),
  newPassword: createPasswordValidator(lang),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword']
});

export const createProfileUpdateSchema = (lang: ValidationLanguage = 'en') => z.object({
  firstName: createNameValidator(lang).optional(),
  lastName: createNameValidator(lang).optional(),
  phone: createPhoneValidator(lang).optional(),
  alternatePhone: createPhoneValidator(lang).optional(),
  streetAddress: createAddressValidator(lang).optional(),
  city: createNameValidator(lang).optional(),
  state: createNameValidator(lang).optional(),
  postalCode: createPostalCodeValidator(lang).optional(),
  country: z.string().min(2).max(2).optional(),
  preferredLanguage: z.enum(['en', 'bg']).optional(),
  communicationMethod: z.enum(['EMAIL', 'PHONE', 'SMS']).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  serviceUpdates: z.boolean().optional(),
  twoFactorEnabled: z.boolean().optional(),
  securityQuestion: z.string().min(5).max(200).optional(),
  securityAnswer: z.string().min(2).max(100).optional()
}).refine(data => {
  if (data.phone && data.alternatePhone) {
    return data.phone !== data.alternatePhone;
  }
  return true;
}, {
  message: 'Alternate phone must be different from primary phone',
  path: ['alternatePhone']
});

export const createEmailVerificationSchema = (lang: ValidationLanguage = 'en') => z.object({
  token: z.string().min(1, getValidationMessage('required', lang))
});

export const createResendVerificationSchema = (lang: ValidationLanguage = 'en') => z.object({
  email: createEmailValidator(lang)
});

// ============================================================================
// Admin Schemas
// ============================================================================

export const createUserStatusUpdateSchema = (lang: ValidationLanguage = 'en') => z.object({
  userId: z.string().uuid('Invalid user ID'),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_EMAIL_VERIFICATION', 'PASSWORD_RESET_REQUIRED', 'SUSPENDED', 'ARCHIVED']),
  reason: z.string().min(5).max(500).optional(),
  notifyUser: z.boolean().default(true)
});

export const createBulkUserStatusUpdateSchema = (lang: ValidationLanguage = 'en') => z.object({
  userIds: z.array(z.string().uuid()),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']),
  reason: z.string().min(5).max(500),
  notifyUsers: z.boolean().default(true)
});

export const createUserFilterSchema = (lang: ValidationLanguage = 'en') => z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING_EMAIL_VERIFICATION', 'PASSWORD_RESET_REQUIRED', 'SUSPENDED', 'ARCHIVED']).optional(),
  role: z.enum(['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']).optional(),
  emailConfirmed: z.boolean().optional(),
  hasPasswordResetToken: z.boolean().optional(),
  createdAfter: z.string().datetime().optional(),
  createdBefore: z.string().datetime().optional(),
  search: z.string().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20),
  sortBy: z.enum(['createdAt', 'updatedAt', 'email', 'name', 'status']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// ============================================================================
// Validation Utilities
// ============================================================================

export const sanitizeInput = (input: string): string => {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/[<>\"']/g, '')
    .trim();
};

export const validateAndSanitize = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: { sanitize?: boolean }
): Promise<{ success: boolean; data?: T; errors?: z.ZodError }> => {
  try {
    if (options?.sanitize && typeof data === 'object' && data !== null) {
      const sanitized = Object.entries(data).reduce((acc, [key, value]) => {
        if (typeof value === 'string') {
          acc[key] = sanitizeInput(value);
        } else {
          acc[key] = value;
        }
        return acc;
      }, {} as any);
      data = sanitized;
    }
    
    const validated = await schema.parseAsync(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};