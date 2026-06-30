import { IntegrationRegistry } from '../integrations/registry';
import { OtpService } from '../otp/otp.service';
import { VerificationService } from './verification.service';
import { VerificationStatus, FailureReason } from '../types';

jest.mock('../models/verification-session.model', () => ({
  VerificationSession: {
    create: jest.fn(),
    findById: jest.fn(),
  },
}));

jest.mock('../models/audit-log.model', () => ({
  AuditLog: {
    create: jest.fn(),
  },
}));

import { VerificationSession } from '../models/verification-session.model';
import { AuditLog } from '../models/audit-log.model';

const MockSession = VerificationSession as jest.Mocked<typeof VerificationSession>;
const MockAuditLog = AuditLog as jest.Mocked<typeof AuditLog>;

describe('VerificationService', () => {
  let service: VerificationService;
  let registry: IntegrationRegistry;
  let otpService: OtpService;
  let mockIntegration: any;
  let mockSessionDoc: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockIntegration = {
      sourceName: 'etrade.gov.et',
      verifyBusinessLicense: jest.fn(),
    };

    registry = new IntegrationRegistry();
    registry.register('etrade.gov.et', mockIntegration);

    otpService = new OtpService({ geezToken: 'test-token' });

    jest.spyOn(otpService, 'sendOtp').mockResolvedValue({ success: true, provider: 'geez_sms' });

    service = new VerificationService({
      integrationRegistry: registry,
      otpService,
      sessionExpiryMinutes: 30,
    });

    mockSessionDoc = {
      _id: 'session123',
      tin: '1234567890',
      licenseNo: 'ABC/123',
      status: VerificationStatus.PARSING_COMPLETE,
      otpHash: undefined,
      otpExpiresAt: undefined,
      otpAttempts: 0,
      otpVerified: false,
      verificationData: undefined,
      save: jest.fn().mockResolvedValue(true),
    };

    (MockSession.create as jest.Mock).mockResolvedValue(mockSessionDoc);
  });

  describe('processQrScan', () => {
    const validUrl =
      'https://etrade.gov.et/business-license-checker?licenseNo=ABC%2F123&tin=1234567890';

    it('returns FAILED for empty QR data', async () => {
      const result = await service.processQrScan('');
      expect(result.status).toBe(VerificationStatus.FAILED);
      expect(result.failureReason).toBe(FailureReason.INVALID_FORMAT);
    });

    it('returns FAILED for invalid QR source', async () => {
      const result = await service.processQrScan(
        'https://evil.com/check?licenseNo=ABC&tin=123',
      );
      expect(result.status).toBe(VerificationStatus.FAILED);
      expect(result.failureReason).toBe(FailureReason.INVALID_FORMAT);
    });

    it('returns FAILED when no integration found', async () => {
      const emptyRegistry = new IntegrationRegistry();
      const svc = new VerificationService({
        integrationRegistry: emptyRegistry,
        otpService,
        sessionExpiryMinutes: 30,
      });

      const result = await svc.processQrScan(validUrl);
      expect(result.status).toBe(VerificationStatus.FAILED);
      expect(result.failureReason).toBe(FailureReason.UNSUPPORTED_DOMAIN);
    });

    it('returns FAILED when government API returns invalid', async () => {
      mockIntegration.verifyBusinessLicense.mockResolvedValue({
        valid: false,
        tin: '1234567890',
        businessName: '',
        licenseStatus: 'NOT_FOUND',
      });

      const result = await service.processQrScan(validUrl);
      expect(result.status).toBe(VerificationStatus.FAILED);
      expect(result.failureReason).toBe(FailureReason.INVALID_LICENSE);
    });

    it('returns VERIFIED when government validates successfully', async () => {
      mockIntegration.verifyBusinessLicense.mockResolvedValue({
        valid: true,
        tin: '1234567890',
        businessName: 'ABC Trading PLC',
        licenseStatus: 'Active',
        phone: '+251911123456',
      });

      mockSessionDoc.status = VerificationStatus.VERIFIED;

      const result = await service.processQrScan(validUrl);
      expect(result.status).toBe(VerificationStatus.VERIFIED);
      expect(result.sessionId).toBe('session123');
      expect(result.extractedData).toBeDefined();
    });
  });

  describe('verifyOtp', () => {
    it('rejects missing sessionId or otp', async () => {
      const r1 = await service.verifyOtp('', '123456');
      expect(r1.verified).toBe(false);

      const r2 = await service.verifyOtp('session123', '');
      expect(r2.verified).toBe(false);
    });

    it('rejects expired session', async () => {
      (MockSession.findById as jest.Mock).mockResolvedValue(null);
      const result = await service.verifyOtp('nonexistent', '123456');
      expect(result.verified).toBe(false);
      expect(result.failureReason).toBe(FailureReason.SESSION_EXPIRED);
    });

    it('accepts correct OTP', async () => {
      const otpResult = otpService.generateOtp();
      mockSessionDoc.status = VerificationStatus.OTP_PENDING;
      mockSessionDoc.otpHash = otpResult.otpHash;
      mockSessionDoc.otpExpiresAt = otpResult.expiresAt;
      mockSessionDoc.otpAttempts = 0;

      (MockSession.findById as jest.Mock).mockResolvedValue(mockSessionDoc);

      const result = await service.verifyOtp('session123', otpResult.otp);
      expect(result.verified).toBe(true);
    });

    it('rejects wrong OTP', async () => {
      const otpResult = otpService.generateOtp();
      mockSessionDoc.status = VerificationStatus.OTP_PENDING;
      mockSessionDoc.otpHash = otpResult.otpHash;
      mockSessionDoc.otpExpiresAt = otpResult.expiresAt;
      mockSessionDoc.otpAttempts = 0;

      (MockSession.findById as jest.Mock).mockResolvedValue(mockSessionDoc);

      const result = await service.verifyOtp('session123', '000000');
      expect(result.verified).toBe(false);
      expect(result.failureReason).toBe(FailureReason.OTP_MISMATCH);
    });
  });
});
