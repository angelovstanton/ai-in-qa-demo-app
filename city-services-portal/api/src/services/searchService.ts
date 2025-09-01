import { PrismaClient, Prisma } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Basic search filters (available in both GET and POST)
export const basicSearchFiltersSchema = z.object({
  status: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  priority: z.union([
    z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
    z.array(z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']))
  ]).optional(),
  category: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  department: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  assignedTo: z.union([
    z.string(),
    z.array(z.string())
  ]).optional(),
  location: z.string().optional(),
  keyword: z.string().optional(),
  createdFrom: z.string().datetime().optional(),
  createdTo: z.string().datetime().optional(),
  updatedFrom: z.string().datetime().optional(),
  updatedTo: z.string().datetime().optional(),
  resolvedFrom: z.string().datetime().optional(),
  resolvedTo: z.string().datetime().optional(),
});

// Advanced filters (POST only)
export const advancedSearchFiltersSchema = z.object({
  complexDateRanges: z.array(z.object({
    field: z.enum(['createdAt', 'updatedAt', 'closedAt', 'preferredDate']),
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    operator: z.enum(['AND', 'OR']).default('AND')
  })).optional(),
  customFields: z.record(z.any()).optional(),
  bulkIds: z.array(z.string()).optional(),
  geoLocation: z.object({
    latitude: z.number(),
    longitude: z.number(),
    radiusKm: z.number().positive()
  }).optional(),
  workflowStage: z.string().optional(),
  citizenFilters: z.object({
    createdBy: z.string().optional(),
    hasUpvoted: z.boolean().optional(),
    hasCommented: z.boolean().optional()
  }).optional(),
  reportingFilters: z.object({
    minUpvotes: z.number().min(0).optional(),
    maxUpvotes: z.number().min(0).optional(),
    minComments: z.number().min(0).optional(),
    maxComments: z.number().min(0).optional(),
    hasAttachments: z.boolean().optional(),
    isEmergency: z.boolean().optional(),
    isRecurring: z.boolean().optional()
  }).optional(),
  textSearch: z.object({
    fields: z.array(z.enum(['title', 'description', 'code', 'locationText', 'formComments'])).optional(),
    query: z.string(),
    fuzzy: z.boolean().default(false),
    caseSensitive: z.boolean().default(false)
  }).optional()
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10)
});

