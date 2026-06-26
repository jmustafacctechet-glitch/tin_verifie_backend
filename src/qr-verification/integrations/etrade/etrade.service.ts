import { GovernmentIntegration, LicenseVerificationResult } from '../integration.interface';
import { EtradeClient } from './etrade.client';
import { EtradeConfig, DEFAULT_ETRADE_CONFIG, BusinessLicenseApiResponse } from './types';

export class EtradeService implements GovernmentIntegration {
  readonly sourceName = 'etrade.gov.et';
  private client: EtradeClient;

  constructor(config: Partial<EtradeConfig> = {}) {
    this.client = new EtradeClient({ ...DEFAULT_ETRADE_CONFIG, ...config });
  }

  async verifyBusinessLicense(
    licenseNo: string,
    tin: string,
  ): Promise<LicenseVerificationResult> {
    const sanitizedLicenseNo = licenseNo.trim();
    const sanitizedTin = tin.trim();

    if (!sanitizedLicenseNo || !sanitizedTin) {
      return {
        valid: false,
        tin: sanitizedTin,
        businessName: '',
        licenseStatus: 'INVALID_INPUT',
      };
    }

    try {
      const data = await this.client.getBusinessLicense(
        sanitizedLicenseNo,
        sanitizedTin,
      );

      if (!data) {
        return {
          valid: false,
          tin: sanitizedTin,
          businessName: '',
          licenseStatus: 'NOT_FOUND',
        };
      }

      const tinMatches = this.compareTinValues(data.OwnerTIN || '', sanitizedTin);
      const isActive = data.StatusDescription?.toLowerCase() === 'is active';

      return {
        valid: tinMatches && isActive,
        tin: sanitizedTin,
        businessName: data.TradeName || 'Unknown Business',
        licenseStatus: isActive ? 'Active' : data.StatusDescription || 'Unknown',
        phone: this.extractPhone(data),
      };
    } catch (error: any) {
      if (error.message && error.message.startsWith('SSRF blocked')) {
        throw error;
      }

      return {
        valid: false,
        tin: sanitizedTin,
        businessName: '',
        licenseStatus: 'API_ERROR',
        phone: undefined,
      };
    }
  }

  private extractPhone(data: BusinessLicenseApiResponse): string | undefined {
    return (
      data.AssociateShortInfos?.[0]?.MobilePhone ||
      data.AddressInfo?.MobilePhone ||
      undefined
    );
  }

  private compareTinValues(returned: string, original: string): boolean {
    const normalize = (v: string) => v.replace(/[\s\-_]/g, '').toUpperCase();
    return normalize(returned) === normalize(original);
  }
}
