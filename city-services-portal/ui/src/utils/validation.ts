import { z } from 'zod';

/**
 * Comprehensive validation patterns and utilities for the AI in QA Demo Application
 * These patterns ensure consistent validation across all forms with security considerations
 */

// Common validation patterns that can be reused across the application
export const ValidationPatterns = {
  // Email validation with comprehensive regex and length checks
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .refine(
      (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      'Email format is invalid'
    ),

  // Password with comprehensive security requirements
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain: uppercase letter, lowercase letter, number, and special character (@$!%*?&)'
    ),

  // Names with unicode support for international characters
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(
      /^[a-zA-ZÀ-ÿ\u0100-\u017f\u0180-\u024f\u1e00-\u1eff\s'-]+$/,
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .transform((name) => name.trim()),

  // Phone number with international support
  phone: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number must be less than 15 digits')
    .regex(
      /^[\+]?[1-9][\d]{0,15}$/,
      'Please enter a valid phone number (digits only, optional + prefix)'
    ),

  // URLs with protocol validation
  url: z.string()
    .url('Please enter a valid URL')
    .refine(
      (url) => /^https?:\/\//.test(url),
      'URL must start with http:// or https://'
    ),

  // Postal codes supporting multiple international formats - minimum 5 symbols
  postalCode: z.string()
    .min(5, 'Postal code must be at least 5 characters')
    .max(10, 'Postal code must be less than 10 characters')
    .regex(
      /^[A-Za-z0-9\s-]{5,10}$/,
      'Postal code format is invalid'
    ),

  // Text content with XSS prevention
  safeText: z.string()
    .transform((text) => text.trim())
    .refine(
      (text) => !/<script|javascript:|on\w+=/i.test(text),
      'Text contains potentially harmful content'
    ),

  // File size validation (in bytes)
  fileSize: (maxSizeMB: number) => z.number()
    .max(maxSizeMB * 1024 * 1024, `File size must be less than ${maxSizeMB}MB`),

  // Date validation with reasonable bounds
  date: z.date()
    .refine(
      (date) => date >= new Date('1900-01-01'),
      'Date must be after January 1, 1900'
    )
    .refine(
      (date) => date <= new Date(),
      'Date cannot be in the future'
    ),

  // Future date validation for scheduling
  futureDate: z.date()
    .refine(
      (date) => date > new Date(),
      'Date must be in the future'
    ),

  // Required field with custom message
  required: (fieldName: string) => z.string()
    .min(1, `${fieldName} is required`)
    .transform((val) => val.trim()),

  // Street address validation
  streetAddress: z.string()
    .min(5, 'Street address must be at least 5 characters')
    .max(100, 'Street address is too long')
    .regex(
      /^[a-zA-Z0-9\s,.-]+$/,
      'Street address contains invalid characters'
    ),

  // City name validation with international support - minimum 3 symbols
  city: z.string()
    .min(3, 'City name must be at least 3 characters')
    .max(50, 'City name is too long')
    .regex(
      /^[a-zA-ZÀ-ÿ\u0100-\u017f\u0180-\u024f\u1e00-\u1eff\s'-]+$/,
      'City name contains invalid characters'
    ),

  // State/Province validation
  state: z.string()
    .min(2, 'State/Province is required')
    .max(50, 'State/Province name is too long'),

  // Country validation
  country: z.string()
    .min(2, 'Country is required')
    .max(50, 'Country name is too long'),

  // Business name validation
  businessName: z.string()
    .min(2, 'Business name must be at least 2 characters')
    .max(100, 'Business name is too long')
    .regex(
      /^[a-zA-Z0-9\s&.,'-]+$/,
      'Business name contains invalid characters'
    ),

  // Time validation (HH:MM format)
  time: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),

  // Numeric range validation
  numericRange: (min: number, max: number) => z.number()
    .min(min, `Value must be at least ${min}`)
    .max(max, `Value must be at most ${max}`),
};

// Service request specific validation patterns
export const ServiceRequestPatterns = {
  // Title validation for service requests
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be less than 120 characters')
    .refine(
      (title) => title.trim().length >= 5,
      'Title must contain at least 5 meaningful characters'
    )
    .transform((title) => ValidationPatterns.safeText.parse(title)),

  // Description validation for service requests
  description: z.string()
    .min(30, 'Description must be at least 30 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .refine(
      (desc) => desc.trim().split(/\s+/).length >= 10,
      'Description must contain at least 10 words'
    )
    .transform((desc) => ValidationPatterns.safeText.parse(desc)),

  // Date of request validation - cannot be more than 1 month in the past
  dateOfRequest: z.date()
    .refine(
      (date) => {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
        return date >= oneMonthAgo;
      },
      'Date cannot be more than 1 month in the past'
    )
    .refine(
      (date) => date <= new Date(),
      'Date cannot be in the future'
    ),

  // Location text validation
  locationText: z.string()
    .min(10, 'Please provide more detailed location information')
    .max(500, 'Location description is too long'),

  // Issue type validation
  issueType: z.string()
    .min(1, 'Issue type is required')
    .max(50, 'Issue type description is too long'),

  // Severity rating (1-10 scale)
  severity: z.number()
    .min(1, 'Severity must be between 1 and 10')
    .max(10, 'Severity must be between 1 and 10')
    .int('Severity must be a whole number'),

  // Priority validation
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: 'Please select a valid priority level' })
  }),

  // Category validation
  category: z.string()
    .min(1, 'Category is required')
    .refine(
      (category) => [
        'roads-transportation',
        'street-lighting',
        'waste-management',
        'water-sewer',
        'parks-recreation',
        'public-safety',
        'building-permits',
        'snow-removal',
        'traffic-signals',
        'sidewalk-maintenance',
        'tree-services',
        'noise-complaints',
        'animal-control',
        'other'
      ].includes(category),
      'Please select a valid category'
    ),

  // Contact method validation
  contactMethod: z.enum(['EMAIL', 'PHONE', 'SMS', 'MAIL'], {
    errorMap: () => ({ message: 'Please select a contact method' })
  }),

  // Estimated value validation
  estimatedValue: z.number()
    .min(0, 'Estimated value cannot be negative')
    .max(1000000, 'Estimated value is too high')
    .optional(),
};

