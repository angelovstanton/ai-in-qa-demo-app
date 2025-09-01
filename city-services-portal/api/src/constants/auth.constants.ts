/**
 * Authentication and authorization constants
 */

// User roles
export const USER_ROLES = {
  CITIZEN: 'CITIZEN',
  CLERK: 'CLERK',
  FIELD_AGENT: 'FIELD_AGENT',
  SUPERVISOR: 'SUPERVISOR',
  ADMIN: 'ADMIN'
} as const;

// User statuses
export const USER_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  PENDING_EMAIL_VERIFICATION: 'PENDING_EMAIL_VERIFICATION',
  PASSWORD_RESET_REQUIRED: 'PASSWORD_RESET_REQUIRED',
  SUSPENDED: 'SUSPENDED',
  ARCHIVED: 'ARCHIVED'
} as const;

// Authentication error codes
export const AUTH_ERROR_CODES = {
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  USER_EXISTS: 'USER_EXISTS',
  EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  ACCOUNT_ARCHIVED: 'ACCOUNT_ARCHIVED',
  TOKEN_INVALID: 'TOKEN_INVALID',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
  PASSWORD_RECENTLY_USED: 'PASSWORD_RECENTLY_USED',
  TWO_FACTOR_REQUIRED: 'TWO_FACTOR_REQUIRED',
  TWO_FACTOR_INVALID: 'TWO_FACTOR_INVALID'
} as const;

// HTTP status codes for auth responses
export const AUTH_HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  LOCKED: 423,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
} as const;

// Token types
export const TOKEN_TYPES = {
  ACCESS: 'access',
  REFRESH: 'refresh',
  EMAIL_VERIFICATION: 'email_verification',
  PASSWORD_RESET: 'password_reset',
  TWO_FACTOR: 'two_factor'
} as const;

// Rate limiting configurations
export const RATE_LIMITS = {
  LOGIN: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 5,
    message: 'Too many login attempts, please try again later'
  },
  REGISTRATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    message: 'Too many registration attempts, please try again later'
  },
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    message: 'Too many password reset attempts, please try again later'
  },
  EMAIL_VERIFICATION: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 5,
    message: 'Too many verification attempts, please try again later'
  },
  API_GENERAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 100,
    message: 'Too many requests, please slow down'
  }
} as const;

// Password requirements
export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 12,
  MAX_LENGTH: 128,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBERS: true,
  REQUIRE_SPECIAL: true,
  MAX_CONSECUTIVE_CHARS: 2,
  MAX_REPEATED_CHARS: 3,
  MIN_ENTROPY: 50,
  PASSWORD_HISTORY_COUNT: 5
} as const;

// Session configuration
export const SESSION_CONFIG = {
  ACCESS_TOKEN_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  EMAIL_VERIFICATION_EXPIRY: '24h',
  PASSWORD_RESET_EXPIRY: '1h',
  TWO_FACTOR_CODE_EXPIRY: '5m',
  SESSION_IDLE_TIMEOUT: 30 * 60 * 1000, // 30 minutes
  SESSION_ABSOLUTE_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
} as const;

// Email templates
export const EMAIL_TEMPLATES = {
  VERIFICATION: 'email-verification',
  PASSWORD_RESET: 'password-reset',
  WELCOME: 'welcome',
  STATUS_CHANGE: 'status-change',
  TWO_FACTOR: 'two-factor',
  SECURITY_ALERT: 'security-alert'
} as const;

// Audit log actions
export const AUDIT_ACTIONS = {
  USER_REGISTERED: 'USER_REGISTERED',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  PROFILE_UPDATED: 'PROFILE_UPDATED',
  USER_STATUS_CHANGED: 'USER_STATUS_CHANGED',
  TWO_FACTOR_ENABLED: 'TWO_FACTOR_ENABLED',
  TWO_FACTOR_DISABLED: 'TWO_FACTOR_DISABLED',
  SECURITY_QUESTION_UPDATED: 'SECURITY_QUESTION_UPDATED',
  FAILED_LOGIN_ATTEMPT: 'FAILED_LOGIN_ATTEMPT',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED'
} as const;

