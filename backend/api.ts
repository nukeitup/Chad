import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Test: return request info to debug routing
  if (req.url?.includes('test') || req.url === '/' || req.url === '/api') {
    return res.status(200).json({
      message: 'API is working!',
      url: req.url,
      method: req.method
    });
  }

  // Load the Express app for all other routes
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
  const { createApp } = require('../src/app');
  const app = createApp();
  return app(req, res);
}
