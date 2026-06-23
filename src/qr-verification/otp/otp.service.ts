import axios from 'axios';
import * as crypto from 'crypto';
import {
  OtpServiceConfig,
  OtpGenerationResult,
  OtpSendResult,
  OtpError,
  DEFAULT_OTP_CONFIG,
} from './types';

export class OtpService {
  private config: OtpServiceConfig;

  constructor(config: Partial<OtpServiceConfig> = {}) {
    this.config = { ...DEFAULT_OTP_CONFIG, ...config };
  }

  generateOtp(): OtpGenerationResult {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.config.otpLength; i++) {
      otp += digits[crypto.randomInt(0, digits.length)];
    }

    const expiresAt = new Date(
      Date.now() + this.config.otpExpiryMinutes * 60 * 1000,
    );

    return {
      otp,
      otpHash: this.hashOtp(otp),
      expiresAt,
    };
  }

  async sendOtp(phoneNumber: string, otp: string): Promise<OtpSendResult> {
    const sanitizedPhone = phoneNumber.replace(/[\s\-()]/g, '');

    if (!this.config.geezToken) {
      return {
        success: false,
        provider: 'geez_sms',
        error: 'Geez SMS token is not configured',
      };
    }

    try {
      const message = `Dear customer, your OTP is: ${otp}. It will expire in ${this.config.otpExpiryMinutes} minutes. Thank you!`;

      const response = await axios({
        method: 'POST',
        url: this.config.geezSendUrl,
        data: {
          token: this.config.geezToken,
          phone: sanitizedPhone,
          msg: message,
        },
        timeout: 10000,
      });

      if (response.status >= 200 && response.status < 300) {
        return { success: true, provider: 'geez_sms' };
      }

      return {
        success: false,
        provider: 'geez_sms',
        error: `Geez SMS returned status ${response.status}`,
      };
    } catch (error: any) {
      return {
        success: false,
        provider: 'geez_sms',
        error: error.message || 'Failed to send OTP via Geez SMS',
      };
    }
  }

  verifyOtp(inputOtp: string, storedHash: string, expiresAt: Date): boolean {
    if (new Date() > expiresAt) {
      return false;
    }

    const inputHash = this.hashOtp(inputOtp);
    return crypto.timingSafeEqual(
      Buffer.from(inputHash),
      Buffer.from(storedHash),
    );
  }

  private hashOtp(otp: string): string {
    return crypto.createHash('sha256').update(otp).digest('hex');
  }
}
