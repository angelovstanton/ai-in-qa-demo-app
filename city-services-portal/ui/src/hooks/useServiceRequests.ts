import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';
import { ServiceRequest, PaginatedResponse } from '../types';

interface UseServiceRequestsParams {
  page?: number;
  pageSize?: number;
  sort?: string;
  status?: string;
  category?: string;
  priority?: string;
  department?: string;
  assignedTo?: string;
  text?: string;
  createdBy?: string;
}

interface UseServiceRequestsResult {
  data: ServiceRequest[];
  loading: boolean;
  error: string | null;
  totalCount: number;
  refetch: () => void;
}

export const useServiceRequests = (params: UseServiceRequestsParams = {}): UseServiceRequestsResult => {
  const [data, setData] = useState<ServiceRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      
      if (params.page !== undefined) queryParams.append('page', params.page.toString());
      if (params.pageSize !== undefined) queryParams.append('size', params.pageSize.toString());
      if (params.sort) queryParams.append('sort', params.sort);
      if (params.status) queryParams.append('status', params.status);
      if (params.category) queryParams.append('category', params.category);
      if (params.priority) queryParams.append('priority', params.priority);
      if (params.department) queryParams.append('department', params.department);
      if (params.assignedTo) queryParams.append('assignedTo', params.assignedTo);
      if (params.text) queryParams.append('text', params.text);
      if (params.createdBy) queryParams.append('createdBy', params.createdBy);

      const response = await api.get<PaginatedResponse<ServiceRequest>>(`/requests?${queryParams.toString()}`);
      
      setData(response.data.data);
      setTotalCount(response.data.pagination.totalCount);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch service requests');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    totalCount,
    refetch: fetchData,
  };
};

interface CreateServiceRequestData {
  title: string;
  description: string;
  category: string;
  priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  locationText: string;
}

export const useCreateServiceRequest = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createRequest = async (data: CreateServiceRequestData, idempotencyKey?: string) => {
    setLoading(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (idempotencyKey) {
        headers['Idempotency-Key'] = idempotencyKey;
      }

      const response = await api.post('/requests', data, { headers });
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to create service request';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return {
    createRequest,
    loading,
    error,
  };
};