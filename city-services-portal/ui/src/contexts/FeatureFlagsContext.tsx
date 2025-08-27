import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../lib/api';

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
  category: 'API' | 'UI' | 'PERFORMANCE' | 'UPLOAD' | 'VALIDATION';
  createdAt: string;
  updatedAt: string;
}

interface FeatureFlagsContextType {
  flags: Record<string, boolean>;
  allFlags: FeatureFlag[];
  loading: boolean;
  error: string | null;
  isEnabled: (flagName: string) => boolean;
  toggleFlag: (flagName: string) => Promise<void>;
  refreshFlags: () => Promise<void>;
  simulateRandomError: () => boolean;
  simulateSlowRequest: () => boolean;
  simulateUploadError: () => boolean;
  getWrongDefaultSort: () => string;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType | undefined>(undefined);

// Default feature flags for testing scenarios
const DEFAULT_FLAGS: Omit<FeatureFlag, 'id' | 'createdAt' | 'updatedAt'>[] = [
  {
    name: 'API_Random500',
    enabled: false,
    description: 'Introduces 5% random server errors (HTTP 500) to test error handling',
    category: 'API',
  },
  {
    name: 'UI_WrongDefaultSort',
    enabled: false,
    description: 'Changes default sorting behavior to test sorting functionality',
    category: 'UI',
  },
  {
    name: 'API_SlowRequests',
    enabled: false,
    description: 'Simulates 10% slow API responses (3-5 second delays)',
    category: 'PERFORMANCE',
  },
  {
    name: 'API_UploadIntermittentFail',
    enabled: false,
    description: 'Random file upload failures (30% failure rate)',
    category: 'UPLOAD',
  },
  {
    name: 'UI_ValidationErrors',
    enabled: false,
    description: 'Triggers validation errors randomly to test form handling',
    category: 'VALIDATION',
  },
  {
    name: 'API_DatabaseTimeout',
    enabled: false,
    description: 'Simulates database timeout errors (1% occurrence)',
    category: 'API',
  },
  {
    name: 'UI_MissingTranslations',
    enabled: false,
    description: 'Shows translation keys instead of translated text',
    category: 'UI',
  },
  {
    name: 'API_AuthTokenExpiry',
    enabled: false,
    description: 'Forces authentication token expiry scenarios',
    category: 'API',
  },
  {
    name: 'UI_MemoryLeak',
    enabled: false,
    description: 'Simulates memory leak scenarios for performance testing',
    category: 'PERFORMANCE',
  },
  {
    name: 'API_NetworkErrors',
    enabled: false,
    description: 'Simulates network connectivity issues',
    category: 'API',
  },
];

interface FeatureFlagsProviderProps {
  children: ReactNode;
}

export const FeatureFlagsProvider: React.FC<FeatureFlagsProviderProps> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [allFlags, setAllFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchFlags = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await api.get('/admin/feature-flags');
      const flagsData = response.data.data;
      
      // Convert to lookup object for easier access
      const flagsLookup = flagsData.reduce((acc: Record<string, boolean>, flag: FeatureFlag) => {
        acc[flag.name] = flag.enabled;
        return acc;
      }, {});
      
      setFlags(flagsLookup);
      setAllFlags(flagsData);
    } catch (err: any) {
      console.warn('Failed to fetch feature flags, using defaults:', err.message);
      
      // Fallback to default flags if API is unavailable
      const defaultFlagsWithIds = DEFAULT_FLAGS.map((flag, index) => ({
        ...flag,
        id: `default-${index}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      
      const defaultLookup = defaultFlagsWithIds.reduce((acc: Record<string, boolean>, flag) => {
        acc[flag.name] = flag.enabled;
        return acc;
      }, {});
      
      setFlags(defaultLookup);
      setAllFlags(defaultFlagsWithIds);
      setError('Using default feature flags (API unavailable)');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (flagName: string) => {
    try {
      const response = await api.patch(`/admin/feature-flags/${flagName}`, {
        enabled: !flags[flagName],
      });
      
      const updatedFlag = response.data.data;
      setFlags(prev => ({
        ...prev,
        [flagName]: updatedFlag.enabled,
      }));
      
      setAllFlags(prev => prev.map(flag => 
        flag.name === flagName 
          ? { ...flag, enabled: updatedFlag.enabled, updatedAt: updatedFlag.updatedAt }
          : flag
      ));
    } catch (err: any) {
      console.error('Failed to toggle feature flag:', err.message);
      
      // Optimistic update for testing when API is unavailable
      setFlags(prev => ({
        ...prev,
        [flagName]: !prev[flagName],
      }));
      
      setAllFlags(prev => prev.map(flag => 
        flag.name === flagName 
          ? { ...flag, enabled: !flag.enabled, updatedAt: new Date().toISOString() }
          : flag
      ));
    }
  };

  const isEnabled = (flagName: string): boolean => {
    return flags[flagName] || false;
  };

  // Feature flag simulation functions
  const simulateRandomError = (): boolean => {
    if (!isEnabled('API_Random500')) return false;
    return Math.random() < 0.05; // 5% chance
  };

  const simulateSlowRequest = (): boolean => {
    if (!isEnabled('API_SlowRequests')) return false;
    return Math.random() < 0.1; // 10% chance
  };

  const simulateUploadError = (): boolean => {
    if (!isEnabled('API_UploadIntermittentFail')) return false;
    return Math.random() < 0.3; // 30% chance
  };

  const getWrongDefaultSort = (): string => {
    if (!isEnabled('UI_WrongDefaultSort')) return 'createdAt:desc';
    return 'title:asc'; // Wrong default for testing
  };

  const refreshFlags = async () => {
    await fetchFlags();
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const contextValue: FeatureFlagsContextType = {
    flags,
    allFlags,
    loading,
    error,
    isEnabled,
    toggleFlag,
    refreshFlags,
    simulateRandomError,
    simulateSlowRequest,
    simulateUploadError,
    getWrongDefaultSort,
  };

  return (
    <FeatureFlagsContext.Provider value={contextValue}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = (): FeatureFlagsContextType => {
  const context = useContext(FeatureFlagsContext);
  if (context === undefined) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagsProvider');
  }
  return context;
};

// Higher-order component for conditional feature rendering
export const withFeatureFlag = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  flagName: string,
  fallback?: React.ComponentType<P> | React.ReactElement | null
) => {
  const ComponentWithFeatureFlag = (props: P) => {
    const { isEnabled } = useFeatureFlags();

    if (!isEnabled(flagName)) {
      if (fallback) {
        if (React.isValidElement(fallback)) {
          return fallback;
        }
        const FallbackComponent = fallback as React.ComponentType<P>;
        return <FallbackComponent {...props} />;
      }
      return null;
    }

    return <WrappedComponent {...props} />;
  };

  ComponentWithFeatureFlag.displayName = `withFeatureFlag(${WrappedComponent.displayName || WrappedComponent.name})`;
  
  return ComponentWithFeatureFlag;
};

// Hook for conditional feature behavior
export const useFeatureVariant = (flagName: string, variants: Record<string, any>) => {
  const { isEnabled } = useFeatureFlags();
  
  return isEnabled(flagName) ? variants.enabled : variants.disabled;
};