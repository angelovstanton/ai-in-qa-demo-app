import { User } from '@prisma/client';

// Define UserStatus as a type since SQLite doesn't support enums
export type UserStatus = 
  | 'ACTIVE' 
  | 'INACTIVE' 
  | 'PENDING_EMAIL_VERIFICATION' 
  | 'PASSWORD_RESET_REQUIRED' 
  | 'SUSPENDED' 
  | 'ARCHIVED';

// ============================================================================
// User Types
// ============================================================================

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  emailConfirmed: boolean;
  departmentId?: string;
}

export interface UserProfile extends AuthenticatedUser {
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
  communicationMethod?: CommunicationMethod;
  emailNotifications: boolean;
  smsNotifications: boolean;
  marketingEmails: boolean;
  serviceUpdates: boolean;
  twoFactorEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'CITIZEN' | 'CLERK' | 'FIELD_AGENT' | 'SUPERVISOR' | 'ADMIN';
export type CommunicationMethod = 'EMAIL' | 'PHONE' | 'SMS';

// ============================================================================
// Authentication Types
// ============================================================================

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  captchaToken?: string;
}

export interface RegistrationData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  alternatePhone?: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  preferredLanguage?: string;
  communicationMethod?: CommunicationMethod;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  marketingEmails?: boolean;
  serviceUpdates?: boolean;
  securityQuestion?: string;
  securityAnswer?: string;
  agreesToTerms: boolean;
  agreesToPrivacy: boolean;
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
  status?: UserStatus;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
}

// ============================================================================
// Password Types
// ============================================================================

export interface PasswordResetRequest {
  email: string;
  captchaToken?: string;
}

export interface PasswordReset {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface PasswordStrength {
  score: number; // 0-100
  feedback: string[];
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumbers: boolean;
  hasSpecialChars: boolean;
  length: number;
  meetsRequirements: boolean;
}

// ============================================================================
// Email Types
// ============================================================================

export interface EmailVerification {
  token: string;
  userId: string;
  email: string;
  expiresAt: Date;
}

export interface EmailTemplate {
  subject: string;
  body: string;
  variables?: Record<string, any>;
}

export interface EmailSimulation {
  type: 'VERIFICATION' | 'PASSWORD_RESET' | 'STATUS_CHANGE' | 'WELCOME';
  recipient: string;
  recipientName: string;
  link?: string;
  token?: string;
  expiresAt?: Date;
  additionalData?: Record<string, any>;
}

// ============================================================================
// Status Management Types
// ============================================================================

export interface UserStatusTransition {
  from: UserStatus;
  to: UserStatus;
  allowed: boolean;
  requiresReason?: boolean;
  requiresAdminApproval?: boolean;
}

export interface StatusChangeRequest {
  userId: string;
  newStatus: UserStatus;
  reason?: string;
  changedBy: string;
  notifyUser?: boolean;
}

export interface StatusChangeResult {
  success: boolean;
  previousStatus: UserStatus;
  newStatus: UserStatus;
  changedAt: Date;
  message?: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface AuthResponse {
  success: boolean;
  message?: string;
  user?: Partial<UserProfile>;
  tokens?: AuthTokens;
  requiresAction?: AuthAction;
  correlationId?: string;
}

export interface AuthError {
  code: string;
  message: string;
  field?: string;
  details?: any;
  correlationId?: string;
}

export type AuthAction = 
  | 'EMAIL_VERIFICATION_REQUIRED'
  | 'PASSWORD_RESET_REQUIRED'
  | 'TWO_FACTOR_REQUIRED'
  | 'PROFILE_COMPLETION_REQUIRED';

// ============================================================================
// Validation Types
// ============================================================================

export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

// ============================================================================
// Session Types
// ============================================================================

export interface UserSession {
  userId: string;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
  lastActivityAt: Date;
}

// ============================================================================
// Rate Limiting Types
// ============================================================================

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
}

export interface RateLimitStatus {
  remaining: number;
  reset: Date;
  blocked: boolean;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface UserFilter {
  status?: UserStatus;
  role?: UserRole;
  emailConfirmed?: boolean;
  hasPasswordResetToken?: boolean;
  createdAfter?: Date;
  createdBefore?: Date;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface BulkOperation {
  userIds: string[];
  operation: 'ACTIVATE' | 'DEACTIVATE' | 'SUSPEND' | 'ARCHIVE' | 'DELETE';
  reason?: string;
  notifyUsers?: boolean;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  pendingVerification: number;
  suspended: number;
  archived: number;
  byRole: Record<UserRole, number>;
  recentRegistrations: number;
  recentLogins: number;
}

// ============================================================================
// Audit Types
// ============================================================================

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  changes?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AuthConfig {
  passwordMinLength: number;
  passwordMaxLength: number;
  passwordRequireUppercase: boolean;
  passwordRequireLowercase: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireSpecial: boolean;
  passwordMaxConsecutiveChars: number;
  passwordMaxRepeatedChars: number;
  emailVerificationExpiry: number;
  passwordResetExpiry: number;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
  maxLoginAttempts: number;
  lockoutDuration: number;
  enableTwoFactor: boolean;
  enableEmailSimulation: boolean;
}