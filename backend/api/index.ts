import type { VercelRequest, VercelResponse } from '@vercel/node';

// Initialize Express app once
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
const { createApp } = require('../src/app');
const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
