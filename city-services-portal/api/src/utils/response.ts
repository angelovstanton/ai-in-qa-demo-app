/**
 * Standardized API response utilities
 */

export interface ApiResponse<T = any> {
  data: T;
  correlationId?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  metadata?: Record<string, any>;
}

export function createApiResponse<T>(
  data: T, 
  pagination?: ApiResponse['pagination'],
  metadata?: Record<string, any>
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    data,
    correlationId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  if (metadata) {
    response.metadata = metadata;
  }
  
  return response;
}

export function createErrorResponse(
  error: string,
  statusCode: number = 500,
  details?: any
): {
  error: string;
  message: string;
  statusCode: number;
  correlationId: string;
  details?: any;
} {
  return {
    error: error.toUpperCase().replace(/\s+/g, '_'),
    message: error,
    statusCode,
    correlationId: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    details
  };
}

export function createPaginationMeta(
  page: number,
  pageSize: number,
  total: number
): ApiResponse['pagination'] {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize)
  };
}