// Sorting schema
export const sortingSchema = z.object({
  sortBy: z.enum([
    'createdAt', 'updatedAt', 'closedAt', 'priority', 
    'status', 'title', 'category', 'upvotes', 'comments'
  ]).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// GET endpoint query schema
export const getSearchQuerySchema = z.object({
  // Basic filters
  ...basicSearchFiltersSchema.shape,
  // Pagination
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
  // Sorting
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  // Options
  includeStats: z.string().optional().transform(val => val === 'true')
});

// POST endpoint body schema
export const postSearchBodySchema = z.object({
  filters: z.object({
    ...basicSearchFiltersSchema.shape,
    ...advancedSearchFiltersSchema.shape
  }).optional(),
  pagination: paginationSchema.optional(),
  sorting: sortingSchema.optional(),
  options: z.object({
    includeStats: z.boolean().default(false),
    includeAggregations: z.boolean().default(false),
    fieldSelection: z.array(z.string()).optional(),
    cacheKey: z.string().optional()
  }).optional()
});

export interface SearchResult {
  data: any[];
  pagination: {
    page: number;
    limit: number;
    totalCount: number;
    totalPages: number;
  };
  filters: any;
  aggregations?: any;
  metadata: {
    searchDuration: number;
    cached: boolean;
    queryComplexity: 'simple' | 'complex';
  };
}

export class SearchService {
  private static searchCache = new Map<string, { result: SearchResult; timestamp: number }>();
  private static CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  static async performSearch(
    filters: any,
    pagination: { page: number; limit: number },
    sorting: { sortBy: string; sortOrder: 'asc' | 'desc' },
    options: any = {},
    userId: string,
    userRole: string
  ): Promise<SearchResult> {
    const startTime = Date.now();
    
    // Generate cache key if caching is enabled
    const cacheKey = options.cacheKey || this.generateCacheKey(filters, pagination, sorting, userId);
    
    // Check cache
    if (!options.skipCache) {
      const cached = this.searchCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_TTL) {
        return {
          ...cached.result,
          metadata: {
            ...cached.result.metadata,
            cached: true,
            searchDuration: Date.now() - startTime
          }
        };
      }
    }

    // Build where clause
    const where = await this.buildWhereClause(filters, userId, userRole);
    
    // Build order by clause
    const orderBy = this.buildOrderByClause(sorting);
    
    // Calculate pagination
    const skip = (pagination.page - 1) * pagination.limit;
    
    // Execute queries
    const [totalCount, requests] = await Promise.all([
      prisma.serviceRequest.count({ where }),
      prisma.serviceRequest.findMany({
        where,
        orderBy,
        skip,
        take: pagination.limit,
        include: this.buildIncludeClause(options),
        ...(options.fieldSelection && {
          select: this.buildSelectClause(options.fieldSelection)
        })
      })
    ]);

    // Get aggregations if requested
    let aggregations = null;
    if (options.includeAggregations) {
      aggregations = await this.getAggregations(where);
    }

    // Transform results
    const transformedData = requests.map(this.transformServiceRequest);

    const result: SearchResult = {
      data: transformedData,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        totalCount,
        totalPages: Math.ceil(totalCount / pagination.limit)
      },
      filters: filters,
      aggregations,
      metadata: {
        searchDuration: Date.now() - startTime,
        cached: false,
        queryComplexity: this.determineQueryComplexity(filters)
      }
    };

    // Cache the result
    if (!options.skipCache) {
      this.searchCache.set(cacheKey, {
        result,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      this.cleanCache();
    }

    return result;
  }

  private static async buildWhereClause(
    filters: any,
    userId: string,
    userRole: string
  ): Promise<Prisma.ServiceRequestWhereInput> {
    const where: Prisma.ServiceRequestWhereInput = {};
    
    // Role-based filtering
    if (userRole === 'CITIZEN' && !filters.showAll) {
      where.createdBy = userId;
    }
    
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      where.status = statuses.length === 1 ? statuses[0] : { in: statuses };
    }
    
    // Priority filter
    if (filters.priority) {
      const priorities = Array.isArray(filters.priority) ? filters.priority : [filters.priority];
      where.priority = priorities.length === 1 ? priorities[0] : { in: priorities };
    }
    
    // Category filter
    if (filters.category) {
      const categories = Array.isArray(filters.category) ? filters.category : [filters.category];
      if (categories.length === 1) {
        where.category = { contains: categories[0] };
      } else {
        where.OR = categories.map((cat: string) => ({ category: { contains: cat } }));
      }
    }
    
    // Department filter
    if (filters.department) {
      const departments = Array.isArray(filters.department) ? filters.department : [filters.department];
      if (departments.length === 1) {
        where.department = { slug: departments[0] };
      } else {
        where.department = { slug: { in: departments } };
      }
    }
    
    // Assigned to filter
    if (filters.assignedTo) {
      const assignees = Array.isArray(filters.assignedTo) ? filters.assignedTo : [filters.assignedTo];
      where.assignedTo = assignees.length === 1 ? assignees[0] : { in: assignees };
    }
    
    // Date range filters
    const dateFilters: any = {};
    if (filters.createdFrom || filters.createdTo) {
      dateFilters.createdAt = {};
      if (filters.createdFrom) dateFilters.createdAt.gte = new Date(filters.createdFrom);
      if (filters.createdTo) dateFilters.createdAt.lte = new Date(filters.createdTo);
    }
    if (filters.updatedFrom || filters.updatedTo) {
      dateFilters.updatedAt = {};
      if (filters.updatedFrom) dateFilters.updatedAt.gte = new Date(filters.updatedFrom);
      if (filters.updatedTo) dateFilters.updatedAt.lte = new Date(filters.updatedTo);
    }
    if (filters.resolvedFrom || filters.resolvedTo) {
      dateFilters.closedAt = {};
      if (filters.resolvedFrom) dateFilters.closedAt.gte = new Date(filters.resolvedFrom);
      if (filters.resolvedTo) dateFilters.closedAt.lte = new Date(filters.resolvedTo);
    }
    Object.assign(where, dateFilters);
    
    // Complex date ranges (POST only)
    if (filters.complexDateRanges && filters.complexDateRanges.length > 0) {
      const complexDateConditions = filters.complexDateRanges.map((range: any) => {
        const condition: any = {};
        if (range.from || range.to) {
          condition[range.field] = {};
          if (range.from) condition[range.field].gte = new Date(range.from);
          if (range.to) condition[range.field].lte = new Date(range.to);
        }
        return condition;
      });
      
      // Combine conditions based on operator
      const hasOrOperator = filters.complexDateRanges.some((r: any) => r.operator === 'OR');
      if (hasOrOperator) {
        where.OR = [...(where.OR as any[] || []), ...complexDateConditions];
      } else {
        where.AND = [...(where.AND as any[] || []), ...complexDateConditions];
      }
    }
    
    // Keyword search
    if (filters.keyword) {
      const keywordConditions = [
        { title: { contains: filters.keyword } },
        { description: { contains: filters.keyword } },
        { code: { contains: filters.keyword } },
        { locationText: { contains: filters.keyword } }
      ];
      
      if (where.OR) {
        where.AND = [...(where.AND as any[] || []), { OR: keywordConditions }];
      } else {
        where.OR = keywordConditions;
      }
    }
    
    // Advanced text search (POST only)
    if (filters.textSearch) {
      const { fields, query, caseSensitive } = filters.textSearch;
      const searchFields = fields || ['title', 'description', 'code', 'locationText'];
      const searchConditions = searchFields.map((field: string) => ({
        [field]: { 
          contains: query,
          mode: caseSensitive ? undefined : 'insensitive' as any
        }
      }));
      
      if (where.OR) {
        where.AND = [...(where.AND as any[] || []), { OR: searchConditions }];
      } else {
        where.OR = searchConditions;
      }
    }
    
    // Location filter
    if (filters.location) {
      where.locationText = { contains: filters.location };
    }
    
    // Bulk IDs filter (POST only)
    if (filters.bulkIds && filters.bulkIds.length > 0) {
      where.id = { in: filters.bulkIds };
    }
    
    // Geo location filter (POST only) - simplified for SQLite
    if (filters.geoLocation) {
      // SQLite doesn't support advanced geospatial queries
      // This is a simplified bounding box approach
      const { latitude, longitude, radiusKm } = filters.geoLocation;
      const latDelta = radiusKm / 111; // Rough approximation
      const lngDelta = radiusKm / (111 * Math.cos(latitude * Math.PI / 180));
      
      where.lat = {
        gte: latitude - latDelta,
        lte: latitude + latDelta
      };
      where.lng = {
        gte: longitude - lngDelta,
        lte: longitude + lngDelta
      };
    }
    
    // Citizen filters (POST only)
    if (filters.citizenFilters) {
      if (filters.citizenFilters.createdBy) {
        where.createdBy = filters.citizenFilters.createdBy;
      }
      if (filters.citizenFilters.hasUpvoted !== undefined) {
        where.upvotes = filters.citizenFilters.hasUpvoted 
          ? { some: { userId } }
          : { none: { userId } };
      }
      if (filters.citizenFilters.hasCommented !== undefined) {
        where.comments = filters.citizenFilters.hasCommented
          ? { some: { authorId: userId } }
          : { none: { authorId: userId } };
      }
    }
    
    // Reporting filters (POST only)
    if (filters.reportingFilters) {
      const rf = filters.reportingFilters;
      
      if (rf.hasAttachments !== undefined) {
        where.attachments = rf.hasAttachments
          ? { some: {} }
          : { none: {} };
      }
      
      if (rf.isEmergency !== undefined) {
        where.isEmergency = rf.isEmergency;
      }
      
      if (rf.isRecurring !== undefined) {
        where.isRecurring = rf.isRecurring;
      }
      
      // Note: For upvotes/comments count filters, we'd need to use raw SQL or post-filtering
      // as Prisma doesn't support count-based filtering directly
    }
    
    return where;
  }

  private static buildOrderByClause(
    sorting: { sortBy: string; sortOrder: 'asc' | 'desc' }
  ): Prisma.ServiceRequestOrderByWithRelationInput {
    const { sortBy, sortOrder } = sorting;
    
    // Special handling for aggregate fields
    if (sortBy === 'upvotes') {
      return {
        upvotes: {
          _count: sortOrder
        }
      };
    }
    
    if (sortBy === 'comments') {
      return {
        comments: {
          _count: sortOrder
        }
      };
    }
    
    // Regular fields
    return {
      [sortBy]: sortOrder
    };
  }

  private static buildIncludeClause(options: any) {
    return {
      creator: {
        select: { id: true, name: true, email: true }
      },
      assignee: {
        select: { id: true, name: true, email: true }
      },
      department: {
        select: { id: true, name: true, slug: true }
      },
      _count: {
        select: {
          comments: true,
          attachments: true,
          upvotes: true
        }
      }
    };
  }

  private static buildSelectClause(fields: string[]) {
    const selectObj: any = { id: true }; // Always include ID
    
    fields.forEach(field => {
      if (field.includes('.')) {
        // Handle nested fields
        const [parent, child] = field.split('.');
        if (!selectObj[parent]) {
          selectObj[parent] = { select: {} };
        }
        selectObj[parent].select[child] = true;
      } else {
        selectObj[field] = true;
      }
    });
    
    return selectObj;
  }

  private static async getAggregations(where: Prisma.ServiceRequestWhereInput) {
    const [
      statusCounts,
      priorityCounts,
      categoryCounts,
      departmentCounts
    ] = await Promise.all([
      // Status aggregation
      prisma.serviceRequest.groupBy({
        by: ['status'],
        where,
        _count: true
      }),
      // Priority aggregation
      prisma.serviceRequest.groupBy({
        by: ['priority'],
        where,
        _count: true
      }),
      // Category aggregation
      prisma.serviceRequest.groupBy({
        by: ['category'],
        where,
        _count: true
      }),
      // Department aggregation
      prisma.serviceRequest.groupBy({
        by: ['departmentId'],
        where,
        _count: true
      })
    ]);

    return {
      byStatus: statusCounts.reduce((acc, item) => {
        acc[item.status] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byPriority: priorityCounts.reduce((acc, item) => {
        acc[item.priority || 'UNSET'] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byCategory: categoryCounts.reduce((acc, item) => {
        acc[item.category] = item._count;
        return acc;
      }, {} as Record<string, number>),
      byDepartment: departmentCounts.reduce((acc, item) => {
        acc[item.departmentId || 'UNASSIGNED'] = item._count;
        return acc;
      }, {} as Record<string, number>)
    };
  }

  private static transformServiceRequest(request: any) {
    return {
      ...request,
      latitude: request.lat,
      longitude: request.lng,
      affectedServices: request.affectedServices ? JSON.parse(request.affectedServices) : null,
      additionalContacts: request.additionalContacts ? JSON.parse(request.additionalContacts) : null,
      upvotes: request._count?.upvotes || 0,
      comments: request.comments && Array.isArray(request.comments) 
        ? request.comments 
        : request._count?.comments || 0,
      attachments: request.attachments && Array.isArray(request.attachments)
        ? request.attachments
        : request._count?.attachments || 0
    };
  }

  private static generateCacheKey(
    filters: any,
    pagination: any,
    sorting: any,
    userId: string
  ): string {
    const keyObj = {
      filters: JSON.stringify(filters),
      pagination: JSON.stringify(pagination),
      sorting: JSON.stringify(sorting),
      userId
    };
    return Buffer.from(JSON.stringify(keyObj)).toString('base64');
  }

  private static determineQueryComplexity(filters: any): 'simple' | 'complex' {
    if (!filters) return 'simple';
    
    const complexFields = [
      'complexDateRanges',
      'customFields',
      'bulkIds',
      'geoLocation',
      'citizenFilters',
      'reportingFilters',
      'textSearch'
    ];
    
    const hasComplexFilters = complexFields.some(field => filters[field]);
    const filterCount = Object.keys(filters).length;
    
    return hasComplexFilters || filterCount > 5 ? 'complex' : 'simple';
  }

  private static cleanCache() {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    this.searchCache.forEach((value, key) => {
      if (now - value.timestamp > this.CACHE_TTL) {
        expiredKeys.push(key);
      }
    });
    
    expiredKeys.forEach(key => this.searchCache.delete(key));
  }

  static clearCache() {
    this.searchCache.clear();
  }
}