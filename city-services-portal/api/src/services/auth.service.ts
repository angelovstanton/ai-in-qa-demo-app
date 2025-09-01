import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '@prisma/client';
import { UserService } from './user.service';
import { PasswordService } from './password.service';
import { EmailSimulationService } from './email-simulation.service';
import {
  LoginCredentials,
  RegistrationData,
  AuthTokens,
  TokenPayload,
  AuthResponse,
  AuthenticatedUser
} from '../types/auth.types';

export class AuthService {
  private readonly userService: UserService;
  private readonly passwordService: PasswordService;
  private readonly emailService: EmailSimulationService;
  private readonly jwtSecret: string;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    this.userService = new UserService();
    this.passwordService = new PasswordService();
    this.emailService = new EmailSimulationService();
    this.jwtSecret = process.env.JWT_SECRET || 'default-secret-change-in-production';
    this.accessTokenExpiry = `${process.env.ACCESS_TOKEN_EXPIRY || '24'}h`;
    this.refreshTokenExpiry = `${process.env.REFRESH_TOKEN_EXPIRY || '168'}h`;
  }

  /**
   * Register a new user
   */
  async register(data: RegistrationData): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await this.userService.findByEmail(data.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.passwordService.hashPassword(data.password);

    // Generate email confirmation token
    const emailConfirmationToken = this.generateConfirmationToken();

    // Create user
    const user = await this.userService.createUser({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      preferredLanguage: data.preferredLanguage,
      emailConfirmationToken
    });

    // Send verification email (simulated)
    await this.emailService.sendEmail({
      type: 'VERIFICATION',
      recipient: user.email,
      recipientName: user.name,
      token: emailConfirmationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    return {
      success: true,
      message: 'Registration successful! Please check your email to verify your account.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        status: user.status
      },
      requiresAction: 'EMAIL_VERIFICATION_REQUIRED'
    };
  }

  /**
   * Login user
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    // Find user
    const user = await this.userService.findByEmail(credentials.email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    // Verify password
    const isValidPassword = await this.passwordService.verifyPassword(
      credentials.password,
      user.passwordHash
    );
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // Check user status
    switch (user.status as any) {
      case 'PENDING_EMAIL_VERIFICATION':
        return {
          success: false,
          message: 'Please verify your email address before logging in',
          requiresAction: 'EMAIL_VERIFICATION_REQUIRED'
        };
      
      case 'PASSWORD_RESET_REQUIRED':
        return {
          success: false,
          message: 'Password reset is required',
          requiresAction: 'PASSWORD_RESET_REQUIRED'
        };
      
      case 'SUSPENDED':
        throw new Error('Your account has been suspended. Please contact support.');
      
      case 'ARCHIVED':
        throw new Error('This account no longer exists');
      
      case 'INACTIVE':
        throw new Error('Your account is inactive. Please contact support.');
    }

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Get user profile
    const profile = await this.userService.getUserProfile(user.id);

    return {
      success: true,
      message: 'Login successful',
      user: profile || undefined,
      tokens
    };
  }

  /**
   * Verify email confirmation token
   */
  async verifyEmail(token: string): Promise<AuthResponse> {
    const user = await this.userService.verifyEmailToken(token);
    
    if (!user) {
      throw new Error('Invalid or expired confirmation token');
    }

    // Send welcome email (simulated)
    await this.emailService.sendEmail({
      type: 'WELCOME',
      recipient: user.email,
      recipientName: user.name
    });

    return {
      success: true,
      message: 'Email verified successfully! You can now log in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        status: user.status
      }
    };
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<AuthResponse> {
    const result = await this.passwordService.createPasswordResetToken(email);
    
    if (result) {
      const user = await this.userService.findByEmail(email);
      if (user) {
        // Send password reset email (simulated)
        await this.emailService.sendEmail({
          type: 'PASSWORD_RESET',
          recipient: user.email,
          recipientName: user.name,
          token: result.token,
          expiresAt: result.expiresAt
        });
      }
    }

    // Always return success for security (don't reveal if email exists)
    return {
      success: true,
      message: 'If an account exists with this email, a password reset link has been sent.'
    };
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<AuthResponse> {
    const success = await this.passwordService.resetPassword(token, newPassword);
    
    if (!success) {
      throw new Error('Invalid or expired reset token');
    }

    return {
      success: true,
      message: 'Password has been reset successfully. Please log in with your new password.'
    };
  }

  /**
   * Change password (authenticated)
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<AuthResponse> {
    await this.passwordService.changePassword(userId, currentPassword, newPassword);
    
    return {
      success: true,
      message: 'Password changed successfully'
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = jwt.verify(refreshToken, this.jwtSecret) as TokenPayload;
      
      // Get fresh user data
      const user = await this.userService.findById(payload.id);
      if (!user) {
        throw new Error('User not found');
      }

      if (user.status !== 'ACTIVE') {
        throw new Error('User account is not active');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Validate access token
   */
  async validateToken(token: string): Promise<AuthenticatedUser | null> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as TokenPayload;
      
      const user = await this.userService.findById(payload.id);
      if (!user || user.status !== 'ACTIVE') {
        return null;
      }

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role as any,
        status: user.status,
        emailConfirmed: user.emailConfirmed,
        departmentId: user.departmentId || undefined
      };
    } catch {
      return null;
    }
  }

  /**
   * Logout (invalidate tokens)
   * Note: In a real app, you'd maintain a token blacklist or use refresh token rotation
   */
  async logout(userId: string): Promise<AuthResponse> {
    // In a real implementation, you would:
    // 1. Add the token to a blacklist
    // 2. Delete refresh token from database
    // 3. Clear any server-side sessions
    
    return {
      success: true,
      message: 'Logged out successfully'
    };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string): Promise<AuthResponse> {
    const user = await this.userService.findByEmail(email);
    
    if (!user || user.emailConfirmed) {
      // Don't reveal if user exists or is already confirmed
      return {
        success: true,
        message: 'If an unverified account exists, a verification email has been sent.'
      };
    }

    // Generate new confirmation token
    const emailConfirmationToken = this.generateConfirmationToken();
    
    // Update user with new token
    await this.userService.updateProfile(user.id, {
      emailConfirmationToken: emailConfirmationToken as any,
      emailConfirmationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000) as any
    } as any);

    // Send verification email (simulated)
    await this.emailService.sendEmail({
      type: 'VERIFICATION',
      recipient: user.email,
      recipientName: user.name,
      token: emailConfirmationToken,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    });

    return {
      success: true,
      message: 'Verification email has been resent'
    };
  }

  /**
   * Generate JWT tokens
   */
  private generateTokens(user: User): AuthTokens {
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role as any,
      status: user.status
    };

    const accessToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.accessTokenExpiry
    });

    const refreshToken = jwt.sign(payload, this.jwtSecret, {
      expiresIn: this.refreshTokenExpiry
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.parseExpiryToSeconds(this.accessTokenExpiry)
    };
  }

  /**
   * Generate email confirmation token
   */
  private generateConfirmationToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Parse expiry string to seconds
   */
  private parseExpiryToSeconds(expiry: string): number {
    const match = expiry.match(/(\d+)([hmd])/);
    if (!match) return 86400; // Default to 24 hours

    const [, value, unit] = match;
    const multipliers: Record<string, number> = {
      h: 3600,
      d: 86400,
      m: 60
    };

    return parseInt(value) * (multipliers[unit] || 3600);
  }
}