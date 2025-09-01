import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { PrismaClient, User } from '@prisma/client';
import { PasswordStrength, PasswordChange, PasswordReset } from '../types/auth.types';
import {
  uppercasePattern,
  lowercasePattern,
  numberPattern,
  specialCharPattern,
  hasConsecutiveCharacters,
  hasRepeatedCharacters,
  isCommonPassword,
  hasSequentialCharacters
} from '../validation/shared/patterns';

const prisma = new PrismaClient();

export class PasswordService {
  private readonly saltRounds = 12;
  private readonly resetTokenLength = 32;
  private readonly passwordHistoryLimit = 5;

  /**
   * Hash a password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compare a plain text password with a hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure random token for password reset
   */
  generateResetToken(): string {
    return crypto.randomBytes(this.resetTokenLength).toString('base64url');
  }

  /**
   * Generate a password reset token and save it to the user
   */
  async createPasswordResetToken(email: string): Promise<{ token: string; expiresAt: Date } | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return null;
    }

    const token = this.generateResetToken();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.PASSWORD_RESET_EXPIRY || '1') * 60 * 60 * 1000));

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt
      }
    });

    return { token, expiresAt };
  }

  /**
   * Validate a password reset token
   */
  async validateResetToken(token: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date()
        }
      }
    });

    return user;
  }

  /**
   * Reset a user's password using a valid token
   */
  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = await this.validateResetToken(token);
    
    if (!user) {
      return false;
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
        status: 'ACTIVE' // Activate the account after password reset
      }
    });

    return true;
  }

  /**
   * Change a user's password (requires current password)
   */
  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const isCurrentPasswordValid = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Check if new password is same as current
    const isSamePassword = await this.verifyPassword(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new Error('New password must be different from current password');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null
      }
    });

    return true;
  }

  /**
   * Calculate password strength
   */
  calculatePasswordStrength(password: string): PasswordStrength {
    const feedback: string[] = [];
    let score = 0;

    // Check length
    const length = password.length;
    if (length >= 8) score += 10;
    if (length >= 12) score += 10;
    if (length >= 16) score += 10;

    // Check character types
    const hasUppercase = uppercasePattern.test(password);
    const hasLowercase = lowercasePattern.test(password);
    const hasNumbers = numberPattern.test(password);
    const hasSpecialChars = specialCharPattern.test(password);

    if (hasUppercase) score += 15;
    else feedback.push('Add uppercase letters');

    if (hasLowercase) score += 15;
    else feedback.push('Add lowercase letters');

    if (hasNumbers) score += 15;
    else feedback.push('Add numbers');

    if (hasSpecialChars) score += 15;
    else feedback.push('Add special characters');

    // Check for patterns
    if (!hasConsecutiveCharacters(password, 2)) score += 5;
    else feedback.push('Avoid consecutive identical characters');

    if (!hasRepeatedCharacters(password, 3)) score += 5;
    else feedback.push('Avoid repeated characters');

    if (!isCommonPassword(password)) score += 10;
    else feedback.push('Avoid common passwords');

    if (!hasSequentialCharacters(password)) score += 10;
    else feedback.push('Avoid sequential characters');

    // Determine if password meets minimum requirements
    const meetsRequirements = 
      length >= parseInt(process.env.PASSWORD_MIN_LENGTH || '12') &&
      hasUppercase &&
      hasLowercase &&
      hasNumbers &&
      hasSpecialChars &&
      !hasConsecutiveCharacters(password, parseInt(process.env.PASSWORD_MAX_CONSECUTIVE_CHARS || '2')) &&
      !hasRepeatedCharacters(password, parseInt(process.env.PASSWORD_MAX_REPEATED_CHARS || '3')) &&
      !isCommonPassword(password);

    // Add feedback for excellent passwords
    if (score >= 80) {
      feedback.push('Strong password!');
    } else if (score >= 60) {
      feedback.push('Good password, but could be stronger');
    } else if (score >= 40) {
      feedback.push('Fair password, consider making it stronger');
    } else {
      feedback.push('Weak password, please make it stronger');
    }

    return {
      score: Math.min(100, score),
      feedback,
      hasUppercase,
      hasLowercase,
      hasNumbers,
      hasSpecialChars,
      length,
      meetsRequirements
    };
  }

  /**
   * Generate a secure random password
   */
  generateSecurePassword(length: number = 16): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '@$!%*?&#^()_+=-{}[]|:;"<>,.?/`~';
    
    const allChars = uppercase + lowercase + numbers + special;
    let password = '';

    // Ensure at least one of each required character type
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if a password has been used before (for password history)
   * Note: This is a placeholder - in production, you'd store password history
   */
  async hasPasswordBeenUsed(userId: string, password: string): Promise<boolean> {
    // In a real implementation, you would:
    // 1. Store hashed passwords in a password_history table
    // 2. Check the new password against the last N passwords
    // 3. Return true if it matches any previous password
    
    // For now, just check against current password
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) return false;

    return this.verifyPassword(password, user.passwordHash);
  }

  /**
   * Force a password reset for a user
   */
  async forcePasswordReset(userId: string, reason?: string): Promise<{ token: string; expiresAt: Date }> {
    const token = this.generateResetToken();
    const expiresAt = new Date(Date.now() + (24 * 60 * 60 * 1000)); // 24 hours

    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expiresAt,
        status: 'PASSWORD_RESET_REQUIRED',
        statusChangeReason: reason || 'Password reset required by administrator'
      }
    });

    return { token, expiresAt };
  }
}