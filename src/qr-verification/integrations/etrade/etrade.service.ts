import { GovernmentIntegration, LicenseVerificationResult } from '../integration.interface';
import { getBusinessByLicenseNo, ETradeError } from './etrade.client';
import { BusinessByLicenseNo, BusinessStatus } from './etrade-types';

export class EtradeService implements GovernmentIntegration {
  readonly sourceName = 'etrade.gov.et';

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
      const data = await getBusinessByLicenseNo(sanitizedLicenseNo, sanitizedTin, 'am');

      const tinMatches = this.compareTinValues(data.OwnerTIN || '', sanitizedTin);
      const isActive = data.Status === BusinessStatus.Active;

      return {
        valid: tinMatches && isActive,
        tin: sanitizedTin,
        businessName: data.TradeName || 'Unknown Business',
        licenseStatus: isActive ? 'Active' : data.StatusDescription || 'Unknown',
        phone: this.extractPhone(data),
      };
    } catch (error: unknown) {
      console.error(
        `[EtradeService] verifyBusinessLicense failed for license=${sanitizedLicenseNo} tin=${sanitizedTin}:`,
        error,
      );

      // Map ETradeError reason to a specific status your controller can act on.
      // CERT_ERROR is the most important — it means the pem needs updating,
      // not that the business data is wrong.
      if (error instanceof ETradeError) {
        const statusMap: Record<string, string> = {
          CERT_ERROR:    'GOVERNMENT_CERT_ERROR',   // cert rotated
          TIMEOUT:       'GOVERNMENT_TIMEOUT',       // server slow
          SERVER_ERROR:  `GOVERNMENT_HTTP_ERROR_${error.status ?? 'UNKNOWN'}`,
          NETWORK_ERROR: 'GOVERNMENT_NETWORK_ERROR',
          UNKNOWN:       'GOVERNMENT_API_ERROR',
        };

        return {
          valid: false,
          tin: sanitizedTin,
          businessName: '',
          licenseStatus: statusMap[error.reason] ?? 'GOVERNMENT_API_ERROR',
          phone: undefined,
        };
      }

      return {
        valid: false,
        tin: sanitizedTin,
        businessName: '',
        licenseStatus: 'GOVERNMENT_API_ERROR',
        phone: undefined,
      };
    }
  }

  private extractPhone(data: BusinessByLicenseNo): string | undefined {
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