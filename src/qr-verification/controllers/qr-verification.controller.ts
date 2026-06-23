import { Request, Response, NextFunction } from 'express';
import { VerificationService } from '../services/verification.service';
import { VerificationStatus, FailureReason } from '../types';

export function createScanController(service: VerificationService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { qrData } = req.body;

      const result = await service.processQrScan(qrData);

      if (result.status === VerificationStatus.FAILED) {
        const statusCode =
          result.failureReason === FailureReason.GOVERNMENT_API_ERROR
            ? 502
            : 400;

        return res.status(statusCode).json({
          status: 'fail',
          message: `Verification failed: ${result.failureReason}`,
          data: result,
        });
      }

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}

export function createOtpVerifyController(service: VerificationService) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { sessionId, otp } = req.body;

      const result = await service.verifyOtp(sessionId, otp);

      if (!result.verified) {
        return res.status(400).json({
          status: 'fail',
          message: `OTP verification failed: ${result.failureReason}`,
          data: result,
        });
      }

      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };
}
