import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface PermissionDefinition {
  resource: string;
  action: string;
  scope?: string;
  description: string;
}

export class PermissionService {
  /**
   * Default permissions for each role
   */
  private static readonly DEFAULT_PERMISSIONS: Record<string, PermissionDefinition[]> = {
    CITIZEN: [
      { resource: 'service_requests', action: 'view', scope: 'own', description: 'View own service requests' },
      { resource: 'service_requests', action: 'create', scope: 'own', description: 'Create service requests' },
      { resource: 'service_requests', action: 'edit', scope: 'own', description: 'Edit own service requests' },
      { resource: 'users', action: 'view', scope: 'own', description: 'View own profile' },
      { resource: 'users', action: 'edit', scope: 'own', description: 'Edit own profile' },
    ],
    CLERK: [
      { resource: 'service_requests', action: 'view', scope: 'department', description: 'View department service requests' },
      { resource: 'service_requests', action: 'create', scope: 'all', description: 'Create service requests' },
      { resource: 'service_requests', action: 'edit', scope: 'department', description: 'Edit department service requests' },
      { resource: 'service_requests', action: 'assign', scope: 'department', description: 'Assign service requests' },
      { resource: 'users', action: 'view', scope: 'all', description: 'View all users' },
      { resource: 'departments', action: 'view', scope: 'own', description: 'View own department' },
    ],
    FIELD_AGENT: [
      { resource: 'service_requests', action: 'view', scope: 'assigned', description: 'View assigned service requests' },
      { resource: 'service_requests', action: 'edit', scope: 'assigned', description: 'Update assigned service requests' },
      { resource: 'service_requests', action: 'resolve', scope: 'assigned', description: 'Resolve assigned service requests' },
      { resource: 'users', action: 'view', scope: 'own', description: 'View own profile' },
      { resource: 'users', action: 'edit', scope: 'own', description: 'Edit own profile' },
      { resource: 'departments', action: 'view', scope: 'own', description: 'View own department' },
    ],
    SUPERVISOR: [
      { resource: 'service_requests', action: 'view', scope: 'all', description: 'View all service requests' },
      { resource: 'service_requests', action: 'edit', scope: 'all', description: 'Edit all service requests' },
      { resource: 'service_requests', action: 'assign', scope: 'all', description: 'Assign service requests' },
      { resource: 'service_requests', action: 'resolve', scope: 'all', description: 'Resolve service requests' },
      { resource: 'service_requests', action: 'delete', scope: 'department', description: 'Delete department service requests' },
      { resource: 'users', action: 'view', scope: 'all', description: 'View all users' },
      { resource: 'users', action: 'manage', scope: 'department', description: 'Manage department users' },
      { resource: 'departments', action: 'view', scope: 'all', description: 'View all departments' },
      { resource: 'departments', action: 'manage', scope: 'own', description: 'Manage own department' },
      { resource: 'reports', action: 'view', scope: 'all', description: 'View all reports' },
      { resource: 'reports', action: 'export', scope: 'all', description: 'Export reports' },
    ],
    ADMIN: [
      { resource: 'service_requests', action: 'view', scope: 'all', description: 'View all service requests' },
      { resource: 'service_requests', action: 'create', scope: 'all', description: 'Create service requests' },
      { resource: 'service_requests', action: 'edit', scope: 'all', description: 'Edit all service requests' },
      { resource: 'service_requests', action: 'delete', scope: 'all', description: 'Delete all service requests' },
      { resource: 'service_requests', action: 'assign', scope: 'all', description: 'Assign service requests' },
      { resource: 'service_requests', action: 'resolve', scope: 'all', description: 'Resolve service requests' },
      { resource: 'users', action: 'view', scope: 'all', description: 'View all users' },
      { resource: 'users', action: 'create', scope: 'all', description: 'Create users' },
      { resource: 'users', action: 'edit', scope: 'all', description: 'Edit all users' },
      { resource: 'users', action: 'delete', scope: 'all', description: 'Delete users' },
      { resource: 'users', action: 'manage', scope: 'all', description: 'Manage all users' },
      { resource: 'departments', action: 'view', scope: 'all', description: 'View all departments' },
      { resource: 'departments', action: 'create', scope: 'all', description: 'Create departments' },
      { resource: 'departments', action: 'edit', scope: 'all', description: 'Edit departments' },
      { resource: 'departments', action: 'delete', scope: 'all', description: 'Delete departments' },
      { resource: 'departments', action: 'manage', scope: 'all', description: 'Manage all departments' },
      { resource: 'reports', action: 'view', scope: 'all', description: 'View all reports' },
      { resource: 'reports', action: 'create', scope: 'all', description: 'Create reports' },
      { resource: 'reports', action: 'export', scope: 'all', description: 'Export reports' },
      { resource: 'system', action: 'manage', scope: 'all', description: 'Manage system settings' },
      { resource: 'system', action: 'audit', scope: 'all', description: 'View audit logs' },
    ],
  };

