import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';
import { 
  SearchService, 
  getSearchQuerySchema, 
  postSearchBodySchema 
} from '../services/searchService';
import { FeatureFlagService } from '../services/featureFlags';

const router = Router();

// GET /api/v1/service-requests/search - Simple search with query parameters
router.get('/service-requests/search', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Parse and validate query parameters
    const query = getSearchQuerySchema.parse(req.query);
    
    // Convert query parameters to filters format
    const filters: any = {};
    
    // Handle comma-separated values for array fields
    if (query.status) {
      const statusValue = query.status as string;
      filters.status = statusValue.includes(',') 
        ? statusValue.split(',').map((s: string) => s.trim())
        : statusValue;
    }
    
    if (query.priority) {
      const priorityValue = query.priority as string;
      filters.priority = priorityValue.includes(',')
        ? priorityValue.split(',').map((p: string) => p.trim())
        : priorityValue;
    }
    
    if (query.category) {
      const categoryValue = query.category as string;
      filters.category = categoryValue.includes(',')
        ? categoryValue.split(',').map((c: string) => c.trim())
        : categoryValue;
    }
    
    if (query.department) {
      const departmentValue = query.department as string;
      filters.department = departmentValue.includes(',')
        ? departmentValue.split(',').map((d: string) => d.trim())
        : departmentValue;
    }
    
    if (query.assignedTo) {
      const assignedToValue = query.assignedTo as string;
      filters.assignedTo = assignedToValue.includes(',')
        ? assignedToValue.split(',').map((a: string) => a.trim())
        : assignedToValue;
    }
    
    // Single value filters
    if (query.location) filters.location = query.location;
    if (query.keyword) filters.keyword = query.keyword;
    
    // Date range filters
    if (query.createdFrom) filters.createdFrom = query.createdFrom;
    if (query.createdTo) filters.createdTo = query.createdTo;
    if (query.updatedFrom) filters.updatedFrom = query.updatedFrom;
    if (query.updatedTo) filters.updatedTo = query.updatedTo;
    if (query.resolvedFrom) filters.resolvedFrom = query.resolvedFrom;
    if (query.resolvedTo) filters.resolvedTo = query.resolvedTo;
    
    // Parse pagination
    const pagination = {
      page: query.page || 1,
      limit: Math.min(query.limit || 10, 100) // Max 100 items per page
    };
    
    // Parse sorting
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';
    
    // Check feature flag for wrong default sort
    const shouldApplyWrongSort = await FeatureFlagService.shouldApplyWrongDefaultSort();
    const sorting = {
      sortBy: shouldApplyWrongSort && sortBy === 'createdAt' ? 'title' : sortBy,
      sortOrder: shouldApplyWrongSort && sortBy === 'createdAt' ? 'asc' as const : sortOrder
    };
    
    // Options
    const options = {
      includeStats: query.includeStats || false,
      includeAggregations: false, // Not available in GET endpoint
      skipCache: false
    };
    
    // Check URL length (most browsers support ~2000 characters)
    const fullUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    if (fullUrl.length > 2000) {
      return res.status(414).json({
        error: {
          code: 'URL_TOO_LONG',
          message: 'Request URL is too long. Please use POST /api/v1/service-requests/search for complex queries',
          details: {
            urlLength: fullUrl.length,
            maxLength: 2000
          },
          correlationId: res.locals.correlationId
        }
      });
    }
    
    // Perform search
    const result = await SearchService.performSearch(
      filters,
      pagination,
      sorting,
      options,
      req.user!.id,
      req.user!.role
    );
    
    // Add CORS headers for bookmarkable URLs
    res.setHeader('Cache-Control', 'public, max-age=60'); // Cache for 1 minute
    res.setHeader('X-Total-Count', result.pagination.totalCount.toString());
    res.setHeader('X-Search-Duration', result.metadata.searchDuration.toString());
    
    res.json({
      ...result,
      correlationId: res.locals.correlationId
    });
    
  } catch (error) {
    console.error('Search error (GET):', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search parameters',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to perform search',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/service-requests/search - Complex search with JSON body
router.post('/service-requests/search', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const startTime = Date.now();
    
    // Parse and validate request body
    const body = postSearchBodySchema.parse(req.body);
    
    // Extract filters, pagination, sorting, and options
    const filters = body.filters || {};
    const pagination = {
      page: body.pagination?.page || 1,
      limit: Math.min(body.pagination?.limit || 10, 100)
    };
    const sorting = {
      sortBy: body.sorting?.sortBy || 'createdAt',
      sortOrder: body.sorting?.sortOrder || 'desc'
    };
    const options = body.options || {};
    
    // Check feature flag for wrong default sort
    const shouldApplyWrongSort = await FeatureFlagService.shouldApplyWrongDefaultSort();
    if (shouldApplyWrongSort && sorting.sortBy === 'createdAt') {
      sorting.sortBy = 'title';
      sorting.sortOrder = 'asc';
    }
    
    // Validate complex filter combinations
    if (filters.complexDateRanges && filters.complexDateRanges.length > 10) {
      return res.status(400).json({
        error: {
          code: 'TOO_MANY_DATE_RANGES',
          message: 'Maximum 10 complex date ranges allowed',
          correlationId: res.locals.correlationId
        }
      });
    }
    
    if (filters.bulkIds && filters.bulkIds.length > 1000) {
      return res.status(400).json({
        error: {
          code: 'TOO_MANY_IDS',
          message: 'Maximum 1000 IDs allowed in bulk search',
          correlationId: res.locals.correlationId
        }
      });
    }
    
    // Apply rate limiting for complex queries
    const queryComplexity = determineQueryComplexity(filters);
    if (queryComplexity === 'complex') {
      // In production, implement proper rate limiting
      // For now, just add a delay for very complex queries
      if (Object.keys(filters).length > 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Perform search
    const result = await SearchService.performSearch(
      filters,
      pagination,
      sorting,
      options,
      req.user!.id,
      req.user!.role
    );
    
    // Set response headers
    res.setHeader('X-Total-Count', result.pagination.totalCount.toString());
    res.setHeader('X-Search-Duration', result.metadata.searchDuration.toString());
    res.setHeader('X-Query-Complexity', result.metadata.queryComplexity);
    
    // Don't cache POST requests
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    
    res.json({
      ...result,
      correlationId: res.locals.correlationId
    });
    
  } catch (error) {
    console.error('Search error (POST):', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search request',
          details: error.errors,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    res.status(500).json({
      error: {
        code: 'SEARCH_ERROR',
        message: 'Failed to perform search',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// GET /api/v1/service-requests/search/suggestions - Search suggestions
router.get('/service-requests/search/suggestions', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { field, query } = req.query;
    
    if (!field || !query) {
      return res.status(400).json({
        error: {
          code: 'MISSING_PARAMETERS',
          message: 'field and query parameters are required',
          correlationId: res.locals.correlationId
        }
      });
    }
    
    // Validate field
    const allowedFields = ['category', 'locationText', 'title'];
    if (!allowedFields.includes(field as string)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_FIELD',
          message: `Field must be one of: ${allowedFields.join(', ')}`,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    // For now, return mock suggestions
    // In production, implement proper suggestion logic with database queries
    const suggestions = await getMockSuggestions(field as string, query as string);
    
    res.json({
      data: suggestions,
      correlationId: res.locals.correlationId
    });
    
  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      error: {
        code: 'SUGGESTIONS_ERROR',
        message: 'Failed to get search suggestions',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// POST /api/v1/service-requests/search/export - Export search results
router.post('/service-requests/search/export', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check permissions - only staff can export
    if (req.user!.role === 'CITIZEN') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Export functionality is only available to staff members',
          correlationId: res.locals.correlationId
        }
      });
    }
    
    const { filters, format = 'csv', fields } = req.body;
    
    // Validate format
    const allowedFormats = ['csv', 'json', 'xlsx'];
    if (!allowedFormats.includes(format)) {
      return res.status(400).json({
        error: {
          code: 'INVALID_FORMAT',
          message: `Format must be one of: ${allowedFormats.join(', ')}`,
          correlationId: res.locals.correlationId
        }
      });
    }
    
    // Perform search with higher limit for export
    const result = await SearchService.performSearch(
      filters || {},
      { page: 1, limit: 10000 }, // Export up to 10000 records
      { sortBy: 'createdAt', sortOrder: 'desc' },
      { 
        skipCache: true,
        fieldSelection: fields
      },
      req.user!.id,
      req.user!.role
    );
    
    // Format data based on requested format
    let exportData: any;
    let contentType: string;
    let filename: string;
    
    switch (format) {
      case 'json':
        exportData = JSON.stringify(result.data, null, 2);
        contentType = 'application/json';
        filename = `service-requests-${Date.now()}.json`;
        break;
      
      case 'csv':
        // Simple CSV conversion (in production, use a proper CSV library)
        const csvHeaders = Object.keys(result.data[0] || {}).join(',');
        const csvRows = result.data.map(row => 
          Object.values(row).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
          ).join(',')
        );
        exportData = [csvHeaders, ...csvRows].join('\n');
        contentType = 'text/csv';
        filename = `service-requests-${Date.now()}.csv`;
        break;
      
      default:
        return res.status(501).json({
          error: {
            code: 'NOT_IMPLEMENTED',
            message: `Export format ${format} is not yet implemented`,
            correlationId: res.locals.correlationId
          }
        });
    }
    
    // Set response headers for file download
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('X-Export-Count', result.data.length.toString());
    
    res.send(exportData);
    
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({
      error: {
        code: 'EXPORT_ERROR',
        message: 'Failed to export search results',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// DELETE /api/v1/service-requests/search/cache - Clear search cache
router.delete('/service-requests/search/cache', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Only admins can clear cache
    if (req.user!.role !== 'ADMIN') {
      return res.status(403).json({
        error: {
          code: 'FORBIDDEN',
          message: 'Only administrators can clear the search cache',
          correlationId: res.locals.correlationId
        }
      });
    }
    
    SearchService.clearCache();
    
    res.json({
      message: 'Search cache cleared successfully',
      correlationId: res.locals.correlationId
    });
    
  } catch (error) {
    console.error('Cache clear error:', error);
    res.status(500).json({
      error: {
        code: 'CACHE_CLEAR_ERROR',
        message: 'Failed to clear search cache',
        correlationId: res.locals.correlationId
      }
    });
  }
});

// Helper functions
function determineQueryComplexity(filters: any): 'simple' | 'complex' {
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

async function getMockSuggestions(field: string, query: string): Promise<string[]> {
  // Mock suggestions - in production, query the database
  const suggestions: Record<string, string[]> = {
    category: [
      'Roads & Infrastructure',
      'Waste Management',
      'Parks & Recreation',
      'Public Safety',
      'Utilities',
      'Transportation'
    ],
    locationText: [
      'Downtown',
      'North District',
      'South District',
      'East Side',
      'West End',
      'City Center'
    ],
    title: [
      'Pothole repair needed',
      'Streetlight outage',
      'Garbage collection missed',
      'Park maintenance required',
      'Traffic signal malfunction'
    ]
  };
  
  const fieldSuggestions = suggestions[field] || [];
  return fieldSuggestions
    .filter(s => s.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 10);
}

export default router;