// User registration specific patterns
export const RegistrationPatterns = {
  // Language preference validation
  preferredLanguage: z.enum(['EN', 'BG', 'ES', 'FR'], {
    errorMap: () => ({ message: 'Please select a valid language' })
  }),

  // Communication method validation
  communicationMethod: z.enum(['EMAIL', 'PHONE', 'SMS', 'MAIL'], {
    errorMap: () => ({ message: 'Please select a communication method' })
  }),

  // Account type validation
  accountType: z.enum(['CITIZEN', 'BUSINESS'], {
    errorMap: () => ({ message: 'Please select an account type' })
  }),

  // Security question validation
  securityQuestion: z.string()
    .min(10, 'Security question must be at least 10 characters')
    .max(200, 'Security question is too long')
    .optional(),

  // Security answer validation
  securityAnswer: z.string()
    .min(3, 'Security answer must be at least 3 characters')
    .max(100, 'Security answer is too long')
    .optional(),
};

// Comment and feedback patterns
export const CommentPatterns = {
  // Comment content validation
  content: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment must be less than 1000 characters')
    .refine(
      (content) => content.trim().split(/\s+/).length >= 3,
      'Comment must contain at least 3 words'
    )
    .transform((content) => ValidationPatterns.safeText.parse(content)),

  // Rating validation
  rating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional(),

  // Comment category validation
  category: z.enum(['QUESTION', 'COMPLAINT', 'COMPLIMENT', 'SUGGESTION', 'UPDATE'], {
    errorMap: () => ({ message: 'Please select a comment category' })
  }).optional(),
};

// File upload patterns
export const FilePatterns = {
  // Image file validation
  image: z.object({
    file: z.instanceof(File),
    name: z.string().min(1, 'File name is required'),
    size: ValidationPatterns.fileSize(10), // 10MB max
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/gif'].includes(type),
      'Only JPEG, PNG, and GIF images are allowed'
    )
  }),

  // Document file validation
  document: z.object({
    file: z.instanceof(File),
    name: z.string().min(1, 'File name is required'),
    size: ValidationPatterns.fileSize(5), // 5MB max for documents
    type: z.string().refine(
      (type) => ['application/pdf', 'text/plain', 'application/msword'].includes(type),
      'Only PDF, TXT, and DOC files are allowed'
    )
  }),

  // Any attachment validation
  attachment: z.object({
    file: z.instanceof(File),
    name: z.string().min(1, 'File name is required'),
    size: ValidationPatterns.fileSize(10), // 10MB max
    type: z.string().refine(
      (type) => [
        'image/jpeg', 'image/png', 'image/gif',
        'application/pdf', 'text/plain',
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ].includes(type),
      'File type not allowed. Please use JPEG, PNG, GIF, PDF, TXT, DOC, or DOCX files'
    )
  }),
};

