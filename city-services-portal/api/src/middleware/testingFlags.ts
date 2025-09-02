import { Request, Response, NextFunction } from 'express';
import TestingFeatureFlagService from '../services/testingFeatureFlags';

/**
 * Middleware to apply testing feature flag effects
 */
export async function applyTestingFlags(req: Request, res: Response, next: NextFunction) {
  try {
    // API_Random500 - Randomly return 500 errors (5% chance)
    if (await TestingFeatureFlagService.shouldTrigger('API_Random500', 5)) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'Random server error triggered by testing flag',
        correlationId: `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
    }

    // API_SlowRequests - Add artificial delay (10% chance, 3 second delay)
    if (await TestingFeatureFlagService.shouldTrigger('API_SlowRequests', 10)) {
      const metadata = await TestingFeatureFlagService.getFlagMetadata('API_SlowRequests');
      const delayMs = metadata?.delayMs || 3000;
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }

    next();
  } catch (error) {
    // Don't break the app if flag checking fails
    console.error('Error in testing flags middleware:', error);
    next();
  }
}

/**
 * Middleware to check if file uploads should fail
 */
export async function checkUploadFailure(req: Request, res: Response, next: NextFunction) {
  try {
    if (await TestingFeatureFlagService.shouldTrigger('API_UploadIntermittentFail', 30)) {
      return res.status(500).json({
        error: 'Upload Failed',
        message: 'File upload failed due to intermittent server issue',
        correlationId: `upload_err_${Date.now()}`
      });
    }
    next();
  } catch (error) {
    console.error('Error in upload failure middleware:', error);
    next();
  }
}

/**
 * Apply authentication bug flags
 */
export async function applyAuthenticationBugs(req: Request, res: Response, next: NextFunction) {
  try {
    req.testingFlags = req.testingFlags || {};
    
    // Check various authentication flags
    req.testingFlags.acceptAnyPassword = await TestingFeatureFlagService.isEnabled('LOGIN_WRONG_PASSWORD_ACCEPTED');
    req.testingFlags.skipEmailValidation = await TestingFeatureFlagService.isEnabled('REGISTRATION_SKIP_EMAIL_VALIDATION');
    req.testingFlags.brokenPasswordReset = await TestingFeatureFlagService.isEnabled('PASSWORD_RESET_BROKEN_LINKS');
    req.testingFlags.profileUpdateFailsSilently = await TestingFeatureFlagService.isEnabled('PROFILE_UPDATE_FAILS_SILENTLY');
    
    next();
  } catch (error) {
    console.error('Error in authentication bugs middleware:', error);
    next();
  }
}

/**
 * Apply service request bug flags
 */
export async function applyServiceRequestBugs(req: Request, res: Response, next: NextFunction) {
  try {
    req.testingFlags = req.testingFlags || {};
    
    // Check service request flags
    req.testingFlags.requestCreationFails = await TestingFeatureFlagService.isEnabled('SERVICE_REQUEST_CREATION_FAILS');
    req.testingFlags.statusChangesDontSave = await TestingFeatureFlagService.isEnabled('STATUS_CHANGES_DONT_SAVE');
    req.testingFlags.criticalRequestsLowPriority = await TestingFeatureFlagService.isEnabled('CRITICAL_REQUESTS_MARKED_LOW_PRIORITY');
    req.testingFlags.corruptImageUploads = await TestingFeatureFlagService.isEnabled('FILE_UPLOADS_CORRUPT_IMAGES');
    req.testingFlags.assignmentsIgnored = await TestingFeatureFlagService.isEnabled('REQUEST_ASSIGNMENTS_IGNORED');
    req.testingFlags.searchReturnsWrongResults = await TestingFeatureFlagService.isEnabled('SEARCH_RETURNS_WRONG_RESULTS');
    req.testingFlags.commentsPostWrongRequest = await TestingFeatureFlagService.isEnabled('COMMENTS_POST_TO_WRONG_REQUEST');
    req.testingFlags.duplicateDetectionBroken = await TestingFeatureFlagService.isEnabled('DUPLICATE_REQUEST_DETECTION_BROKEN');
    req.testingFlags.wrongTimezone = await TestingFeatureFlagService.isEnabled('REQUEST_TIMESTAMPS_WRONG_TIMEZONE');
    req.testingFlags.requestCodesMissingYear = await TestingFeatureFlagService.isEnabled('REQUEST_CODES_MISSING_YEAR');
    req.testingFlags.wrongCountBadge = await TestingFeatureFlagService.isEnabled('REQUEST_COUNT_BADGE_WRONG');
    
    next();
  } catch (error) {
    console.error('Error in service request bugs middleware:', error);
    next();
  }
}

/**
 * Apply search and filter bug flags
 */
export async function applySearchBugs(req: Request, res: Response, next: NextFunction) {
  try {
    req.testingFlags = req.testingFlags || {};
    
    // Check search flags
    req.testingFlags.searchIgnoresFilters = await TestingFeatureFlagService.isEnabled('SEARCH_IGNORES_FILTERS');
    req.testingFlags.exportDownloadsEmpty = await TestingFeatureFlagService.isEnabled('EXPORT_DOWNLOADS_EMPTY_FILE');
    req.testingFlags.advancedSearchCrashes = await TestingFeatureFlagService.isEnabled('ADVANCED_SEARCH_CRASHES_PAGE');
    req.testingFlags.searchResultsRandomOrder = await TestingFeatureFlagService.isEnabled('SEARCH_RESULTS_RANDOM_ORDER');
    req.testingFlags.filterCountersWrong = await TestingFeatureFlagService.isEnabled('FILTER_COUNTERS_WRONG');
    req.testingFlags.paginationShowsWrongTotal = await TestingFeatureFlagService.isEnabled('PAGINATION_SHOWS_WRONG_TOTAL');
    
    next();
  } catch (error) {
    console.error('Error in search bugs middleware:', error);
    next();
  }
}

/**
 * Get all active testing flags for frontend
 */
export async function getActiveFlags(req: Request, res: Response) {
  try {
    const flags = await TestingFeatureFlagService.getAllFlags();
    const activeFlags: Record<string, boolean> = {};
    
    for (const flag of flags) {
      activeFlags[flag.key] = await TestingFeatureFlagService.isEnabled(flag.key);
    }
    
    res.json({
      data: activeFlags,
      correlationId: `flags_${Date.now()}`
    });
  } catch (error) {
    console.error('Error getting active flags:', error);
    res.status(500).json({
      error: 'Failed to retrieve active flags',
      correlationId: `err_${Date.now()}`
    });
  }
}

// Extend Express Request type to include testingFlags
declare global {
  namespace Express {
    interface Request {
      testingFlags?: {
        acceptAnyPassword?: boolean;
        skipEmailValidation?: boolean;
        brokenPasswordReset?: boolean;
        profileUpdateFailsSilently?: boolean;
        requestCreationFails?: boolean;
        statusChangesDontSave?: boolean;
        criticalRequestsLowPriority?: boolean;
        corruptImageUploads?: boolean;
        assignmentsIgnored?: boolean;
        searchReturnsWrongResults?: boolean;
        commentsPostWrongRequest?: boolean;
        duplicateDetectionBroken?: boolean;
        wrongTimezone?: boolean;
        requestCodesMissingYear?: boolean;
        wrongCountBadge?: boolean;
        searchIgnoresFilters?: boolean;
        exportDownloadsEmpty?: boolean;
        advancedSearchCrashes?: boolean;
        searchResultsRandomOrder?: boolean;
        filterCountersWrong?: boolean;
        paginationShowsWrongTotal?: boolean;
      };
    }
  }
}