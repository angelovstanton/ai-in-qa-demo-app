import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class FeatureFlagService {
  private static cache = new Map<string, any>();
  private static lastCacheUpdate = 0;
  private static CACHE_TTL = 30 * 1000; // 30 seconds

  static async getFlag(key: string, defaultValue: any = false): Promise<any> {
    await this.refreshCacheIfNeeded();
    
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }
    
    return defaultValue;
  }

  static async setFlag(key: string, value: any): Promise<void> {
    const flag = await prisma.featureFlag.upsert({
      where: { key },
      update: { value: JSON.stringify(value) },
      create: { key, value: JSON.stringify(value) }
    });

    // Update cache
    this.cache.set(key, value);
  }

  static async getAllFlags(): Promise<Record<string, any>> {
    await this.refreshCacheIfNeeded();
    return Object.fromEntries(this.cache);
  }

  private static async refreshCacheIfNeeded(): Promise<void> {
    const now = Date.now();
    if (now - this.lastCacheUpdate > this.CACHE_TTL) {
      await this.refreshCache();
    }
  }

  private static async refreshCache(): Promise<void> {
    const flags = await prisma.featureFlag.findMany();
    this.cache.clear();
    
    for (const flag of flags) {
      try {
        const value = JSON.parse(flag.value);
        this.cache.set(flag.key, value);
      } catch (error) {
        console.error(`Failed to parse flag ${flag.key}:`, error);
        this.cache.set(flag.key, false);
      }
    }
    
    this.lastCacheUpdate = Date.now();
  }

  // Feature flag implementations
  static async shouldApplyWrongDefaultSort(): Promise<boolean> {
    return await this.getFlag('UI_WrongDefaultSort', false);
  }

  static async shouldApplyMissingAriaSearch(): Promise<boolean> {
    return await this.getFlag('UI_MissingAria_Search', false);
  }

  static async shouldApplyRandom500(): Promise<boolean> {
    return await this.getFlag('API_Random500', false);
  }

  static async shouldApplySlowRequests(): Promise<boolean> {
    return await this.getFlag('API_SlowRequests', false);
  }

  static async shouldApplyUploadIntermittentFail(): Promise<boolean> {
    return await this.getFlag('API_UploadIntermittentFail', false);
  }
}