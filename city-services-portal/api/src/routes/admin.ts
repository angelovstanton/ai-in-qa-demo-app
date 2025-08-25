import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';
import { FeatureFlagService } from '../services/featureFlags';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateFlagSchema = z.object({
  value: z.any()
});

// GET /api/v1/admin/flags - Get all feature flags
router.get('/flags', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const flags = await FeatureFlagService.getAllFlags();

    res.json({
      data: flags,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch feature flags',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// PATCH /api/v1/admin/flags/:key - Update specific feature flag
router.patch('/flags/:key', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { key } = req.params;
    const validatedData = updateFlagSchema.parse(req.body);

    await FeatureFlagService.setFlag(key, validatedData.value);

    const updatedFlags = await FeatureFlagService.getAllFlags();

    res.json({
      data: {
        key,
        value: validatedData.value,
        allFlags: updatedFlags
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid flag data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update feature flag',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/admin/seed - Re-seed the database
router.post('/seed', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would typically run the seed script
    // For now, just return success
    res.json({
      data: {
        message: 'Database seeding initiated',
        status: 'success'
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to seed database',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/admin/reset - Reset the database
router.post('/reset', authenticateToken, rbacGuard(['ADMIN']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This would typically run the reset script
    // For now, just return success
    res.json({
      data: {
        message: 'Database reset initiated',
        status: 'success'
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to reset database',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;