import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { Express } from 'express';
import mongoose from 'mongoose';
import { createApp } from '../src/index';

let cachedApp: Express | null = null;

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  if (!cachedApp) {
    cachedApp = await createApp(process.env.MONGODB_URI!, {
      geezToken: process.env.GEEZ_TOKEN || '',
      geezSendUrl:
        process.env.GEEZ_SEND_URL || 'https://api.geezsms.com/api/send',
      geezBaseUrl: process.env.GEEZ_URL || 'https://api.geezsms.com',
      sessionExpiryMinutes: 30,
    });
  } else if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI!);
  }

  cachedApp(req, res);
}
