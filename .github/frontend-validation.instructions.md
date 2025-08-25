---
description: 'Frontend Form Validation Standards and Best Practices'
applyTo: '**/*.tsx, **/*.ts, **/*.jsx, **/*.js'
---

# Frontend Form Validation Instructions

Comprehensive validation standards for all forms in the AI in QA Demo Application, ensuring data integrity, security, and excellent user experience.

## Validation Framework
- **Primary**: Zod schemas for type-safe validation
- **Integration**: React Hook Form with zodResolver
- **Real-time**: Immediate feedback with debounced validation
- **Accessibility**: ARIA attributes for screen readers
- **Security**: Input sanitization and XSS prevention

## Core Validation Patterns

### Base Validation Schemas
```typescript
import { z } from 'zod';

// Common validation patterns
export const ValidationPatterns = {
  // Email validation with comprehensive regex
  email: z.string()
    .min(1, 'Email is required')
    .email('Please enter a valid email address')
    .max(254, 'Email address is too long')
    .refine(
      (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      'Email format is invalid'
    ),

  // Password with security requirements
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain: uppercase letter, lowercase letter, number, and special character (@$!%*?&)'
    ),

  // Names with unicode support
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

  // Postal codes with multiple formats
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

  // Date validation
  date: z.date()
    .refine(
      (date) => date >= new Date('1900-01-01'),
      'Date must be after January 1, 1900'
    )
    .refine(
      (date) => date <= new Date(),
      'Date cannot be in the future'
    ),

  // Future date validation
  futureDate: z.date()
    .refine(
      (date) => date > new Date(),
      'Date must be in the future'
    ),

  // Required field with custom message
  required: (fieldName: string) => z.string()
    .min(1, `${fieldName} is required`)
    .transform((val) => val.trim()),
};

// Service request priority validation
export const prioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
  errorMap: () => ({ message: 'Please select a valid priority level' })
});

// Service request category validation
export const categorySchema = z.string()
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
  );
```

### User Registration Validation with Proper TypeScript
```typescript
// Comprehensive registration validation schema with proper TypeScript
export const registrationSchema = z.object({
  // Personal Information
  firstName: ValidationPatterns.name,
  lastName: ValidationPatterns.name,
  email: ValidationPatterns.email,

  // Password Requirements
  password: ValidationPatterns.password,
  confirmPassword: z.string().min(1, 'Please confirm your password'),

  // Contact Information
  phone: ValidationPatterns.phone,
  alternatePhone: ValidationPatterns.phone.optional(),

  // Address Information
  streetAddress: z.string()
    .min(5, 'Street address must be at least 5 characters')
    .max(100, 'Street address is too long')
    .regex(
      /^[a-zA-Z0-9\s,.-]+$/,
      'Street address contains invalid characters'
    ),
  
  city: z.string()
    .min(2, 'City name must be at least 2 characters')
    .max(50, 'City name is too long')
    .regex(
      /^[a-zA-ZÀ-ÿ\u0100-\u017f\u0180-\u024f\u1e00-\u1eff\s'-]+$/,
      'City name contains invalid characters'
    ),

  state: z.string()
    .min(2, 'State/Province is required')
    .max(50, 'State/Province name is too long'),

  postalCode: ValidationPatterns.postalCode,

  country: z.string()
    .min(2, 'Country is required')
    .max(50, 'Country name is too long'),

  // Communication Preferences
  preferredLanguage: z.enum(['EN', 'BG', 'ES', 'FR'], {
    errorMap: () => ({ message: 'Please select a valid language' })
  }),

  communicationMethod: z.enum(['EMAIL', 'PHONE', 'SMS', 'MAIL'], {
    errorMap: () => ({ message: 'Please select a communication method' })
  }),

  // Account Type
  accountType: z.enum(['CITIZEN', 'BUSINESS'], {
    errorMap: () => ({ message: 'Please select an account type' })
  }),

  businessName: z.string()
    .max(100, 'Business name is too long')
    .optional(),

  // Legal Agreements
  agreesToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the Terms and Conditions'),

  agreesToPrivacy: z.boolean()
    .refine(val => val === true, 'You must agree to the Privacy Policy'),

  // Marketing Preferences
  marketingEmails: z.boolean(),
  serviceUpdates: z.boolean(),

  // Security Questions (optional)
  securityQuestion: z.string().optional(),
  securityAnswer: z.string()
    .min(3, 'Security answer must be at least 3 characters')
    .max(100, 'Security answer is too long')
    .optional(),

}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.accountType === 'BUSINESS') {
    return data.businessName && data.businessName.trim().length > 0;
  }
  return true;
}, {
  message: "Business name is required for business accounts",
  path: ["businessName"],
}).refine((data) => {
  if (data.securityQuestion) {
    return data.securityAnswer && data.securityAnswer.trim().length > 0;
  }
  return true;
}, {
  message: "Security answer is required when security question is provided",
  path: ["securityAnswer"],
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;
```

