import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type TimePeriod = 'daily' | 'weekly' | 'monthly' | 'quarterly';

export interface AgentWorkload {
  userId: string;
  name: string;
  email: string;
  activeRequests: number;
  completedRequests: number;
  averageHandlingTime: number;
  workloadScore: number;
  utilizationRate: number;
}

export interface DepartmentMetrics {
  departmentId: string;
  departmentName: string;
  period: TimePeriod;
  periodStart: Date;
  periodEnd: Date;
  avgResolutionTime: number;
  slaCompliance: number;
  firstCallResolution: number;
  citizenSatisfaction: number;
  requestVolume: number;
  escalationRate: number;
  staffUtilization: number;
  agentWorkloads: AgentWorkload[];
  categoryBreakdown: Record<string, number>;
  priorityBreakdown: Record<string, number>;
  calculatedAt: Date;
}

export class MetricsCalculatorService {
  
  /**
   * Calculate average resolution time for resolved requests in the given period
   */
  async calculateAverageResolutionTime(departmentId: string, period: TimePeriod, periodStart: Date, periodEnd: Date): Promise<number> {
    const resolvedRequests = await prisma.serviceRequest.findMany({
      where: {
        departmentId,
        status: { in: ['RESOLVED', 'CLOSED'] },
        closedAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      select: {
        createdAt: true,
        closedAt: true
      }
    });

    if (resolvedRequests.length === 0) return 0;

    const totalResolutionTime = resolvedRequests.reduce((sum, request) => {
      if (request.closedAt) {
        const resolutionTime = request.closedAt.getTime() - request.createdAt.getTime();
        return sum + (resolutionTime / (1000 * 60 * 60)); // Convert to hours
      }
      return sum;
    }, 0);

    return totalResolutionTime / resolvedRequests.length;
  }

  /**
   * Calculate SLA compliance rate (requests resolved within SLA timeframe)
   */
  async calculateSLAComplianceRate(departmentId: string, period: TimePeriod, periodStart: Date, periodEnd: Date): Promise<number> {
    const requests = await prisma.serviceRequest.findMany({
      where: {
        departmentId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      select: {
        id: true,
        priority: true,
        createdAt: true,
        closedAt: true,
        slaDueAt: true
      }
    });

    if (requests.length === 0) return 100;

    const slaCompliantRequests = requests.filter(request => {
      if (!request.closedAt) return false; // Still open, consider non-compliant
      if (!request.slaDueAt) return true; // No SLA set, consider compliant
      return request.closedAt <= request.slaDueAt;
    });

    return (slaCompliantRequests.length / requests.length) * 100;
  }

  /**
   * Calculate first call resolution rate (requests resolved without reassignment)
   */
  async calculateFirstCallResolutionRate(departmentId: string, period: TimePeriod, periodStart: Date, periodEnd: Date): Promise<number> {
    const resolvedRequests = await prisma.serviceRequest.findMany({
      where: {
        departmentId,
        status: { in: ['RESOLVED', 'CLOSED'] },
        closedAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      include: {
        assignments: true
      }
    });

    if (resolvedRequests.length === 0) return 0;

    // First call resolution = resolved requests with only one assignment
    const firstCallResolutions = resolvedRequests.filter(request => 
      request.assignments.length <= 1
    );

    return (firstCallResolutions.length / resolvedRequests.length) * 100;
  }

  /**
   * Calculate average citizen satisfaction score from resolved requests
   */
  async calculateCitizenSatisfactionScore(departmentId: string, period: TimePeriod, periodStart: Date, periodEnd: Date): Promise<number> {
    const requests = await prisma.serviceRequest.aggregate({
      where: {
        departmentId,
        satisfactionRating: { not: null },
        closedAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      _avg: {
        satisfactionRating: true
      }
    });

    return requests._avg.satisfactionRating || 0;
  }

  /**
   * Calculate current staff workloads for the department
   */
  async calculateStaffWorkloads(departmentId: string): Promise<AgentWorkload[]> {
    const staffMembers = await prisma.user.findMany({
      where: {
        departmentId,
        role: { in: ['CLERK', 'FIELD_AGENT', 'SUPERVISOR'] }
      },
      include: {
        assignedRequests: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            closedAt: true,
            priority: true
          }
        }
      }
    });

    const workloads: AgentWorkload[] = [];

    for (const staff of staffMembers) {
      const activeRequests = staff.assignedRequests.filter(r => 
        !['RESOLVED', 'CLOSED', 'CANCELLED'].includes(r.status)
      );
      
      const completedRequests = staff.assignedRequests.filter(r => 
        ['RESOLVED', 'CLOSED'].includes(r.status)
      );

      // Calculate average handling time for completed requests
      let averageHandlingTime = 0;
      if (completedRequests.length > 0) {
        const totalHandlingTime = completedRequests.reduce((sum, request) => {
          if (request.closedAt) {
            return sum + (request.closedAt.getTime() - request.createdAt.getTime());
          }
          return sum;
        }, 0);
        averageHandlingTime = totalHandlingTime / completedRequests.length / (1000 * 60 * 60); // Hours
      }

      // Calculate workload score (weighted by priority and age of requests)
      const workloadScore = activeRequests.reduce((score, request) => {
        const priorityWeight = {
          'URGENT': 4,
          'HIGH': 3,
          'MEDIUM': 2,
          'LOW': 1
        }[request.priority] || 2;

        const ageInDays = (Date.now() - request.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        const ageWeight = Math.min(ageInDays / 7, 2); // Max 2x weight for requests older than a week

        return score + (priorityWeight * (1 + ageWeight));
      }, 0);

      // Calculate utilization rate (assume 40 hours per week capacity)
      const hoursPerWeek = 40;
      const estimatedHoursNeeded = activeRequests.length * (averageHandlingTime || 2); // Default 2 hours per request
      const utilizationRate = Math.min((estimatedHoursNeeded / hoursPerWeek) * 100, 150); // Cap at 150%

      workloads.push({
        userId: staff.id,
        name: staff.name,
        email: staff.email,
        activeRequests: activeRequests.length,
        completedRequests: completedRequests.length,
        averageHandlingTime,
        workloadScore,
        utilizationRate
      });
    }

    return workloads.sort((a, b) => b.workloadScore - a.workloadScore);
  }

  /**
   * Calculate request volume trends by category
   */
  async calculateRequestVolume(departmentId: string, periodStart: Date, periodEnd: Date): Promise<number> {
    const count = await prisma.serviceRequest.count({
      where: {
        departmentId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    return count;
  }

  /**
   * Calculate escalation rate (requests reassigned or escalated)
   */
  async calculateEscalationRate(departmentId: string, period: TimePeriod, periodStart: Date, periodEnd: Date): Promise<number> {
    const totalRequests = await prisma.serviceRequest.count({
      where: {
        departmentId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      }
    });

    if (totalRequests === 0) return 0;

    const escalatedRequests = await prisma.serviceRequest.count({
      where: {
        departmentId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        assignments: {
          some: {}
        }
      }
    });

    // Count requests with multiple assignments as escalated
    const multipleAssignmentRequests = await prisma.serviceRequest.count({
      where: {
        departmentId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        assignments: {
          some: {
            NOT: {
              id: undefined
            }
          }
        }
      }
    });

    return (multipleAssignmentRequests / totalRequests) * 100;
  }

  /**
   * Calculate staff utilization rate
   */
  async calculateStaffUtilization(departmentId: string, period: TimePeriod, periodStart: Date, periodEnd: Date): Promise<number> {
    const workloads = await this.calculateStaffWorkloads(departmentId);
    
    if (workloads.length === 0) return 0;

    const averageUtilization = workloads.reduce((sum, workload) => 
      sum + workload.utilizationRate, 0) / workloads.length;

    return averageUtilization;
  }

  /**
   * Get category breakdown for requests in the period
   */
  async getCategoryBreakdown(departmentId: string, periodStart: Date, periodEnd: Date): Promise<Record<string, number>> {
    const requests = await prisma.serviceRequest.groupBy({
      by: ['category'],
      where: {
        departmentId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      _count: {
        category: true
      }
    });

    const breakdown: Record<string, number> = {};
    requests.forEach(item => {
      breakdown[item.category] = item._count.category;
    });

    return breakdown;
  }

  /**
   * Get priority breakdown for requests in the period
   */
  async getPriorityBreakdown(departmentId: string, periodStart: Date, periodEnd: Date): Promise<Record<string, number>> {
    const requests = await prisma.serviceRequest.groupBy({
      by: ['priority'],
      where: {
        departmentId,
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        }
      },
      _count: {
        priority: true
      }
    });

    const breakdown: Record<string, number> = {};
    requests.forEach(item => {
      breakdown[item.priority] = item._count.priority;
    });

    return breakdown;
  }

  /**
   * Generate comprehensive department metrics report
   */
  async generateDepartmentReport(departmentId: string, period: TimePeriod): Promise<DepartmentMetrics> {
    // Calculate period boundaries
    const periodEnd = new Date();
    let periodStart = new Date();

    switch (period) {
      case 'daily':
        periodStart.setDate(periodEnd.getDate() - 1);
        break;
      case 'weekly':
        periodStart.setDate(periodEnd.getDate() - 7);
        break;
      case 'monthly':
        periodStart.setMonth(periodEnd.getMonth() - 1);
        break;
      case 'quarterly':
        periodStart.setMonth(periodEnd.getMonth() - 3);
        break;
    }

    // Get department info
    const department = await prisma.department.findUnique({
      where: { id: departmentId },
      select: { name: true }
    });

    if (!department) {
      throw new Error(`Department not found: ${departmentId}`);
    }

    // Calculate all metrics in parallel
    const [
      avgResolutionTime,
      slaCompliance,
      firstCallResolution,
      citizenSatisfaction,
      requestVolume,
      escalationRate,
      staffUtilization,
      agentWorkloads,
      categoryBreakdown,
      priorityBreakdown
    ] = await Promise.all([
      this.calculateAverageResolutionTime(departmentId, period, periodStart, periodEnd),
      this.calculateSLAComplianceRate(departmentId, period, periodStart, periodEnd),
      this.calculateFirstCallResolutionRate(departmentId, period, periodStart, periodEnd),
      this.calculateCitizenSatisfactionScore(departmentId, period, periodStart, periodEnd),
      this.calculateRequestVolume(departmentId, periodStart, periodEnd),
      this.calculateEscalationRate(departmentId, period, periodStart, periodEnd),
      this.calculateStaffUtilization(departmentId, period, periodStart, periodEnd),
      this.calculateStaffWorkloads(departmentId),
      this.getCategoryBreakdown(departmentId, periodStart, periodEnd),
      this.getPriorityBreakdown(departmentId, periodStart, periodEnd)
    ]);

    return {
      departmentId,
      departmentName: department.name,
      period,
      periodStart,
      periodEnd,
      avgResolutionTime,
      slaCompliance,
      firstCallResolution,
      citizenSatisfaction,
      requestVolume,
      escalationRate,
      staffUtilization,
      agentWorkloads,
      categoryBreakdown,
      priorityBreakdown,
      calculatedAt: new Date()
    };
  }

  /**
   * Store calculated metrics in the database
   */
  async storeDepartmentMetrics(metrics: DepartmentMetrics): Promise<void> {
    const metricsToStore = [
      { type: 'avgResolutionTime', value: metrics.avgResolutionTime },
      { type: 'slaCompliance', value: metrics.slaCompliance },
      { type: 'firstCallResolution', value: metrics.firstCallResolution },
      { type: 'citizenSatisfaction', value: metrics.citizenSatisfaction },
      { type: 'requestVolume', value: metrics.requestVolume },
      { type: 'escalationRate', value: metrics.escalationRate },
      { type: 'staffUtilization', value: metrics.staffUtilization }
    ];

    for (const metric of metricsToStore) {
      await prisma.departmentMetrics.upsert({
        where: {
          departmentId_metricType_period_periodStart: {
            departmentId: metrics.departmentId,
            metricType: metric.type,
            period: metrics.period,
            periodStart: metrics.periodStart
          }
        },
        update: {
          value: metric.value,
          periodEnd: metrics.periodEnd,
          calculatedAt: metrics.calculatedAt
        },
        create: {
          departmentId: metrics.departmentId,
          metricType: metric.type,
          value: metric.value,
          period: metrics.period,
          periodStart: metrics.periodStart,
          periodEnd: metrics.periodEnd,
          calculatedAt: metrics.calculatedAt
        }
      });
    }
  }

  /**
   * Calculate and store metrics for all departments
   */
  async calculateMetricsForAllDepartments(period: TimePeriod): Promise<void> {
    const departments = await prisma.department.findMany({
      select: { id: true }
    });

    console.log(`🔄 Calculating ${period} metrics for ${departments.length} departments...`);

    for (const department of departments) {
      try {
        const metrics = await this.generateDepartmentReport(department.id, period);
        await this.storeDepartmentMetrics(metrics);
        console.log(`✅ Metrics calculated for department ${department.id}`);
      } catch (error) {
        console.error(`❌ Error calculating metrics for department ${department.id}:`, error);
      }
    }

    console.log(`🎉 Completed ${period} metrics calculation for all departments`);
  }
}