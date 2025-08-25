import { Request, Response, NextFunction } from 'express';
import { FeatureFlagService } from '../services/featureFlags';

export const applyFeatureFlags = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // API_Random500: 5% random internal error on GET /requests
    if (req.path.includes('/requests') && req.method === 'GET') {
      const shouldApplyRandom500 = await FeatureFlagService.shouldApplyRandom500();
      if (shouldApplyRandom500 && Math.random() < 0.05) {
        return res.status(500).json({
          error: {
            code: 'FEATURE_FLAG_RANDOM_ERROR',
            message: 'Random internal server error (feature flag enabled)',
            correlationId: res.locals.correlationId
          }
        });
      }
    }

    // API_SlowRequests: 10% add 2.5s delay on GET /requests
    if (req.path.includes('/requests') && req.method === 'GET') {
      const shouldApplySlowRequests = await FeatureFlagService.shouldApplySlowRequests();
      if (shouldApplySlowRequests && Math.random() < 0.1) {
        await new Promise(resolve => setTimeout(resolve, 2500));
      }
    }

    next();
  } catch (error) {
    // Don't let feature flag errors break the request
    console.error('Feature flag middleware error:', error);
    next();
  }
};

export const featureFlagMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Add feature flags to request object for easy access
  req.featureFlags = FeatureFlagService.getAllFlags();
  next();
};

export const getFeatureFlagStatus = async (): Promise<{
  UI_WrongDefaultSort: boolean;
  UI_MissingAria_Search: boolean;
  API_Random500: boolean;
  API_SlowRequests: boolean;
  API_UploadIntermittentFail: boolean;
}> => {
  return {
    UI_WrongDefaultSort: await FeatureFlagService.shouldApplyWrongDefaultSort(),
    UI_MissingAria_Search: await FeatureFlagService.shouldApplyMissingAriaSearch(),
    API_Random500: await FeatureFlagService.shouldApplyRandom500(),
    API_SlowRequests: await FeatureFlagService.shouldApplySlowRequests(),
    API_UploadIntermittentFail: await FeatureFlagService.shouldApplyUploadIntermittentFail()
  };
};

// Extend Request interface to include feature flags
declare global {
  namespace Express {
    interface Request {
      featureFlags?: Record<string, any>;
    }
  }
}