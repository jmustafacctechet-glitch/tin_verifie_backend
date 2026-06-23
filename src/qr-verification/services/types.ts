import { IntegrationRegistry } from '../integrations/registry';
import { OtpService } from '../otp/otp.service';

export interface VerificationServiceConfig {
  integrationRegistry: IntegrationRegistry;
  otpService: OtpService;
  sessionExpiryMinutes: number;
}
