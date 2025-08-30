import { User, Prisma } from '@prisma/client';
import { BaseRepository } from './base/BaseRepository';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

export interface UserWithRelations extends User {
  department?: any;
  createdRequests?: any[];
  assignedRequests?: any[];
}

export interface UserFilters {
  role?: string | string[];
  departmentId?: string;
  isActive?: boolean;
  search?: string;
}

export interface UserStats {
  totalUsers: number;
  byRole: Record<string, number>;
  activeUsers: number;
  newUsersThisMonth: number;
}

/**
 * User Repository
 * Handles user-related database operations
 * Implements authentication and user management logic
 */
export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'user');
  }

  /**
   * Find user by email
   */
  async findByEmail(email: string): Promise<User | null> {
    return this.model.findUnique({
      where: { email: email.toLowerCase() }
    });
  }

  /**
   * Find user with all relations
   */
  async findByIdWithRelations(
    id: string,
    includeOptions?: Prisma.UserInclude
  ): Promise<UserWithRelations | null> {
    return this.model.findUnique({
      where: { id },
      include: includeOptions || {
        department: true,
        createdRequests: {
          take: 10,
          orderBy: { createdAt: 'desc' }
        },
        assignedRequests: {
          take: 10,
          orderBy: { updatedAt: 'desc' }
        }
      }
    });
  }

  /**
   * Create user with hashed password
   */
  async createUser(
    userData: Omit<Prisma.UserCreateInput, 'passwordHash'> & { password: string }
  ): Promise<User> {
    const { password, ...data } = userData;
    const passwordHash = await bcrypt.hash(password, 10);

    return this.create({
      ...data,
      email: data.email.toLowerCase(),
      passwordHash
    } as Prisma.UserCreateInput);
  }

  /**
   * Verify user credentials
   */
  async verifyCredentials(
    email: string,
    password: string
  ): Promise<User | null> {
    const user = await this.findByEmail(email);
    
    if (!user || !user.isActive) {
      return null;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    return isValid ? user : null;
  }

  /**
   * Update user password
   */
  async updatePassword(
    userId: string,
    newPassword: string
  ): Promise<User> {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    
    return this.update(userId, {
      passwordHash,
      passwordResetToken: null,
      passwordResetExpires: null
    });
  }

  /**
   * Search users with filters
   */
  async search(
    filters: UserFilters,
    options: QueryOptions = {}
  ): Promise<UserWithRelations[]> {
    const where = this.buildWhereClause(filters);

    return this.model.findMany({
      where,
      ...options,
      include: options.include || {
        department: true
      }
    });
  }

  /**
   * Find users by role
   */
  async findByRole(
    role: string | string[],
    includeInactive: boolean = false
  ): Promise<User[]> {
    const roles = Array.isArray(role) ? role : [role];
    const where: any = { role: { in: roles } };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.findAll({
      where,
      orderBy: { name: 'asc' }
    });
  }

  /**
   * Find users by department
   */
  async findByDepartment(
    departmentId: string,
    includeInactive: boolean = false
  ): Promise<UserWithRelations[]> {
    const where: any = { departmentId };

    if (!includeInactive) {
      where.isActive = true;
    }

    return this.search({}, { where });
  }

  /**
   * Get available agents for assignment
   */
  async getAvailableAgents(departmentId?: string): Promise<User[]> {
    const where: any = {
      role: { in: ['CLERK', 'FIELD_AGENT'] },
      isActive: true
    };

    if (departmentId) {
      where.departmentId = departmentId;
    }

    // Get agents with their current workload
    const agents = await this.model.findMany({
      where,
      include: {
        assignedRequests: {
          where: {
            status: { notIn: ['COMPLETED', 'CANCELLED', 'CLOSED'] }
          },
          select: { id: true }
        }
      },
      orderBy: { name: 'asc' }
    });

    // Sort by workload (ascending)
    return agents.sort((a: any, b: any) => 
      a.assignedRequests.length - b.assignedRequests.length
    );
  }

  /**
   * Set password reset token
   */
  async setPasswordResetToken(
    userId: string,
    token: string,
    expiresIn: number = 3600000 // 1 hour
  ): Promise<User> {
    return this.update(userId, {
      passwordResetToken: token,
      passwordResetExpires: new Date(Date.now() + expiresIn)
    });
  }

  /**
   * Verify password reset token
   */
  async verifyPasswordResetToken(token: string): Promise<User | null> {
    return this.model.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: { gt: new Date() }
      }
    });
  }

  /**
   * Confirm user email
   */
  async confirmEmail(token: string): Promise<User | null> {
    const user = await this.model.findFirst({
      where: { emailConfirmationToken: token }
    });

    if (!user) return null;

    return this.update(user.id, {
      emailConfirmed: true,
      emailConfirmationToken: null
    });
  }

  /**
   * Get user statistics
   */
  async getStatistics(): Promise<UserStats> {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [totalUsers, byRole, activeUsers, newUsersThisMonth] = await Promise.all([
      this.count(),
      this.getCountByRole(),
      this.count({ isActive: true }),
      this.count({ createdAt: { gte: startOfMonth } })
    ]);

    return {
      totalUsers,
      byRole,
      activeUsers,
      newUsersThisMonth
    };
  }

  /**
   * Update user preferences
   */
  async updatePreferences(
    userId: string,
    preferences: {
      preferredLanguage?: string;
      communicationMethod?: string;
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      marketingEmails?: boolean;
      serviceUpdates?: boolean;
      twoFactorEnabled?: boolean;
    }
  ): Promise<User> {
    return this.update(userId, preferences);
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(filters: UserFilters): any {
    const where: any = {};

    if (filters.role) {
      where.role = Array.isArray(filters.role)
        ? { in: filters.role }
        : filters.role;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search } },
        { email: { contains: filters.search } },
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } }
      ];
    }

    return where;
  }

  /**
   * Get count grouped by role
   */
  private async getCountByRole(): Promise<Record<string, number>> {
    const results = await this.model.groupBy({
      by: ['role'],
      _count: true
    });

    return results.reduce((acc: any, item: any) => {
      acc[item.role] = item._count;
      return acc;
    }, {});
  }
}