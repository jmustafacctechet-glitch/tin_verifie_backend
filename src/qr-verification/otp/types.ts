export interface OtpServiceConfig {
  geezToken: string;
  geezSendUrl: string;
  geezBaseUrl: string;
  otpLength: number;
  otpExpiryMinutes: number;
  maxOtpAttempts: number;
}

export interface OtpGenerationResult {
  otp: string;
  otpHash: string;
  expiresAt: Date;
}

export interface OtpSendResult {
  success: boolean;
  provider: string;
  error?: string;
}

export class OtpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OtpError';
  }
}

export const DEFAULT_OTP_CONFIG: OtpServiceConfig = {
  geezToken: '',
  geezSendUrl: 'https://api.geezsms.com/api/send',
  geezBaseUrl: 'https://api.geezsms.com',
  otpLength: 6,
  otpExpiryMinutes: 5,
  maxOtpAttempts: 3,
};