// Search and filter patterns
export const SearchPatterns = {
  // Search term validation
  searchTerm: z.string()
    .max(100, 'Search term is too long')
    .optional()
    .transform((val) => val ? ValidationPatterns.safeText.parse(val) : val),

  // Sort field validation
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status', 'title'], {
    errorMap: () => ({ message: 'Invalid sort field' })
  }).optional(),

  // Sort order validation
  sortOrder: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort order must be ascending or descending' })
  }).optional(),

  // Pagination validation
  page: z.number()
    .min(1, 'Page number must be at least 1')
    .max(1000, 'Page number is too high')
    .optional(),

  limit: z.number()
    .min(1, 'Items per page must be at least 1')
    .max(100, 'Items per page cannot exceed 100')
    .optional(),
};

// Error message categories and formatters
export const ErrorMessages = {
  // Required field errors
  REQUIRED: {
    FIELD: (fieldName: string) => `${fieldName} is required`,
    SELECT: (fieldName: string) => `Please select a ${fieldName.toLowerCase()}`,
    CHECK: (fieldName: string) => `Please check ${fieldName.toLowerCase()}`,
    UPLOAD: 'Please upload a file',
  },

  // Format errors with examples
  FORMAT: {
    EMAIL: 'Please enter a valid email address (example: user@domain.com)',
    PHONE: 'Please enter a valid phone number (10-15 digits, +1234567890)',
    URL: 'Please enter a valid URL starting with http:// or https://',
    DATE: 'Please enter a valid date (MM/DD/YYYY)',
    TIME: 'Please enter a valid time (HH:MM)',
    POSTAL_CODE: 'Please enter a valid postal code',
    PASSWORD: 'Password must contain uppercase, lowercase, number, and special character',
  },

  // Length errors with dynamic values
  LENGTH: {
    TOO_SHORT: (fieldName: string, minLength: number) => 
      `${fieldName} must be at least ${minLength} characters`,
    TOO_LONG: (fieldName: string, maxLength: number) => 
      `${fieldName} must be less than ${maxLength} characters`,
    EXACT: (fieldName: string, length: number) => 
      `${fieldName} must be exactly ${length} characters`,
  },

  // Security-related errors
  SECURITY: {
    UNSAFE_CONTENT: 'Content contains potentially harmful elements',
    PASSWORDS_MISMATCH: 'Passwords do not match',
    WEAK_PASSWORD: 'Password is too weak. Use a mix of letters, numbers, and symbols',
    ACCOUNT_LOCKED: 'Account is temporarily locked due to multiple failed attempts',
    XSS_DETECTED: 'Input contains potentially malicious content',
    RATE_LIMITED: 'Too many attempts. Please wait before trying again',
  },

  // Business logic errors
  BUSINESS: {
    EMAIL_EXISTS: 'This email address is already registered',
    INVALID_CREDENTIALS: 'Invalid email address or password',
    SESSION_EXPIRED: 'Your session has expired. Please log in again',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
    DUPLICATE_REQUEST: 'A similar request already exists',
    INVALID_STATUS_TRANSITION: 'Cannot change status to the selected value',
  },

  // File upload errors
  FILE: {
    TOO_LARGE: (maxSize: string) => `File size exceeds ${maxSize} limit`,
    INVALID_TYPE: (allowedTypes: string[]) => 
      `File type not supported. Please use: ${allowedTypes.join(', ')}`,
    UPLOAD_FAILED: 'File upload failed. Please try again',
    TOO_MANY: (maxFiles: number) => `Maximum ${maxFiles} files allowed`,
    CORRUPTED: 'File appears to be corrupted. Please try a different file',
    EMPTY_FILE: 'File is empty or corrupted',
  },

  // Network/API errors
  NETWORK: {
    CONNECTION_ERROR: 'Connection error. Please check your internet connection',
    SERVER_ERROR: 'Server error occurred. Please try again later',
    TIMEOUT: 'Request timed out. Please try again',
    RATE_LIMITED: 'Too many requests. Please wait before trying again',
    MAINTENANCE: 'System is under maintenance. Please try again later',
  },

  // Validation errors
  VALIDATION: {
    FUTURE_DATE_REQUIRED: 'Date must be in the future',
    PAST_DATE_REQUIRED: 'Date must be in the past',
    INVALID_RANGE: (min: number, max: number) => `Value must be between ${min} and ${max}`,
    PATTERN_MISMATCH: (pattern: string) => `Format must match: ${pattern}`,
    CROSS_FIELD_ERROR: 'Related fields have conflicting values',
  },
};

