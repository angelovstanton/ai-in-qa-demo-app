import { useState, useEffect, useCallback } from 'react';
import api from '../lib/api';

interface UseFeatureFlagsResult {
  flags: Record<string, any>;
  loading: boolean;
  error: string | null;
  updateFlag: (key: string, value: any) => Promise<void>;
  refetch: () => void;
}

export const useFeatureFlags = (): UseFeatureFlagsResult => {
  const [flags, setFlags] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/flags');
      setFlags(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to fetch feature flags');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateFlag = async (key: string, value: any) => {
    try {
      const response = await api.patch(`/admin/flags/${key}`, { value });
      setFlags(response.data.data.allFlags);
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to update feature flag';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  return {
    flags,
    loading,
    error,
    updateFlag,
    refetch: fetchFlags,
  };
};

export const useAdminActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const seedDatabase = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/admin/seed');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to seed database';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const resetDatabase = async () => {
    setLoading(true);
    setError(null);

    try {
      await api.post('/admin/reset');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to reset database';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getStats = async () => {
    try {
      const response = await api.get('/admin/stats');
      return response.data.data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.error?.message || 'Failed to get database stats';
      throw new Error(errorMessage);
    }
  };

  return {
    seedDatabase,
    resetDatabase,
    getStats,
    loading,
    error,
  };
};