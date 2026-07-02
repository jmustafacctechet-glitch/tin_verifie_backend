import dotenv from 'dotenv';
dotenv.config({ path: './.env' });

import { createApp } from './index';
   
const PORT = parseInt(process.env.PORT || '4000', 10);
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tin-verifier';

async function start() {
  try {
    const app = await createApp(MONGODB_URI, {
      geezToken: process.env.GEEZ_TOKEN || '',
      geezSendUrl:
        process.env.GEEZ_SEND_URL || 'https://api.geezsms.com/api/send',
      geezBaseUrl: process.env.GEEZ_URL || 'https://api.geezsms.com',

      sessionExpiryMinutes: 30,
    });

    app.listen(PORT, () => {
      console.log(`TIN Verifier server running on port ${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/health`);
      console.log(
        `QR scan endpoint: POST http://localhost:${PORT}/api/qr-verification/scan`,
      );
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
