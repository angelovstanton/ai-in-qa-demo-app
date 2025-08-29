import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import { authenticateToken, authorizeRoles } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { generateCorrelationId } from '../utils/correlation';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5 // Max 5 files at once
  },
  fileFilter: (req, file, cb) => {
    // Accept only images
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Schemas
const UploadPhotoSchema = z.object({
  workOrderId: z.string().uuid(),
  photoType: z.enum(['BEFORE', 'DURING', 'AFTER', 'ISSUE', 'SAFETY']),
  caption: z.string().optional(),
  gpsLat: z.coerce.number().min(-90).max(90).optional(),
  gpsLng: z.coerce.number().min(-180).max(180).optional()
});

const UpdatePhotoSchema = z.object({
  caption: z.string().optional(),
  photoType: z.enum(['BEFORE', 'DURING', 'AFTER', 'ISSUE', 'SAFETY']).optional()
});

// POST /api/v1/field-photos/upload - Upload field photos
router.post(
  '/upload',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  upload.array('photos', 5),
  validateRequest({ body: UploadPhotoSchema }),
  async (req, res) => {
    try {
      const { workOrderId, photoType, caption, gpsLat, gpsLng } = req.body as z.infer<typeof UploadPhotoSchema>;
      const agentId = req.user!.id;
      const files = req.files as Express.Multer.File[];

      if (!files || files.length === 0) {
        return res.status(400).json({ 
          error: 'No files uploaded',
          correlationId: generateCorrelationId(req)
        });
      }

      // Verify work order exists and is assigned to agent
      const workOrder = await prisma.fieldWorkOrder.findUnique({
        where: { id: workOrderId }
      });

      if (!workOrder) {
        return res.status(404).json({ 
          error: 'Work order not found',
          correlationId: generateCorrelationId(req)
        });
      }

      if (workOrder.assignedAgentId !== agentId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      // Create photo records
      const photos = await Promise.all(
        files.map(async (file, index) => {
          return prisma.fieldPhoto.create({
            data: {
              workOrderId,
              agentId,
              photoType,
              filename: file.originalname,
              mime: file.mimetype,
              size: file.size,
              data: file.buffer,
              caption: index === 0 ? caption : undefined, // Only first photo gets the caption
              gpsLat,
              gpsLng,
              timestamp: new Date()
            },
            select: {
              id: true,
              photoType: true,
              filename: true,
              size: true,
              caption: true,
              timestamp: true
            }
          });
        })
      );

      // Log event
      await prisma.eventLog.create({
        data: {
          requestId: workOrder.requestId,
          type: 'PHOTOS_UPLOADED',
          payload: JSON.stringify({
            workOrderId,
            photoType,
            count: photos.length,
            uploadedBy: req.user!.name
          })
        }
      });

      res.status(201).json({
        data: photos,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error uploading photos:', error);
      res.status(500).json({ 
        error: 'Failed to upload photos',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// GET /api/v1/field-photos/work-order/:workOrderId - Get photos for work order
router.get(
  '/work-order/:workOrderId',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT', 'SUPERVISOR', 'ADMIN', 'CLERK']),
  async (req, res) => {
    try {
      const { workOrderId } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Verify access
      if (userRole === 'FIELD_AGENT') {
        const workOrder = await prisma.fieldWorkOrder.findUnique({
          where: { id: workOrderId }
        });

        if (!workOrder || workOrder.assignedAgentId !== userId) {
          return res.status(403).json({ 
            error: 'Access denied',
            correlationId: generateCorrelationId(req)
          });
        }
      }

      // Get photos without data (for listing)
      const photos = await prisma.fieldPhoto.findMany({
        where: { workOrderId },
        select: {
          id: true,
          photoType: true,
          filename: true,
          size: true,
          caption: true,
          gpsLat: true,
          gpsLng: true,
          timestamp: true,
          agent: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      // Group by type
      const groupedPhotos = photos.reduce((acc, photo) => {
        if (!acc[photo.photoType]) {
          acc[photo.photoType] = [];
        }
        acc[photo.photoType].push(photo);
        return acc;
      }, {} as Record<string, typeof photos>);

      res.json({
        data: {
          all: photos,
          byType: groupedPhotos,
          count: {
            total: photos.length,
            before: groupedPhotos.BEFORE?.length || 0,
            during: groupedPhotos.DURING?.length || 0,
            after: groupedPhotos.AFTER?.length || 0,
            issue: groupedPhotos.ISSUE?.length || 0,
            safety: groupedPhotos.SAFETY?.length || 0
          }
        },
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error fetching photos:', error);
      res.status(500).json({ 
        error: 'Failed to fetch photos',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// GET /api/v1/field-photos/:id - Get specific photo with data
router.get(
  '/:id',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT', 'SUPERVISOR', 'ADMIN', 'CLERK']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get photo
      const photo = await prisma.fieldPhoto.findUnique({
        where: { id },
        include: {
          workOrder: {
            select: {
              id: true,
              assignedAgentId: true
            }
          }
        }
      });

      if (!photo) {
        return res.status(404).json({ 
          error: 'Photo not found',
          correlationId: generateCorrelationId(req)
        });
      }

      // Verify access for field agents
      if (userRole === 'FIELD_AGENT' && photo.workOrder.assignedAgentId !== userId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      // Send image data
      res.setHeader('Content-Type', photo.mime);
      res.setHeader('Content-Length', photo.size.toString());
      res.setHeader('Content-Disposition', `inline; filename="${photo.filename}"`);
      res.send(photo.data);
    } catch (error) {
      console.error('Error fetching photo:', error);
      res.status(500).json({ 
        error: 'Failed to fetch photo',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// PATCH /api/v1/field-photos/:id - Update photo metadata
router.patch(
  '/:id',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  validateRequest({ body: UpdatePhotoSchema }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body as z.infer<typeof UpdatePhotoSchema>;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get photo
      const photo = await prisma.fieldPhoto.findUnique({
        where: { id },
        include: {
          workOrder: {
            select: {
              id: true,
              assignedAgentId: true
            }
          }
        }
      });

      if (!photo) {
        return res.status(404).json({ 
          error: 'Photo not found',
          correlationId: generateCorrelationId(req)
        });
      }

      // Field agents can only update their own photos
      if (userRole === 'FIELD_AGENT' && photo.agentId !== userId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      // Update photo
      const updated = await prisma.fieldPhoto.update({
        where: { id },
        data: updates,
        select: {
          id: true,
          photoType: true,
          filename: true,
          size: true,
          caption: true,
          gpsLat: true,
          gpsLng: true,
          timestamp: true
        }
      });

      res.json({
        data: updated,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error updating photo:', error);
      res.status(500).json({ 
        error: 'Failed to update photo',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// DELETE /api/v1/field-photos/:id - Delete photo
router.delete(
  '/:id',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT', 'SUPERVISOR', 'ADMIN']),
  async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user!.id;
      const userRole = req.user!.role;

      // Get photo
      const photo = await prisma.fieldPhoto.findUnique({
        where: { id },
        include: {
          workOrder: {
            select: {
              id: true,
              assignedAgentId: true,
              requestId: true
            }
          }
        }
      });

      if (!photo) {
        return res.status(404).json({ 
          error: 'Photo not found',
          correlationId: generateCorrelationId(req)
        });
      }

      // Field agents can only delete their own photos
      if (userRole === 'FIELD_AGENT' && photo.agentId !== userId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      // Delete photo
      await prisma.fieldPhoto.delete({
        where: { id }
      });

      // Log event
      await prisma.eventLog.create({
        data: {
          requestId: photo.workOrder.requestId,
          type: 'PHOTO_DELETED',
          payload: JSON.stringify({
            photoId: id,
            photoType: photo.photoType,
            deletedBy: req.user!.name
          })
        }
      });

      res.json({
        message: 'Photo deleted successfully',
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error deleting photo:', error);
      res.status(500).json({ 
        error: 'Failed to delete photo',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

// POST /api/v1/field-photos/bulk-upload - Upload multiple photos with different types
router.post(
  '/bulk-upload',
  authenticateToken,
  authorizeRoles(['FIELD_AGENT']),
  upload.array('photos', 10),
  async (req, res) => {
    try {
      const { workOrderId } = req.body;
      const agentId = req.user!.id;
      const files = req.files as Express.Multer.File[];

      if (!workOrderId) {
        return res.status(400).json({ 
          error: 'Work order ID required',
          correlationId: generateCorrelationId(req)
        });
      }

      if (!files || files.length === 0) {
        return res.status(400).json({ 
          error: 'No files uploaded',
          correlationId: generateCorrelationId(req)
        });
      }

      // Verify work order
      const workOrder = await prisma.fieldWorkOrder.findUnique({
        where: { id: workOrderId }
      });

      if (!workOrder) {
        return res.status(404).json({ 
          error: 'Work order not found',
          correlationId: generateCorrelationId(req)
        });
      }

      if (workOrder.assignedAgentId !== agentId) {
        return res.status(403).json({ 
          error: 'Access denied',
          correlationId: generateCorrelationId(req)
        });
      }

      // Parse photo metadata from request body
      const photoMetadata = [];
      for (let i = 0; i < files.length; i++) {
        const photoType = req.body[`photoType_${i}`] || 'DURING';
        const caption = req.body[`caption_${i}`];
        const gpsLat = req.body[`gpsLat_${i}`] ? parseFloat(req.body[`gpsLat_${i}`]) : undefined;
        const gpsLng = req.body[`gpsLng_${i}`] ? parseFloat(req.body[`gpsLng_${i}`]) : undefined;
        
        photoMetadata.push({
          file: files[i],
          photoType,
          caption,
          gpsLat,
          gpsLng
        });
      }

      // Create all photos
      const photos = await Promise.all(
        photoMetadata.map(async (meta) => {
          return prisma.fieldPhoto.create({
            data: {
              workOrderId,
              agentId,
              photoType: meta.photoType,
              filename: meta.file.originalname,
              mime: meta.file.mimetype,
              size: meta.file.size,
              data: meta.file.buffer,
              caption: meta.caption,
              gpsLat: meta.gpsLat,
              gpsLng: meta.gpsLng,
              timestamp: new Date()
            },
            select: {
              id: true,
              photoType: true,
              filename: true,
              size: true,
              caption: true,
              timestamp: true
            }
          });
        })
      );

      res.status(201).json({
        data: photos,
        correlationId: generateCorrelationId(req)
      });
    } catch (error) {
      console.error('Error bulk uploading photos:', error);
      res.status(500).json({ 
        error: 'Failed to bulk upload photos',
        correlationId: generateCorrelationId(req)
      });
    }
  }
);

export default router;