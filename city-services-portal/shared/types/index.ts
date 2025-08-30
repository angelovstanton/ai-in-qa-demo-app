/**
 * Shared TypeScript Type Definitions
 * Central location for all shared types between API and UI
 * Following DRY principle and ensuring type consistency
 */

// User Types
export type UserRole = 'CITIZEN' | 'CLERK' | 'FIELD_AGENT' | 'SUPERVISOR' | 'ADMIN';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  emailConfirmed: boolean;
  isActive: boolean;
  firstName?: string;
  lastName?: string;
  phone?: string;
  alternatePhone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  preferredLanguage?: string;
  communicationMethod?: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  serviceUpdates: boolean;
  twoFactorEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

// Service Request Types
export type ServiceRequestStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'TRIAGED'
  | 'IN_REVIEW'
  | 'APPROVED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'CLOSED';

export type ServiceRequestPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface ServiceRequest {
  id: string;
  code: string;
  title: string;
  description: string;
  category: string;
  priority: ServiceRequestPriority;
  status: ServiceRequestStatus;
  dateOfRequest: string;
  streetAddress?: string;
  city?: string;
  postalCode?: string;
  locationText: string;
  landmark?: string;
  accessInstructions?: string;
  lat?: number;
  lng?: number;
  contactMethod?: string;
  email?: string;
  phone?: string;
  alternatePhone?: string;
  bestTimeToContact?: string;
  mailingStreetAddress?: string;
  mailingCity?: string;
  mailingPostalCode?: string;
  issueType?: string;
  severity?: number;
  isRecurring: boolean;
  isEmergency: boolean;
  hasPermits: boolean;
  affectedServices?: string;
  estimatedValue?: number;
  additionalContacts?: string;
  satisfactionRating?: number;
  formComments?: string;
  agreesToTerms: boolean;
  wantsUpdates: boolean;
  preferredDate?: string;
  preferredTime?: string;
  createdBy: string;
  assignedTo?: string;
  departmentId?: string;
  version: number;
  slaDueAt?: string;
  closedAt?: string;
  reopenUntil?: string;
  createdAt: string;
  updatedAt: string;
}

// Department Types
export interface Department {
  id: string;
  name: string;
  slug: string;
}

// Comment Types
export type CommentVisibility = 'PUBLIC' | 'INTERNAL';

export interface Comment {
  id: string;
  requestId: string;
  authorId: string;
  body: string;
  visibility: CommentVisibility;
  createdAt: string;
  author?: User;
}

// Attachment Types
export interface Attachment {
  id: string;
  requestId: string;
  uploadedById: string;
  filename: string;
  mime: string;
  size: number;
  url?: string;
  createdAt: string;
  uploadedBy?: User;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  correlationId: string;
  pagination?: PaginationMeta;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  correlationId?: string;
  details?: any;
}

// Form Types
export interface FormField<T = any> {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'select' | 'checkbox' | 'radio' | 'textarea' | 'date' | 'time';
  value?: T;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  helperText?: string;
  error?: string;
  options?: SelectOption[];
  validation?: FormValidation;
}

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
}

export interface FormValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | undefined;
}

// Dashboard Types
export interface DashboardStats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  avgResolutionTime: number;
  satisfactionScore: number;
  requestsByStatus: Record<ServiceRequestStatus, number>;
  requestsByPriority: Record<ServiceRequestPriority, number>;
  requestsTrend: TrendData[];
}

export interface TrendData {
  date: string;
  value: number;
  label?: string;
}

// Supervisor Types
export interface QualityReview {
  id: string;
  requestId: string;
  reviewerId: string;
  qualityScore: number;
  communicationScore: number;
  technicalAccuracyScore: number;
  timelinessScore: number;
  citizenSatisfactionScore: number;
  improvementSuggestions?: string;
  followUpRequired: boolean;
  calibrationSession?: string;
  reviewStatus: 'PENDING' | 'COMPLETED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  request?: ServiceRequest;
  reviewer?: User;
}

export interface StaffPerformance {
  id: string;
  userId: string;
  departmentId: string;
  performancePeriod: string;
  averageHandlingTime: number;
  completedRequests: number;
  qualityScore?: number;
  citizenSatisfactionRating?: number;
  overtimeHours: number;
  productivityScore?: number;
  goalsAchieved: number;
  goalsMissed: number;
  trainingHoursCompleted: number;
  createdAt: string;
  updatedAt: string;
  user?: User;
  department?: Department;
}

export interface WorkloadAssignment {
  id: string;
  requestId: string;
  assignedFrom?: string;
  assignedTo: string;
  assignedBy: string;
  assignmentReason?: string;
  workloadScore?: number;
  estimatedEffort?: number;
  skillsRequired?: string;
  priorityWeight?: number;
  isActive: boolean;
  completedAt?: string;
  createdAt: string;
  request?: ServiceRequest;
  assignedUser?: User;
  supervisor?: User;
  previousUser?: User;
}

export interface PerformanceGoal {
  id: string;
  userId: string;
  supervisorId: string;
  title: string;
  description: string;
  targetValue?: number;
  currentValue?: number;
  unit?: string;
  dueDate: string;
  status: 'ACTIVE' | 'ACHIEVED' | 'MISSED' | 'CANCELLED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  user?: User;
  supervisor?: User;
}

// Field Agent Types
export type FieldWorkOrderStatus = 
  | 'ASSIGNED'
  | 'EN_ROUTE'
  | 'ON_SITE'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export type FieldWorkOrderPriority = 'EMERGENCY' | 'HIGH' | 'NORMAL' | 'LOW';

export interface FieldWorkOrder {
  id: string;
  requestId: string;
  assignedAgentId: string;
  supervisorId?: string;
  priority: FieldWorkOrderPriority;
  gpsLat?: number;
  gpsLng?: number;
  gpsAccuracy?: number;
  navigationLink?: string;
  estimatedTravelTime?: number;
  optimalRoute?: string;
  taskType: string;
  estimatedDuration: number;
  requiredSkills?: string;
  requiredTools?: string;
  safetyNotes?: string;
  status: FieldWorkOrderStatus;
  checkInTime?: string;
  checkOutTime?: string;
  actualDuration?: number;
  completionNotes?: string;
  citizenSignature?: string;
  followUpRequired: boolean;
  nextVisitScheduled?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  request?: ServiceRequest;
  assignedAgent?: User;
  supervisor?: User;
}

// Feature Flags
export interface FeatureFlag {
  key: string;
  enabled: boolean;
  description?: string;
  metadata?: Record<string, any>;
}

// WebSocket Events
export interface WebSocketEvent {
  type: string;
  payload: any;
  timestamp: string;
  userId?: string;
  correlationId?: string;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

// Search and Filter Types
export interface SearchParams {
  query?: string;
  filters?: Record<string, any>;
  sort?: SortParams;
  pagination?: PaginationParams;
}

export interface SortParams {
  field: string;
  order: 'asc' | 'desc';
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

// Validation Error Types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Export type guards
export const isUserRole = (value: any): value is UserRole => {
  return ['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN'].includes(value);
};

export const isServiceRequestStatus = (value: any): value is ServiceRequestStatus => {
  return [
    'DRAFT', 'SUBMITTED', 'TRIAGED', 'IN_REVIEW', 'APPROVED',
    'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CANCELLED', 'CLOSED'
  ].includes(value);
};

export const isServiceRequestPriority = (value: any): value is ServiceRequestPriority => {
  return ['LOW', 'MEDIUM', 'HIGH', 'URGENT'].includes(value);
};