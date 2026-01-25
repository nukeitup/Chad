import { createApp } from './app';
import { config } from './config';
import prisma from './utils/prisma';
import { scheduleFatfUpdate } from './jobs/fatf-update.job';
import { scheduleCddRefreshJob } from './jobs/cdd-refresh.job';

const app = createApp();

/**
 * Graceful shutdown handler
 */
async function gracefulShutdown(signal: string): Promise<void> {
  console.log(`
${signal} received. Starting graceful shutdown...`);

  try {
    await prisma.$disconnect();
    console.log('Database connection closed.');
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Rejection:', reason);
  gracefulShutdown('UNHANDLED_REJECTION');
});

/**
 * Start the server
 */
async function startServer(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully.');

    // Schedule jobs
    scheduleFatfUpdate();
    scheduleCddRefreshJob();

    // Start HTTP server
    app.listen(config.port, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   AML/CFT Compliance Application - Backend Server              ║
║                                                                ║
║   Environment: ${config.nodeEnv.padEnd(46)}║
║   Port: ${config.port.toString().padEnd(53)}║
║   API Base URL: http://localhost:${config.port}/api/v1${' '.padEnd(24)}║
║                                                                ║
║   Health Check: http://localhost:${config.port}/health${' '.padEnd(24)}║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
