import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Express app once
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const { createApp } = require('../src/app');
const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Reconstruct the original URL from the path query parameter
  if (req.query.path) {
    const pathSegments = Array.isArray(req.query.path) ? req.query.path : [req.query.path];
    req.url = '/' + pathSegments.join('/');
    // Remove path from query
    delete req.query.path;
  }
  return app(req, res);
}
