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

// Route imports
import authRoutes from './routes/auth';
import requestRoutes from './routes/requests';
import attachmentRoutes from './routes/attachments';
import adminRoutes from './routes/admin';
import rankingRoutes from './routes/rankings';

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet());
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
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/requests', attachmentRoutes);
app.use('/api/v1', attachmentRoutes); // Add this line for the image serving endpoint
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/rankings', rankingRoutes);

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
});

export default app;