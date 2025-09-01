import { PrismaClient, User } from '@prisma/client';
import { 
  UserProfile, 
  UserFilter, 
  UserStatistics,
  StatusChangeRequest,
  StatusChangeResult,
  UserStatusTransition,
  BulkOperation,
  UserStatus
} from '../types/auth.types';

const prisma = new PrismaClient();

export class UserService {
  /**
   * Define valid status transitions
   */
  private readonly statusTransitions: Record<UserStatus, UserStatus[]> = {
    PENDING_EMAIL_VERIFICATION: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'],
    ACTIVE: ['INACTIVE', 'SUSPENDED', 'PASSWORD_RESET_REQUIRED', 'ARCHIVED'],
    INACTIVE: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'],
    PASSWORD_RESET_REQUIRED: ['ACTIVE', 'SUSPENDED', 'ARCHIVED'],
    SUSPENDED: ['ACTIVE', 'INACTIVE', 'ARCHIVED'],
    ARCHIVED: [] // No transitions from archived
  };

  /**
   * Create a new user
   */
  async createUser(data: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role?: string;
    phone?: string;
    preferredLanguage?: string;
    emailConfirmationToken?: string;
  }): Promise<User> {
    const name = `${data.firstName} ${data.lastName}`.trim();
    
    return prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        name,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role || 'CITIZEN',
        status: 'PENDING_EMAIL_VERIFICATION',
        phone: data.phone,
        preferredLanguage: data.preferredLanguage || 'en',
        emailConfirmationToken: data.emailConfirmationToken,
        emailConfirmationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        emailConfirmed: false,
        isActive: false // Legacy field
      }
    });
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });
  }

  /**
   * Find user by ID
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id }
    });
  }

  /**
   * Get user profile with department
   */
  async getUserProfile(id: string): Promise<UserProfile | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { department: true }
    });

    if (!user) return null;

    return this.mapUserToProfile(user);
  }

  /**
   * Update user profile
   */
  async updateProfile(id: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
    // Update name if firstName or lastName changed
    let name = undefined;
    if (data.firstName || data.lastName) {
      const currentUser = await this.findById(id);
      if (currentUser) {
        const firstName = data.firstName || currentUser.firstName || '';
        const lastName = data.lastName || currentUser.lastName || '';
        name = `${firstName} ${lastName}`.trim();
      }
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...data,
        name
      },
      include: { department: true }
    });

    return this.mapUserToProfile(user);
  }

  /**
   * Change user status
   */
  async changeUserStatus(request: StatusChangeRequest): Promise<StatusChangeResult> {
    const user = await this.findById(request.userId);
    
    if (!user) {
      throw new Error('User not found');
    }

    // Check if transition is valid
    if (!this.isValidStatusTransition(user.status, request.newStatus)) {
      throw new Error(`Invalid status transition from ${user.status} to ${request.newStatus}`);
    }

    // Update user status
    await prisma.user.update({
      where: { id: request.userId },
      data: {
        status: request.newStatus,
        statusChangedAt: new Date(),
        statusChangeReason: request.reason,
        // Update legacy isActive field
        isActive: request.newStatus === 'ACTIVE'
      }
    });

    return {
      success: true,
      previousStatus: user.status,
      newStatus: request.newStatus,
      changedAt: new Date(),
      message: `User status changed from ${user.status} to ${request.newStatus}`
    };
  }

  /**
   * Check if a status transition is valid
   */
  isValidStatusTransition(from: UserStatus, to: UserStatus): boolean {
    const validTransitions = this.statusTransitions[from] || [];
    return validTransitions.includes(to);
  }

  /**
   * Get status transition rules
   */
  getStatusTransitionRules(from: UserStatus): UserStatusTransition[] {
    const allStatuses: UserStatus[] = ['ACTIVE', 'INACTIVE', 'PENDING_EMAIL_VERIFICATION', 'PASSWORD_RESET_REQUIRED', 'SUSPENDED', 'ARCHIVED'];
    const validTransitions = this.statusTransitions[from] || [];

    return allStatuses.map(to => ({
      from,
      to,
      allowed: validTransitions.includes(to),
      requiresReason: ['SUSPENDED', 'ARCHIVED'].includes(to),
      requiresAdminApproval: to === 'ARCHIVED'
    }));
  }

  /**
   * Verify email confirmation token
   */
  async verifyEmailToken(token: string): Promise<User | null> {
    const user = await prisma.user.findFirst({
      where: {
        emailConfirmationToken: token,
        emailConfirmationExpires: {
          gt: new Date()
        }
      }
    });

    if (!user) return null;

    // Update user as verified and active
    return prisma.user.update({
      where: { id: user.id },
      data: {
        emailConfirmed: true,
        emailConfirmationToken: null,
        emailConfirmationExpires: null,
        status: 'ACTIVE',
        isActive: true
      }
    });
  }

  /**
   * Search and filter users (admin function)
   */
  async searchUsers(filter: UserFilter): Promise<{ users: UserProfile[]; total: number }> {
    const where: any = {};

    if (filter.status) where.status = filter.status;
    if (filter.role) where.role = filter.role;
    if (filter.emailConfirmed !== undefined) where.emailConfirmed = filter.emailConfirmed;
    if (filter.hasPasswordResetToken) {
      where.passwordResetToken = filter.hasPasswordResetToken ? { not: null } : null;
    }
    if (filter.createdAfter) where.createdAt = { gte: filter.createdAfter };
    if (filter.createdBefore) where.createdAt = { lte: filter.createdBefore };
    if (filter.search) {
      where.OR = [
        { email: { contains: filter.search } },
        { name: { contains: filter.search } },
        { phone: { contains: filter.search } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: ((filter.page || 1) - 1) * (filter.limit || 20),
        take: filter.limit || 20,
        orderBy: {
          [filter.sortBy || 'createdAt']: filter.sortOrder || 'desc'
        },
        include: { department: true }
      }),
      prisma.user.count({ where })
    ]);

    return {
      users: users.map(user => this.mapUserToProfile(user)),
      total
    };
  }

  /**
   * Bulk update user status (admin function)
   */
  async bulkUpdateStatus(operation: BulkOperation): Promise<number> {
    const status = this.mapOperationToStatus(operation.operation);
    
    const result = await prisma.user.updateMany({
      where: {
        id: { in: operation.userIds }
      },
      data: {
        status,
        statusChangedAt: new Date(),
        statusChangeReason: operation.reason,
        isActive: status === 'ACTIVE'
      }
    });

    return result.count;
  }

  /**
   * Get user statistics (admin function)
   */
  async getUserStatistics(): Promise<UserStatistics> {
    const [
      totalUsers,
      statusCounts,
      roleCounts,
      recentRegistrations,
      recentLogins
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.groupBy({
        by: ['status'],
        _count: true
      }),
      prisma.user.groupBy({
        by: ['role'],
        _count: true
      }),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
          }
        }
      }),
      // Note: You'd need to track last login separately
      Promise.resolve(0)
    ]);

    const statusMap = statusCounts.reduce((acc, curr) => {
      acc[curr.status] = curr._count;
      return acc;
    }, {} as Record<string, number>);

    const roleMap = roleCounts.reduce((acc, curr) => {
      acc[curr.role as any] = curr._count;
      return acc;
    }, {} as any);

    return {
      totalUsers,
      activeUsers: statusMap['ACTIVE'] || 0,
      pendingVerification: statusMap['PENDING_EMAIL_VERIFICATION'] || 0,
      suspended: statusMap['SUSPENDED'] || 0,
      archived: statusMap['ARCHIVED'] || 0,
      byRole: roleMap,
      recentRegistrations,
      recentLogins
    };
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    const count = await prisma.user.count({
      where: { email: email.toLowerCase() }
    });
    return count > 0;
  }

  /**
   * Delete user (soft delete by archiving)
   */
  async deleteUser(id: string, reason?: string): Promise<boolean> {
    await prisma.user.update({
      where: { id },
      data: {
        status: 'ARCHIVED',
        statusChangedAt: new Date(),
        statusChangeReason: reason || 'User deleted',
        isActive: false
      }
    });
    return true;
  }

  /**
   * Map bulk operation to status
   */
  private mapOperationToStatus(operation: string): UserStatus {
    const mapping: Record<string, UserStatus> = {
      ACTIVATE: 'ACTIVE',
      DEACTIVATE: 'INACTIVE',
      SUSPEND: 'SUSPENDED',
      ARCHIVE: 'ARCHIVED',
      DELETE: 'ARCHIVED'
    };
    return mapping[operation] || 'INACTIVE';
  }

  /**
   * Map user entity to profile
   */
  private mapUserToProfile(user: any): UserProfile {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      emailConfirmed: user.emailConfirmed,
      departmentId: user.departmentId,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      alternatePhone: user.alternatePhone,
      streetAddress: user.streetAddress,
      city: user.city,
      state: user.state,
      postalCode: user.postalCode,
      country: user.country,
      preferredLanguage: user.preferredLanguage,
      communicationMethod: user.communicationMethod,
      emailNotifications: user.emailNotifications,
      smsNotifications: user.smsNotifications,
      marketingEmails: user.marketingEmails,
      serviceUpdates: user.serviceUpdates,
      twoFactorEnabled: user.twoFactorEnabled,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}