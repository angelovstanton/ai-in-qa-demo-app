/**
 * useApi Hook
 * Generic hook for API calls with loading, error, and data states
 * Implements proper error handling and cleanup
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ApiResponse, ApiError } from '../../../shared/types';

export interface UseApiOptions {
  immediate?: boolean;
  onSuccess?: (data: any) => void;
  onError?: (error: ApiError) => void;
  retryCount?: number;
  retryDelay?: number;
}

export interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
  retry: () => Promise<void>;
}

export function useApi<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: UseApiOptions = {}
): UseApiResult<T> {
  const {
    immediate = false,
    onSuccess,
    onError,
    retryCount = 0,
    retryDelay = 1000
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<ApiError | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastArgsRef = useRef<any[]>([]);
  const retryCountRef = useRef<number>(0);
  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const execute = useCallback(async (...args: any[]) => {
    lastArgsRef.current = args;
    retryCountRef.current = 0;

    const performRequest = async (attemptNumber: number = 0): Promise<void> => {
      try {
        // Cancel any pending request
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();
        
        setLoading(true);
        setError(null);

        const response = await apiFunction(...args);
        
        if (!isMountedRef.current) return;

        setData(response.data);
        setLoading(false);
        
        if (onSuccess) {
          onSuccess(response.data);
        }
      } catch (err: any) {
        if (!isMountedRef.current) return;

        // Check if it's an abort error
        if (err.name === 'AbortError') {
          return;
        }

        const apiError: ApiError = err.statusCode
          ? err
          : {
              error: 'NETWORK_ERROR',
              message: err.message || 'An unexpected error occurred',
              statusCode: 0,
              details: err
            };

        // Retry logic
        if (attemptNumber < retryCount) {
          setTimeout(() => {
            if (isMountedRef.current) {
              performRequest(attemptNumber + 1);
            }
          }, retryDelay * Math.pow(2, attemptNumber)); // Exponential backoff
          return;
        }

        setError(apiError);
        setLoading(false);
        
        if (onError) {
          onError(apiError);
        }
      }
    };

    await performRequest();
  }, [apiFunction, onSuccess, onError, retryCount, retryDelay]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setLoading(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const retry = useCallback(async () => {
    if (lastArgsRef.current.length > 0) {
      await execute(...lastArgsRef.current);
    }
  }, [execute]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    data,
    loading,
    error,
    execute,
    reset,
    retry
  };
}

/**
 * useApiLazy Hook
 * Similar to useApi but doesn't execute immediately
 */
export function useApiLazy<T>(
  apiFunction: (...args: any[]) => Promise<ApiResponse<T>>,
  options: Omit<UseApiOptions, 'immediate'> = {}
): UseApiResult<T> {
  return useApi(apiFunction, { ...options, immediate: false });
}