/**
 * Base API Service
 * Provides common HTTP operations with error handling and interceptors
 * Following DRY principle and Single Responsibility
 */

import { ApiResponse, ApiError, PaginationParams, SortParams } from '../../../../shared/types';

export interface RequestConfig extends RequestInit {
  params?: Record<string, any>;
  timeout?: number;
}

export class BaseApiService {
  private baseURL: string;
  private defaultHeaders: HeadersInit;
  private authToken: string | null = null;

  constructor(baseURL: string = process.env.REACT_APP_API_URL || 'http://localhost:3001') {
    this.baseURL = baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set authentication token
   */
  setAuthToken(token: string | null): void {
    this.authToken = token;
    if (token) {
      localStorage.setItem('authToken', token);
    } else {
      localStorage.removeItem('authToken');
    }
  }

  /**
   * Get authentication token
   */
  getAuthToken(): string | null {
    if (!this.authToken) {
      this.authToken = localStorage.getItem('authToken');
    }
    return this.authToken;
  }

  /**
   * Build URL with query parameters
   */
  private buildURL(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseURL}${endpoint}`);
    
    if (params) {
      Object.keys(params).forEach(key => {
        const value = params[key];
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => url.searchParams.append(key, String(v)));
          } else {
            url.searchParams.append(key, String(value));
          }
        }
      });
    }
    
    return url.toString();
  }

  /**
   * Build headers for request
   */
  private buildHeaders(customHeaders?: HeadersInit): Headers {
    const headers = new Headers(this.defaultHeaders);
    
    const token = this.getAuthToken();
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    if (customHeaders) {
      const customHeadersObj = new Headers(customHeaders);
      customHeadersObj.forEach((value, key) => {
        headers.set(key, value);
      });
    }
    
    return headers;
  }

  /**
   * Handle response and extract data
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      const error = await this.handleError(response);
      throw error;
    }

    const data = await response.json();
    
    // Handle API response format
    if (data.data !== undefined) {
      return data as ApiResponse<T>;
    }
    
    // Wrap raw response in ApiResponse format
    return {
      data: data as T,
      correlationId: response.headers.get('x-correlation-id') || `req_${Date.now()}`,
      pagination: this.extractPaginationFromHeaders(response.headers)
    };
  }

  /**
   * Handle error responses
   */
  private async handleError(response: Response): Promise<ApiError> {
    let errorData: any;
    
    try {
      errorData = await response.json();
    } catch {
      errorData = { message: response.statusText };
    }

    const error: ApiError = {
      error: errorData.error || 'API_ERROR',
      message: errorData.message || `Request failed with status ${response.status}`,
      statusCode: response.status,
      correlationId: response.headers.get('x-correlation-id') || undefined,
      details: errorData.details || errorData.errors || undefined
    };

    // Handle specific error codes
    if (response.status === 401) {
      this.setAuthToken(null);
      window.dispatchEvent(new CustomEvent('auth:logout'));
    }

    return error;
  }

  /**
   * Extract pagination from response headers
   */
  private extractPaginationFromHeaders(headers: Headers): any {
    const total = headers.get('x-total-count');
    const page = headers.get('x-page');
    const pageSize = headers.get('x-page-size');
    
    if (total && page && pageSize) {
      return {
        total: parseInt(total, 10),
        page: parseInt(page, 10),
        pageSize: parseInt(pageSize, 10),
        totalPages: Math.ceil(parseInt(total, 10) / parseInt(pageSize, 10))
      };
    }
    
    return undefined;
  }

  /**
   * Create request with timeout
   */
  private createRequestWithTimeout(
    url: string,
    config: RequestConfig,
    timeout: number = 30000
  ): Promise<Response> {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error('Request timeout'));
      }, timeout);

      fetch(url, {
        ...config,
        signal: controller.signal
      })
        .then(response => {
          clearTimeout(timeoutId);
          resolve(response);
        })
        .catch(error => {
          clearTimeout(timeoutId);
          if (error.name === 'AbortError') {
            reject(new Error('Request timeout'));
          } else {
            reject(error);
          }
        });
    });
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, any>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint, params);
    const headers = this.buildHeaders(config?.headers);
    
    const response = await this.createRequestWithTimeout(
      url,
      {
        ...config,
        method: 'GET',
        headers
      },
      config?.timeout
    );
    
    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint, config?.params);
    const headers = this.buildHeaders(config?.headers);
    
    const response = await this.createRequestWithTimeout(
      url,
      {
        ...config,
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined
      },
      config?.timeout
    );
    
    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint, config?.params);
    const headers = this.buildHeaders(config?.headers);
    
    const response = await this.createRequestWithTimeout(
      url,
      {
        ...config,
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined
      },
      config?.timeout
    );
    
    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint, config?.params);
    const headers = this.buildHeaders(config?.headers);
    
    const response = await this.createRequestWithTimeout(
      url,
      {
        ...config,
        method: 'PATCH',
        headers,
        body: data ? JSON.stringify(data) : undefined
      },
      config?.timeout
    );
    
    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint, config?.params);
    const headers = this.buildHeaders(config?.headers);
    
    const response = await this.createRequestWithTimeout(
      url,
      {
        ...config,
        method: 'DELETE',
        headers
      },
      config?.timeout
    );
    
    return this.handleResponse<T>(response);
  }

  /**
   * Upload file
   */
  async upload<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    const url = this.buildURL(endpoint, config?.params);
    const headers = this.buildHeaders(config?.headers);
    headers.delete('Content-Type'); // Let browser set multipart boundary
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }
    
    const response = await this.createRequestWithTimeout(
      url,
      {
        ...config,
        method: 'POST',
        headers,
        body: formData
      },
      config?.timeout || 60000 // Longer timeout for uploads
    );
    
    return this.handleResponse<T>(response);
  }

  /**
   * Build pagination params
   */
  buildPaginationParams(
    pagination?: PaginationParams,
    sort?: SortParams
  ): Record<string, any> {
    const params: Record<string, any> = {};
    
    if (pagination) {
      params.page = pagination.page;
      params.pageSize = pagination.pageSize;
    }
    
    if (sort) {
      params.sortBy = sort.field;
      params.sortOrder = sort.order;
    }
    
    return params;
  }
}

// Export singleton instance
export const apiService = new BaseApiService();