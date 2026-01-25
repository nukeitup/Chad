import express, { Express } from 'express';
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
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
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
  app.use(limiter);

  // Request parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Compression
  app.use(compression());

  // Logging
  if (config.nodeEnv === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined'));
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        environment: config.nodeEnv,
      },
    });
  });

  // Database test endpoint
  app.get('/db-test', async (req, res) => {
    try {
      const prisma = require('./utils/prisma').default;
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      res.json({ success: true, data: result });
    } catch (error: any) {
      res.json({ success: false, error: error.message, stack: error.stack });
    }
  });

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/applications', applicationRoutes);
  app.use('/api/v1/entities', entityRoutes);
  app.use('/api/v1/beneficial-owners', beneficialOwnerRoutes);
  app.use('/api/v1/persons-acting', personActingRoutes);
  app.use('/api/v1/documents', documentRoutes);
  app.use('/api/v1/reference', referenceRoutes);
  app.use('/api/v1/users', userRoutes);

  // Error handling
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

export default createApp;
