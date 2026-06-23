import { OtpService } from './otp.service';

describe('OtpService', () => {
  let service: OtpService;

  beforeEach(() => {
    service = new OtpService({ geezToken: 'test-token' });
  });

  describe('generateOtp', () => {
    it('generates a 6-digit OTP by default', () => {
      const result = service.generateOtp();
      expect(result.otp).toMatch(/^\d{6}$/);
      expect(result.otpHash).toBeTruthy();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it('generates different OTPs on consecutive calls', () => {
      const r1 = service.generateOtp();
      const r2 = service.generateOtp();
      expect(r1.otp).not.toBe(r2.otp);
    });

    it('sets expiry in the future', () => {
      const result = service.generateOtp();
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('verifyOtp', () => {
    it('accepts correct OTP before expiry', () => {
      const { otp, otpHash, expiresAt } = service.generateOtp();
      expect(service.verifyOtp(otp, otpHash, expiresAt)).toBe(true);
    });

    it('rejects incorrect OTP', () => {
      const { otp, otpHash, expiresAt } = service.generateOtp();
      const wrongOtp = otp === '123456' ? '654321' : '123456';
      expect(service.verifyOtp(wrongOtp, otpHash, expiresAt)).toBe(false);
    });

    it('rejects expired OTP', () => {
      const { otp, otpHash } = service.generateOtp();
      const expiredDate = new Date(Date.now() - 1000);
      expect(service.verifyOtp(otp, otpHash, expiredDate)).toBe(false);
    });
  });

  describe('sendOtp', () => {
    it('returns failure when token is missing', async () => {
      const noTokenService = new OtpService({ geezToken: '' });
      const result = await noTokenService.sendOtp('+251911123456', '123456');
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/not configured/i);
    });
  });
});
