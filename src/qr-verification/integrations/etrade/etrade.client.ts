import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { EtradeConfig, DEFAULT_ETRADE_CONFIG, BusinessLicenseApiResponse } from './types';

export class EtradeClient {
  private client: AxiosInstance;
  private config: EtradeConfig;

  constructor(config: Partial<EtradeConfig> = {}) {
    this.config = { ...DEFAULT_ETRADE_CONFIG, ...config };

    this.client = axios.create({
      baseURL: this.config.baseUrl,
      timeout: this.config.timeoutMs,
      maxRedirects: 0,
      headers: {
        Accept: 'application/json, text/plain, */*',
        'User-Agent':
          'Mozilla/5.0 (compatible; GnzabeTINVerifier/1.0)',
      },
    });

    this.client.interceptors.request.use(this.validateRequest.bind(this));
  }

  async getBusinessLicense(
    licenseNo: string,
    tin: string,
  ): Promise<BusinessLicenseApiResponse | null> {
    const response = await this.client.get('/api/BusinessMain/GetBusinessByLicenseNo', {
      params: { LicenseNo: licenseNo, Tin: tin, Lang: 'en' },
      headers: {
        Referer: 'https://etrade.gov.et/',
      },
      validateStatus: (status) => status < 300 || status === 204,
    });

    if (response.status === 204 || !response.data) {
      return null;
    }

    return response.data as BusinessLicenseApiResponse;
  }

  private validateRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    const resolvedUrl = config.baseURL
      ? new URL(config.url || '', config.baseURL)
      : new URL(config.url || '', 'http://localhost');

    const allowedHostname = new URL(this.config.baseUrl).hostname;
    if (resolvedUrl.hostname !== allowedHostname) {
      throw new Error(
        `SSRF blocked: request to "${resolvedUrl.hostname}" is not allowed`,
      );
    }
    return config;
  }
}
