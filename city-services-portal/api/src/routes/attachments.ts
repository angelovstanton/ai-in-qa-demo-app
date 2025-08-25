import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { FeatureFlagService } from '../services/featureFlags';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const sanitizedName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const filename = `${timestamp}-${sanitizedName}`;
    cb(null, filename);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Only allow JPG and PNG files
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG and PNG files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// POST /api/v1/requests/:id/attachments - Upload attachments
router.post('/:id/attachments', authenticateToken, upload.array('files', 5), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: requestId } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({
        error: {
          code: 'NO_FILES_UPLOADED',
          message: 'No files were uploaded',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check if request exists and user has permission
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!serviceRequest) {
      // Clean up uploaded files
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      return res.status(404).json({
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Service request not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check permissions - citizens can only upload to their own requests
    if (req.user!.role === 'CITIZEN' && serviceRequest.createdBy !== req.user!.id) {
      // Clean up uploaded files
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only upload attachments to your own requests',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Feature flag: API_UploadIntermittentFail
    const shouldFail = await FeatureFlagService.shouldApplyUploadIntermittentFail();
    if (shouldFail && Math.random() < (1/15)) {
      // Clean up uploaded files
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });

      return res.status(500).json({
        error: {
          code: 'UPLOAD_INTERMITTENT_FAILURE',
          message: 'Upload failed due to intermittent server error (feature flag enabled)',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Create attachment records
    const attachments = await Promise.all(
      files.map(async (file) => {
        const attachment = await prisma.attachment.create({
          data: {
            requestId,
            uploadedById: req.user!.id,
            filename: file.originalname,
            mime: file.mimetype,
            size: file.size,
            url: `/uploads/${file.filename}`
          },
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        });

        return {
          ...attachment,
          thumbnail: file.mimetype.startsWith('image/') ? `/uploads/thumb_${file.filename}` : null
        };
      })
    );

    res.status(201).json({
      data: attachments,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      const files = req.files as Express.Multer.File[];
      files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
    }

    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 5MB limit',
            correlationId: res.locals.correlationId
          }
        });
      }
    }

    if (error instanceof Error && error.message === 'Only JPG and PNG files are allowed') {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Only JPG and PNG files are allowed',
          correlationId: res.locals.correlationId
        }
      });
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upload attachments',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/requests/:id/attachments - Get attachments for a request
router.get('/:id/attachments', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: requestId } = req.params;

    // Check if request exists and user has permission
    const serviceRequest = await prisma.serviceRequest.findUnique({
      where: { id: requestId }
    });

    if (!serviceRequest) {
      return res.status(404).json({
        error: {
          code: 'REQUEST_NOT_FOUND',
          message: 'Service request not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check permissions - citizens can only view attachments from their own requests
    if (req.user!.role === 'CITIZEN' && serviceRequest.createdBy !== req.user!.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view attachments from your own requests',
          correlationId: res.locals.correlationId
        }
      });
    }

    const attachments = await prisma.attachment.findMany({
      where: { requestId },
      include: {
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const attachmentsWithThumbnails = attachments.map(attachment => ({
      ...attachment,
      thumbnail: attachment.mime.startsWith('image/') ? 
        attachment.url.replace('/uploads/', '/uploads/thumb_') : null
    }));

    res.json({
      data: attachmentsWithThumbnails,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch attachments',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;