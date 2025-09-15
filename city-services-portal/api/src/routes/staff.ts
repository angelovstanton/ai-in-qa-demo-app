import { Router, Response } from 'express';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import {
  StaffAccountService,
  createStaffAccountSchema,
  bulkCreateStaffAccountsSchema,
  updateStaffAccountSchema,
  assignRoleSchema,
  bulkRoleUpdateSchema,
} from '../services/staffAccountService';
import { PermissionService } from '../services/permissionService';
import { z } from 'zod';

const router = Router();

/**
 * @swagger
 * /api/v1/admin/staff:
 *   post:
 *     summary: Create new staff account
 *     description: Creates a new staff account with specified role and department
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [CLERK, FIELD_AGENT, SUPERVISOR, ADMIN]
 *               departmentId:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               phone:
 *                 type: string
 *               sendInvitation:
 *                 type: boolean
 *                 default: true
 *     responses:
 *       201:
 *         description: Staff account created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
// POST /api/v1/admin/staff - Create new staff account
router.post('/staff', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = createStaffAccountSchema.parse(req.body);
    
    const result = await StaffAccountService.createStaffAccount(
      validatedData,
      req.user!.id
    );

    res.status(201).json({
      data: result,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid staff account data',
          details: error.errors,
          correlationId: res.locals.correlationId,
        },
      });
    }

    if (error instanceof Error && error.message === 'Email already exists') {
      return res.status(409).json({
        error: {
          code: 'CONFLICT',
          message: 'Email already exists',
          correlationId: res.locals.correlationId,
        },
      });
    }

    console.error('Staff account creation error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create staff account',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/staff/bulk-create:
 *   post:
 *     summary: Bulk create staff accounts
 *     description: Create multiple staff accounts in a single operation
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - accounts
 *             properties:
 *               accounts:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                     firstName:
 *                       type: string
 *                     lastName:
 *                       type: string
 *                     role:
 *                       type: string
 *     responses:
 *       201:
 *         description: Bulk creation completed
 *       400:
 *         description: Validation error
 */
// POST /api/v1/admin/staff/bulk-create - Bulk create staff accounts
router.post('/staff/bulk-create', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = bulkCreateStaffAccountsSchema.parse(req.body);
    
    const result = await StaffAccountService.bulkCreateStaffAccounts(
      validatedData,
      req.user!.id
    );

    res.status(201).json({
      data: result,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid bulk create data',
          details: error.errors,
          correlationId: res.locals.correlationId,
        },
      });
    }

    console.error('Bulk staff account creation error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to bulk create staff accounts',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/staff:
 *   get:
 *     summary: List all staff accounts
 *     description: Get paginated list of staff accounts with optional filters
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [CLERK, FIELD_AGENT, SUPERVISOR, ADMIN]
 *       - in: query
 *         name: departmentId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, INACTIVE, SUSPENDED, ARCHIVED]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of staff accounts
 *       401:
 *         description: Unauthorized
 */
