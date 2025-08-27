import { z } from 'zod';
import { 
  ValidationPatterns, 
  ServiceRequestPatterns, 
  RegistrationPatterns,
  CommentPatterns,
  FilePatterns,
  SearchPatterns 
} from '../utils/validation';

/**
 * Comprehensive form validation schemas for the AI in QA Demo Application
 * Each schema includes all necessary validation rules, cross-field validation,
 * and security measures for their respective forms.
 */

// User Registration Form Schema
export const registrationSchema = z.object({
  // Personal Information
  firstName: ValidationPatterns.name,
  lastName: ValidationPatterns.name,
  email: ValidationPatterns.email,

  // Password Requirements with confirmation
  password: ValidationPatterns.password,
  confirmPassword: z.string().min(1, 'Please confirm your password'),

  // Contact Information
  phone: ValidationPatterns.phone,
  alternatePhone: z.string().optional().refine((val) => {
    // If empty or undefined, it's valid (optional)
    if (!val || val.trim().length === 0) return true;
    // If provided, must match phone pattern
    return /^[\+]?[1-9][\d]{9,14}$/.test(val) && val.length >= 10 && val.length <= 15;
  }, {
    message: 'Please enter a valid phone number (10-15 digits, optional + prefix)'
  }),

  // Address Information
  streetAddress: ValidationPatterns.streetAddress,
  city: ValidationPatterns.city,
  state: ValidationPatterns.state,
  postalCode: ValidationPatterns.postalCode,
  country: ValidationPatterns.country,

  // Communication Preferences
  preferredLanguage: RegistrationPatterns.preferredLanguage,
  communicationMethod: RegistrationPatterns.communicationMethod,

  // Account Type
  accountType: RegistrationPatterns.accountType,
  businessName: ValidationPatterns.businessName.optional(),

  // Legal Agreements
  agreesToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the Terms and Conditions'),
  agreesToPrivacy: z.boolean()
    .refine(val => val === true, 'You must agree to the Privacy Policy'),

  // Marketing Preferences
  marketingEmails: z.boolean().default(false),
  serviceUpdates: z.boolean().default(true),

  // Security Questions (optional)
  securityQuestion: RegistrationPatterns.securityQuestion,
  securityAnswer: RegistrationPatterns.securityAnswer,

}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  // Business accounts require business name
  if (data.accountType === 'BUSINESS') {
    return data.businessName && data.businessName.trim().length > 0;
  }
  return true;
}, {
  message: "Business name is required for business accounts",
  path: ["businessName"],
}).refine((data) => {
  // Security answer required if question provided
  if (data.securityQuestion) {
    return data.securityAnswer && data.securityAnswer.trim().length > 0;
  }
  return true;
}, {
  message: "Security answer is required when security question is provided",
  path: ["securityAnswer"],
}).refine((data) => {
  // Business email validation for business accounts
  if (data.accountType === 'BUSINESS') {
    const businessDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com'];
    const domain = data.email.split('@')[1]?.toLowerCase();
    return domain ? !businessDomains.includes(domain) : false;
  }
  return true;
}, {
  message: "Business accounts require a business email address",
  path: ["email"],
});

export type RegistrationFormData = z.infer<typeof registrationSchema>;

