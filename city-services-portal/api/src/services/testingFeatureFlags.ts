import { PrismaClient, TestingFeatureFlag } from '@prisma/client';

const prisma = new PrismaClient();

// In-memory cache for feature flags
let flagCache: Map<string, TestingFeatureFlag> = new Map();
let cacheTimestamp: number = 0;
const CACHE_TTL = 60000; // 1 minute cache

export interface FlagMetadata {
  percentage?: number;
  delayMs?: number;
  failureRate?: number;
  isSystemFlag?: boolean;
  [key: string]: any;
}

export class TestingFeatureFlagService {
  /**
   * Load all flags into cache
   */
  private static async loadCache(): Promise<void> {
    const now = Date.now();
    if (now - cacheTimestamp < CACHE_TTL) {
      return; // Cache is still valid
    }

    try {
      const flags = await prisma.testingFeatureFlag.findMany();
      flagCache.clear();
      
      for (const flag of flags) {
        flagCache.set(flag.key, flag);
      }
      
      cacheTimestamp = now;
    } catch (error) {
      console.error('Failed to load feature flags:', error);
    }
  }

  /**
   * Check if a feature flag is enabled
   */
  static async isEnabled(key: string): Promise<boolean> {
    await this.loadCache();
    
    // Check master control first
    const masterFlag = flagCache.get('MASTER_TESTING_FLAGS_ENABLED');
    const isMasterEnabled = masterFlag?.isEnabled || false;
    
    // Get the specific flag
    const flag = flagCache.get(key);
    if (!flag) {
      return false;
    }
    
    // If flag is master-controlled and master is disabled, return false
    if (flag.isMasterControlled && !isMasterEnabled && key !== 'MASTER_TESTING_FLAGS_ENABLED') {
      return false;
    }
    
    return flag.isEnabled;
  }

  /**
   * Get all feature flags
   */
  static async getAllFlags(): Promise<TestingFeatureFlag[]> {
    return await prisma.testingFeatureFlag.findMany({
      orderBy: [
        { category: 'asc' },
        { impactLevel: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  /**
   * Get flags by category
   */
  static async getFlagsByCategory(category: string): Promise<TestingFeatureFlag[]> {
    return await prisma.testingFeatureFlag.findMany({
      where: { category },
      orderBy: [
        { impactLevel: 'asc' },
        { name: 'asc' }
      ]
    });
  }

  /**
   * Update a feature flag
   */
  static async updateFlag(key: string, isEnabled: boolean): Promise<TestingFeatureFlag | null> {
    try {
      const updated = await prisma.testingFeatureFlag.update({
        where: { key },
        data: { isEnabled }
      });
      
      // Clear cache to force reload
      cacheTimestamp = 0;
      
      return updated;
    } catch (error) {
      console.error(`Failed to update flag ${key}:`, error);
      return null;
    }
  }

  /**
   * Bulk update flags
   */
  static async bulkUpdateFlags(updates: { key: string; isEnabled: boolean }[]): Promise<void> {
    const promises = updates.map(update =>
      prisma.testingFeatureFlag.update({
        where: { key: update.key },
        data: { isEnabled: update.isEnabled }
      })
    );
    
    await Promise.all(promises);
    
    // Clear cache to force reload
    cacheTimestamp = 0;
  }

  /**
   * Enable all flags in a category
   */
  static async enableCategory(category: string): Promise<void> {
    await prisma.testingFeatureFlag.updateMany({
      where: { 
        category,
        isMasterControlled: true
      },
      data: { isEnabled: true }
    });
    
    // Clear cache to force reload
    cacheTimestamp = 0;
  }

  /**
   * Disable all flags in a category
   */
  static async disableCategory(category: string): Promise<void> {
    await prisma.testingFeatureFlag.updateMany({
      where: { 
        category,
        isMasterControlled: true
      },
      data: { isEnabled: false }
    });
    
    // Clear cache to force reload
    cacheTimestamp = 0;
  }

  /**
   * Reset all flags to default values
   */
  static async resetAllFlags(): Promise<void> {
    const flags = await prisma.testingFeatureFlag.findMany();
    
    const promises = flags.map(flag =>
      prisma.testingFeatureFlag.update({
        where: { key: flag.key },
        data: { isEnabled: flag.defaultValue }
      })
    );
    
    await Promise.all(promises);
    
    // Clear cache to force reload
    cacheTimestamp = 0;
  }

  /**
   * Get flag metadata
   */
  static async getFlagMetadata(key: string): Promise<FlagMetadata | null> {
    await this.loadCache();
    
    const flag = flagCache.get(key);
    if (!flag || !flag.metadata) {
      return null;
    }
    
    try {
      return JSON.parse(flag.metadata);
    } catch {
      return null;
    }
  }

  /**
   * Helper to check percentage-based flags
   */
  static async shouldTrigger(key: string, defaultPercentage: number = 10): Promise<boolean> {
    if (!(await this.isEnabled(key))) {
      return false;
    }
    
    const metadata = await this.getFlagMetadata(key);
    const percentage = metadata?.percentage || defaultPercentage;
    
    return Math.random() * 100 < percentage;
  }

  /**
   * Get flag statistics
   */
  static async getStatistics(): Promise<{
    total: number;
    enabled: number;
    byCategory: Record<string, { total: number; enabled: number }>;
    byImpact: Record<string, { total: number; enabled: number }>;
  }> {
    const flags = await this.getAllFlags();
    
    const stats = {
      total: flags.length,
      enabled: flags.filter(f => f.isEnabled).length,
      byCategory: {} as Record<string, { total: number; enabled: number }>,
      byImpact: {} as Record<string, { total: number; enabled: number }>
    };
    
    for (const flag of flags) {
      // Category stats
      if (!stats.byCategory[flag.category]) {
        stats.byCategory[flag.category] = { total: 0, enabled: 0 };
      }
      stats.byCategory[flag.category].total++;
      if (flag.isEnabled) {
        stats.byCategory[flag.category].enabled++;
      }
      
      // Impact stats
      if (!stats.byImpact[flag.impactLevel]) {
        stats.byImpact[flag.impactLevel] = { total: 0, enabled: 0 };
      }
      stats.byImpact[flag.impactLevel].total++;
      if (flag.isEnabled) {
        stats.byImpact[flag.impactLevel].enabled++;
      }
    }
    
    return stats;
  }
}

export default TestingFeatureFlagService;