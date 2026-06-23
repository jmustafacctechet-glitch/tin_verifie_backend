export { createQrVerificationRouter } from './qr-verification.routes';
export {
  createScanController,
  createOtpVerifyController,
} from './qr-verification.controller';
export {
  scanRateLimiter,
  otpRateLimiter,
  requireBodyFields,
} from './qr-verification.middleware';
export type { ControllerConfig } from './types';
