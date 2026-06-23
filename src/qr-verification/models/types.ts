import { VerificationStatus, FailureReason } from '../types';

export interface IVerificationSession {
  tin: string;
  licenseNo: string;
  status: VerificationStatus;
  otpHash?: string;
  otpExpiresAt?: Date;
  otpAttempts: number;
  otpVerified: boolean;
  failureReason?: FailureReason;
  verificationData?: {
    businessName: string;
    licenseStatus: string;
    phone?: string;
  };
  createdAt: Date;
  expiresAt: Date;
}

export interface IAuditLog {
  sessionId?: string;
  tin?: string;
  licenseNo?: string;
  result: string;
  failureReason?: string;
  timestamp: Date;
}