// Login Form Schema
export const loginSchema = z.object({
  email: ValidationPatterns.email,
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password is too long'),
  rememberMe: z.boolean().optional(),
  captcha: z.string()
    .min(1, 'Please complete the captcha')
    .optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Service Request Creation Schema
export const serviceRequestSchema = z.object({
  // Basic Information
  title: ServiceRequestPatterns.title,
  description: ServiceRequestPatterns.description,
  category: ServiceRequestPatterns.category,
  priority: ServiceRequestPatterns.priority,
  
  // Date of Request - new field with validation
  dateOfRequest: ServiceRequestPatterns.dateOfRequest,

  // Location Information (address fields are optional, can be used for mailing)
  streetAddress: ValidationPatterns.streetAddress.optional(),
  city: ValidationPatterns.city.optional(),
  postalCode: ValidationPatterns.postalCode.optional(),
  locationText: ServiceRequestPatterns.locationText,
  
  landmark: z.string()
    .max(100, 'Landmark description is too long')
    .optional(),
  
  accessInstructions: z.string()
    .max(300, 'Access instructions are too long')
    .optional(),

  // Contact Information
  contactMethod: ServiceRequestPatterns.contactMethod,
  email: ValidationPatterns.email.optional(),
  phone: ValidationPatterns.phone.optional(),
  alternatePhone: z.string().optional().refine((val) => {
    // If empty or undefined, it's valid (optional)
    if (!val || val.trim().length === 0) return true;
    // If provided, must match phone pattern
    return /^[\+]?[1-9][\d]{9,14}$/.test(val) && val.length >= 10 && val.length <= 15;
  }, {
    message: 'Please enter a valid phone number (10-15 digits, optional + prefix)'
  }),
  bestTimeToContact: z.string()
    .max(100, 'Best time to contact description is too long')
    .optional(),
  
  // Mailing Address (separate from location address)
  mailingStreetAddress: ValidationPatterns.streetAddress.optional(),
  mailingCity: ValidationPatterns.city.optional(),
  mailingPostalCode: ValidationPatterns.postalCode.optional(),

  // Issue Details
  issueType: z.string().optional(),
  severity: ServiceRequestPatterns.severity,
  isRecurring: z.boolean().default(false),
  isEmergency: z.boolean().default(false),
  hasPermits: z.boolean().default(false),

  // Service Impact
  affectedServices: z.array(z.string())
    .max(10, 'Too many affected services selected')
    .default([])
    .optional(),

  estimatedValue: ServiceRequestPatterns.estimatedValue,

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

  // File Attachments (completely optional)
  attachments: z.array(FilePatterns.attachment)
    .max(5, 'Maximum 5 file attachments allowed')
    .optional()
    .default([]),

  // User Experience
  satisfactionRating: z.number()
    .min(1, 'Rating must be between 1 and 5')
    .max(5, 'Rating must be between 1 and 5')
    .optional(),

  comments: z.string()
    .max(1000, 'Comments must be less than 1000 characters')
    .optional()
    .transform((val) => val ? ValidationPatterns.safeText.parse(val) : val),

  // Legal and Preferences
  agreesToTerms: z.boolean()
    .refine(val => val === true, 'You must agree to the terms and conditions'),
  
  wantsUpdates: z.boolean().default(true),

  // Scheduled Service (if applicable)
  preferredDate: ValidationPatterns.futureDate.optional(),
  preferredTime: z.string().optional(),

}).refine((data) => {
  // Emergency requests require alternate phone number
  if (data.isEmergency) {
    return data.alternatePhone && data.alternatePhone.trim().length > 0;
  }
  return true;
}, {
  message: "Emergency requests require alternate phone number",
  path: ["alternatePhone"],
}).refine((data) => {
  // Email is required when EMAIL contact method is selected
  if (data.contactMethod === 'EMAIL' || !data.contactMethod) {
    return data.email && data.email.trim().length > 0;
  }
  return true;
}, {
  message: "Email address is required for email contact method",
  path: ["email"],
}).refine((data) => {
  // Phone is required when PHONE or SMS contact method is selected
  if (data.contactMethod === 'PHONE' || data.contactMethod === 'SMS') {
    return data.phone && data.phone.trim().length > 0;
  }
  return true;
}, {
  message: "Phone number is required for phone/SMS contact method",
  path: ["phone"],
}).refine((data) => {
  // Scheduled service requires both date and time
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
}).refine((data) => {
  // Emergency requests require higher priority
  if (data.isEmergency) {
    return ['HIGH', 'URGENT'].includes(data.priority);
  }
  return true;
}, {
  message: "Emergency requests must have HIGH or URGENT priority",
  path: ["priority"],
});

export type ServiceRequestFormData = z.infer<typeof serviceRequestSchema>;

// Comment/Feedback Schema
export const commentSchema = z.object({
  content: CommentPatterns.content,
  isPrivate: z.boolean().default(false),
  rating: CommentPatterns.rating,
  category: CommentPatterns.category,
  
  attachments: z.array(z.object({
    file: z.instanceof(File),
    name: z.string().min(1, 'File name is required'),
    size: ValidationPatterns.fileSize(5), // 5MB max for comments
    type: z.string().refine(
      (type) => ['image/jpeg', 'image/png', 'application/pdf'].includes(type),
      'Only JPEG, PNG, and PDF files are allowed for comments'
    )
  })).max(3, 'Maximum 3 file attachments allowed for comments'),

  // Follow-up preferences
  wantsFollowUp: z.boolean().default(false),
  followUpMethod: z.enum(['EMAIL', 'PHONE', 'SMS'], {
    errorMap: () => ({ message: 'Please select a follow-up method' })
  }).optional(),

}).refine((data) => {
  // Follow-up method required if follow-up requested
  if (data.wantsFollowUp) {
    return data.followUpMethod !== undefined;
  }
  return true;
}, {
  message: "Follow-up method is required when requesting follow-up",
  path: ["followUpMethod"],
});

export type CommentFormData = z.infer<typeof commentSchema>;

// Search and Filter Schema
export const searchFilterSchema = z.object({
  searchTerm: SearchPatterns.searchTerm,
  category: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  
  dateFrom: ValidationPatterns.date.optional(),
  dateTo: ValidationPatterns.date.optional(),
  
  sortBy: SearchPatterns.sortBy,
  sortOrder: SearchPatterns.sortOrder,
  
  page: SearchPatterns.page,
  limit: SearchPatterns.limit,

  // Advanced filters
  createdBy: z.string().optional(),
  assignedTo: z.string().optional(),
  department: z.string().optional(),
  
  minEstimatedValue: z.number().min(0, 'Minimum value cannot be negative').optional(),
  maxEstimatedValue: z.number().min(0, 'Maximum value cannot be negative').optional(),
  
  isEmergency: z.boolean().optional(),
  hasAttachments: z.boolean().optional(),

}).refine((data) => {
  // Date range validation
  if (data.dateFrom && data.dateTo) {
    return data.dateFrom <= data.dateTo;
  }
  return true;
}, {
  message: "Start date must be before or equal to end date",
  path: ["dateTo"],
}).refine((data) => {
  // Value range validation
  if (data.minEstimatedValue && data.maxEstimatedValue) {
    return data.minEstimatedValue <= data.maxEstimatedValue;
  }
  return true;
}, {
  message: "Minimum value must be less than or equal to maximum value",
  path: ["maxEstimatedValue"],
});

export type SearchFilterData = z.infer<typeof searchFilterSchema>;

// Profile Update Schema - only includes fields actually rendered in the form
export const profileUpdateSchema = z.object({
  // Personal Information (required)
  firstName: ValidationPatterns.name,
  lastName: ValidationPatterns.name,
  
  // Contact Information (optional)
  phone: ValidationPatterns.phone.optional(),
  alternatePhone: z.string().optional().refine((val) => {
    // If empty or undefined, it's valid (optional)
    if (!val || val.trim().length === 0) return true;
    // If provided, must match phone pattern
    return /^[\+]?[1-9][\d]{9,14}$/.test(val) && val.length >= 10 && val.length <= 15;
  }, {
    message: 'Please enter a valid phone number (10-15 digits, optional + prefix)'
  }),
  
  // Address Information (optional)
  streetAddress: ValidationPatterns.streetAddress.optional(),
  city: ValidationPatterns.city.optional(),
  state: ValidationPatterns.state.optional(),
  postalCode: ValidationPatterns.postalCode.optional(),
  country: ValidationPatterns.country.optional(),
  
  // Notification Preferences (only the ones rendered in the form)
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  marketingEmails: z.boolean().default(false),
  serviceUpdates: z.boolean().default(true),
});

export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>;

// Password Change Schema
export const passwordChangeSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required'),
  
  newPassword: ValidationPatterns.password,
  
  confirmNewPassword: z.string()
    .min(1, 'Please confirm your new password'),

}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "New passwords don't match",
  path: ["confirmNewPassword"],
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: "New password must be different from current password",
  path: ["newPassword"],
});

