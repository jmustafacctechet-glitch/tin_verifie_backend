import { GovernmentIntegration, LicenseVerificationResult } from '../integration.interface';
import { EtradeClient } from './etrade.client';
import { EtradeScraper } from './etrade.scraper';
import { EtradeConfig, DEFAULT_ETRADE_CONFIG } from './types';

export class EtradeService implements GovernmentIntegration {
  readonly sourceName = 'etrade.gov.et';
  private client: EtradeClient;
  private scraper: EtradeScraper;

  constructor(config: Partial<EtradeConfig> = {}) {
    this.client = new EtradeClient({ ...DEFAULT_ETRADE_CONFIG, ...config });
    this.scraper = new EtradeScraper();
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
      const html = await this.client.getBusinessLicensePage(
        sanitizedLicenseNo,
        sanitizedTin,
      );

      const scraped = this.scraper.scrapeLicensePage(html);

      if (!scraped.tin || scraped.tin.length === 0) {
        return {
          valid: false,
          tin: sanitizedTin,
          businessName: '',
          licenseStatus: 'NOT_FOUND',
        };
      }

      const tinMatches = this.compareTinValues(scraped.tin, sanitizedTin);

      return {
        valid: tinMatches && scraped.licenseStatus === 'Active',
        tin: sanitizedTin,
        businessName: scraped.businessName,
        licenseStatus: scraped.licenseStatus,
        phone: scraped.phone,
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

  private compareTinValues(scraped: string, original: string): boolean {
    const normalize = (v: string) => v.replace(/[\s\-_]/g, '').toUpperCase();
    return normalize(scraped) === normalize(original);
  }
}
