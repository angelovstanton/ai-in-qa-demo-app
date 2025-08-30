import { PrismaClient } from '@prisma/client';

/**
 * Base Repository Interface
 * Implements Interface Segregation Principle (ISP) from SOLID
 */
export interface IBaseRepository<T, CreateDTO, UpdateDTO> {
  findById(id: string): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  create(data: CreateDTO): Promise<T>;
  update(id: string, data: UpdateDTO): Promise<T>;
  delete(id: string): Promise<T>;
  count(where?: any): Promise<number>;
}

export interface QueryOptions {
  where?: any;
  orderBy?: any;
  skip?: number;
  take?: number;
  include?: any;
  select?: any;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Abstract Base Repository
 * Implements common database operations following DRY principle
 */
export abstract class BaseRepository<T, CreateDTO, UpdateDTO> 
  implements IBaseRepository<T, CreateDTO, UpdateDTO> {
  
  protected prisma: PrismaClient;
  protected modelName: string;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.modelName = modelName;
  }

  protected get model(): any {
    return (this.prisma as any)[this.modelName];
  }

  async findById(id: string): Promise<T | null> {
    return this.model.findUnique({
      where: { id }
    });
  }

  async findAll(options: QueryOptions = {}): Promise<T[]> {
    return this.model.findMany(options);
  }

  async findPaginated(
    page: number = 1,
    pageSize: number = 10,
    options: QueryOptions = {}
  ): Promise<PaginatedResult<T>> {
    const skip = (page - 1) * pageSize;
    
    const [data, total] = await Promise.all([
      this.model.findMany({
        ...options,
        skip,
        take: pageSize
      }),
      this.count(options.where)
    ]);

    return {
      data,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  }

  async create(data: CreateDTO): Promise<T> {
    return this.model.create({ data });
  }

  async createMany(data: CreateDTO[]): Promise<number> {
    const result = await this.model.createMany({ data });
    return result.count;
  }

  async update(id: string, data: UpdateDTO): Promise<T> {
    return this.model.update({
      where: { id },
      data
    });
  }

  async updateMany(where: any, data: UpdateDTO): Promise<number> {
    const result = await this.model.updateMany({
      where,
      data
    });
    return result.count;
  }

  async delete(id: string): Promise<T> {
    return this.model.delete({
      where: { id }
    });
  }

  async deleteMany(where: any): Promise<number> {
    const result = await this.model.deleteMany({ where });
    return result.count;
  }

  async count(where?: any): Promise<number> {
    return this.model.count({ where });
  }

  async exists(where: any): Promise<boolean> {
    const count = await this.count(where);
    return count > 0;
  }

  /**
   * Execute raw SQL query with type safety
   */
  protected async executeRaw<R>(
    query: string,
    params: any[] = []
  ): Promise<R[]> {
    return this.prisma.$queryRawUnsafe<R[]>(query, ...params);
  }

  /**
   * Batch operations for performance optimization
   */
  async batchUpdate(
    updates: Array<{ id: string; data: UpdateDTO }>
  ): Promise<void> {
    const operations = updates.map(({ id, data }) =>
      this.model.update({
        where: { id },
        data
      })
    );
    
    await this.prisma.$transaction(operations);
  }
}