// Input sanitization utilities
export const Sanitization = {
  // Remove HTML tags and prevent XSS
  sanitizeHtml: (input: string): string => {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '');
  },

  // Sanitize for database storage
  sanitizeForDatabase: (input: string): string => {
    return input
      .trim()
      .replace(/\0/g, '') // Remove null bytes
      .replace(/\r\n/g, '\n') // Normalize line endings
      .substring(0, 10000); // Prevent extremely long inputs
  },

  // Sanitize file names
  sanitizeFileName: (fileName: string): string => {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/_{2,}/g, '_')
      .replace(/^_+|_+$/g, '')
      .substring(0, 255);
  },

  // Validate and sanitize URLs
  sanitizeUrl: (url: string): string | null => {
    try {
      const parsedUrl = new URL(url);
      if (['http:', 'https:'].includes(parsedUrl.protocol)) {
        return parsedUrl.toString();
      }
      return null;
    } catch {
      return null;
    }
  },

  // Remove potentially dangerous characters
  removeDangerousChars: (input: string): string => {
    return input
      .replace(/[<>'"&]/g, '') // Remove HTML/XML special chars
      .replace(/[{}[\]()]/g, '') // Remove object notation chars
      .replace(/[;:]/g, ''); // Remove command separators
  },
};

// XSS prevention utilities
export const XSSPrevention = {
  // Check for XSS patterns
  containsXSS: (content: string): boolean => {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>/gi,
      /<form[^>]*>/gi,
      /expression\s*\(/gi,
      /vbscript:/gi,
      /livescript:/gi,
    ];
    
    return xssPatterns.some(pattern => pattern.test(content));
  },

  // Escape HTML entities
  escapeHtml: (text: string): string => {
    const map: { [key: string]: string } = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };
    
    return text.replace(/[&<>"'`=\/]/g, (s) => map[s]);
  },

  // Clean potentially dangerous content
  cleanContent: (content: string): string => {
    return content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>?/gm, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/expression\s*\(/gi, '')
      .replace(/vbscript:/gi, '')
      .replace(/livescript:/gi, '');
  },
};

// User-friendly error formatter
export function formatErrorMessage(error: z.ZodError, fieldName?: string): string {
  const issue = error.issues[0];
  
  switch (issue.code) {
    case 'too_small':
      if (issue.type === 'string') {
        return ErrorMessages.LENGTH.TOO_SHORT(fieldName || 'Field', issue.minimum as number);
      }
      break;
    case 'too_big':
      if (issue.type === 'string') {
        return ErrorMessages.LENGTH.TOO_LONG(fieldName || 'Field', issue.maximum as number);
      }
      break;
    case 'invalid_string':
      if (issue.validation === 'email') {
        return ErrorMessages.FORMAT.EMAIL;
      }
      if (issue.validation === 'url') {
        return ErrorMessages.FORMAT.URL;
      }
      break;
    case 'custom':
      return issue.message;
    default:
      return issue.message;
  }
  
  return 'Invalid input. Please check and try again.';
}

// Password strength calculator
export function calculatePasswordStrength(password: string): {
  score: number;
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  if (password.length >= 8) score += 1;
  else feedback.push('Use at least 8 characters');

  if (/[a-z]/.test(password)) score += 1;
  else feedback.push('Add lowercase letters');

  if (/[A-Z]/.test(password)) score += 1;
  else feedback.push('Add uppercase letters');

  if (/\d/.test(password)) score += 1;
  else feedback.push('Add numbers');

  if (/[@$!%*?&]/.test(password)) score += 1;
  else feedback.push('Add special characters (@$!%*?&)');

  return { score, feedback };
}

// Email domain validation (for business accounts)
export function validateBusinessEmail(email: string): boolean {
  const businessDomains = [
    'gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com',
    'aol.com', 'icloud.com', 'protonmail.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  return domain ? !businessDomains.includes(domain) : false;
}

// Export validation test IDs for consistent testing
export const ValidationTestIds = {
  FIELD_ERROR: (fieldName: string) => `cs-field-error-${fieldName}`,
  CHAR_COUNT: (fieldName: string) => `cs-char-count-${fieldName}`,
  PASSWORD_STRENGTH: 'cs-password-strength',
  VALIDATION_MESSAGE: (fieldName: string) => `cs-validation-${fieldName}`,
  SUCCESS_MESSAGE: 'cs-validation-success',
  FORM_ERROR: 'cs-form-error',
  LOADING_VALIDATION: 'cs-validation-loading',
};