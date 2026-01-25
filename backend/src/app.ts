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
import nzbnRoutes from './routes/nzbn.routes';

/**
 * Create and configure Express application
 */
export function createApp(): Express {
...
  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/applications', applicationRoutes);
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
