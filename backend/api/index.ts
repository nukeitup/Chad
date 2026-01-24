import type { VercelRequest, VercelResponse } from '@vercel/node';

// Load env vars
process.env.NODE_ENV = process.env.NODE_ENV || 'production';

import { createApp } from '../src/app';

const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
