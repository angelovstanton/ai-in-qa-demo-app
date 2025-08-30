/**
 * Shared Validation Schemas
 * Centralized Zod schemas for consistent validation across API and UI
 * Following DRY principle and ensuring data integrity
 */

import { z } from 'zod';

// Common validation patterns
const emailSchema = z.string().email('Invalid email address').toLowerCase();
const phoneSchema = z.string().regex(/^[\d\s\-\+\(\)]+$/, 'Invalid phone number');
const postalCodeSchema = z.string().regex(/^[\dA-Za-z\s\-]+$/, 'Invalid postal code');
const uuidSchema = z.string().uuid('Invalid ID format');

// User validation schemas
export const userRoleSchema = z.enum(['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']);

export const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  email: emailSchema,
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  role: userRoleSchema,
  departmentId: uuidSchema.optional(),
  firstName: z.string().max(50).optional(),
  lastName: z.string().max(50).optional(),
  phone: phoneSchema.optional(),
  alternatePhone: phoneSchema.optional(),
  streetAddress: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(50).optional(),
  postalCode: postalCodeSchema.optional(),
  country: z.string().max(100).optional(),
  preferredLanguage: z.enum(['EN', 'ES', 'FR', 'ZH', 'AR']).optional(),
  communicationMethod: z.enum(['EMAIL', 'PHONE', 'SMS']).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  marketingEmails: z.boolean().optional(),
  serviceUpdates: z.boolean().optional()
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true });

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// Service Request validation schemas
export const serviceRequestStatusSchema = z.enum([
  'DRAFT', 'SUBMITTED', 'TRIAGED', 'IN_REVIEW', 'APPROVED',
  'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELLED', 'CLOSED'
]);

export const serviceRequestPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const createServiceRequestSchema = z.object({
  title: z.string()
    .min(5, 'Title must be at least 5 characters')
    .max(200, 'Title must be less than 200 characters'),
  description: z.string()
    .min(10, 'Description must be at least 10 characters')
    .max(2000, 'Description must be less than 2000 characters'),
  category: z.string().min(1, 'Category is required'),
  priority: serviceRequestPrioritySchema.default('MEDIUM'),
  dateOfRequest: z.string().datetime(),
  
  // Location fields
  streetAddress: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postalCode: postalCodeSchema.optional(),
  locationText: z.string().min(1, 'Location description is required').max(500),
  landmark: z.string().max(200).optional(),
  accessInstructions: z.string().max(500).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  
  // Contact fields
  contactMethod: z.enum(['EMAIL', 'PHONE', 'SMS']).optional(),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  alternatePhone: phoneSchema.optional(),
  bestTimeToContact: z.string().max(100).optional(),
  
  // Mailing address
  mailingStreetAddress: z.string().max(200).optional(),
  mailingCity: z.string().max(100).optional(),
  mailingPostalCode: postalCodeSchema.optional(),
  
  // Issue details
  issueType: z.string().max(100).optional(),
  severity: z.number().min(1).max(10).optional(),
  isRecurring: z.boolean().default(false),
  isEmergency: z.boolean().default(false),
  hasPermits: z.boolean().default(false),
  
  // Service impact
  affectedServices: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  
  // Additional contacts
  additionalContacts: z.string().optional(),
  
  // User experience
  satisfactionRating: z.number().min(1).max(5).optional(),
  formComments: z.string().max(1000).optional(),
  
  // Legal and preferences
  agreesToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms and conditions'
  }),
  wantsUpdates: z.boolean().default(true),
  
  // Scheduled service
  preferredDate: z.string().datetime().optional(),
  preferredTime: z.string().max(50).optional()
});

export const updateServiceRequestSchema = createServiceRequestSchema.partial();

export const updateServiceRequestStatusSchema = z.object({
  status: serviceRequestStatusSchema,
  notes: z.string().max(500).optional()
});

// Comment validation schemas
export const createCommentSchema = z.object({
  body: z.string()
    .min(1, 'Comment cannot be empty')
    .max(1000, 'Comment must be less than 1000 characters'),
  visibility: z.enum(['PUBLIC', 'INTERNAL']).default('PUBLIC')
});

// Quality Review validation schemas
export const createQualityReviewSchema = z.object({
  requestId: uuidSchema,
  qualityScore: z.number().min(1).max(10),
  communicationScore: z.number().min(1).max(10),
  technicalAccuracyScore: z.number().min(1).max(10),
  timelinessScore: z.number().min(1).max(10),
  citizenSatisfactionScore: z.number().min(1).max(10),
  improvementSuggestions: z.string().max(1000).optional(),
  followUpRequired: z.boolean().default(false),
  calibrationSession: z.string().max(100).optional()
});

