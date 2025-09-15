import { Router, Response } from 'express';
import { authenticateToken, AuthenticatedRequest, rbacGuard } from '../middleware/auth';
import TestingFeatureFlagService from '../services/testingFeatureFlags';
import { getActiveFlags } from '../middleware/testingFlags';

const router = Router();

/**
 * @swagger
 * /api/testing-flags:
 *   get:
 *     summary: Get all testing feature flags
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all testing feature flags
 */
router.get('/', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  try {
    const flags = await TestingFeatureFlagService.getAllFlags();
    const masterFlag = flags.find(f => f.key === 'MASTER_TESTING_FLAGS_ENABLED');
    
    res.json({
      data: {
        masterControl: masterFlag,
        flags: flags.filter(f => f.key !== 'MASTER_TESTING_FLAGS_ENABLED'),
        categories: ['Authentication', 'ServiceRequests', 'UI/UX', 'Search', 'Notifications']
      },
      correlationId: `flags_${Date.now()}`
    });
  } catch (error) {
    console.error('Error fetching testing flags:', error);
    res.status(500).json({
      error: 'Failed to fetch testing flags',
      correlationId: `err_${Date.now()}`
    });
  }
});

/**
 * @swagger
 * /api/testing-flags/active:
 *   get:
 *     summary: Get all active testing flags (for frontend)
 *     tags: [Testing Flags]
 *     responses:
 *       200:
 *         description: Map of flag keys to enabled status
 */
router.get('/active', getActiveFlags);

/**
 * @swagger
 * /api/testing-flags/statistics:
 *   get:
 *     summary: Get testing flag statistics
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics about testing flags
 */
router.get('/statistics', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  try {
    const stats = await TestingFeatureFlagService.getStatistics();
    
    res.json({
      data: stats,
      correlationId: `stats_${Date.now()}`
    });
  } catch (error) {
    console.error('Error fetching flag statistics:', error);
    res.status(500).json({
      error: 'Failed to fetch statistics',
      correlationId: `err_${Date.now()}`
    });
  }
});

/**
 * @swagger
 * /api/testing-flags/category/{category}:
 *   get:
 *     summary: Get flags by category
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of flags in the category
 */
router.get('/category/:category', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  try {
    const { category } = req.params;
    const flags = await TestingFeatureFlagService.getFlagsByCategory(category);
    
    res.json({
      data: flags,
      correlationId: `cat_${Date.now()}`
    });
  } catch (error) {
    console.error('Error fetching category flags:', error);
    res.status(500).json({
      error: 'Failed to fetch category flags',
      correlationId: `err_${Date.now()}`
    });
  }
});

/**
 * @swagger
 * /api/testing-flags/{key}:
 *   patch:
 *     summary: Update a testing flag
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: key
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
 *               isEnabled:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Updated flag
 */
router.patch('/:key', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  try {
    const { key } = req.params;
    const { isEnabled } = req.body;
    
    if (typeof isEnabled !== 'boolean') {
      return res.status(400).json({
        error: 'isEnabled must be a boolean',
        correlationId: `err_${Date.now()}`
      });
    }
    
    const updated = await TestingFeatureFlagService.updateFlag(key, isEnabled);
    
    if (!updated) {
      return res.status(404).json({
        error: 'Flag not found',
        correlationId: `err_${Date.now()}`
      });
    }
    
    res.json({
      data: updated,
      correlationId: `update_${Date.now()}`
    });
  } catch (error) {
    console.error('Error updating flag:', error);
    res.status(500).json({
      error: 'Failed to update flag',
      correlationId: `err_${Date.now()}`
    });
  }
});

/**
 * @swagger
 * /api/testing-flags/bulk:
 *   patch:
 *     summary: Bulk update testing flags
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               updates:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                     isEnabled:
 *                       type: boolean
 *     responses:
 *       200:
 *         description: Flags updated successfully
 */
router.patch('/bulk', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  try {
    const { updates } = req.body;
    
    if (!Array.isArray(updates)) {
      return res.status(400).json({
        error: 'updates must be an array',
        correlationId: `err_${Date.now()}`
      });
    }
    
    await TestingFeatureFlagService.bulkUpdateFlags(updates);
    
    res.json({
      data: { updated: updates.length },
      correlationId: `bulk_${Date.now()}`
    });
  } catch (error) {
    console.error('Error bulk updating flags:', error);
    res.status(500).json({
      error: 'Failed to bulk update flags',
      correlationId: `err_${Date.now()}`
    });
  }
});

/**
 * @swagger
 * /api/testing-flags/category/{category}/enable:
 *   post:
 *     summary: Enable all flags in a category
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category flags enabled
 */
