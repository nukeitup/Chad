import type { VercelRequest, VercelResponse } from '@vercel/node';
import 'dotenv/config';
import { createApp } from '../src/app';

const app = createApp();

export default function handler(req: VercelRequest, res: VercelResponse) {
  return app(req, res);
}
