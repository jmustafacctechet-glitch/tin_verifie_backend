export enum VerificationStatus {
  QR_RECEIVED = 'QR_RECEIVED',
  PARSING_COMPLETE = 'PARSING_COMPLETE',
  GOVERNMENT_VALIDATED = 'GOVERNMENT_VALIDATED',
  OTP_PENDING = 'OTP_PENDING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
}

export enum FailureReason {
  INVALID_FORMAT = 'INVALID_FORMAT',
  INVALID_SOURCE = 'INVALID_SOURCE',
  UNSUPPORTED_DOMAIN = 'UNSUPPORTED_DOMAIN',
  MISSING_PARAMETERS = 'MISSING_PARAMETERS',
  TIN_MISMATCH = 'TIN_MISMATCH',
  INVALID_LICENSE = 'INVALID_LICENSE',
  GOVERNMENT_API_ERROR = 'GOVERNMENT_API_ERROR',
  OTP_EXPIRED = 'OTP_EXPIRED',
  OTP_MISMATCH = 'OTP_MISMATCH',
  OTP_MAX_ATTEMPTS = 'OTP_MAX_ATTEMPTS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface QrScanRequest {
  qrData: string;
}

export interface QrScanResponse {
  sessionId: string;
  status: VerificationStatus;
  extractedData?: ParsedQrData;
  failureReason?: FailureReason;
}

export interface OtpVerifyRequest {
  sessionId: string;
  otp: string;
}

export interface OtpVerifyResponse {
  verified: boolean;
  failureReason?: FailureReason;
}

export interface ParsedQrData {
  source: string;
  type: string;
  licenseNo: string;
  tin: string;
}

export interface VerificationResult {
  verified: boolean;
  reason: string;
  data?: {
    tin: string;
    businessName: string;
    licenseStatus: string;
    phone?: string;
  };
}