router.post('/category/:category/enable', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  try {
    const { category } = req.params;
    await TestingFeatureFlagService.enableCategory(category);
    
    res.json({
      data: { message: `All flags in category "${category}" enabled` },
      correlationId: `enable_${Date.now()}`
    });
  } catch (error) {
    console.error('Error enabling category:', error);
    res.status(500).json({
      error: 'Failed to enable category',
      correlationId: `err_${Date.now()}`
    });
  }
});

/**
 * @swagger
 * /api/testing-flags/category/{category}/disable:
 *   post:
 *     summary: Disable all flags in a category
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: category
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Category flags disabled
 */
router.post('/category/:category/disable', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  try {
    const { category } = req.params;
    await TestingFeatureFlagService.disableCategory(category);
    
    res.json({
      data: { message: `All flags in category "${category}" disabled` },
      correlationId: `disable_${Date.now()}`
    });
  } catch (error) {
    console.error('Error disabling category:', error);
    res.status(500).json({
      error: 'Failed to disable category',
      correlationId: `err_${Date.now()}`
    });
  }
});

/**
 * @swagger
 * /api/testing-flags/reset:
 *   post:
 *     summary: Reset all flags to default values
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All flags reset to defaults
 */
router.post('/reset', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  try {
    await TestingFeatureFlagService.resetAllFlags();
    
    res.json({
      data: { message: 'All flags reset to default values' },
      correlationId: `reset_${Date.now()}`
    });
  } catch (error) {
    console.error('Error resetting flags:', error);
    res.status(500).json({
      error: 'Failed to reset flags',
      correlationId: `err_${Date.now()}`
    });
  }
});

/**
 * @swagger
 * /api/testing-flags/presets:
 *   get:
 *     summary: Get available flag presets
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available presets
 */
router.get('/presets', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  const presets = [
    {
      id: 'all-ui-bugs',
      name: 'Enable All UI Bugs',
      description: 'Enable all UI/UX testing flags',
      category: 'UI/UX'
    },
    {
      id: 'all-high-impact',
      name: 'Enable High Impact Bugs',
      description: 'Enable all high impact testing flags',
      impact: 'HIGH'
    },
    {
      id: 'authentication-issues',
      name: 'Authentication Issues',
      description: 'Enable all authentication testing flags',
      category: 'Authentication'
    },
    {
      id: 'service-request-bugs',
      name: 'Service Request Bugs',
      description: 'Enable all service request testing flags',
      category: 'ServiceRequests'
    },
    {
      id: 'search-problems',
      name: 'Search Problems',
      description: 'Enable all search and filter testing flags',
      category: 'Search'
    },
    {
      id: 'notification-glitches',
      name: 'Notification Glitches',
      description: 'Enable all notification testing flags',
      category: 'Notifications'
    }
  ];
  
  res.json({
    data: presets,
    correlationId: `presets_${Date.now()}`
  });
});

/**
 * @swagger
 * /api/testing-flags/presets/{presetId}:
 *   post:
 *     summary: Apply a flag preset
 *     tags: [Testing Flags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: presetId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Preset applied successfully
 */
router.post('/presets/:presetId', authenticateToken, rbacGuard(['ADMIN']), async (req, res) => {
  try {
    const { presetId } = req.params;
    
    switch (presetId) {
      case 'all-ui-bugs':
        await TestingFeatureFlagService.enableCategory('UI/UX');
        break;
        
      case 'all-high-impact':
        const allFlags = await TestingFeatureFlagService.getAllFlags();
        const highImpactFlags = allFlags
          .filter(f => f.impactLevel === 'HIGH' && f.key !== 'MASTER_TESTING_FLAGS_ENABLED')
          .map(f => ({ key: f.key, isEnabled: true }));
        await TestingFeatureFlagService.bulkUpdateFlags(highImpactFlags);
        break;
        
      case 'authentication-issues':
        await TestingFeatureFlagService.enableCategory('Authentication');
        break;
        
      case 'service-request-bugs':
        await TestingFeatureFlagService.enableCategory('ServiceRequests');
        break;
        
      case 'search-problems':
        await TestingFeatureFlagService.enableCategory('Search');
        break;
        
      case 'notification-glitches':
        await TestingFeatureFlagService.enableCategory('Notifications');
        break;
        
      default:
        return res.status(400).json({
          error: 'Invalid preset ID',
          correlationId: `err_${Date.now()}`
        });
    }
    
    res.json({
      data: { message: `Preset "${presetId}" applied successfully` },
      correlationId: `preset_${Date.now()}`
    });
  } catch (error) {
    console.error('Error applying preset:', error);
    res.status(500).json({
      error: 'Failed to apply preset',
      correlationId: `err_${Date.now()}`
    });
  }
});

export default router;