### Service Request Creation Validation
```typescript
// Comprehensive service request validation schema
export const serviceRequestSchema = z.object({
  // Basic Information
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(120, 'Title must be less than 120 characters')
    .refine(
      (title) => title.trim().length >= 5,
      'Title must contain at least 5 meaningful characters'
    )
    .transform((title) => ValidationPatterns.safeText.parse(title)),

  description: z.string()
    .min(30, 'Description must be at least 30 characters')
    .max(2000, 'Description must be less than 2000 characters')
    .refine(
      (desc) => desc.trim().split(/\s+/).length >= 10,
      'Description must contain at least 10 words'
    )
    .transform((desc) => ValidationPatterns.safeText.parse(desc)),

  category: categorySchema,
  priority: prioritySchema,

  // Location Information
  streetAddress: z.string()
    .min(5, 'Street address is required and must be at least 5 characters')
    .max(100, 'Street address is too long'),

  city: z.string()
    .min(2, 'City is required')
    .max(50, 'City name is too long'),

  postalCode: ValidationPatterns.postalCode,

  locationText: z.string()
    .min(10, 'Please provide more detailed location information')
    .max(500, 'Location description is too long'),

  landmark: z.string()
    .max(100, 'Landmark description is too long')
    .optional(),

  accessInstructions: z.string()
    .max(300, 'Access instructions are too long')
    .optional(),

  // Contact Information
  contactMethod: z.enum(['EMAIL', 'PHONE', 'SMS', 'MAIL'], {
    errorMap: () => ({ message: 'Please select a contact method' })
  }),

  alternatePhone: ValidationPatterns.phone.optional(),

  bestTimeToContact: z.string()
    .max(100, 'Best time to contact description is too long')
    .optional(),

  // Issue Details
  issueType: z.string()
    .min(1, 'Issue type is required')
    .max(50, 'Issue type description is too long'),

  severity: z.number()
    .min(1, 'Severity must be between 1 and 10')
    .max(10, 'Severity must be between 1 and 10')
    .int('Severity must be a whole number'),

  isRecurring: z.boolean(),
  isEmergency: z.boolean(),
  hasPermits: z.boolean(),

  // Service Impact
  affectedServices: z.array(z.string())
    .min(1, 'Please select at least one affected service')
    .max(10, 'Too many affected services selected'),

  estimatedValue: z.number()
    .min(0, 'Estimated value cannot be negative')
    .max(1000000, 'Estimated value is too high')
    .optional(),

  // Additional Contacts
  additionalContacts: z.array(z.object({
    name: ValidationPatterns.name,
    phone: ValidationPatterns.phone,
    relationship: z.string()
      .min(2, 'Relationship must be at least 2 characters')
      .max(50, 'Relationship description is too long')
      .regex(
        /^[a-zA-Z\s]+$/,
        'Relationship can only contain letters and spaces'
      )
  })).max(5, 'Maximum 5 additional contacts allowed'),

  // File Attachments
  attachments: z.array(z.object({
    file: z.instanceof(File),
    name: z.string().min(1, 'File name is required'),
    size: ValidationPatterns.fileSize(10), // 10MB max
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'text/plain'].includes(type),
      'File type not allowed. Please use JPEG, PNG, GIF, PDF, or TXT files'
    )
  })).max(5, 'Maximum 5 file attachments allowed'),

  // User Experience
  satisfactionRating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional());

   comments: z.string()
    .max(1000, 'Comments must be less than 1000 characters')
    .optional()
    .transform((val) => val ? ValidationPatterns.safeText.parse(val) : val),

  // Legal and Preferences
  agreesToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the terms and conditions'),

  wantsUpdates: z.boolean(),

  // Scheduled Service (if applicable)
  preferredDate: z.date().optional(),
  preferredTime: z.string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format')
    .optional(),

}).refine((data) => {
  // If emergency, certain fields become required
  if (data.isEmergency) {
    return data.alternatePhone || data.contactMethod === 'EMAIL';
  }
  return true;
}, {
  message: "Emergency requests require alternate phone number or email contact",
  path: ["alternatePhone"],
}).refine((data) => {
  // If scheduled service requested, date must be provided
  if (data.preferredTime) {
    return data.preferredDate;
  }
  return true;
}, {
  message: "Preferred date is required when preferred time is specified",
  path: ["preferredDate"],
}).refine((data) => {
  // High value requests require additional verification
  if (data.estimatedValue && data.estimatedValue > 50000) {
    return data.additionalContacts.length > 0;
  }
  return true;
}, {
  message: "High-value requests require at least one additional contact",
  path: ["additionalContacts"],
});

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;
```

