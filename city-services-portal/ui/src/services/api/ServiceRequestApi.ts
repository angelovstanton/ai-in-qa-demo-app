/**
 * Service Request API Service
 * Handles all service request related API calls
 * Following Single Responsibility Principle
 */

import { BaseApiService } from './BaseApiService';
import {
  ServiceRequest,
  ServiceRequestStatus,
  ApiResponse,
  PaginationParams,
  SortParams,
  Comment,
  Attachment
} from '../../../../shared/types';
import {
  CreateServiceRequestInput,
  UpdateServiceRequestInput
} from '../../../../shared/validation/schemas';

export interface ServiceRequestFilters {
  status?: ServiceRequestStatus | ServiceRequestStatus[];
  priority?: string | string[];
  departmentId?: string;
  assignedTo?: string;
  createdBy?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export class ServiceRequestApiService extends BaseApiService {
  private readonly basePath = '/api/requests';

  /**
   * Get all service requests with filters
   */
  async getRequests(
    filters?: ServiceRequestFilters,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<ApiResponse<ServiceRequest[]>> {
    const params = {
      ...filters,
      ...this.buildPaginationParams(pagination, sort)
    };

    return this.get<ServiceRequest[]>(this.basePath, params);
  }

  /**
   * Get single service request by ID
   */
  async getRequest(id: string): Promise<ApiResponse<ServiceRequest>> {
    return this.get<ServiceRequest>(`${this.basePath}/${id}`);
  }

  /**
   * Get service request by code
   */
  async getRequestByCode(code: string): Promise<ApiResponse<ServiceRequest>> {
    return this.get<ServiceRequest>(`${this.basePath}/code/${code}`);
  }

  /**
   * Create new service request
   */
  async createRequest(
    data: CreateServiceRequestInput
  ): Promise<ApiResponse<ServiceRequest>> {
    return this.post<ServiceRequest>(this.basePath, data);
  }

  /**
   * Update service request
   */
  async updateRequest(
    id: string,
    data: UpdateServiceRequestInput
  ): Promise<ApiResponse<ServiceRequest>> {
    return this.patch<ServiceRequest>(`${this.basePath}/${id}`, data);
  }

  /**
   * Update service request status
   */
  async updateRequestStatus(
    id: string,
    status: ServiceRequestStatus,
    notes?: string
  ): Promise<ApiResponse<ServiceRequest>> {
    return this.patch<ServiceRequest>(`${this.basePath}/${id}/status`, {
      status,
      notes
    });
  }

  /**
   * Delete service request
   */
  async deleteRequest(id: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.basePath}/${id}`);
  }

  /**
   * Assign request to user
   */
  async assignRequest(
    requestId: string,
    userId: string
  ): Promise<ApiResponse<ServiceRequest>> {
    return this.post<ServiceRequest>(`${this.basePath}/${requestId}/assign`, {
      assigneeId: userId
    });
  }

  /**
   * Get request comments
   */
  async getRequestComments(
    requestId: string,
    pagination?: PaginationParams
  ): Promise<ApiResponse<Comment[]>> {
    const params = this.buildPaginationParams(pagination);
    return this.get<Comment[]>(`${this.basePath}/${requestId}/comments`, params);
  }

  /**
   * Add comment to request
   */
  async addRequestComment(
    requestId: string,
    body: string,
    visibility: 'PUBLIC' | 'INTERNAL' = 'PUBLIC'
  ): Promise<ApiResponse<Comment>> {
    return this.post<Comment>(`${this.basePath}/${requestId}/comments`, {
      body,
      visibility
    });
  }

  /**
   * Get request attachments
   */
  async getRequestAttachments(
    requestId: string
  ): Promise<ApiResponse<Attachment[]>> {
    return this.get<Attachment[]>(`${this.basePath}/${requestId}/attachments`);
  }

  /**
   * Upload attachment to request
   */
  async uploadRequestAttachment(
    requestId: string,
    file: File
  ): Promise<ApiResponse<Attachment>> {
    return this.upload<Attachment>(
      `${this.basePath}/${requestId}/attachments`,
      file
    );
  }

  /**
   * Delete request attachment
   */
  async deleteRequestAttachment(
    requestId: string,
    attachmentId: string
  ): Promise<ApiResponse<void>> {
    return this.delete<void>(
      `${this.basePath}/${requestId}/attachments/${attachmentId}`
    );
  }

  /**
   * Get my requests (for citizens)
   */
  async getMyRequests(
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<ApiResponse<ServiceRequest[]>> {
    const params = this.buildPaginationParams(pagination, sort);
    return this.get<ServiceRequest[]>(`${this.basePath}/my`, params);
  }

  /**
   * Get assigned requests (for clerks/agents)
   */
  async getAssignedRequests(
    includeCompleted: boolean = false,
    pagination?: PaginationParams,
    sort?: SortParams
  ): Promise<ApiResponse<ServiceRequest[]>> {
    const params = {
      includeCompleted,
      ...this.buildPaginationParams(pagination, sort)
    };
    return this.get<ServiceRequest[]>(`${this.basePath}/assigned`, params);
  }

  /**
   * Get overdue requests
   */
  async getOverdueRequests(
    departmentId?: string
  ): Promise<ApiResponse<ServiceRequest[]>> {
    const params = departmentId ? { departmentId } : {};
    return this.get<ServiceRequest[]>(`${this.basePath}/overdue`, params);
  }

  /**
   * Search requests
   */
  async searchRequests(
    query: string,
    filters?: ServiceRequestFilters,
    pagination?: PaginationParams
  ): Promise<ApiResponse<ServiceRequest[]>> {
    const params = {
      q: query,
      ...filters,
      ...this.buildPaginationParams(pagination)
    };
    return this.get<ServiceRequest[]>(`${this.basePath}/search`, params);
  }

  /**
   * Get request statistics
   */
  async getRequestStatistics(
    filters?: ServiceRequestFilters
  ): Promise<ApiResponse<any>> {
    return this.get<any>(`${this.basePath}/statistics`, filters);
  }

  /**
   * Bulk update requests
   */
  async bulkUpdateRequests(
    requestIds: string[],
    updates: Partial<UpdateServiceRequestInput>
  ): Promise<ApiResponse<ServiceRequest[]>> {
    return this.patch<ServiceRequest[]>(`${this.basePath}/bulk`, {
      ids: requestIds,
      updates
    });
  }

  /**
   * Export requests to CSV
   */
  async exportRequestsToCSV(
    filters?: ServiceRequestFilters
  ): Promise<Blob> {
    const params = { ...filters, format: 'csv' };
    const response = await fetch(
      this.buildURL(`${this.basePath}/export`, params),
      {
        method: 'GET',
        headers: this.buildHeaders({ Accept: 'text/csv' })
      }
    );

    if (!response.ok) {
      throw await this.handleError(response);
    }

    return response.blob();
  }

  /**
   * Get request timeline/history
   */
  async getRequestTimeline(
    requestId: string
  ): Promise<ApiResponse<any[]>> {
    return this.get<any[]>(`${this.basePath}/${requestId}/timeline`);
  }

  /**
   * Upvote a request
   */
  async upvoteRequest(requestId: string): Promise<ApiResponse<void>> {
    return this.post<void>(`${this.basePath}/${requestId}/upvote`);
  }

  /**
   * Remove upvote from request
   */
  async removeUpvote(requestId: string): Promise<ApiResponse<void>> {
    return this.delete<void>(`${this.basePath}/${requestId}/upvote`);
  }

  /**
   * Get similar requests
   */
  async getSimilarRequests(
    requestId: string,
    limit: number = 5
  ): Promise<ApiResponse<ServiceRequest[]>> {
    return this.get<ServiceRequest[]>(`${this.basePath}/${requestId}/similar`, {
      limit
    });
  }

  /**
   * Merge duplicate requests
   */
  async mergeRequests(
    primaryId: string,
    duplicateIds: string[]
  ): Promise<ApiResponse<ServiceRequest>> {
    return this.post<ServiceRequest>(`${this.basePath}/${primaryId}/merge`, {
      duplicateIds
    });
  }
}

// Export singleton instance
export const serviceRequestApi = new ServiceRequestApiService();