export type PasswordChangeData = z.infer<typeof passwordChangeSchema>;

// File Upload Schema
export const fileUploadSchema = z.object({
  files: z.array(FilePatterns.attachment)
    .min(1, 'At least one file is required')
    .max(10, 'Maximum 10 files allowed'),
  
  description: z.string()
    .max(500, 'Description is too long')
    .optional(),
  
  category: z.enum(['EVIDENCE', 'DOCUMENTATION', 'REFERENCE', 'OTHER'], {
    errorMap: () => ({ message: 'Please select a file category' })
  }),
  
  isPublic: z.boolean().default(false),

}).refine((data) => {
  // Check total file size doesn't exceed 50MB
  const totalSize = data.files.reduce((sum, file) => sum + file.size, 0);
  return totalSize <= 50 * 1024 * 1024;
}, {
  message: "Total file size cannot exceed 50MB",
  path: ["files"],
});

export type FileUploadData = z.infer<typeof fileUploadSchema>;

// Contact Form Schema (for general inquiries)
export const contactFormSchema = z.object({
  name: ValidationPatterns.name,
  email: ValidationPatterns.email,
  phone: ValidationPatterns.phone.optional(),
  
  subject: z.string()
    .min(5, 'Subject must be at least 5 characters')
    .max(100, 'Subject is too long'),
  
  message: z.string()
    .min(20, 'Message must be at least 20 characters')
    .max(2000, 'Message is too long')
    .transform((msg) => ValidationPatterns.safeText.parse(msg)),
  
  category: z.enum(['GENERAL', 'TECHNICAL', 'BILLING', 'COMPLAINT', 'SUGGESTION'], {
    errorMap: () => ({ message: 'Please select a category' })
  }),
  
  urgency: z.enum(['LOW', 'MEDIUM', 'HIGH'], {
    errorMap: () => ({ message: 'Please select urgency level' })
  }),
  
  preferredResponse: z.enum(['EMAIL', 'PHONE', 'NONE'], {
    errorMap: () => ({ message: 'Please select preferred response method' })
  }),
  
  attachments: z.array(FilePatterns.attachment)
    .max(3, 'Maximum 3 attachments allowed'),

}).refine((data) => {
  // Phone required for phone response preference
  if (data.preferredResponse === 'PHONE') {
    return data.phone && data.phone.trim().length > 0;
  }
  return true;
}, {
  message: "Phone number is required for phone response",
  path: ["phone"],
});

