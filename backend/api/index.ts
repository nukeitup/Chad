import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Simple test response
  if (req.url === '/test' || req.url === '/api/test') {
    return res.status(200).json({ message: 'API is working!' });
  }

  // Load the Express app for all other routes
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  const { createApp } = require('../src/app');
  const app = createApp();
  return app(req, res);
}