export const updateQualityReviewSchema = createQualityReviewSchema.partial();

// Workload Assignment validation schemas
export const createWorkloadAssignmentSchema = z.object({
  requestId: uuidSchema,
  assignedFrom: uuidSchema.optional(),
  assignedTo: uuidSchema,
  assignmentReason: z.string().max(500).optional(),
  workloadScore: z.number().min(0).max(100).optional(),
  estimatedEffort: z.number().positive().optional(),
  skillsRequired: z.string().optional(),
  priorityWeight: z.number().min(0).max(10).optional()
});

// Performance Goal validation schemas
export const createPerformanceGoalSchema = z.object({
  userId: uuidSchema,
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(1000),
  targetValue: z.number().optional(),
  unit: z.string().max(50).optional(),
  dueDate: z.string().datetime(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM')
});

export const updatePerformanceGoalSchema = createPerformanceGoalSchema.partial().extend({
  currentValue: z.number().optional(),
  status: z.enum(['ACTIVE', 'ACHIEVED', 'MISSED', 'CANCELLED']).optional()
});

// Field Work Order validation schemas
export const fieldWorkOrderStatusSchema = z.enum([
  'ASSIGNED', 'EN_ROUTE', 'ON_SITE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
]);

export const fieldWorkOrderPrioritySchema = z.enum(['EMERGENCY', 'HIGH', 'NORMAL', 'LOW']);

export const createFieldWorkOrderSchema = z.object({
  requestId: uuidSchema,
  assignedAgentId: uuidSchema,
  supervisorId: uuidSchema.optional(),
  priority: fieldWorkOrderPrioritySchema.default('NORMAL'),
  gpsLat: z.number().min(-90).max(90).optional(),
  gpsLng: z.number().min(-180).max(180).optional(),
  gpsAccuracy: z.number().positive().optional(),
  navigationLink: z.string().url().optional(),
  estimatedTravelTime: z.number().positive().optional(),
  optimalRoute: z.string().optional(),
  taskType: z.string().min(1).max(100),
  estimatedDuration: z.number().positive(),
  requiredSkills: z.string().optional(),
  requiredTools: z.string().optional(),
  safetyNotes: z.string().max(500).optional()
});

export const updateFieldWorkOrderSchema = createFieldWorkOrderSchema.partial().extend({
  status: fieldWorkOrderStatusSchema.optional(),
  checkInTime: z.string().datetime().optional(),
  checkOutTime: z.string().datetime().optional(),
  actualDuration: z.number().positive().optional(),
  completionNotes: z.string().max(1000).optional(),
  citizenSignature: z.string().optional(),
  followUpRequired: z.boolean().optional(),
  nextVisitScheduled: z.string().datetime().optional()
});

// Search and filter validation schemas
export const searchParamsSchema = z.object({
  query: z.string().max(200).optional(),
  filters: z.record(z.any()).optional(),
  sort: z.object({
    field: z.string(),
    order: z.enum(['asc', 'desc'])
  }).optional(),
  pagination: z.object({
    page: z.number().positive().default(1),
    pageSize: z.number().positive().max(100).default(10)
  }).optional()
});

// File upload validation
export const fileUploadSchema = z.object({
  filename: z.string().min(1).max(255),
  mime: z.string().regex(/^[\w\-]+\/[\w\-]+$/),
  size: z.number().positive().max(10 * 1024 * 1024), // 10MB max
  data: z.instanceof(Buffer).optional(),
  url: z.string().url().optional()
}).refine(data => data.data || data.url, {
  message: 'Either data or url must be provided'
});

// Batch operation validation
export const batchOperationSchema = z.object({
  ids: z.array(uuidSchema).min(1).max(100),
  operation: z.enum(['UPDATE', 'DELETE', 'ARCHIVE']),
  data: z.record(z.any()).optional()
});

// Export type inference helpers
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateServiceRequestInput = z.infer<typeof createServiceRequestSchema>;
export type UpdateServiceRequestInput = z.infer<typeof updateServiceRequestSchema>;
export type CreateCommentInput = z.infer<typeof createCommentSchema>;
export type CreateQualityReviewInput = z.infer<typeof createQualityReviewSchema>;
export type CreateWorkloadAssignmentInput = z.infer<typeof createWorkloadAssignmentSchema>;
export type CreatePerformanceGoalInput = z.infer<typeof createPerformanceGoalSchema>;
export type CreateFieldWorkOrderInput = z.infer<typeof createFieldWorkOrderSchema>;
export type SearchParamsInput = z.infer<typeof searchParamsSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;