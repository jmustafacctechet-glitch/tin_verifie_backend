import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { IntegrationRegistry } from './qr-verification/integrations/registry';
import { EtradeService } from './qr-verification/integrations/etrade/etrade.service';
import { OtpService } from './qr-verification/otp/otp.service';
import { VerificationService } from './qr-verification/services/verification.service';
import { createQrVerificationRouter } from './qr-verification/controllers';

export async function createApp(
  mongoUri: string,
  config: {
    geezToken: string;
    geezSendUrl: string;
    geezBaseUrl: string;
    sessionExpiryMinutes?: number;
  },
) {
  await mongoose.connect(mongoUri);

  const registry = new IntegrationRegistry();
  const etrade = new EtradeService();
  registry.register('etrade.gov.et', etrade);

  const otpService = new OtpService({
    geezToken: config.geezToken,
    geezSendUrl: config.geezSendUrl,
    geezBaseUrl: config.geezBaseUrl,
  });

  const verificationService = new VerificationService({
    integrationRegistry: registry,
    otpService,
    sessionExpiryMinutes: config.sessionExpiryMinutes ?? 30,
  });

  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '4kb' }));
  app.use(express.urlencoded({ extended: true, limit: '4kb' }));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  const qrRouter = createQrVerificationRouter(verificationService);
  app.use('/api/qr-verification', qrRouter);

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('Unhandled error:', err);
      res.status(500).json({
        status: 'error',
        message:
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
      });
    },
  );

  return app;
}
