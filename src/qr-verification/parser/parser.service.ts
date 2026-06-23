import { ParsedQrData } from '../types';
import { ParserConfig, DEFAULT_PARSER_CONFIG, ParseError } from './types';

const SUPPORTED_HOSTNAMES = new Set(['etrade.gov.et']);

export function parseQrData(
  qrData: string,
  config: ParserConfig = DEFAULT_PARSER_CONFIG,
): ParsedQrData {
  if (!qrData || qrData.trim().length === 0) {
    throw new ParseError('QR data is empty');
  }

  const trimmed = qrData.trim();

  if (trimmed.length > config.maxLength) {
    throw new ParseError(
      `QR data exceeds maximum length of ${config.maxLength} characters`,
    );
  }

  if (!isHttpsUrl(trimmed)) {
    throw new ParseError('Invalid protocol — only HTTPS URLs are allowed');
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new ParseError('QR data is not a valid URL');
  }

  if (url.username || url.password) {
    throw new ParseError('URL must not contain user credentials');
  }

  const hostname = url.hostname.toLowerCase();

  if (!SUPPORTED_HOSTNAMES.has(hostname)) {
    throw new ParseError(`Unsupported domain: ${hostname}`);
  }

  const licenseNo = url.searchParams.get('licenseNo');
  const tin = url.searchParams.get('tin');

  if (!licenseNo || licenseNo.trim().length === 0) {
    throw new ParseError('Missing required parameter: licenseNo');
  }

  if (!tin || tin.trim().length === 0) {
    throw new ParseError('Missing required parameter: tin');
  }

  const decodedLicenseNo = safeDecodeURIComponent(licenseNo.trim());
  const decodedTin = safeDecodeURIComponent(tin.trim());

  if (!decodedLicenseNo || !decodedTin) {
    throw new ParseError('Failed to decode URL-encoded parameters');
  }

  if (decodedLicenseNo.length > 200 || decodedTin.length > 50) {
    throw new ParseError('Parameter value exceeds maximum allowed length');
  }

  return {
    source: hostname,
    type: 'business_license',
    licenseNo: decodedLicenseNo,
    tin: decodedTin,
  };
}

function isHttpsUrl(value: string): boolean {
  return /^https:\/\//i.test(value);
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value);
    if (decoded !== value) {
      const reEncoded = encodeURIComponent(decoded);
      if (reEncoded !== value && reEncoded !== decodeURIComponent(value)) {
        return decoded;
      }
    }
    return decoded;
  } catch {
    return null;
  }
}