### Login Validation
```typescript
// Login validation schema
export const loginSchema = z.object({
  email: ValidationPatterns.email,
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().optional(),
  captcha: z.string()
    .min(1, 'Please complete the captcha')
    .optional(),
}).refine((data) => {
  // Add rate limiting check if needed
  return true;
}, {
  message: "Too many login attempts. Please try again later.",
  path: ["email"],
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

### Comment/Feedback Validation
```typescript
// Comment validation schema
export const commentSchema = z.object({
  content: z.string()
    .min(10, 'Comment must be at least 10 characters')
    .max(1000, 'Comment must be less than 1000 characters')
    .refine(
      (content) => content.trim().split(/\s+/).length >= 3,
      'Comment must contain at least 3 words'
    )
    .transform((content) => ValidationPatterns.safeText.parse(content)),

  isPrivate: z.boolean(),
  
  rating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional(),

  category: z.enum(['QUESTION', 'COMPLAINT', 'COMPLIMENT', 'SUGGESTION', 'UPDATE'], {
    errorMap: () => ({ message: 'Please select a comment category' })
  }).optional(),

  attachments: z.array(z.object({
    file: z.instanceof(File),
    name: z.string().min(1, 'File name is required'),
    size: ValidationPatterns.fileSize(5), // 5MB max for comments
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'application/pdf'].includes(type),
      'Only JPEG, PNG, and PDF files are allowed for comments'
    )
  })).max(3, 'Maximum 3 file attachments allowed for comments'),
});

export type CommentFormData = z.infer<typeof commentSchema>;
```

### Search and Filter Validation
```typescript
// Search and filter validation
export const searchFilterSchema = z.object({
  searchTerm: z.string()
    .max(100, 'Search term is too long')
    .optional()
    .transform((val) => val ? ValidationPatterns.safeText.parse(val) : val),

  category: z.string().optional(),
  
  status: z.string().optional(),
  
  priority: z.string().optional(),
  
  dateFrom: z.date().optional(),
  
  dateTo: z.date().optional(),
  
  sortBy: z.enum(['createdAt', 'updatedAt', 'priority', 'status', 'title'], {
    errorMap: () => ({ message: 'Invalid sort field' })
  }).optional(),
  
  sortOrder: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'Sort order must be ascending or descending' })
  }).optional(),
  
  page: z.number()
    .min(1, 'Page number must be at least 1')
    .max(1000, 'Page number is too high')
    .optional(),
  
  limit: z.number()
    .min(1, 'Items per page must be at least 1')
    .max(100, 'Items per page cannot exceed 100')
    .optional(),

}).refine((data) => {
  if (data.dateFrom && data.dateTo) {
    return data.dateFrom <= data.dateTo;
  }
  return true;
}, {
  message: "Start date must be before or equal to end date",
  path: ["dateTo"],
});

