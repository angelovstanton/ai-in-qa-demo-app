import * as cron from 'node-cron';
import { MetricsCalculatorService, TimePeriod } from './metricsCalculator';
import { logger } from '../utils/logger';

export class MetricsSchedulerService {
  private metricsCalculator: MetricsCalculatorService;
  private scheduledJobs: Map<string, cron.ScheduledTask> = new Map();

  constructor() {
    this.metricsCalculator = new MetricsCalculatorService();
  }

  /**
   * Initialize all scheduled metrics collection jobs
   */
  initialize(): void {
    this.scheduleDailyMetrics();
    this.scheduleWeeklyMetrics();
    this.scheduleMonthlyMetrics();
    this.scheduleQuarterlyMetrics();

    logger.info('🕒 Metrics scheduler initialized with all jobs');
  }

  /**
   * Schedule daily metrics calculation (runs every day at 2 AM)
   */
  private scheduleDailyMetrics(): void {
    const task = cron.schedule('0 2 * * *', async () => {
      logger.info('🌅 Starting daily metrics calculation...');
      try {
        await this.metricsCalculator.calculateMetricsForAllDepartments('daily');
        logger.info('✅ Daily metrics calculation completed successfully');
      } catch (error) {
        logger.error('❌ Daily metrics calculation failed:', error);
      }
    }, {
      timezone: 'America/New_York'
    });

    this.scheduledJobs.set('daily', task);
    logger.info('📅 Daily metrics job scheduled (2 AM daily)');
  }

  /**
   * Schedule weekly metrics calculation (runs every Monday at 3 AM)
   */
  private scheduleWeeklyMetrics(): void {
    const task = cron.schedule('0 3 * * 1', async () => {
      logger.info('📊 Starting weekly metrics calculation...');
      try {
        await this.metricsCalculator.calculateMetricsForAllDepartments('weekly');
        logger.info('✅ Weekly metrics calculation completed successfully');
      } catch (error) {
        logger.error('❌ Weekly metrics calculation failed:', error);
      }
    }, {
      timezone: 'America/New_York'
    });

    this.scheduledJobs.set('weekly', task);
    logger.info('📈 Weekly metrics job scheduled (3 AM Mondays)');
  }

  /**
   * Schedule monthly metrics calculation (runs on 1st of each month at 4 AM)
   */
  private scheduleMonthlyMetrics(): void {
    const task = cron.schedule('0 4 1 * *', async () => {
      logger.info('📈 Starting monthly metrics calculation...');
      try {
        await this.metricsCalculator.calculateMetricsForAllDepartments('monthly');
        logger.info('✅ Monthly metrics calculation completed successfully');
      } catch (error) {
        logger.error('❌ Monthly metrics calculation failed:', error);
      }
    }, {
      timezone: 'America/New_York'
    });

    this.scheduledJobs.set('monthly', task);
    logger.info('📊 Monthly metrics job scheduled (4 AM 1st of month)');
  }

  /**
   * Schedule quarterly metrics calculation (runs on 1st of quarter at 5 AM)
   */
  private scheduleQuarterlyMetrics(): void {
    const task = cron.schedule('0 5 1 1,4,7,10 *', async () => {
      logger.info('📊 Starting quarterly metrics calculation...');
      try {
        await this.metricsCalculator.calculateMetricsForAllDepartments('quarterly');
        logger.info('✅ Quarterly metrics calculation completed successfully');
      } catch (error) {
        logger.error('❌ Quarterly metrics calculation failed:', error);
      }
    }, {
      timezone: 'America/New_York'
    });

    this.scheduledJobs.set('quarterly', task);
    logger.info('📊 Quarterly metrics job scheduled (5 AM 1st of quarter)');
  }

  /**
   * Trigger immediate metrics calculation for testing
   */
  async triggerImmediateCalculation(period: TimePeriod): Promise<void> {
    logger.info(`🚀 Triggering immediate ${period} metrics calculation...`);
    
    try {
      await this.metricsCalculator.calculateMetricsForAllDepartments(period);
      logger.info(`✅ Immediate ${period} metrics calculation completed`);
    } catch (error) {
      logger.error(`❌ Immediate ${period} metrics calculation failed:`, error);
      throw error;
    }
  }

  /**
   * Get status of all scheduled jobs
   */
  getJobStatus(): Record<string, boolean> {
    const status: Record<string, boolean> = {};
    
    this.scheduledJobs.forEach((task, jobName) => {
      status[jobName] = task.running;
    });

    return status;
  }

  /**
   * Stop a specific scheduled job
   */
  stopJob(jobName: string): boolean {
    const task = this.scheduledJobs.get(jobName);
    if (task) {
      task.stop();
      logger.info(`⏹️ Stopped ${jobName} metrics job`);
      return true;
    }
    return false;
  }

  /**
   * Start a specific scheduled job
   */
  startJob(jobName: string): boolean {
    const task = this.scheduledJobs.get(jobName);
    if (task) {
      task.start();
      logger.info(`▶️ Started ${jobName} metrics job`);
      return true;
    }
    return false;
  }

  /**
   * Stop all scheduled jobs
   */
  stopAllJobs(): void {
    this.scheduledJobs.forEach((task, jobName) => {
      task.stop();
      logger.info(`⏹️ Stopped ${jobName} metrics job`);
    });
    
    logger.info('🛑 All metrics scheduler jobs stopped');
  }

  /**
   * Restart all scheduled jobs
   */
  restartAllJobs(): void {
    this.scheduledJobs.forEach((task, jobName) => {
      task.start();
      logger.info(`▶️ Restarted ${jobName} metrics job`);
    });
    
    logger.info('🔄 All metrics scheduler jobs restarted');
  }
}

// Singleton instance
export const metricsScheduler = new MetricsSchedulerService();