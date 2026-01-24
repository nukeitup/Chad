import 'dotenv/config';
import { createApp } from '../src/app';

const app = createApp();

// Vercel serverless handler
export default app;
