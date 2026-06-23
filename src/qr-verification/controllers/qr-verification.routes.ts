import { Router } from 'express';
import { VerificationService } from '../services/verification.service';
import {
  scanRateLimiter,
  otpRateLimiter,
  requireBodyFields,
} from './qr-verification.middleware';
import {
  createScanController,
  createOtpVerifyController,
} from './qr-verification.controller';

export function createQrVerificationRouter(
  service: VerificationService,
): Router {
  const router = Router();

  router.post(
    '/scan',
    scanRateLimiter,
    requireBodyFields(['qrData']),
    createScanController(service),
  );

  router.post(
    '/verify-otp',
    otpRateLimiter,
    requireBodyFields(['sessionId', 'otp']),
    createOtpVerifyController(service),
  );

  return router;
}