export type ContactFormData = z.infer<typeof contactFormSchema>;

// Admin Settings Schema
export const adminSettingsSchema = z.object({
  // Feature Flags
  featureFlags: z.record(z.boolean()),
  
  // System Settings
  maintenanceMode: z.boolean().default(false),
  registrationEnabled: z.boolean().default(true),
  maxFileSize: z.number().min(1, 'Max file size must be at least 1MB').max(100, 'Max file size cannot exceed 100MB'),
  maxFilesPerRequest: z.number().min(1).max(20),
  
  // Rate Limiting
  maxLoginAttempts: z.number().min(3).max(10),
  rateLimitWindow: z.number().min(60).max(3600), // seconds
  
  // Email Settings
  emailNotificationsEnabled: z.boolean().default(true),
  smtpHost: z.string().min(1, 'SMTP host is required').optional(),
  smtpPort: z.number().min(1).max(65535).optional(),
  
  // Backup Settings
  backupFrequency: z.enum(['DAILY', 'WEEKLY', 'MONTHLY'], {
    errorMap: () => ({ message: 'Please select backup frequency' })
  }),
  
  retentionDays: z.number().min(30).max(2555), // 30 days to 7 years

}).refine((data) => {
  // SMTP settings validation
  if (data.emailNotificationsEnabled) {
    return data.smtpHost && data.smtpPort;
  }
  return true;
}, {
  message: "SMTP configuration is required when email notifications are enabled",
  path: ["smtpHost"],
});

export type AdminSettingsData = z.infer<typeof adminSettingsSchema>;

// Export all schemas for easy importing
export const FormSchemas = {
  registration: registrationSchema,
  login: loginSchema,
  serviceRequest: serviceRequestSchema,
  comment: commentSchema,
  searchFilter: searchFilterSchema,
  profileUpdate: profileUpdateSchema,
  passwordChange: passwordChangeSchema,
  fileUpload: fileUploadSchema,
  contactForm: contactFormSchema,
  adminSettings: adminSettingsSchema,
};

// Test IDs for form validation elements
export const FormValidationTestIds = {
  // Error messages
  FIELD_ERROR: (formName: string, fieldName: string) => `cs-${formName}-error-${fieldName}`,
  FORM_ERROR: (formName: string) => `cs-${formName}-form-error`,
  FORM_SUCCESS: (formName: string) => `cs-${formName}-form-success`,
  
  // Character counts
  CHAR_COUNT: (formName: string, fieldName: string) => `cs-${formName}-char-count-${fieldName}`,
  
  // Password strength
  PASSWORD_STRENGTH: (formName: string) => `cs-${formName}-password-strength`,
  
  // File upload
  FILE_UPLOAD_ERROR: (formName: string) => `cs-${formName}-file-error`,
  FILE_UPLOAD_PROGRESS: (formName: string) => `cs-${formName}-file-progress`,
  
  // Loading states
  VALIDATION_LOADING: (formName: string, fieldName: string) => `cs-${formName}-validating-${fieldName}`,
  FORM_SUBMITTING: (formName: string) => `cs-${formName}-submitting`,
  
  // Cross-field validation
  CROSS_FIELD_ERROR: (formName: string) => `cs-${formName}-cross-field-error`,
};