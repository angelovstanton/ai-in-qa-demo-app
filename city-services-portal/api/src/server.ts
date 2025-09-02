import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import path from 'path';
import { swaggerSpec } from './config/swagger';
import { errorHandler } from './middleware/error';
import { logger } from './utils/logger';
import { featureFlagMiddleware } from './middleware/featureFlags';
import { applyTestingFlags, applyAuthenticationBugs, applyServiceRequestBugs, applySearchBugs } from './middleware/testingFlags';
import { metricsScheduler } from './services/metricsScheduler';

// Route imports
import authRoutes from './routes/auth';
import authDemoRoutes from './routes/auth-demo'; // Demo routes for new auth system
import requestRoutes from './routes/requests';
import searchRoutes from './routes/search';
import attachmentRoutes from './routes/attachments';
import adminRoutes from './routes/admin';
import staffRoutes from './routes/staff';
import rankingRoutes from './routes/rankings';
import departmentRoutes from './routes/departments';
import supervisorRoutes from './routes/supervisor';
import metricsRoutes from './routes/metrics';
import dashboardRoutes from './routes/dashboard';
import fieldAgentRoutes from './routes/field-agent';
import timeTrackingRoutes from './routes/time-tracking';
import fieldPhotosRoutes from './routes/field-photos';
import agentStatusRoutes from './routes/agent-status';
import communityRoutes from './routes/community';
import testingFlagsRoutes from './routes/testingFlags';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['http://localhost:5173', 'http://127.0.0.1:5173'] 
    : true,
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10000, // Increased limit for development - 10000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Feature flag middleware
app.use(featureFlagMiddleware);

// Testing flag middleware
app.use(applyTestingFlags);
app.use(applyAuthenticationBugs);
app.use(applyServiceRequestBugs);
app.use(applySearchBugs);

// Correlation ID middleware
app.use((req, res, next) => {
  res.locals.correlationId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'city-services-portal-api'
  });
});

// Static file serving for uploads
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/auth-demo', authDemoRoutes); // Demo endpoints for new auth system
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1', searchRoutes); // Search endpoints
app.use('/api/v1/requests', attachmentRoutes); // For request-specific attachment endpoints
app.use('/api/v1/attachments', attachmentRoutes); // For standalone attachment endpoints (image serving)
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/admin', staffRoutes); // Staff management endpoints
app.use('/api/v1/rankings', rankingRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/supervisor', supervisorRoutes);
app.use('/api/v1/metrics', metricsRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/field-agent', fieldAgentRoutes);
app.use('/api/v1/time-tracking', timeTrackingRoutes);
app.use('/api/v1/field-photos', fieldPhotosRoutes);
app.use('/api/v1/agent-status', agentStatusRoutes);
app.use('/api/v1/community', communityRoutes);
app.use('/api/v1/testing-flags', testingFlagsRoutes);
app.use('/api/departments', departmentRoutes); // Alternative path without version

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'City Services Portal API',
    version: '1.0.0',
    docs: '/api-docs',
    health: '/health'
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

app.listen(port, '0.0.0.0', () => {
  logger.info(`?? City Services Portal API running on port ${port}`);
  logger.info(`?? API Documentation: http://localhost:${port}/api-docs`);
  logger.info(`??  Health Check: http://localhost:${port}/health`);
  
  // Initialize metrics scheduler
  metricsScheduler.initialize();
});

export default app;