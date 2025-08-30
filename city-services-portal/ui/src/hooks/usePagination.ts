/**
 * usePagination Hook
 * Manages pagination state and provides helper functions
 * Reusable across different data tables and lists
 */

import { useState, useCallback, useMemo } from 'react';
import { PaginationParams, PaginationMeta } from '../../../shared/types';

export interface UsePaginationOptions {
  initialPage?: number;
  initialPageSize?: number;
  pageSizeOptions?: number[];
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
}

export interface UsePaginationResult {
  page: number;
  pageSize: number;
  totalPages: number;
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  pageSizeOptions: number[];
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  updatePagination: (meta: PaginationMeta) => void;
  getPaginationParams: () => PaginationParams;
  getPageInfo: () => string;
  getPageRange: () => { start: number; end: number };
}

export function usePagination(
  options: UsePaginationOptions = {}
): UsePaginationResult {
  const {
    initialPage = 1,
    initialPageSize = 10,
    pageSizeOptions = [5, 10, 20, 50, 100],
    onPageChange,
    onPageSizeChange
  } = options;

  const [page, setPageState] = useState<number>(initialPage);
  const [pageSize, setPageSizeState] = useState<number>(initialPageSize);
  const [total, setTotal] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(0);

  const hasNextPage = useMemo(() => page < totalPages, [page, totalPages]);
  const hasPreviousPage = useMemo(() => page > 1, [page]);

  const setPage = useCallback((newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages || 1));
    setPageState(validPage);
    if (onPageChange) {
      onPageChange(validPage);
    }
  }, [totalPages, onPageChange]);

  const setPageSize = useCallback((newPageSize: number) => {
    setPageSizeState(newPageSize);
    // Reset to first page when page size changes
    setPageState(1);
    if (onPageSizeChange) {
      onPageSizeChange(newPageSize);
    }
    if (onPageChange) {
      onPageChange(1);
    }
  }, [onPageChange, onPageSizeChange]);

  const nextPage = useCallback(() => {
    if (hasNextPage) {
      setPage(page + 1);
    }
  }, [page, hasNextPage, setPage]);

  const previousPage = useCallback(() => {
    if (hasPreviousPage) {
      setPage(page - 1);
    }
  }, [page, hasPreviousPage, setPage]);

  const firstPage = useCallback(() => {
    setPage(1);
  }, [setPage]);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages, setPage]);

  const updatePagination = useCallback((meta: PaginationMeta) => {
    setTotal(meta.total);
    setTotalPages(meta.totalPages);
    // Update page if current page is out of bounds
    if (meta.page !== page && meta.page <= meta.totalPages) {
      setPageState(meta.page);
    }
    if (meta.pageSize !== pageSize) {
      setPageSizeState(meta.pageSize);
    }
  }, [page, pageSize]);

  const getPaginationParams = useCallback((): PaginationParams => ({
    page,
    pageSize
  }), [page, pageSize]);

  const getPageInfo = useCallback((): string => {
    if (total === 0) {
      return 'No results';
    }
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, total);
    return `Showing ${start}-${end} of ${total} results`;
  }, [page, pageSize, total]);

  const getPageRange = useCallback((): { start: number; end: number } => {
    const start = (page - 1) * pageSize;
    const end = Math.min(start + pageSize, total);
    return { start, end };
  }, [page, pageSize, total]);

  return {
    page,
    pageSize,
    totalPages,
    total,
    hasNextPage,
    hasPreviousPage,
    pageSizeOptions,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    firstPage,
    lastPage,
    updatePagination,
    getPaginationParams,
    getPageInfo,
    getPageRange
  };
}

/**
 * useInfinitePagination Hook
 * For infinite scrolling implementations
 */
export interface UseInfinitePaginationResult<T> {
  items: T[];
  loading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  reset: () => void;
  totalLoaded: number;
}

export function useInfinitePagination<T>(
  fetchFunction: (page: number, pageSize: number) => Promise<{ data: T[]; hasMore: boolean }>,
  pageSize: number = 20
): UseInfinitePaginationResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;

    setLoading(true);
    try {
      const result = await fetchFunction(page, pageSize);
      setItems(prev => [...prev, ...result.data]);
      setHasMore(result.hasMore);
      setPage(prev => prev + 1);
    } catch (error) {
      console.error('Error loading more items:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, loading, hasMore, fetchFunction]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(1);
    setHasMore(true);
    setLoading(false);
  }, []);

  return {
    items,
    loading,
    hasMore,
    loadMore,
    reset,
    totalLoaded: items.length
  };
}