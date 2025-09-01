import { z } from 'zod';
import { ValidationResult, ValidationError } from '../types/auth.types';
import { sanitizeInput } from '../validation/schemas/auth.schema';

export class ValidationService {
  /**
   * Validate data against a schema
   */
  async validate<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    options?: {
      sanitize?: boolean;
      language?: 'en' | 'bg';
    }
  ): Promise<ValidationResult<T>> {
    try {
      // Sanitize input if requested
      if (options?.sanitize && typeof data === 'object' && data !== null) {
        data = this.sanitizeObject(data);
      }

      // Validate against schema
      const validated = await schema.parseAsync(data);
      
      return {
        isValid: true,
        data: validated
      };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          errors: this.formatZodErrors(error, options?.language)
        };
      }
      
      throw error;
    }
  }

  /**
   * Validate multiple fields independently
   */
  async validateFields(
    fields: Record<string, { schema: z.ZodSchema; value: unknown }>,
    options?: {
      sanitize?: boolean;
      language?: 'en' | 'bg';
    }
  ): Promise<Record<string, ValidationResult>> {
    const results: Record<string, ValidationResult> = {};

    for (const [field, { schema, value }] of Object.entries(fields)) {
      results[field] = await this.validate(schema, value, options);
    }

    return results;
  }

  /**
   * Real-time field validation with debouncing
   */
  createFieldValidator<T>(
    schema: z.ZodSchema<T>,
    debounceMs: number = 300
  ): (value: unknown) => Promise<ValidationResult<T>> {
    let timeoutId: NodeJS.Timeout;

    return (value: unknown) => {
      return new Promise((resolve) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(async () => {
          const result = await this.validate(schema, value);
          resolve(result);
        }, debounceMs);
      });
    };
  }

  /**
   * Sanitize an object recursively
   */
  private sanitizeObject(obj: any): any {
    if (typeof obj !== 'object' || obj === null) {
      return typeof obj === 'string' ? sanitizeInput(obj) : obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }

    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitized[key] = this.sanitizeObject(value);
    }
    return sanitized;
  }

  /**
   * Format Zod errors for client consumption
   */
  private formatZodErrors(error: z.ZodError, language?: 'en' | 'bg'): ValidationError[] {
    return error.errors.map(err => ({
      field: err.path.join('.'),
      message: this.getLocalizedMessage(err, language),
      code: err.code
    }));
  }

  /**
   * Get localized error message
   */
  private getLocalizedMessage(error: z.ZodIssue, language?: 'en' | 'bg'): string {
    // In a real app, you'd have a comprehensive translation system
    const messages: Record<string, Record<string, string>> = {
      en: {
        too_small: `Must be at least ${(error as any).minimum} characters`,
        too_big: `Must be at most ${(error as any).maximum} characters`,
        invalid_type: 'Invalid type',
        invalid_string: 'Invalid format',
        custom: error.message
      },
      bg: {
        too_small: `Трябва да бъде поне ${(error as any).minimum} символа`,
        too_big: `Не може да надвишава ${(error as any).maximum} символа`,
        invalid_type: 'Невалиден тип',
        invalid_string: 'Невалиден формат',
        custom: error.message
      }
    };

    const lang = language || 'en';
    return messages[lang]?.[error.code] || messages[lang]?.custom || error.message;
  }

  /**
   * Validate email format
   */
  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number format
   */
  isValidPhone(phone: string, country?: string): boolean {
    // Remove all non-digit characters for validation
    const cleaned = phone.replace(/\D/g, '');
    
    if (country === 'BG') {
      // Bulgarian phone numbers
      return /^(359|0)[87-9]\d{8}$/.test(cleaned);
    }
    
    // International E.164 format
    return /^[1-9]\d{1,14}$/.test(cleaned);
  }

  /**
   * Validate postal code
   */
  isValidPostalCode(postalCode: string, country: string = 'BG'): boolean {
    const patterns: Record<string, RegExp> = {
      BG: /^\d{4}$/,
      US: /^\d{5}(-\d{4})?$/,
      UK: /^[A-Z]{1,2}\d{1,2}[A-Z]?\s?\d[A-Z]{2}$/i,
      CA: /^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i
    };
    
    const pattern = patterns[country] || /^[A-Z0-9\s-]{3,10}$/i;
    return pattern.test(postalCode);
  }

  /**
   * Check for XSS attempts in input
   */
  hasXSSAttempt(input: string): boolean {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi,
      /<embed/gi,
      /<object/gi
    ];

    return xssPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Check for SQL injection attempts
   */
  hasSQLInjectionAttempt(input: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER|CREATE)\b)/gi,
      /('|(--|\/\*|\*\/|;))/g,
      /(=|!=|<>|<|>|\bAND\b|\bOR\b)/gi
    ];

    // Allow some legitimate uses (like in addresses)
    const legitimateContext = /\b(street|address|city|state)\b/gi;
    if (legitimateContext.test(input)) {
      return false;
    }

    return sqlPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Validate password complexity
   */
  validatePasswordComplexity(password: string): {
    isValid: boolean;
    score: number;
    issues: string[];
  } {
    const issues: string[] = [];
    let score = 0;

    // Length check
    if (password.length < 12) {
      issues.push('Password must be at least 12 characters');
    } else {
      score += 20;
      if (password.length >= 16) score += 10;
    }

    // Character type checks
    if (!/[A-Z]/.test(password)) {
      issues.push('Must contain uppercase letters');
    } else {
      score += 20;
    }

    if (!/[a-z]/.test(password)) {
      issues.push('Must contain lowercase letters');
    } else {
      score += 20;
    }

    if (!/[0-9]/.test(password)) {
      issues.push('Must contain numbers');
    } else {
      score += 20;
    }

    if (!/[@$!%*?&#^()_+=\-{}\[\]|\\:;"'<>,.?\/`~]/.test(password)) {
      issues.push('Must contain special characters');
    } else {
      score += 20;
    }

    // Pattern checks
    if (/(.)\1{2,}/.test(password)) {
      issues.push('Avoid consecutive identical characters');
      score -= 10;
    }

    if (/(?:012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz)/i.test(password)) {
      issues.push('Avoid sequential characters');
      score -= 10;
    }

    const commonPasswords = ['password', '12345678', 'qwerty', 'admin', 'letmein'];
    if (commonPasswords.some(common => password.toLowerCase().includes(common))) {
      issues.push('Avoid common passwords');
      score -= 20;
    }

    return {
      isValid: issues.length === 0,
      score: Math.max(0, Math.min(100, score)),
      issues
    };
  }

  /**
   * Validate name format
   */
  validateName(name: string, options?: { allowCyrillic?: boolean }): boolean {
    if (options?.allowCyrillic) {
      return /^[a-zA-ZА-Яа-яЁё\s'-]+$/.test(name);
    }
    return /^[a-zA-Z\s'-]+$/.test(name);
  }

  /**
   * Format validation errors for API response
   */
  formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
    const formatted: Record<string, string[]> = {};
    
    for (const error of errors) {
      if (!formatted[error.field]) {
        formatted[error.field] = [];
      }
      formatted[error.field].push(error.message);
    }
    
    return formatted;
  }
}