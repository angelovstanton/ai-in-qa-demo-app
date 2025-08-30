import { PrismaClient, DepartmentMetrics } from '@prisma/client';
import { prisma } from '../../infrastructure/database/prismaClient';

export interface MetricsFilters {
  departmentId?: string;
  metricType?: string;
  period?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface MetricsSummary {
  avgResolutionTime: number;
  slaCompliance: number;
  satisfaction: number;
  productivity: number;
  requestVolume: number;
  period: string;
}

/**
 * Department Metrics Service
 * Handles all department metrics calculations and retrieval
 * Single Responsibility: Department performance metrics
 */
export class DepartmentMetricsService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = prisma) {
    this.prisma = prismaClient;
  }

  /**
   * Get department metrics with filters
   */
  async getMetrics(filters: MetricsFilters): Promise<DepartmentMetrics[]> {
    const where: any = {};

    if (filters.departmentId) {
      where.departmentId = filters.departmentId;
    }

    if (filters.metricType) {
      where.metricType = filters.metricType;
    }

    if (filters.period) {
      where.period = filters.period;
    }

    if (filters.startDate || filters.endDate) {
      where.periodStart = {};
      if (filters.startDate) where.periodStart.gte = filters.startDate;
      if (filters.endDate) where.periodStart.lte = filters.endDate;
    }

    return this.prisma.departmentMetrics.findMany({
      where,
      include: { department: true },
      orderBy: { periodStart: 'desc' }
    });
  }

  /**
   * Calculate and store department metrics
   */
  async calculateMetrics(
    departmentId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'quarterly',
    periodStart: Date,
    periodEnd: Date
  ): Promise<MetricsSummary> {
    // Get all requests for the department in the period
    const requests = await this.prisma.serviceRequest.findMany({
      where: {
        departmentId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      include: {
        qualityReviews: true
      }
    });

    // Calculate metrics
    const metrics = {
      avgResolutionTime: this.calculateAvgResolutionTime(requests),
      slaCompliance: this.calculateSLACompliance(requests),
      satisfaction: this.calculateSatisfaction(requests),
      productivity: this.calculateProductivity(requests),
      requestVolume: requests.length,
      period
    };

    // Store metrics in database
    await this.storeMetrics(departmentId, metrics, period, periodStart, periodEnd);

    return metrics;
  }

  /**
   * Get trending metrics for department
   */
  async getTrendingMetrics(
    departmentId: string,
    metricType: string,
    periods: number = 12
  ): Promise<DepartmentMetrics[]> {
    return this.prisma.departmentMetrics.findMany({
      where: {
        departmentId,
        metricType
      },
      orderBy: { periodStart: 'desc' },
      take: periods
    });
  }

  /**
   * Compare metrics across departments
   */
  async compareDepartments(
    metricType: string,
    period: string,
    periodStart: Date
  ): Promise<DepartmentMetrics[]> {
    return this.prisma.departmentMetrics.findMany({
      where: {
        metricType,
        period,
        periodStart
      },
      include: { department: true },
      orderBy: { value: 'desc' }
    });
  }

  /**
   * Get performance summary for department
   */
  async getPerformanceSummary(departmentId: string): Promise<any> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [currentMetrics, previousMetrics, topPerformers] = await Promise.all([
      this.getMetrics({
        departmentId,
        startDate: thirtyDaysAgo
      }),
      this.getMetrics({
        departmentId,
        startDate: new Date(thirtyDaysAgo.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: thirtyDaysAgo
      }),
      this.getTopPerformers(departmentId, 5)
    ]);

    return {
      current: this.aggregateMetrics(currentMetrics),
      previous: this.aggregateMetrics(previousMetrics),
      trend: this.calculateTrend(currentMetrics, previousMetrics),
      topPerformers
    };
  }

  /**
   * Generate metrics report
   */
  async generateReport(
    departmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const metrics = await this.getMetrics({
      departmentId,
      startDate,
      endDate
    });

    const groupedByType = this.groupMetricsByType(metrics);
    const averages = this.calculateAverages(groupedByType);
    const trends = await this.calculateTrends(departmentId, startDate, endDate);

    return {
      period: { startDate, endDate },
      metrics: groupedByType,
      averages,
      trends,
      generatedAt: new Date()
    };
  }

  // Private helper methods
  private calculateAvgResolutionTime(requests: any[]): number {
    const resolved = requests.filter(r => r.status === 'CLOSED' && r.closedAt);
    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((sum, req) => {
      const diff = new Date(req.closedAt).getTime() - new Date(req.createdAt).getTime();
      return sum + diff;
    }, 0);

    return Math.round(totalTime / resolved.length / (1000 * 60 * 60)); // in hours
  }

  private calculateSLACompliance(requests: any[]): number {
    const withSLA = requests.filter(r => r.slaDueAt);
    if (withSLA.length === 0) return 100;

    const compliant = withSLA.filter(r => {
      if (r.status === 'CLOSED' && r.closedAt) {
        return new Date(r.closedAt) <= new Date(r.slaDueAt);
      }
      return new Date() <= new Date(r.slaDueAt);
    });

    return Math.round((compliant.length / withSLA.length) * 100);
  }

  private calculateSatisfaction(requests: any[]): number {
    const withRating = requests.filter(r => r.satisfactionRating);
    if (withRating.length === 0) return 0;

    const totalRating = withRating.reduce((sum, r) => sum + r.satisfactionRating, 0);
    return Math.round((totalRating / withRating.length) * 20); // Convert 1-5 to percentage
  }

  private calculateProductivity(requests: any[]): number {
    const completed = requests.filter(r => 
      ['RESOLVED', 'CLOSED'].includes(r.status)
    );
    return Math.round((completed.length / requests.length) * 100);
  }

  private async storeMetrics(
    departmentId: string,
    metrics: MetricsSummary,
    period: string,
    periodStart: Date,
    periodEnd: Date
  ): Promise<void> {
    const metricTypes = Object.keys(metrics).filter(k => k !== 'period');
    
    const operations = metricTypes.map(metricType => 
      this.prisma.departmentMetrics.upsert({
        where: {
          departmentId_metricType_period_periodStart: {
            departmentId,
            metricType,
            period,
            periodStart
          }
        },
        update: {
          value: (metrics as any)[metricType],
          periodEnd,
          calculatedAt: new Date()
        },
        create: {
          departmentId,
          metricType,
          value: (metrics as any)[metricType],
          period,
          periodStart,
          periodEnd
        }
      })
    );

    await this.prisma.$transaction(operations);
  }

  private async getTopPerformers(departmentId: string, limit: number): Promise<any[]> {
    return this.prisma.staffPerformance.findMany({
      where: { departmentId },
      include: { user: true },
      orderBy: { productivityScore: 'desc' },
      take: limit
    });
  }

  private aggregateMetrics(metrics: DepartmentMetrics[]): Record<string, number> {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = 0;
      }
      acc[metric.metricType] += metric.value;
      return acc;
    }, {} as Record<string, number>);
  }

  private calculateTrend(
    current: DepartmentMetrics[],
    previous: DepartmentMetrics[]
  ): Record<string, number> {
    const currentAgg = this.aggregateMetrics(current);
    const previousAgg = this.aggregateMetrics(previous);
    const trend: Record<string, number> = {};

    Object.keys(currentAgg).forEach(key => {
      if (previousAgg[key]) {
        trend[key] = ((currentAgg[key] - previousAgg[key]) / previousAgg[key]) * 100;
      } else {
        trend[key] = 100;
      }
    });

    return trend;
  }

  private groupMetricsByType(metrics: DepartmentMetrics[]): Record<string, DepartmentMetrics[]> {
    return metrics.reduce((acc, metric) => {
      if (!acc[metric.metricType]) {
        acc[metric.metricType] = [];
      }
      acc[metric.metricType].push(metric);
      return acc;
    }, {} as Record<string, DepartmentMetrics[]>);
  }

  private calculateAverages(groupedMetrics: Record<string, DepartmentMetrics[]>): Record<string, number> {
    const averages: Record<string, number> = {};
    
    Object.keys(groupedMetrics).forEach(metricType => {
      const metrics = groupedMetrics[metricType];
      const sum = metrics.reduce((acc, m) => acc + m.value, 0);
      averages[metricType] = sum / metrics.length;
    });

    return averages;
  }

  private async calculateTrends(
    departmentId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any> {
    const metrics = await this.prisma.departmentMetrics.findMany({
      where: {
        departmentId,
        periodStart: { gte: startDate, lte: endDate }
      },
      orderBy: { periodStart: 'asc' }
    });

    const grouped = this.groupMetricsByType(metrics);
    const trends: Record<string, any> = {};

    Object.keys(grouped).forEach(metricType => {
      const typeMetrics = grouped[metricType];
      trends[metricType] = {
        data: typeMetrics.map(m => ({
          date: m.periodStart,
          value: m.value
        })),
        min: Math.min(...typeMetrics.map(m => m.value)),
        max: Math.max(...typeMetrics.map(m => m.value)),
        average: this.calculateAverages({ [metricType]: typeMetrics })[metricType]
      };
    });

    return trends;
  }
}