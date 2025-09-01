import crypto from 'crypto';
import { Request } from 'express';

/**
 * Extract bearer token from Authorization header
 */
export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}

/**
 * Generate a random string for tokens
 */
export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('base64url');
}

/**
 * Generate a unique session ID
 */
export function generateSessionId(): string {
  return `sess_${Date.now()}_${generateRandomToken(16)}`;
}

/**
 * Get client IP address from request
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

/**
 * Get user agent from request
 */
export function getUserAgent(req: Request): string {
  return req.headers['user-agent'] || 'unknown';
}

/**
 * Parse JWT expiry to Date
 */
export function parseJwtExpiry(exp?: number): Date | null {
  if (!exp) return null;
  return new Date(exp * 1000);
}

/**
 * Check if a token is expired
 */
export function isTokenExpired(expiresAt: Date | null): boolean {
  if (!expiresAt) return true;
  return new Date() > expiresAt;
}

/**
 * Generate a secure random password
 */
export function generateSecurePassword(
  length: number = 16,
  options?: {
    includeUppercase?: boolean;
    includeLowercase?: boolean;
    includeNumbers?: boolean;
    includeSpecial?: boolean;
  }
): string {
  const opts = {
    includeUppercase: true,
    includeLowercase: true,
    includeNumbers: true,
    includeSpecial: true,
    ...options
  };

  let charset = '';
  let password = '';

  if (opts.includeUppercase) {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    charset += uppercase;
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
  }

  if (opts.includeLowercase) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    charset += lowercase;
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
  }

  if (opts.includeNumbers) {
    const numbers = '0123456789';
    charset += numbers;
    password += numbers[Math.floor(Math.random() * numbers.length)];
  }

  if (opts.includeSpecial) {
    const special = '@$!%*?&#^()_+=-{}[]|:;"<>,.?/`~';
    charset += special;
    password += special[Math.floor(Math.random() * special.length)];
  }

  // Fill remaining length
  for (let i = password.length; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }

  // Shuffle password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

/**
 * Hash a string using SHA256
 */
export function hashString(str: string): string {
  return crypto.createHash('sha256').update(str).digest('hex');
}

/**
 * Generate a time-based OTP (for 2FA)
 */
export function generateOTP(length: number = 6): string {
  const digits = '0123456789';
  let otp = '';
  for (let i = 0; i < length; i++) {
    otp += digits[Math.floor(Math.random() * digits.length)];
  }
  return otp;
}

/**
 * Mask sensitive data for logging
 */
export function maskSensitiveData(data: any): any {
  if (typeof data !== 'object' || data === null) {
    return data;
  }

  const sensitiveFields = [
    'password',
    'passwordHash',
    'token',
    'accessToken',
    'refreshToken',
    'emailConfirmationToken',
    'passwordResetToken',
    'securityAnswer',
    'creditCard',
    'ssn'
  ];

  const masked = { ...data };
  
  for (const field of Object.keys(masked)) {
    if (sensitiveFields.some(sensitive => field.toLowerCase().includes(sensitive.toLowerCase()))) {
      masked[field] = '***MASKED***';
    } else if (typeof masked[field] === 'object') {
      masked[field] = maskSensitiveData(masked[field]);
    }
  }

  return masked;
}

/**
 * Calculate password entropy
 */
export function calculatePasswordEntropy(password: string): number {
  const charsets = {
    lowercase: 26,
    uppercase: 26,
    numbers: 10,
    special: 32,
    extended: 128
  };

  let poolSize = 0;

  if (/[a-z]/.test(password)) poolSize += charsets.lowercase;
  if (/[A-Z]/.test(password)) poolSize += charsets.uppercase;
  if (/[0-9]/.test(password)) poolSize += charsets.numbers;
  if (/[^a-zA-Z0-9]/.test(password)) poolSize += charsets.special;
  if (/[^\x00-\x7F]/.test(password)) poolSize += charsets.extended;

  const entropy = password.length * Math.log2(poolSize);
  return Math.round(entropy);
}

/**
 * Determine password strength based on entropy
 */
export function getPasswordStrength(entropy: number): string {
  if (entropy < 30) return 'Very Weak';
  if (entropy < 50) return 'Weak';
  if (entropy < 70) return 'Fair';
  if (entropy < 90) return 'Strong';
  return 'Very Strong';
}

/**
 * Format date for email display
 */
export function formatEmailDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
}

/**
 * Generate a verification code
 */
export function generateVerificationCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Check if an email domain is from a disposable email service
 */
export function isDisposableEmail(email: string): boolean {
  const disposableDomains = [
    'tempmail.com',
    'throwaway.email',
    'guerrillamail.com',
    'mailinator.com',
    '10minutemail.com',
    'trashmail.com'
  ];

  const domain = email.split('@')[1]?.toLowerCase();
  return disposableDomains.some(d => domain?.includes(d));
}

/**
 * Normalize email address
 */
export function normalizeEmail(email: string): string {
  const [localPart, domain] = email.toLowerCase().trim().split('@');
  
  // Remove dots from Gmail addresses
  if (domain === 'gmail.com') {
    const cleanedLocal = localPart.replace(/\./g, '');
    // Remove everything after + for Gmail aliases
    const baseLocal = cleanedLocal.split('+')[0];
    return `${baseLocal}@${domain}`;
  }
  
  // For other providers, just remove aliases
  const baseLocal = localPart.split('+')[0];
  return `${baseLocal}@${domain}`;
}

/**
 * Create a rate limit key for a user action
 */
export function createRateLimitKey(
  action: string,
  identifier: string,
  window?: 'minute' | 'hour' | 'day'
): string {
  const now = new Date();
  let timeWindow = '';

  switch (window) {
    case 'minute':
      timeWindow = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}-${now.getMinutes()}`;
      break;
    case 'hour':
      timeWindow = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
      break;
    case 'day':
      timeWindow = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;
      break;
    default:
      timeWindow = `${now.getTime()}`;
  }

  return `ratelimit:${action}:${identifier}:${timeWindow}`;
}

/**
 * Parse boolean environment variable
 */
export function parseBooleanEnv(value: string | undefined, defaultValue: boolean = false): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true';
}

/**
 * Parse integer environment variable
 */
export function parseIntEnv(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}