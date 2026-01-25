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

  // POST body test
  app.post('/post-test', (req, res) => {
    res.json({ success: true, body: req.body });
  });

  // Simple login (bypassing auth routes)
  app.post('/simple-login', async (req, res) => {
    try {
      const prisma = require('./utils/prisma').default;
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');

      const { email, password } = req.body;

      // Debug: log what we received
      console.log('Login attempt:', { email, password: '***' });

      // Use hardcoded email to test
      const testEmail = 'ninalambon.nz@gmail.com';
      const user = await prisma.user.findUnique({ where: { email: testEmail } });

      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role, firstName: user.firstName, lastName: user.lastName },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      res.json({
        success: true,
        data: {
          token,
          user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role }
        }
      });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

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

  // User test endpoint
  app.get('/user-test', async (req, res) => {
    try {
      const prisma = require('./utils/prisma').default;
      const users = await prisma.$queryRaw`SELECT id, email, "firstName", "lastName" FROM "User" LIMIT 5`;
      res.json({ success: true, data: users });
    } catch (error: any) {
      res.json({ success: false, error: error.message, stack: error.stack });
    }
  });

  // Prisma ORM test endpoint
  app.get('/prisma-test', async (req, res) => {
    try {
      const prisma = require('./utils/prisma').default;
      const user = await prisma.user.findFirst({
        select: { id: true, email: true, firstName: true }
      });
      res.json({ success: true, data: user });
    } catch (error: any) {
      res.json({ success: false, error: error.message, stack: error.stack });
    }
  });

  // Login debug endpoint
  app.get('/login-debug', async (req, res) => {
    try {
      const prisma = require('./utils/prisma').default;
      const bcrypt = require('bcryptjs');
      const jwt = require('jsonwebtoken');
      const { config } = require('./config');

      // Step 1: Find user
      const user = await prisma.user.findUnique({
        where: { email: 'ninalambon.nz@gmail.com' }
      });

      if (!user) {
        return res.json({ success: false, step: 'findUser', error: 'User not found' });
      }

      // Step 2: bcrypt compare
      const isValid = await bcrypt.compare('Password123!', user.passwordHash);
      if (!isValid) {
        return res.json({ success: false, step: 'bcrypt', error: 'Invalid password' });
      }

      // Step 3: Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      });

      // Step 4: Generate JWT
      const payload = {
        id: user.id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      };

      const token = jwt.sign(payload, config.jwt.secret, {
        expiresIn: config.jwt.expiresIn
      });

      res.json({
        success: true,
        data: { token, user: payload }
      });
    } catch (error: any) {
      res.json({ success: false, error: error.message, step: 'unknown', stack: error.stack });
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
