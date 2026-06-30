import type { RegistrationInfo, BusinessByLicenseNo } from './etrade-types';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const COMMON_HEADERS = {
  Referer: 'https://etrade.gov.et/business-license-checker',
  'User-Agent': USER_AGENT,
  Accept: 'application/json, text/plain, */*',
};

export class ETradeError extends Error {
  constructor(message: string, public status?: number) {
    super(message);
    this.name = 'ETradeError';
  }
}

// ── Endpoint 1: by TIN ───────────────────────────────────────────────────

export async function getRegistrationInfoByTin(
  tin: string,
  lang: 'am' | 'en' = 'am',
): Promise<RegistrationInfo> {
  const url = `https://etrade.gov.et/api/Registration/GetRegistrationInfoByTin/${encodeURIComponent(tin)}/${encodeURIComponent(lang)}`;

  const res = await fetch(url, { headers: COMMON_HEADERS });

  if (!res.ok) {
    throw new ETradeError(
      `GetRegistrationInfoByTin failed with status ${res.status}`,
      res.status,
    );
  }

  return (await res.json()) as RegistrationInfo;
}

// ── Endpoint 2: by License No ───────────────────────────────────────────

export async function getBusinessByLicenseNo(
  licenseNo: string,
  tin: string,
  lang: 'am' | 'en' = 'am',
): Promise<BusinessByLicenseNo> {
  const params = new URLSearchParams({
    LicenseNo: licenseNo,
    Tin: tin,
    Lang: lang,
  });

  const url = `https://etrade.gov.et/api/BusinessMain/GetBusinessByLicenseNo?${params.toString()}`;

  const res = await fetch(url, { headers: COMMON_HEADERS });

  if (!res.ok) {
    throw new ETradeError(
      `GetBusinessByLicenseNo failed with status ${res.status}`,
      res.status,
    );
  }

  return (await res.json()) as BusinessByLicenseNo;
}

// ── Date parsing helper ─────────────────────────────────────────────────

export function parseEtradeDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  const parts = dateStr.split('/');
  if (parts.length !== 3) return null;

  const [day, month, year] = parts.map(Number);
  if ([day, month, year].some((n) => Number.isNaN(n))) return null;

  return new Date(year, month - 1, day);
}

// ── Reconciling the RenewedTo discrepancy ───────────────────────────────

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
