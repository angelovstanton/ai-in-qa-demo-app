import { PrismaClient } from '@prisma/client';

/**
 * PrismaClient Singleton Service
 * Implements Singleton pattern to ensure a single database connection pool
 * Following SOLID principle: Single Responsibility - manages database connection
 */
class PrismaService {
  private static instance: PrismaService;
  private prisma: PrismaClient;

  private constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' 
        ? ['query', 'error', 'warn'] 
        : ['error'],
      errorFormat: 'pretty',
    });

    // Handle connection lifecycle
    this.prisma.$connect()
      .then(() => console.log('Database connected successfully'))
      .catch((error) => {
        console.error('Failed to connect to database:', error);
        process.exit(1);
      });

    // Graceful shutdown
    process.on('SIGINT', this.disconnect);
    process.on('SIGTERM', this.disconnect);
  }

  public static getInstance(): PrismaService {
    if (!PrismaService.instance) {
      PrismaService.instance = new PrismaService();
    }
    return PrismaService.instance;
  }

  public getClient(): PrismaClient {
    return this.prisma;
  }

  private disconnect = async (): Promise<void> => {
    await this.prisma.$disconnect();
    console.log('Database disconnected');
    process.exit(0);
  };

  /**
   * Transaction helper for complex operations
   */
  public async transaction<T>(
    fn: (prisma: PrismaClient) => Promise<T>
  ): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      return fn(tx as PrismaClient);
    });
  }

  /**
   * Health check for database connection
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const prismaService = PrismaService.getInstance();
export const prisma = prismaService.getClient();