export type SearchFilterData = z.infer<typeof searchFilterSchema>;
```

## Error Message Standards

### Error Message Categories
```typescript
export const ErrorMessages = {
  // Required Field Errors
  REQUIRED: {
    FIELD: (fieldName: string) => `${fieldName} is required`,
    SELECT: (fieldName: string) => `Please select a ${fieldName.toLowerCase()}`,
    CHECK: (fieldName: string) => `Please check ${fieldName.toLowerCase()}`,
    UPLOAD: 'Please upload a file',
  },

  // Format Errors
  FORMAT: {
    EMAIL: 'Please enter a valid email address (example: user@domain.com)',
    PHONE: 'Please enter a valid phone number (10-15 digits, +1234567890)',
    URL: 'Please enter a valid URL starting with http:// or https://',
    DATE: 'Please enter a valid date (MM/DD/YYYY)',
    TIME: 'Please enter a valid time (HH:MM)',
    POSTAL_CODE: 'Please enter a valid postal code',
    PASSWORD: 'Password must contain uppercase, lowercase, number, and special character',
  },

  // Length Errors
  LENGTH: {
    TOO_SHORT: (fieldName: string, minLength: number) => 
      `${fieldName} must be at least ${minLength} characters`,
    TOO_LONG: (fieldName: string, maxLength: number) => 
      `${fieldName} must be less than ${maxLength} characters`,
    EXACT: (fieldName: string, length: number) => 
      `${fieldName} must be exactly ${length} characters`,
  },

  // Security Errors
  SECURITY: {
    UNSAFE_CONTENT: 'Content contains potentially harmful elements',
    PASSWORDS_MISMATCH: 'Passwords do not match',
    WEAK_PASSWORD: 'Password is too weak. Use a mix of letters, numbers, and symbols',
    ACCOUNT_LOCKED: 'Account is temporarily locked due to multiple failed attempts',
  },

  // Business Logic Errors
  BUSINESS: {
    EMAIL_EXISTS: 'This email address is already registered',
    INVALID_CREDENTIALS: 'Invalid email address or password',
    SESSION_EXPIRED: 'Your session has expired. Please log in again',
    INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action',
    DUPLICATE_REQUEST: 'A similar request already exists',
  },

  // File Upload Errors
  FILE: {
    TOO_LARGE: (maxSize: string) => `File size exceeds ${maxSize} limit`,
    INVALID_TYPE: (allowedTypes: string[]) => 
      `File type not supported. Please use: ${allowedTypes.join(', ')}`,
    UPLOAD_FAILED: 'File upload failed. Please try again',
    TOO_MANY: (maxFiles: number) => `Maximum ${maxFiles} files allowed`,
    CORRUPTED: 'File appears to be corrupted. Please try a different file',
  },

  // Network/API Errors
  NETWORK: {
    CONNECTION_ERROR: 'Connection error. Please check your internet connection',
    SERVER_ERROR: 'Server error occurred. Please try again later',
    TIMEOUT: 'Request timed out. Please try again',
    RATE_LIMITED: 'Too many requests. Please wait before trying again',
  },

  // Validation Errors
  VALIDATION: {
    FUTURE_DATE_REQUIRED: 'Date must be in the future',
    PAST_DATE_REQUIRED: 'Date must be in the past',
    INVALID_RANGE: (min: number, max: number) => `Value must be between ${min} and ${max}`,
    PATTERN_MISMATCH: (pattern: string) => `Format must match: ${pattern}`,
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
      break;
    case 'custom':
      return issue.message;
    default:
      return issue.message;
  }
  
  return 'Invalid input. Please check and try again.';
}
```

## Form Component Implementation

### Enhanced Form Hook
```typescript
// Enhanced form hook with comprehensive validation
export function useValidatedForm<T extends z.ZodTypeAny>(
  schema: T,
  options?: {
    mode?: 'onBlur' | 'onChange' | 'onSubmit';
    reValidateMode?: 'onBlur' | 'onChange';
    defaultValues?: z.infer<T>;
    onSubmit?: (data: z.infer<T>) => Promise<void> | void;
  }
) {
  const form = useForm<z.infer<T>>({
    resolver: zodResolver(schema),
    mode: options?.mode || 'onBlur',
    reValidateMode: options?.reValidateMode || 'onChange',
    defaultValues: options?.defaultValues,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!options?.onSubmit) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      await options.onSubmit(data);
    } catch (error) {
      setSubmitError(
        error instanceof Error 
          ? error.message 
          : 'An unexpected error occurred'
      );
    } finally {
      setIsSubmitting(false);
    }
  });

  // Real-time validation helper with proper typing
  const validateField = useCallback(async (fieldName: keyof z.infer<T>, value: any) => {
    try {
      const fieldSchema = (schema as any).shape[fieldName];
      await fieldSchema.parseAsync(value);
      form.clearErrors(fieldName);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        form.setError(fieldName, {
          type: 'validation',
          message: formatErrorMessage(error, String(fieldName))
        });
      }
      return false;
    }
  }, [schema, form]);

  return {
    ...form,
    handleSubmit,
    isSubmitting,
    submitError,
    validateField,
    clearSubmitError: () => setSubmitError(null),
  };
}
```

### Validated Input Components
```typescript
// Enhanced input component with validation
interface ValidatedTextFieldProps {
  name: string;
  label: string;
  control: Control<any>;
  error?: FieldError;
  helperText?: string;
  required?: boolean;
  type?: string;
  multiline?: boolean;
  rows?: number;
  testId?: string;
  maxLength?: number;
  showCharCount?: boolean;
  debounceMs?: number;
}

