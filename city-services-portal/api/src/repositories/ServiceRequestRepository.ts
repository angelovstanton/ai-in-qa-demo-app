import { ServiceRequest, Prisma } from '@prisma/client';
import { BaseRepository, QueryOptions } from './base/BaseRepository';
import { PrismaClient } from '@prisma/client';

export interface ServiceRequestWithRelations extends ServiceRequest {
  creator?: any;
  assignee?: any;
  department?: any;
  comments?: any[];
  attachments?: any[];
  qualityReviews?: any[];
  fieldWorkOrders?: any[];
}

export interface ServiceRequestFilters {
  status?: string | string[];
  priority?: string | string[];
  departmentId?: string;
  assignedTo?: string;
  createdBy?: string;
  category?: string;
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}

export interface ServiceRequestStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  avgResolutionTime: number;
  overdueCount: number;
}

/**
 * Service Request Repository
 * Implements complex business logic for service requests
 * Following Single Responsibility Principle
 */
export class ServiceRequestRepository extends BaseRepository<
  ServiceRequest,
  Prisma.ServiceRequestCreateInput,
  Prisma.ServiceRequestUpdateInput
> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'serviceRequest');
  }

  /**
   * Find service request with all relations
   */
  async findByIdWithRelations(
    id: string,
    includeOptions?: Prisma.ServiceRequestInclude
  ): Promise<ServiceRequestWithRelations | null> {
    return this.model.findUnique({
      where: { id },
      include: includeOptions || {
        creator: true,
        assignee: true,
        department: true,
        comments: {
          include: { author: true },
          orderBy: { createdAt: 'desc' }
        },
        attachments: {
          orderBy: { createdAt: 'desc' }
        },
        qualityReviews: {
          include: { reviewer: true },
          orderBy: { createdAt: 'desc' }
        },
        fieldWorkOrders: {
          include: { assignedAgent: true },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  /**
   * Find by unique code
   */
  async findByCode(code: string): Promise<ServiceRequest | null> {
    return this.model.findUnique({
      where: { code }
    });
  }

  /**
   * Advanced search with filters
   */
  async search(
    filters: ServiceRequestFilters,
    options: QueryOptions = {}
  ): Promise<ServiceRequestWithRelations[]> {
    const where = this.buildWhereClause(filters);
    
    return this.model.findMany({
      where,
      ...options,
      include: options.include || {
        creator: true,
        assignee: true,
        department: true
      }
    });
  }

  /**
   * Get requests by status with pagination
   */
  async findByStatus(
    status: string | string[],
    page: number = 1,
    pageSize: number = 10
  ) {
    const statusArray = Array.isArray(status) ? status : [status];
    
    return this.findPaginated(page, pageSize, {
      where: { status: { in: statusArray } },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: true,
        assignee: true,
        department: true
      }
    });
  }

  /**
   * Get requests assigned to user
   */
  async findAssignedToUser(
    userId: string,
    includeCompleted: boolean = false
  ): Promise<ServiceRequestWithRelations[]> {
    const where: any = { assignedTo: userId };
    
    if (!includeCompleted) {
      where.status = { notIn: ['COMPLETED', 'CANCELLED', 'CLOSED'] };
    }
    
    return this.search({}, { where, orderBy: { priority: 'desc' } });
  }

  /**
   * Get overdue requests
   */
  async findOverdue(): Promise<ServiceRequestWithRelations[]> {
    return this.model.findMany({
      where: {
        slaDueAt: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED', 'CLOSED'] }
      },
      include: {
        creator: true,
        assignee: true,
        department: true
      },
      orderBy: { slaDueAt: 'asc' }
    });
  }

  /**
   * Update request status with validation
   */
  async updateStatus(
    id: string,
    newStatus: string,
    userId: string,
    notes?: string
  ): Promise<ServiceRequest> {
    // Validate status transition
    const request = await this.findById(id);
    if (!request) {
      throw new Error('Service request not found');
    }

    if (!this.isValidStatusTransition(request.status, newStatus)) {
      throw new Error(`Invalid status transition from ${request.status} to ${newStatus}`);
    }

    // Update with transaction
    return this.prisma.$transaction(async (tx) => {
      // Update request
      const updated = await tx.serviceRequest.update({
        where: { id },
        data: { 
          status: newStatus,
          closedAt: newStatus === 'CLOSED' ? new Date() : null
        }
      });

      // Create event log
      await tx.eventLog.create({
        data: {
          requestId: id,
          type: 'STATUS_CHANGE',
          payload: JSON.stringify({
            from: request.status,
            to: newStatus,
            userId,
            notes,
            timestamp: new Date()
          })
        }
      });

      return updated;
    });
  }

  /**
   * Assign request to user
   */
  async assignToUser(
    requestId: string,
    assigneeId: string,
    assignedById: string
  ): Promise<ServiceRequest> {
    return this.prisma.$transaction(async (tx) => {
      // Update request
      const updated = await tx.serviceRequest.update({
        where: { id: requestId },
        data: { assignedTo: assigneeId }
      });

      // Create assignment record
      await tx.assignment.create({
        data: {
          requestId,
          assigneeId,
          assignedById
        }
      });

      // Create event log
      await tx.eventLog.create({
        data: {
          requestId,
          type: 'ASSIGNMENT',
          payload: JSON.stringify({
            assigneeId,
            assignedById,
            timestamp: new Date()
          })
        }
      });

      return updated;
    });
  }

  /**
   * Get statistics for dashboard
   */
  async getStatistics(filters?: ServiceRequestFilters): Promise<ServiceRequestStats> {
    const where = filters ? this.buildWhereClause(filters) : {};

    const [total, byStatus, byPriority, avgResolution, overdueCount] = await Promise.all([
      this.count(where),
      this.getCountByField('status', where),
      this.getCountByField('priority', where),
      this.getAverageResolutionTime(where),
      this.count({
        ...where,
        slaDueAt: { lt: new Date() },
        status: { notIn: ['COMPLETED', 'CANCELLED', 'CLOSED'] }
      })
    ]);

    return {
      total,
      byStatus,
      byPriority,
      avgResolutionTime: avgResolution,
      overdueCount
    };
  }

  /**
   * Build where clause from filters
   */
  private buildWhereClause(filters: ServiceRequestFilters): any {
    const where: any = {};

    if (filters.status) {
      where.status = Array.isArray(filters.status) 
        ? { in: filters.status }
        : filters.status;
    }

    if (filters.priority) {
      where.priority = Array.isArray(filters.priority)
        ? { in: filters.priority }
        : filters.priority;
    }

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.assignedTo) {
      where.assignedTo = filters.assignedTo;
    }

    if (filters.createdBy) {
      where.createdBy = filters.createdBy;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = filters.dateFrom;
      if (filters.dateTo) where.createdAt.lte = filters.dateTo;
    }

    if (filters.search) {
      where.OR = [
        { title: { contains: filters.search } },
        { description: { contains: filters.search } },
        { code: { contains: filters.search } }
      ];
    }

    return where;
  }

  /**
   * Validate status transitions
   */
  private isValidStatusTransition(from: string, to: string): boolean {
    const transitions: Record<string, string[]> = {
      'DRAFT': ['SUBMITTED'],
      'SUBMITTED': ['TRIAGED', 'CANCELLED'],
      'TRIAGED': ['IN_REVIEW', 'CANCELLED'],
      'IN_REVIEW': ['APPROVED', 'REJECTED', 'CANCELLED'],
      'APPROVED': ['IN_PROGRESS', 'CANCELLED'],
      'IN_PROGRESS': ['RESOLVED', 'CANCELLED'],
      'RESOLVED': ['CLOSED', 'IN_PROGRESS'],
      'REJECTED': ['DRAFT', 'CANCELLED'],
      'CANCELLED': [],
      'CLOSED': []
    };

    return transitions[from]?.includes(to) || false;
  }

  /**
   * Get count grouped by field
   */
  private async getCountByField(
    field: string,
    where: any = {}
  ): Promise<Record<string, number>> {
    const results = await this.model.groupBy({
      by: [field],
      where,
      _count: true
    });

    return results.reduce((acc: any, item: any) => {
      acc[item[field]] = item._count;
      return acc;
    }, {});
  }

  /**
   * Calculate average resolution time
   */
  private async getAverageResolutionTime(where: any = {}): Promise<number> {
    const resolved = await this.model.findMany({
      where: {
        ...where,
        status: 'CLOSED',
        closedAt: { not: null }
      },
      select: {
        createdAt: true,
        closedAt: true
      }
    });

    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((sum, req) => {
      const diff = req.closedAt!.getTime() - req.createdAt.getTime();
      return sum + diff;
    }, 0);

    return Math.round(totalTime / resolved.length / (1000 * 60 * 60)); // in hours
  }
}