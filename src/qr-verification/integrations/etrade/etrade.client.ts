import https from 'https';
import fs from 'fs';
import path from 'path';
import axios, { AxiosError } from 'axios';
import type { RegistrationInfo, BusinessByLicenseNo } from './etrade-types';


const certPath = path.resolve(process.cwd(), 'certs/etrade-ca.pem');
const etradeAxios = axios.create({
  httpsAgent: new https.Agent({
    ca: fs.readFileSync(certPath),
  }),
  headers: {
    Referer: 'https://etrade.gov.et/business-license-checker',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'application/json, text/plain, */*',
  },
  timeout: 10000,
});

// ── Error classification ─────────────────────────────────────────────────
// These are the Node TLS error codes that mean the cert chain changed.
// Any of these = you need to update etrade-ca.pem.
const CERT_ERROR_CODES = new Set([
  'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
  'CERT_HAS_EXPIRED',
  'UNABLE_TO_GET_ISSUER_CERT_LOCALLY',
  'ERR_TLS_CERT_ALTNAME_INVALID',
  'DEPTH_ZERO_SELF_SIGNED_CERT',
  'SELF_SIGNED_CERT_IN_CHAIN',
]);

export type ETradeFailureReason =
  | 'CERT_ERROR'    // cert rotated — pem needs updating
  | 'SERVER_ERROR'  // eTrade returned 4xx/5xx
  | 'TIMEOUT'       // server too slow
  | 'NETWORK_ERROR' // DNS/connection failure
  | 'UNKNOWN';

export class ETradeError extends Error {
  constructor(
    message: string,
    public reason: ETradeFailureReason,
    public status?: number,
  ) {
    super(message);
    this.name = 'ETradeError';
  }
}

function classifyError(err: unknown): ETradeFailureReason {
  if (err instanceof AxiosError) {
    // err.cause is the underlying Node error that has the TLS code
    const code = (err.cause as any)?.code ?? err.code ?? '';
    if (CERT_ERROR_CODES.has(code)) return 'CERT_ERROR';
    if (code === 'ECONNABORTED' || code === 'ETIMEDOUT' || err.code === 'ECONNABORTED') return 'TIMEOUT';
    if (err.response) return 'SERVER_ERROR';
    return 'NETWORK_ERROR';
  }
  return 'UNKNOWN';
}

// ── Endpoint 1: by TIN ───────────────────────────────────────────────────

export async function getRegistrationInfoByTin(
  tin: string,
  lang: 'am' | 'en' = 'am',
): Promise<RegistrationInfo> {
  const url = `https://etrade.gov.et/api/Registration/GetRegistrationInfoByTin/${encodeURIComponent(tin)}/${encodeURIComponent(lang)}`;

  try {
    console.log('Calling:', url);
    const { data } = await etradeAxios.get<RegistrationInfo>(url);
    console.log('Response:', JSON.stringify(data));
    return data;
  } catch (err) {
    const reason = classifyError(err);
    if (reason === 'CERT_ERROR') {
      console.error('🔴 eTrade certificate error — certs/etrade-ca.pem needs updating');
    }
    console.error('getRegistrationInfoByTin error:', err);
    throw new ETradeError('GetRegistrationInfoByTin failed', reason, (err as AxiosError)?.response?.status);
  }
}

// ── Endpoint 2: by License No ────────────────────────────────────────────

export async function getBusinessByLicenseNo(
  licenseNo: string,
  tin: string,
  lang: 'am' | 'en' = 'am',
): Promise<BusinessByLicenseNo> {
  const params = new URLSearchParams({ LicenseNo: licenseNo, Tin: tin, Lang: lang });
  const url = `https://etrade.gov.et/api/BusinessMain/GetBusinessByLicenseNo?${params.toString()}`;

  try {
    console.log('Calling eTrade API:', url);
    const { data } = await etradeAxios.get<BusinessByLicenseNo>(url);
    console.log('Response body:', JSON.stringify(data));
    return data;
  } catch (err) {
    const reason = classifyError(err);
    if (reason === 'CERT_ERROR') {
      console.error('🔴 eTrade certificate error — certs/etrade-ca.pem needs updating');
    }
    console.error('GetBusinessByLicenseNo error:', err);
    throw new ETradeError('GetBusinessByLicenseNo failed', reason, (err as AxiosError)?.response?.status);
  }
}

// ── Date parsing ─────────────────────────────────────────────────────────

export function parseEtradeDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;
  const [day, month, year] = parts.map(Number);
  if ([day, month, year].some((n) => Number.isNaN(n))) return null;
  return new Date(year, month - 1, day);
}

export interface RenewalDates {
  fromIsoField: Date | null;
  fromStringField: Date | null;
  agree: boolean;
}

export function reconcileRenewedTo(business: BusinessByLicenseNo): RenewalDates {
  const fromIsoField = business.RenewedTo ? new Date(business.RenewedTo) : null;
  const fromStringField = parseEtradeDate(business.RenewedToDateString);
  const agree =
    !!fromIsoField &&
    !!fromStringField &&
    fromIsoField.getTime() === fromStringField.getTime();
  return { fromIsoField, fromStringField, agree };
}