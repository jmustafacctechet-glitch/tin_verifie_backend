export interface LicenseVerificationResult {
  valid: boolean;
  tin: string;
  businessName: string;
  licenseStatus: string;
  phone?: string;
}

export interface GovernmentIntegration {
  readonly sourceName: string;
  verifyBusinessLicense(
    licenseNo: string,
    tin: string,
  ): Promise<LicenseVerificationResult>;
}
