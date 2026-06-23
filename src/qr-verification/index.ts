export { VerificationStatus, FailureReason } from './types';
export type {
  QrScanRequest,
  QrScanResponse,
  OtpVerifyRequest,
  OtpVerifyResponse,
  ParsedQrData,
  VerificationResult,
} from './types';

export { scannerService } from './scanner/scanner.service';

export { parseQrData } from './parser/parser.service';
export type { ParserConfig } from './parser/types';
export { DEFAULT_PARSER_CONFIG } from './parser/types';

export {
  validateSource,
  validateInputLength,
  sanitizeInput,
  preventJavaScriptUrls,
  isAllowedHostname,
  rejectUserinfoInUrl,
} from './validators';
export type { SourceValidationResult, InputValidationResult } from './validators/types';

export type { GovernmentIntegration, LicenseVerificationResult } from './integrations/integration.interface';
export { IntegrationRegistry } from './integrations/registry';
export { EtradeService } from './integrations/etrade/etrade.service';

export { VerificationService } from './services/verification.service';
export type { VerificationServiceConfig } from './services/types';

export { OtpService } from './otp/otp.service';
export type { OtpServiceConfig } from './otp/types';

export { VerificationSession, AuditLog } from './models';
export type { IVerificationSession, IAuditLog } from './models/types';

export { createQrVerificationRouter } from './controllers';
