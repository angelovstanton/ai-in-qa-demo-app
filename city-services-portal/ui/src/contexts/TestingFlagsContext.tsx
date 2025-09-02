import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import api from '../lib/api';

interface TestingFlagsContextType {
  flags: Record<string, boolean>;
  isLoading: boolean;
  checkFlag: (key: string) => boolean;
  refreshFlags: () => Promise<void>;
}

const TestingFlagsContext = createContext<TestingFlagsContextType | undefined>(undefined);

export const TestingFlagsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFlags();
    // Refresh flags every 60 seconds
    const interval = setInterval(loadFlags, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadFlags = async () => {
    try {
      const response = await api.get('/testing-flags/active');
      setFlags(response.data.data || {});
    } catch (error) {
      console.error('Failed to load testing flags:', error);
      // Set empty flags on error to prevent app crash
      setFlags({});
    } finally {
      setIsLoading(false);
    }
  };

  const checkFlag = (key: string): boolean => {
    return flags[key] || false;
  };

  const refreshFlags = async () => {
    setIsLoading(true);
    await loadFlags();
  };

  return (
    <TestingFlagsContext.Provider value={{ flags, isLoading, checkFlag, refreshFlags }}>
      {children}
    </TestingFlagsContext.Provider>
  );
};

export const useTestingFlags = () => {
  const context = useContext(TestingFlagsContext);
  if (context === undefined) {
    throw new Error('useTestingFlags must be used within a TestingFlagsProvider');
  }
  return context;
};

// Helper hook to check a specific flag
export const useTestingFlag = (key: string): boolean => {
  const { checkFlag } = useTestingFlags();
  return checkFlag(key);
};

export default TestingFlagsProvider;