import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { EtradeConfig, DEFAULT_ETRADE_CONFIG } from './types';

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
        Accept: 'text/html,application/xhtml+xml',
        'User-Agent':
          'Mozilla/5.0 (compatible; GnzabeTINVerifier/1.0)',
      },
    });

    this.client.interceptors.request.use(this.validateRequest.bind(this));
  }

  async getBusinessLicensePage(
    licenseNo: string,
    tin: string,
  ): Promise<string> {
    const response = await this.client.get('/business-license-checker', {
      params: { licenseNo, tin },
      responseType: 'text',
      validateStatus: (status) => status < 400,
    });

    return response.data;
  }

  async postBusinessLicenseLookup(
    licenseNo: string,
    tin: string,
  ): Promise<string> {
    const response = await this.client.post(
      '/business-license-checker',
      new URLSearchParams({ licenseNo, tin }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        responseType: 'text',
        validateStatus: (status) => status < 400,
      },
    );

    return response.data;
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
