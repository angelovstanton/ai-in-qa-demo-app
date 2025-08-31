import { PrismaClient } from '@prisma/client';

export async function seedFeatureFlags(prisma: PrismaClient): Promise<number> {
  console.log('🚩 Seeding Feature Flags...');
  
  const featureFlags = [
    {
      key: 'API_Random500',
      value: JSON.stringify({
        enabled: false,
        description: 'Randomly return 500 errors for 5% of API requests',
        percentage: 5
      })
    },
    {
      key: 'UI_WrongDefaultSort',
      value: JSON.stringify({
        enabled: false,
        description: 'Use wrong default sorting in data grids',
        sortField: 'id',
        sortOrder: 'desc'
      })
    },
    {
      key: 'API_SlowRequests',
      value: JSON.stringify({
        enabled: false,
        description: 'Add artificial delay to 10% of API requests',
        percentage: 10,
        delayMs: 3000
      })
    },
    {
      key: 'API_UploadIntermittentFail',
      value: JSON.stringify({
        enabled: false,
        description: 'Cause file uploads to fail intermittently',
        failureRate: 30
      })
    },
    {
      key: 'UI_IncorrectValidation',
      value: JSON.stringify({
        enabled: false,
        description: 'Show incorrect validation messages on forms',
        fields: ['email', 'phone', 'description']
      })
    },
    {
      key: 'API_DataInconsistency',
      value: JSON.stringify({
        enabled: false,
        description: 'Return inconsistent data between related endpoints',
        endpoints: ['/api/v1/requests', '/api/v1/supervisor/dashboard']
      })
    },
    {
      key: 'UI_MissingTranslations',
      value: JSON.stringify({
        enabled: false,
        description: 'Show translation keys instead of translated text',
        percentage: 15
      })
    },
    {
      key: 'API_AuthorizationBypass',
      value: JSON.stringify({
        enabled: false,
        description: 'Occasionally bypass role-based authorization checks',
        bypassRate: 5
      })
    },
    {
      key: 'SUPERVISOR_MetricsDelay',
      value: JSON.stringify({
        enabled: false,
        description: 'Add delay to supervisor metrics calculations',
        delayMs: 2000
      })
    },
    {
      key: 'SUPERVISOR_WrongChartData',
      value: JSON.stringify({
        enabled: false,
        description: 'Return incorrect data for dashboard charts',
        affectedCharts: ['trends', 'performance']
      })
    },
    {
      key: 'FIELD_LocationDrift',
      value: JSON.stringify({
        enabled: false,
        description: 'Simulate GPS location drift for field agents',
        driftRadius: 500,
        driftIntervalMs: 5000
      })
    },
    {
      key: 'FIELD_PhotoUploadCorruption',
      value: JSON.stringify({
        enabled: false,
        description: 'Corrupt field photo uploads randomly',
        corruptionRate: 15
      })
    },
    {
      key: 'COMMUNITY_StaleRankings',
      value: JSON.stringify({
        enabled: false,
        description: 'Show outdated community rankings',
        staleDays: 7
      })
    },
    {
      key: 'COMMUNITY_WrongAchievements',
      value: JSON.stringify({
        enabled: false,
        description: 'Grant wrong achievements to users',
        errorRate: 20
      })
    },
    {
      key: 'API_DatabaseTimeout',
      value: JSON.stringify({
        enabled: false,
        description: 'Simulate database connection timeouts',
        timeoutRate: 3,
        timeoutMs: 30000
      })
    },
    {
      key: 'UI_BrokenPagination',
      value: JSON.stringify({
        enabled: false,
        description: 'Break pagination on data tables',
        affectedTables: ['requests', 'users', 'workOrders']
      })
    },
    {
      key: 'API_PartialDataReturns',
      value: JSON.stringify({
        enabled: false,
        description: 'Return incomplete data from API endpoints',
        missingFieldRate: 10,
        affectedEndpoints: ['/api/v1/requests', '/api/v1/field/work-orders']
      })
    },
    {
      key: 'UI_FormResetOnError',
      value: JSON.stringify({
        enabled: false,
        description: 'Reset form data when validation errors occur',
        affectedForms: ['serviceRequest', 'workOrder', 'qualityReview']
      })
    },
    {
      key: 'NOTIFICATION_Duplicate',
      value: JSON.stringify({
        enabled: false,
        description: 'Send duplicate notifications to users',
        duplicateRate: 25
      })
    },
    {
      key: 'SEARCH_WrongResults',
      value: JSON.stringify({
        enabled: false,
        description: 'Return incorrect search results',
        errorRate: 15,
        shuffleResults: true
      })
    }
  ];

  let totalRecords = 0;
  
  for (const flag of featureFlags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      update: { value: flag.value },
      create: flag
    });
    totalRecords++;
  }

  console.log(`   ✅ Created ${totalRecords} feature flags\n`);
  return totalRecords;
}