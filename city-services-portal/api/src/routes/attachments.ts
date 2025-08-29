import { Router, Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { FeatureFlagService } from '../services/featureFlags';

const router = Router();
const prisma = new PrismaClient();

// Configure multer for memory storage (store in database instead of disk)
const storage = multer.memoryStorage();

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Allow JPG, PNG, and GIF files
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPG, PNG, and GIF files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB limit - exactly 1,048,576 bytes
    files: 5 // Maximum 5 files
  }
});

// POST /api/v1/requests/:id/attachments - Upload attachments
router.post('/:id/attachments', authenticateToken, (req: AuthenticatedRequest, res: Response, next: any) => {
  // Custom multer error handling middleware
  upload.array('files', 5)(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 1MB limit. Please compress your image or choose a smaller file.',
            maxSize: '1MB',
            correlationId: res.locals.correlationId
          }
        });
      }
      if (err.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          error: {
            code: 'TOO_MANY_FILES',
            message: 'Maximum 5 files allowed per upload',
            correlationId: res.locals.correlationId
          }
        });
      }
      if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          error: {
            code: 'UNEXPECTED_FILE',
            message: 'Unexpected file field',
            correlationId: res.locals.correlationId
          }
        });
      }
    }
    
    if (err && err.message === 'Only JPG, PNG, and GIF files are allowed') {
      return res.status(400).json({
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'Only JPG, PNG, and GIF files are allowed',
          correlationId: res.locals.correlationId
        }
      });
    }
    
    if (err) {
      console.error('File upload error:', err);
      return res.status(500).json({
        error: {
          code: 'UPLOAD_ERROR',
          message: 'An error occurred during file upload',
          correlationId: res.locals.correlationId
        }
      });
    }
    
    // Continue to the main handler
    next();
  });
}, async (req: AuthenticatedRequest, res: Response) => {
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

    // Additional validation: Check individual file sizes (double-check)
    const oversizedFiles = files.filter(file => file.size > 1 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      return res.status(400).json({
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File(s) exceed 1MB limit: ${oversizedFiles.map(f => f.originalname).join(', ')}`,
          maxSize: '1MB',
          correlationId: res.locals.correlationId
        }
      });
    }

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

    // Check permissions - citizens can only upload to their own requests
    if (req.user!.role === 'CITIZEN' && serviceRequest.createdBy !== req.user!.id) {
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
      return res.status(500).json({
        error: {
          code: 'UPLOAD_INTERMITTENT_FAILURE',
          message: 'Upload failed due to intermittent server error (feature flag enabled)',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Create attachment records with image data stored in database
    const attachments = await Promise.all(
      files.map(async (file) => {
        const attachment = await prisma.attachment.create({
          data: {
            requestId,
            uploadedById: req.user!.id,
            filename: file.originalname,
            mime: file.mimetype,
            size: file.size,
            data: file.buffer, // Store the actual image data in database
            url: `/api/v1/attachments/${requestId}/image` // Dynamic URL for serving images
          },
          include: {
            uploadedBy: {
              select: { id: true, name: true, email: true }
            }
          }
        });

        return {
          id: attachment.id,
          filename: attachment.filename,
          mime: attachment.mime,
          size: attachment.size,
          url: `/api/v1/attachments/${attachment.id}/image`,
          createdAt: attachment.createdAt,
          uploadedBy: attachment.uploadedBy
        };
      })
    );

    res.status(201).json({
      data: attachments,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Attachment upload error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to upload attachments',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// Test endpoint to verify attachment exists
router.get('/test/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: attachmentId } = req.params;
    
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      select: {
        id: true,
        filename: true,
        mime: true,
        size: true,
        data: true
      }
    });

    if (!attachment) {
      return res.status(404).json({
        error: {
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    res.json({
      id: attachment.id,
      filename: attachment.filename,
      mime: attachment.mime,
      size: attachment.size,
      hasData: !!attachment.data,
      dataSize: attachment.data?.length || 0,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to test attachment',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/attachments/:id/image - Serve image data
router.get('/:id/image', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: attachmentId } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        request: true
      }
    });

    if (!attachment) {
      return res.status(404).json({
        error: {
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check permissions - citizens can only view attachments from their own requests
    if (req.user!.role === 'CITIZEN' && attachment.request.createdBy !== req.user!.id) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only view attachments from your own requests',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Set appropriate headers for image response
    res.set({
      'Content-Type': attachment.mime,
      'Content-Length': attachment.size.toString(),
      'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      'ETag': `"${attachment.id}"`
    });

    // Send the image data
    res.send(attachment.data);

  } catch (error) {
    console.error('Image serve error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to serve image',
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
      select: {
        id: true,
        filename: true,
        mime: true,
        size: true,
        createdAt: true,
        uploadedBy: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const attachmentsWithUrls = attachments.map(attachment => ({
      ...attachment,
      url: `/api/v1/attachments/${attachment.id}/image`
    }));

    res.json({
      data: attachmentsWithUrls,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Fetch attachments error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch attachments',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// DELETE /api/v1/attachments/:id - Delete an attachment
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id: attachmentId } = req.params;

    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
      include: {
        request: {
          select: { 
            id: true,
            createdBy: true,
            status: true,
            title: true 
          }
        },
        uploadedBy: {
          select: { id: true, name: true }
        }
      }
    });

    if (!attachment) {
      return res.status(404).json({
        error: {
          code: 'ATTACHMENT_NOT_FOUND',
          message: 'Attachment not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Permission checks
    const isOwner = attachment.uploadedBy.id === req.user!.id;
    const isRequestOwner = attachment.request.createdBy === req.user!.id;
    const isStaff = ['CLERK', 'SUPERVISOR', 'FIELD_AGENT', 'ADMIN'].includes(req.user!.role);

    if (!isOwner && !isRequestOwner && !isStaff) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete attachments you uploaded or from your own requests',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Prevent deletion from closed requests (unless admin)
    if (attachment.request.status === 'CLOSED' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: {
          code: 'REQUEST_CLOSED',
          message: 'Cannot delete attachments from closed requests',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Delete the attachment
    await prisma.attachment.delete({
      where: { id: attachmentId }
    });

    // Log the deletion
    await prisma.eventLog.create({
      data: {
        requestId: attachment.request.id,
        type: 'ATTACHMENT_DELETED',
        payload: JSON.stringify({
          attachmentId: attachment.id,
          filename: attachment.filename,
          deletedBy: req.user!.id,
          deletedByName: req.user!.name,
          reason: 'User requested deletion'
        })
      }
    });

    res.json({
      message: 'Attachment deleted successfully',
      data: {
        id: attachment.id,
        filename: attachment.filename,
        requestId: attachment.request.id,
        requestTitle: attachment.request.title
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Attachment deletion error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete attachment',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;