import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const createStaffAccountSchema = z.object({
  email: z.string().email('Invalid email format'),
  role: z.enum(['CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  departmentId: z.string().optional(),
  employeeId: z.string().optional(),
  phone: z.string().optional(),
  sendInvitation: z.boolean().default(true),
});

export const bulkCreateStaffAccountsSchema = z.object({
  accounts: z.array(createStaffAccountSchema).min(1).max(100),
});

export const updateStaffAccountSchema = z.object({
  role: z.enum(['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']).optional(),
  departmentId: z.string().nullable().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  employeeId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'ARCHIVED']).optional(),
});

export const assignRoleSchema = z.object({
  role: z.enum(['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  reason: z.string().optional(),
  departmentId: z.string().nullable().optional(),
});

export const bulkRoleUpdateSchema = z.object({
  userIds: z.array(z.string()).min(1).max(100),
  role: z.enum(['CITIZEN', 'CLERK', 'FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  reason: z.string().optional(),
  departmentId: z.string().nullable().optional(),
});

export class StaffAccountService {
  /**
   * Generate a secure temporary password
   */
  private static generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Generate invitation token
   */
  private static generateInvitationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create a new staff account
   */
  static async createStaffAccount(
    data: z.infer<typeof createStaffAccountSchema>,
    createdById: string
  ) {
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new Error('Email already exists');
    }

    // Validate department if provided
    if (data.departmentId) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId }
      });
      if (!department) {
        throw new Error('Invalid department ID');
      }
    }

    // Generate temporary password and invitation token
    const temporaryPassword = this.generateTemporaryPassword();
    const invitationToken = this.generateInvitationToken();
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create staff account record
    const staffAccount = await prisma.staffAccount.create({
      data: {
        email: data.email,
        temporaryPassword: await bcrypt.hash(temporaryPassword, 10),
        role: data.role,
        departmentId: data.departmentId,
        employeeId: data.employeeId,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        invitationToken,
        invitationExpires,
        createdBy: createdById,
        metadata: JSON.stringify({
          createdAt: new Date().toISOString(),
          createdBy: createdById,
          sendInvitation: data.sendInvitation,
        }),
      },
    });

    // Create the actual user account
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: `${data.firstName} ${data.lastName}`,
        firstName: data.firstName,
        lastName: data.lastName,
        passwordHash: await bcrypt.hash(temporaryPassword, 10),
        role: data.role,
        departmentId: data.departmentId,
        employeeId: data.employeeId,
        phone: data.phone,
        isStaffAccount: true,
        createdById,
        status: 'PASSWORD_RESET_REQUIRED',
        emailConfirmed: false,
        isActive: true,
      },
    });

    // Log role assignment
    await prisma.roleChangeHistory.create({
      data: {
        userId: user.id,
        previousRole: null,
        newRole: data.role,
        changedBy: createdById,
        reason: 'Staff account created',
        metadata: JSON.stringify({
          accountType: 'staff',
          departmentId: data.departmentId,
          employeeId: data.employeeId,
        }),
      },
    });

    return {
      user,
      temporaryPassword: data.sendInvitation ? temporaryPassword : undefined,
      invitationToken: data.sendInvitation ? invitationToken : undefined,
      invitationUrl: data.sendInvitation
        ? `${process.env.FRONTEND_URL}/auth/accept-invitation?token=${invitationToken}`
        : undefined,
    };
  }

  /**
   * Bulk create staff accounts
   */
  static async bulkCreateStaffAccounts(
    data: z.infer<typeof bulkCreateStaffAccountsSchema>,
    createdById: string
  ) {
    const results = [];
    const errors = [];

    for (const account of data.accounts) {
      try {
        const result = await this.createStaffAccount(account, createdById);
        results.push({
          email: account.email,
          success: true,
          ...result,
        });
      } catch (error: any) {
        errors.push({
          email: account.email,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      created: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  /**
   * Get all staff accounts with pagination
   */
  static async getStaffAccounts(params: {
    page?: number;
    limit?: number;
    role?: string;
    departmentId?: string;
    status?: string;
    search?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      // Show all non-citizen users as staff accounts
      role: {
        not: 'CITIZEN'
      }
    };

    if (params.role) {
      where.role = params.role;
    }

    if (params.departmentId) {
      where.departmentId = params.departmentId;
    }

    if (params.status) {
      if (params.status === 'ACTIVE') {
        // For active status, check isActive flag (most users don't have status field set)
        where.isActive = true;
      } else {
        where.status = params.status;
      }
    }

    if (params.search) {
      where.AND = [
        {
          OR: [
            { email: { contains: params.search } },
            { name: { contains: params.search } },
            { employeeId: { contains: params.search } },
          ]
        }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
          createdByStaff: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update staff account
   */
  static async updateStaffAccount(
    userId: string,
    data: z.infer<typeof updateStaffAccountSchema>,
    updatedById: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isStaffAccount) {
      throw new Error('User is not a staff account');
    }

    // Log role change if role is being updated
    if (data.role && data.role !== user.role) {
      await prisma.roleChangeHistory.create({
        data: {
          userId,
          previousRole: user.role,
          newRole: data.role,
          changedBy: updatedById,
          reason: 'Staff account role updated',
          metadata: JSON.stringify({
            updatedFields: Object.keys(data),
          }),
        },
      });
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: data.role,
        departmentId: data.departmentId,
        firstName: data.firstName,
        lastName: data.lastName,
        name: data.firstName && data.lastName
          ? `${data.firstName} ${data.lastName}`
          : undefined,
        phone: data.phone,
        employeeId: data.employeeId,
        status: data.status,
        statusChangedAt: data.status ? new Date() : undefined,
        statusChangeReason: data.status
          ? `Updated by admin ${updatedById}`
          : undefined,
      },
      include: {
        department: true,
      },
    });

    return updatedUser;
  }

  /**
   * Deactivate staff account
   */
  static async deactivateStaffAccount(userId: string, deactivatedById: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isStaffAccount) {
      throw new Error('User is not a staff account');
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'ARCHIVED',
        isActive: false,
        statusChangedAt: new Date(),
        statusChangeReason: `Deactivated by admin ${deactivatedById}`,
      },
    });

    // Log the change
    await prisma.roleChangeHistory.create({
      data: {
        userId,
        previousRole: user.role,
        newRole: user.role,
        changedBy: deactivatedById,
        reason: 'Staff account deactivated',
        metadata: JSON.stringify({
          action: 'deactivate',
          previousStatus: user.status,
        }),
      },
    });

    return updatedUser;
  }

  /**
   * Assign role to existing user
   */
  static async assignRoleToUser(
    userId: string,
    data: z.infer<typeof assignRoleSchema>,
    assignedById: string
  ) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Validate department if role requires it
    if (['CLERK', 'FIELD_AGENT', 'SUPERVISOR'].includes(data.role) && !data.departmentId) {
      throw new Error('Department ID is required for this role');
    }

    // Log role change
    await prisma.roleChangeHistory.create({
      data: {
        userId,
        previousRole: user.role,
        newRole: data.role,
        changedBy: assignedById,
        reason: data.reason || 'Role assignment',
        metadata: JSON.stringify({
          departmentId: data.departmentId,
          previousDepartmentId: user.departmentId,
        }),
      },
    });

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        role: data.role,
        departmentId: data.departmentId,
        isStaffAccount: data.role !== 'CITIZEN',
      },
      include: {
        department: true,
      },
    });

    return updatedUser;
  }

  /**
   * Bulk role assignment
   */
  static async bulkAssignRoles(
    data: z.infer<typeof bulkRoleUpdateSchema>,
    assignedById: string
  ) {
    const results = [];
    const errors = [];

    for (const userId of data.userIds) {
      try {
        const result = await this.assignRoleToUser(
          userId,
          {
            role: data.role,
            reason: data.reason,
            departmentId: data.departmentId,
          },
          assignedById
        );
        results.push({
          userId,
          success: true,
          user: result,
        });
      } catch (error: any) {
        errors.push({
          userId,
          success: false,
          error: error.message,
        });
      }
    }

    return {
      updated: results.length,
      failed: errors.length,
      results,
      errors,
    };
  }

  /**
   * Get users by role
   */
  static async getUsersByRole(roleId: string, params: {
    page?: number;
    limit?: number;
    departmentId?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      role: roleId,
    };

    if (params.departmentId) {
      where.departmentId = params.departmentId;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        include: {
          department: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get role change history for a user
   */
  static async getUserRoleHistory(userId: string) {
    const history = await prisma.roleChangeHistory.findMany({
      where: { userId },
      include: {
        performer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  }
}