export function ValidatedTextField({
  name,
  label,
  control,
  error,
  helperText,
  required = false,
  type = 'text',
  multiline = false,
  rows,
  testId,
  maxLength,
  showCharCount = false,
  debounceMs = 300,
  ...props
}: ValidatedTextFieldProps) {
  const [value, setValue] = useState('');
  const [charCount, setCharCount] = useState(0);

  // Use useMemo for debounced validation to prevent recreation
  const debouncedValidation = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (val: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        control._trigger(name);
      }, debounceMs);
    };
  }, [control, name, debounceMs]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Box>
          <TextField
            {...field}
            {...props}
            label={label}
            type={type}
            multiline={multiline}
            rows={rows}
            error={!!error}
            helperText={error?.message || helperText}
            required={required}
            fullWidth
            margin="normal"
            data-testid={testId || `cs-form-${name}`}
            inputProps={{
              maxLength,
              'aria-describedby': error ? `${name}-error` : undefined,
              'aria-invalid': !!error,
            }}
            onChange={(e) => {
              const newValue = e.target.value;
              field.onChange(newValue);
              setValue(newValue);
              setCharCount(newValue.length);
              debouncedValidation(newValue);
            }}
            InputProps={{
              endAdornment: showCharCount && maxLength && (
                <InputAdornment position="end">
                  <Typography
                    variant="caption"
                    color={charCount > maxLength * 0.9 ? 'error' : 'textSecondary'}
                  >
                    {charCount}/{maxLength}
                  </Typography>
                </InputAdornment>
              ),
            }}
          />
          {error && (
            <FormHelperText
              id={`${name}-error`}
              error
              component="div"
              role="alert"
              aria-live="polite"
            >
              {error.message}
            </FormHelperText>
          )}
        </Box>
      )}
    />
  );
}

// Enhanced select component with validation
interface ValidatedSelectProps {
  name: string;
  label: string;
  control: Control<any>;
  error?: FieldError;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  required?: boolean;
  testId?: string;
  placeholder?: string;
}

export function ValidatedSelect({
  name,
  label,
  control,
  error,
  options,
  required = false,
  testId,
  placeholder = 'Select an option...',
}: ValidatedSelectProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <FormControl 
          fullWidth 
          margin="normal" 
          error={!!error}
          required={required}
        >
          <InputLabel>{label}</InputLabel>
          <Select
            {...field}
            label={label}
            data-testid={testId || `cs-form-${name}`}
            displayEmpty
            aria-describedby={error ? `${name}-error` : undefined}
            aria-invalid={!!error}
          >
            <MenuItem value="" disabled>
              <em>{placeholder}</em>
            </MenuItem>
            {options.map((option) => (
              <MenuItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                data-testid={`cs-option-${option.value}`}
              >
                {option.label}
              </MenuItem>
            ))}
          </Select>
          {error && (
            <FormHelperText
              id={`${name}-error`}
              error
              component="div"
              role="alert"
              aria-live="polite"
            >
              {error.message}
            </FormHelperText>
          )}
        </FormControl>
      )}
    />
  );
}
```

## Security and Sanitization

### Input Sanitization
```typescript
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
};
```

## Performance Optimization

### Debounced Validation
```typescript
// Debounced validation hook for real-time feedback
export function useDebouncedValidation<T>(
  schema: z.ZodSchema<T>,
  value: T,
  delay: number = 300
) {
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const debouncedValidate = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return async (val: T) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(async () => {
        setIsValidating(true);
        try {
          await schema.parseAsync(val);
          setValidationError(null);
        } catch (error) {
          if (error instanceof z.ZodError) {
            setValidationError(formatErrorMessage(error));
          }
        } finally {
          setIsValidating(false);
        }
      }, delay);
    };
  }, [schema, delay]);

  useEffect(() => {
    if (value !== undefined && value !== null) {
      debouncedValidate(value);
    }
  }, [value, debouncedValidate]);

  return { isValidating, validationError };
}
```

This comprehensive validation framework ensures data integrity, security, and excellent user experience across all forms in the AI in QA Demo Application while providing clear, actionable feedback to users.