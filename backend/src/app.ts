import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { notFoundHandler, errorHandler } from './middleware/error.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
import applicationRoutes from './routes/application.routes';
import entityRoutes from './routes/entity.routes';
import beneficialOwnerRoutes from './routes/beneficial-owner.routes';
import personActingRoutes from './routes/person-acting.routes';
import documentRoutes from './routes/document.routes';
import referenceRoutes from './routes/reference.routes';
import userRoutes from './routes/user.routes';
import nzbnRoutes from './routes/nzbn.routes';
import cddRoutes from './routes/cdd.routes';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS configuration
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Rate limiting
  const limiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.maxRequests,
    message: {
      success: false,
      error: 'Too many requests, please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Logging
  if (config.nodeEnv !== 'test') {
    app.use(morgan(config.nodeEnv === 'development' ? 'dev' : 'combined'));
  }

  // Health check endpoint
  app.get('/health', (_req: Request, res: Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      testMode: config.testMode,
    });
  });

  // Test mode status endpoint
  app.get('/api/v1/test-mode', (_req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        testMode: config.testMode,
        environment: config.nodeEnv,
        message: config.testMode
          ? 'Test mode is ENABLED. Mock data will be used for NZBN API, screening, and other external services.'
          : 'Test mode is DISABLED. Real API connections will be used.',
      },
    });
  });

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/applications', applicationRoutes);
  app.use('/api/v1/applications', cddRoutes); // CDD determination routes nested under applications
  app.use('/api/v1/entities', entityRoutes);
  app.use('/api/v1/beneficial-owners', beneficialOwnerRoutes);
  app.use('/api/v1/persons-acting', personActingRoutes);
  app.use('/api/v1/documents', documentRoutes);
  app.use('/api/v1/reference', referenceRoutes);
  app.use('/api/v1/users', userRoutes);
  app.use('/api/v1/nzbn', nzbnRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