  /**
   * Initialize roles and permissions in the database
   */
  static async initializeRolesAndPermissions() {
    const roles = [
      { name: 'CITIZEN', displayName: 'Citizen', description: 'Default role for public users', hierarchy: 1 },
      { name: 'CLERK', displayName: 'Clerk', description: 'Staff role for processing requests', hierarchy: 2 },
      { name: 'FIELD_AGENT', displayName: 'Field Agent', description: 'Mobile workers handling on-site delivery', hierarchy: 2 },
      { name: 'SUPERVISOR', displayName: 'Supervisor', description: 'Management role overseeing operations', hierarchy: 3 },
      { name: 'ADMIN', displayName: 'Administrator', description: 'System administrators with full access', hierarchy: 4 },
    ];

    // Create roles
    for (const roleData of roles) {
      await prisma.role.upsert({
        where: { name: roleData.name },
        update: roleData,
        create: roleData,
      });
    }

    // Create permissions and assign to roles
    for (const [roleName, permissions] of Object.entries(this.DEFAULT_PERMISSIONS)) {
      const role = await prisma.role.findUnique({ where: { name: roleName } });
      if (!role) continue;

      for (const permDef of permissions) {
        // Create or get permission
        const permission = await prisma.permission.upsert({
          where: {
            resource_action_scope: {
              resource: permDef.resource,
              action: permDef.action,
              scope: permDef.scope || '',
            },
          },
          update: { description: permDef.description },
          create: {
            resource: permDef.resource,
            action: permDef.action,
            scope: permDef.scope,
            description: permDef.description,
          },
        });

        // Create role-permission association
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: role.id,
              permissionId: permission.id,
            },
          },
          update: { granted: true },
          create: {
            roleId: role.id,
            permissionId: permission.id,
            granted: true,
          },
        });
      }
    }
  }

  /**
   * Check if a user has a specific permission
   */
  static async hasPermission(
    userId: string,
    resource: string,
    action: string,
    scope?: string
  ): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        rolePermissions: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
            permission: true,
          },
        },
      },
    });

    if (!user) return false;

    // Check direct user permissions (overrides)
    const userPermission = user.rolePermissions.find(
      (up) =>
        up.permission &&
        up.permission.resource === resource &&
        up.permission.action === action &&
        (!scope || up.permission.scope === scope)
    );

    if (userPermission) {
      return userPermission.granted;
    }

    // Check role-based permissions
    const role = await prisma.role.findUnique({
      where: { name: user.role },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) return false;

    const rolePermission = role.permissions.find(
      (rp) =>
        rp.permission.resource === resource &&
        rp.permission.action === action &&
        (!scope || rp.permission.scope === scope || rp.permission.scope === 'all')
    );

    return rolePermission ? rolePermission.granted : false;
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) return [];

    // Get role permissions
    const role = await prisma.role.findUnique({
      where: { name: user.role },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    const rolePermissions = role?.permissions.map((rp) => ({
      ...rp.permission,
      granted: rp.granted,
      source: 'role',
    })) || [];

    // Get user-specific permissions (overrides)
    const userPermissions = await prisma.userRolePermission.findMany({
      where: { userId },
      include: {
        permission: true,
      },
    });

    const userOverrides = userPermissions
      .filter((up) => up.permission)
      .map((up) => ({
        ...up.permission!,
        granted: up.granted,
        source: 'user',
        expiresAt: up.expiresAt,
      }));

    // Merge permissions (user overrides take precedence)
    const permissionMap = new Map();

    rolePermissions.forEach((p) => {
      const key = `${p.resource}-${p.action}-${p.scope || ''}`;
      permissionMap.set(key, p);
    });

    userOverrides.forEach((p) => {
      const key = `${p.resource}-${p.action}-${p.scope || ''}`;
      permissionMap.set(key, p);
    });

    return Array.from(permissionMap.values());
  }

  /**
   * Grant permission to a user
   */
  static async grantPermission(
    userId: string,
    permissionId: string,
    grantedBy: string,
    reason?: string,
    expiresAt?: Date
  ) {
    const permission = await prisma.permission.findUnique({
      where: { id: permissionId },
    });

    if (!permission) {
      throw new Error('Permission not found');
    }

    const userPermission = await prisma.userRolePermission.upsert({
      where: {
        userId_roleId_permissionId: {
          userId,
          roleId: null,
          permissionId,
        },
      },
      update: {
        granted: true,
        expiresAt,
        grantedBy,
        reason,
      },
      create: {
        userId,
        permissionId,
        granted: true,
        expiresAt,
        grantedBy,
        reason,
      },
    });

    return userPermission;
  }

  /**
   * Revoke permission from a user
   */
  static async revokePermission(
    userId: string,
    permissionId: string,
    revokedBy: string,
    reason?: string
  ) {
    const userPermission = await prisma.userRolePermission.upsert({
      where: {
        userId_roleId_permissionId: {
          userId,
          roleId: null,
          permissionId,
        },
      },
      update: {
        granted: false,
        grantedBy: revokedBy,
        reason,
      },
      create: {
        userId,
        permissionId,
        granted: false,
        grantedBy: revokedBy,
        reason,
      },
    });

    return userPermission;
  }

  /**
   * Get all roles with their permissions
   */
  static async getRolesWithPermissions() {
    const roles = await prisma.role.findMany({
      where: { isActive: true },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            userRoles: true,
          },
        },
      },
      orderBy: { hierarchy: 'desc' },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      displayName: role.displayName,
      description: role.description,
      hierarchy: role.hierarchy,
      isSystem: role.isSystem,
      userCount: role._count.userRoles,
      permissions: role.permissions.map((rp) => ({
        ...rp.permission,
        granted: rp.granted,
      })),
    }));
  }

  /**
   * Update multiple permissions for a role
   */
  static async updateRolePermissions(
    roleId: string,
    permissions: Array<{ permissionId: string; granted: boolean }>
  ) {
    // Delete existing permissions for this role
    await prisma.rolePermission.deleteMany({
      where: { roleId },
    });

    // Create new permissions
    const rolePermissions = permissions.map((p) => ({
      roleId,
      permissionId: p.permissionId,
      granted: p.granted,
    }));

    await prisma.rolePermission.createMany({
      data: rolePermissions,
    });

    return rolePermissions;
  }

  /**
   * Toggle a single permission for a role
   */
  static async toggleRolePermission(
    roleId: string,
    permissionId: string,
    granted: boolean
  ) {
    const existing = await prisma.rolePermission.findUnique({
      where: {
        roleId_permissionId: {
          roleId,
          permissionId,
        },
      },
    });

    if (existing) {
      // Update existing
      return await prisma.rolePermission.update({
        where: {
          roleId_permissionId: {
            roleId,
            permissionId,
          },
        },
        data: { granted },
      });
    } else {
      // Create new
      return await prisma.rolePermission.create({
        data: {
          roleId,
          permissionId,
          granted,
        },
      });
    }
  }

  /**
   * Get permission matrix (all roles vs all permissions)
   */
  static async getPermissionMatrix() {
    const [roles, permissions] = await Promise.all([
      prisma.role.findMany({
        where: { isActive: true },
        orderBy: { hierarchy: 'desc' },
      }),
      prisma.permission.findMany({
        where: { isActive: true },
        orderBy: [{ resource: 'asc' }, { action: 'asc' }, { scope: 'asc' }],
      }),
    ]);

    const rolePermissions = await prisma.rolePermission.findMany();

    const matrix = permissions.map((permission) => {
      const permissionRow: any = {
        id: permission.id,
        resource: permission.resource,
        action: permission.action,
        scope: permission.scope,
        description: permission.description,
      };

      roles.forEach((role) => {
        const hasPermission = rolePermissions.find(
          (rp) => rp.roleId === role.id && rp.permissionId === permission.id && rp.granted
        );
        permissionRow[role.name] = !!hasPermission;
      });

      return permissionRow;
    });

    return {
      roles: roles.map((r) => ({
        id: r.id,
        name: r.name,
        displayName: r.displayName,
      })),
      permissions: matrix,
    };
  }
}