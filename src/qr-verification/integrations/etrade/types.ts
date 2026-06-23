export interface EtradeConfig {
  baseUrl: string;
  timeoutMs: number;
}

export interface EtradeScrapeResult {
  businessName: string;
  licenseStatus: string;
  tin: string;
  phone?: string;
  rawHtml?: string;
}

export const DEFAULT_ETRADE_CONFIG: EtradeConfig = {
  baseUrl: 'https://etrade.gov.et',
  timeoutMs: 10000,
};
