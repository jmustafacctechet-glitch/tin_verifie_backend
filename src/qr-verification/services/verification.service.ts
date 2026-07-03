import { VerificationStatus, FailureReason, ParsedQrData, VerificationResult } from '../types';
import type {
  QrScanResponse,
  OtpVerifyResponse,
} from '../types';
import { parseQrData } from '../parser/parser.service';
import { scannerService } from '../scanner/scanner.service';
import { IntegrationRegistry } from '../integrations/registry';
import { OtpService } from '../otp/otp.service';
import { VerificationSession, AuditLog } from '../models';
import { VerificationServiceConfig } from './types';

export class VerificationService {
  private integrationRegistry: IntegrationRegistry;
  private otpService: OtpService;
  private sessionExpiryMinutes: number;

  constructor(config: VerificationServiceConfig) {
    this.integrationRegistry = config.integrationRegistry;
    this.otpService = config.otpService;
    this.sessionExpiryMinutes = config.sessionExpiryMinutes;
  }

  async processQrScan(qrData: string): Promise<QrScanResponse> {
    const scanResult = scannerService.validate({ qrData });
    if (!scanResult.valid) {
      return {
        sessionId: '',
        status: VerificationStatus.FAILED,
        failureReason: FailureReason.INVALID_FORMAT,
      };
    }

    let parsed: ParsedQrData;
    try {
      parsed = parseQrData(scanResult.qrData);
    } catch {
      return {
        sessionId: '',
        status: VerificationStatus.FAILED,
        failureReason: FailureReason.INVALID_FORMAT,
      };
    }

    const integration = this.integrationRegistry.get(parsed.source);
    if (!integration) {
      return {
        sessionId: '',
        status: VerificationStatus.FAILED,
        failureReason: FailureReason.UNSUPPORTED_DOMAIN,
      };
    }

    const session = await VerificationSession.create({
      tin: parsed.tin,
      licenseNo: parsed.licenseNo,
      status: VerificationStatus.PARSING_COMPLETE,
      expiresAt: new Date(
        Date.now() + this.sessionExpiryMinutes * 60 * 1000,
      ),
    });

    try {
      const govResult = await integration.verifyBusinessLicense(
        parsed.licenseNo,
        parsed.tin,
      );

      if (!govResult.valid) {
        const reason = govResult.licenseStatus === 'NOT_FOUND'
          ? FailureReason.INVALID_LICENSE
          : govResult.licenseStatus.startsWith('API_ERROR')
            ? FailureReason.GOVERNMENT_API_ERROR
            : FailureReason.TIN_MISMATCH;

        session.status = VerificationStatus.FAILED;
        session.failureReason = reason;
        await session.save();

        await AuditLog.create({
          sessionId: session._id.toString(),
          tin: parsed.tin,
          licenseNo: parsed.licenseNo,
          result: 'FAILED',
          failureReason: reason,
          timestamp: new Date(),
        });

        return {
          sessionId: session._id.toString(),
          status: VerificationStatus.FAILED,
          failureReason: reason,
        };
      }

      session.status = VerificationStatus.VERIFIED;
      session.verificationData = {
        businessName: govResult.businessName,
        licenseStatus: govResult.licenseStatus,
        phone: govResult.phone,
      };
      await session.save();

      await AuditLog.create({
        sessionId: session._id.toString(),
        tin: parsed.tin,
        licenseNo: parsed.licenseNo,
        result: 'VERIFIED',
        timestamp: new Date(),
      });

      return {
        sessionId: session._id.toString(),
        status: session.status,
        extractedData: parsed,
      };
    } catch (error) {
      session.status = VerificationStatus.FAILED;
      session.failureReason = FailureReason.GOVERNMENT_API_ERROR;
      await session.save();

      await AuditLog.create({
        sessionId: session._id.toString(),
        tin: parsed.tin,
        licenseNo: parsed.licenseNo,
        result: 'FAILED',
        failureReason: FailureReason.GOVERNMENT_API_ERROR,
        timestamp: new Date(),
      });

      return {
        sessionId: session._id.toString(),
        status: VerificationStatus.FAILED,
        failureReason: FailureReason.GOVERNMENT_API_ERROR,
      };
    }
  }

  async verifyOtp(
    sessionId: string,
    otp: string,
  ): Promise<OtpVerifyResponse> {
    if (!sessionId || !otp) {
      return { verified: false, failureReason: FailureReason.INVALID_FORMAT };
    }

    const session = await VerificationSession.findById(sessionId);
    if (!session) {
      return { verified: false, failureReason: FailureReason.SESSION_EXPIRED };
    }

    if (session.status !== VerificationStatus.OTP_PENDING) {
      return { verified: false, failureReason: FailureReason.INVALID_FORMAT };
    }

    if (new Date() > session.otpExpiresAt!) {
      session.status = VerificationStatus.FAILED;
      session.failureReason = FailureReason.OTP_EXPIRED;
      await session.save();

      await AuditLog.create({
        sessionId: session._id.toString(),
        tin: session.tin,
        licenseNo: session.licenseNo,
        result: 'FAILED',
        failureReason: FailureReason.OTP_EXPIRED,
        timestamp: new Date(),
      });

      return { verified: false, failureReason: FailureReason.OTP_EXPIRED };
    }

    if (session.otpAttempts >= 3) {
      session.status = VerificationStatus.FAILED;
      session.failureReason = FailureReason.OTP_MAX_ATTEMPTS;
      await session.save();

      return {
        verified: false,
        failureReason: FailureReason.OTP_MAX_ATTEMPTS,
      };
    }

    const isValid = this.otpService.verifyOtp(
      otp,
      session.otpHash!,
      session.otpExpiresAt!,
    );

    if (!isValid) {
      session.otpAttempts += 1;
      await session.save();

      return { verified: false, failureReason: FailureReason.OTP_MISMATCH };
    }

    session.otpVerified = true;
    session.status = VerificationStatus.VERIFIED;
    session.otpAttempts += 1;
    await session.save();

    await AuditLog.create({
      sessionId: session._id.toString(),
      tin: session.tin,
      licenseNo: session.licenseNo,
      result: 'VERIFIED',
      timestamp: new Date(),
    });

    return { verified: true };
  }
}
