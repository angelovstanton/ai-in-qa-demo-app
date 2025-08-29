import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, rbacGuard, AuthenticatedRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const updateCommentSchema = z.object({
  body: z.string().min(10).max(1000),
  visibility: z.enum(['PUBLIC', 'INTERNAL']).optional()
});

const queryCommentsSchema = z.object({
  requestId: z.string().uuid().optional(),
  visibility: z.enum(['PUBLIC', 'INTERNAL', 'ALL']).optional().default('ALL'),
  authorId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1'),
  size: z.string().optional().default('20'),
  sort: z.string().optional().default('createdAt:desc')
});

// GET /api/v1/comments - List comments with filtering
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const query = queryCommentsSchema.parse(req.query);

    // Build where clause
    let where: any = {};
    
    if (query.requestId) {
      where.requestId = query.requestId;
    }
    
    if (query.visibility !== 'ALL') {
      where.visibility = query.visibility;
    }
    
    if (query.authorId) {
      where.authorId = query.authorId;
    }
    
    if (query.search) {
      where.body = { contains: query.search };
    }

    // Citizens can only see public comments and their own internal comments
    if (req.user!.role === 'CITIZEN') {
      where.OR = [
        { visibility: 'PUBLIC' },
        { 
          AND: [
            { visibility: 'INTERNAL' },
            { authorId: req.user!.id }
          ]
        }
      ];
    }

    // Parse sorting
    const sortParts = query.sort.split(':');
    const sortField = sortParts[0] || 'createdAt';
    const sortOrder = sortParts[1] === 'desc' ? 'desc' : 'asc';
    
    const allowedSortFields = ['createdAt', 'updatedAt'];
    const orderBy = allowedSortFields.includes(sortField) 
      ? { [sortField]: sortOrder as 'asc' | 'desc' }
      : { createdAt: 'desc' as const };

    // Pagination
    const page = Math.max(1, parseInt(query.page));
    const pageSize = Math.min(100, Math.max(1, parseInt(query.size)));
    const skip = (page - 1) * pageSize;

    // Get total count
    const totalCount = await prisma.comment.count({ where });

    // Get comments
    const comments = await prisma.comment.findMany({
      where,
      orderBy,
      skip,
      take: pageSize,
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        },
        request: {
          select: { id: true, code: true, title: true, status: true }
        }
      }
    });

    res.setHeader('X-Total-Count', totalCount.toString());
    
    res.json({
      data: comments,
      pagination: {
        page,
        pageSize,
        totalCount,
        totalPages: Math.ceil(totalCount / pageSize)
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Comments fetch error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid query parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch comments',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/comments/:id - Get specific comment
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        },
        request: {
          select: { id: true, code: true, title: true, status: true, createdBy: true }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Permission check for internal comments
    if (comment.visibility === 'INTERNAL' && req.user!.role === 'CITIZEN') {
      // Citizens can only see their own internal comments or internal comments on their requests
      if (comment.authorId !== req.user!.id && comment.request.createdBy !== req.user!.id) {
        return res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: 'You cannot view internal comments',
            correlationId: res.locals.correlationId
          }
        });
      }
    }

    res.json({
      data: comment,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Comment fetch error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to fetch comment',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// PATCH /api/v1/comments/:id - Update comment
router.patch('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const validatedData = updateCommentSchema.parse(req.body);

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        request: { select: { status: true } }
      }
    });

    if (!comment) {
      return res.status(404).json({
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Permission check - only comment author or staff can edit
    if (comment.authorId !== req.user!.id && !['CLERK', 'SUPERVISOR', 'ADMIN'].includes(req.user!.role)) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only edit your own comments',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Check if comment can be edited (within 15 minutes for regular users)
    const isStaff = ['CLERK', 'SUPERVISOR', 'ADMIN'].includes(req.user!.role);
    if (!isStaff) {
      const editTimeLimit = 15 * 60 * 1000; // 15 minutes
      const timeSinceCreation = Date.now() - new Date(comment.createdAt).getTime();
      
      if (timeSinceCreation > editTimeLimit) {
        return res.status(403).json({
          error: {
            code: 'EDIT_TIME_EXPIRED',
            message: 'Comments can only be edited within 15 minutes of creation',
            correlationId: res.locals.correlationId
          }
        });
      }
    }

    // Update comment
    const updatedComment = await prisma.comment.update({
      where: { id },
      data: {
        body: validatedData.body,
        ...(validatedData.visibility && { visibility: validatedData.visibility }),
        updatedAt: new Date()
      },
      include: {
        author: {
          select: { id: true, name: true, email: true, role: true }
        },
        request: {
          select: { id: true, code: true, title: true }
        }
      }
    });

    res.json({
      data: updatedComment,
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Comment update error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid comment data',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to update comment',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// DELETE /api/v1/comments/:id - Delete comment
router.delete('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const comment = await prisma.comment.findUnique({
      where: { id },
      include: {
        request: { 
          select: { 
            id: true,
            status: true,
            title: true,
            createdBy: true
          } 
        }
      }
    });

    if (!comment) {
      return res.status(404).json({
        error: {
          code: 'COMMENT_NOT_FOUND',
          message: 'Comment not found',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Permission check
    const isAuthor = comment.authorId === req.user!.id;
    const isRequestOwner = comment.request.createdBy === req.user!.id;
    const isStaff = ['CLERK', 'SUPERVISOR', 'ADMIN'].includes(req.user!.role);

    if (!isAuthor && !isRequestOwner && !isStaff) {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'You can only delete your own comments or comments on your requests',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Prevent deletion from closed requests (unless admin)
    if (comment.request.status === 'CLOSED' && req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: {
          code: 'REQUEST_CLOSED',
          message: 'Cannot delete comments from closed requests',
          correlationId: res.locals.correlationId
        }
      });
    }

    // Delete comment
    await prisma.comment.delete({
      where: { id }
    });

    // Log the deletion
    await prisma.eventLog.create({
      data: {
        requestId: comment.request.id,
        type: 'COMMENT_DELETED',
        payload: JSON.stringify({
          commentId: comment.id,
          deletedBy: req.user!.id,
          deletedByName: req.user!.name,
          originalAuthor: comment.authorId,
          reason: 'User requested deletion'
        })
      }
    });

    res.json({
      message: 'Comment deleted successfully',
      data: {
        id: comment.id,
        requestId: comment.request.id,
        requestTitle: comment.request.title
      },
      correlationId: res.locals.correlationId
    });

  } catch (error) {
    console.error('Comment deletion error:', error);
    
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to delete comment',
        correlationId: res.locals.correlationId
      }
    });
  }
});

export default router;