// GET /api/v1/admin/staff - List all staff accounts
router.get('/staff', authenticateToken, rbacGuard(['ADMIN', 'SUPERVISOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { page, limit, role, departmentId, status, search } = req.query;
    
    const result = await StaffAccountService.getStaffAccounts({
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      role: role as string,
      departmentId: departmentId as string,
      status: status as string,
      search: search as string,
    });

    res.json({
      data: result.users,
      pagination: result.pagination,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    console.error('Staff account fetch error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch staff accounts',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/staff/{id}:
 *   put:
 *     summary: Update staff account
 *     description: Update staff account details and role
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *               departmentId:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phone:
 *                 type: string
 *               employeeId:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Account updated successfully
 *       404:
 *         description: User not found
 */
// PUT /api/v1/admin/staff/:id - Update staff account
router.put('/staff/:id', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateStaffAccountSchema.parse(req.body);
    
    const result = await StaffAccountService.updateStaffAccount(
      id,
      validatedData,
      req.user!.id
    );

    res.json({
      data: result,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid update data',
          details: error.errors,
          correlationId: res.locals.correlationId,
        },
      });
    }

    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          correlationId: res.locals.correlationId,
        },
      });
    }

    console.error('Staff account update error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update staff account',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/staff/{id}:
 *   delete:
 *     summary: Deactivate staff account
 *     description: Deactivate a staff account (sets status to ARCHIVED)
 *     tags: [Staff Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Account deactivated successfully
 *       404:
 *         description: User not found
 */
// DELETE /api/v1/admin/staff/:id - Deactivate staff account
router.delete('/staff/:id', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = await StaffAccountService.deactivateStaffAccount(
      id,
      req.user!.id
    );

    res.json({
      data: result,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          correlationId: res.locals.correlationId,
        },
      });
    }

    console.error('Staff account deactivation error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to deactivate staff account',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/users/{id}/role:
 *   patch:
 *     summary: Assign role to existing user
 *     description: Change the role of an existing user account
 *     tags: [Role Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - role
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [CITIZEN, CLERK, FIELD_AGENT, SUPERVISOR, ADMIN]
 *               reason:
 *                 type: string
 *               departmentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Role assigned successfully
 *       404:
 *         description: User not found
 */
// PATCH /api/v1/admin/users/:id/role - Assign role to existing user
router.patch('/users/:id/role', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = assignRoleSchema.parse(req.body);
    
    const result = await StaffAccountService.assignRoleToUser(
      id,
      validatedData,
      req.user!.id
    );

    res.json({
      data: result,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid role assignment data',
          details: error.errors,
          correlationId: res.locals.correlationId,
        },
      });
    }

    if (error instanceof Error && error.message === 'User not found') {
      return res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
          correlationId: res.locals.correlationId,
        },
      });
    }

    console.error('Role assignment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to assign role',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

// POST /api/v1/admin/users/bulk-role-update - Bulk role assignment
router.post('/users/bulk-role-update', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const validatedData = bulkRoleUpdateSchema.parse(req.body);
    
    const result = await StaffAccountService.bulkAssignRoles(
      validatedData,
      req.user!.id
    );

    res.json({
      data: result,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid bulk role update data',
          details: error.errors,
          correlationId: res.locals.correlationId,
        },
      });
    }

    console.error('Bulk role assignment error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to bulk assign roles',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

// GET /api/v1/admin/users/by-role/:roleId - Get users by role
router.get('/users/by-role/:roleId', authenticateToken, rbacGuard(['ADMIN', 'SUPERVISOR']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const { page, limit, departmentId } = req.query;
    
    const result = await StaffAccountService.getUsersByRole(roleId, {
      page: page ? parseInt(page as string) : undefined,
      limit: limit ? parseInt(limit as string) : undefined,
      departmentId: departmentId as string,
    });

    res.json({
      data: result.users,
      pagination: result.pagination,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    console.error('Users by role fetch error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch users by role',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

// GET /api/v1/admin/users/:id/role-history - Get user's role change history
router.get('/users/:id/role-history', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const history = await StaffAccountService.getUserRoleHistory(id);

    res.json({
      data: history,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    console.error('Role history fetch error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch role history',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/roles:
 *   get:
 *     summary: Get all roles with permissions
 *     description: Retrieve all system roles with their associated permissions
 *     tags: [Role Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of roles with permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       displayName:
 *                         type: string
 *                       description:
 *                         type: string
 *                       hierarchy:
 *                         type: integer
 *                       isSystem:
 *                         type: boolean
 *                       userCount:
 *                         type: integer
 *                       permissions:
 *                         type: array
 */
// GET /api/v1/admin/roles - Get all roles with permissions
router.get('/roles', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const roles = await PermissionService.getRolesWithPermissions();

    res.json({
      data: roles,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    console.error('Roles fetch error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch roles',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/permissions/matrix:
 *   get:
 *     summary: Get permission matrix
 *     description: Get a matrix showing all permissions for all roles
 *     tags: [Permission Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Permission matrix
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     roles:
 *                       type: array
 *                     permissions:
 *                       type: array
 */
// GET /api/v1/admin/permissions/matrix - Get permission matrix
router.get('/permissions/matrix', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const matrix = await PermissionService.getPermissionMatrix();

    res.json({
      data: matrix,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    console.error('Permission matrix fetch error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch permission matrix',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

// GET /api/v1/admin/users/:id/permissions - Get user's permissions
router.get('/users/:id/permissions', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    
    const permissions = await PermissionService.getUserPermissions(id);

    res.json({
      data: permissions,
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    console.error('User permissions fetch error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch user permissions',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/permissions/initialize:
 *   post:
 *     summary: Initialize roles and permissions
 *     description: Initialize default system roles and permissions
 *     tags: [Permission Management]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Roles and permissions initialized
 *       500:
 *         description: Failed to initialize permissions
 */
// POST /api/v1/admin/permissions/initialize - Initialize roles and permissions
router.post('/permissions/initialize', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    await PermissionService.initializeRolesAndPermissions();

    res.json({
      data: {
        message: 'Roles and permissions initialized successfully',
        status: 'success',
      },
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    console.error('Permission initialization error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to initialize permissions',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/roles/{roleId}/permissions:
 *   put:
 *     summary: Update role permissions
 *     description: Update all permissions for a specific role
 *     tags: [Permission Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissions
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     permissionId:
 *                       type: string
 *                     granted:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Permissions updated successfully
 */
// PUT /api/v1/admin/roles/:roleId/permissions - Update role permissions
router.put('/roles/:roleId/permissions', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissions } = req.body; // Array of { permissionId, granted }
    
    await PermissionService.updateRolePermissions(roleId, permissions);
    
    res.json({
      data: {
        message: 'Role permissions updated successfully',
        roleId,
        updatedPermissions: permissions.length,
      },
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    console.error('Role permission update error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update role permissions',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

/**
 * @swagger
 * /api/v1/admin/roles/{roleId}/permission:
 *   post:
 *     summary: Toggle single permission
 *     description: Toggle a single permission for a role
 *     tags: [Permission Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - permissionId
 *               - granted
 *             properties:
 *               permissionId:
 *                 type: string
 *               granted:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Permission toggled successfully
 */
// POST /api/v1/admin/roles/:roleId/permission - Toggle single permission
router.post('/roles/:roleId/permission', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { roleId } = req.params;
    const { permissionId, granted } = req.body;
    
    await PermissionService.toggleRolePermission(roleId, permissionId, granted);
    
    res.json({
      data: {
        message: 'Permission toggled successfully',
        roleId,
        permissionId,
        granted,
      },
      correlationId: res.locals.correlationId,
    });
  } catch (error) {
    console.error('Permission toggle error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to toggle permission',
        correlationId: res.locals.correlationId,
      },
    });
  }
});

export default router;