// Security questions (for demo purposes)
export const SECURITY_QUESTIONS = [
  'What was the name of your first pet?',
  'In what city were you born?',
  'What is your mother\'s maiden name?',
  'What was the name of your elementary school?',
  'What was your childhood nickname?',
  'What is the name of the street you grew up on?',
  'What was the make of your first car?',
  'What is your favorite book?',
  'What was your dream job as a child?',
  'What is your father\'s middle name?'
] as const;

// Validation patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE_E164: /^\+?[1-9]\d{1,14}$/,
  PHONE_BG: /^(\+359|0)[87-9]\d{8}$/,
  POSTAL_CODE_BG: /^\d{4}$/,
  NAME: /^[a-zA-ZÀ-ÿĀ-žА-яЁё\u0100-\u017F\u0400-\u04FF\u1E00-\u1EFF\s'-]+$/,
  USERNAME: /^[a-zA-Z0-9_-]{3,30}$/,
  SLUG: /^[a-z0-9-]+$/
} as const;

// Communication methods
export const COMMUNICATION_METHODS = {
  EMAIL: 'EMAIL',
  PHONE: 'PHONE',
  SMS: 'SMS'
} as const;

// Language codes
export const LANGUAGES = {
  EN: 'en',
  BG: 'bg'
} as const;

// Cookie names
export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  SESSION_ID: 'session_id',
  CSRF_TOKEN: 'csrf_token'
} as const;

// Header names
export const HEADER_NAMES = {
  AUTHORIZATION: 'Authorization',
  API_KEY: 'X-API-Key',
  CSRF_TOKEN: 'X-CSRF-Token',
  CLIENT_ID: 'X-Client-Id',
  CORRELATION_ID: 'X-Correlation-Id',
  RATE_LIMIT_REMAINING: 'X-RateLimit-Remaining',
  RATE_LIMIT_RESET: 'X-RateLimit-Reset'
} as const;

// Default values
export const DEFAULTS = {
  PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  SORT_ORDER: 'desc',
  LANGUAGE: 'en',
  TIMEZONE: 'UTC',
  DATE_FORMAT: 'YYYY-MM-DD',
  DATETIME_FORMAT: 'YYYY-MM-DD HH:mm:ss'
} as const;

// Role permissions matrix
export const ROLE_PERMISSIONS = {
  CITIZEN: [
    'view_own_profile',
    'update_own_profile',
    'change_own_password',
    'submit_requests',
    'view_own_requests',
    'comment_on_own_requests'
  ],
  CLERK: [
    'view_own_profile',
    'update_own_profile',
    'change_own_password',
    'view_all_requests',
    'update_request_status',
    'assign_requests',
    'comment_on_requests'
  ],
  FIELD_AGENT: [
    'view_own_profile',
    'update_own_profile',
    'change_own_password',
    'view_assigned_requests',
    'update_field_status',
    'upload_field_photos',
    'complete_work_orders'
  ],
  SUPERVISOR: [
    'view_own_profile',
    'update_own_profile',
    'change_own_password',
    'view_all_requests',
    'view_all_users',
    'view_reports',
    'manage_assignments',
    'review_quality',
    'view_metrics'
  ],
  ADMIN: [
    'view_own_profile',
    'update_own_profile',
    'change_own_password',
    'view_all_users',
    'manage_users',
    'change_user_status',
    'view_all_requests',
    'manage_system',
    'view_audit_logs',
    'manage_feature_flags'
  ]
} as const;

export type UserRole = keyof typeof USER_ROLES;
export type UserStatus = keyof typeof USER_STATUS;
export type AuthErrorCode = keyof typeof AUTH_ERROR_CODES;
export type TokenType = keyof typeof TOKEN_TYPES;
export type AuditAction = keyof typeof AUDIT_ACTIONS;
export type CommunicationMethod = keyof typeof COMMUNICATION_METHODS;
export type Language = keyof typeof LANGUAGES;