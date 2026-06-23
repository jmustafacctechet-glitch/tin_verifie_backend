import { SourceValidationResult } from './types';
import { ValidationError } from './types';

const ALLOWED_HOSTNAMES = new Set(['etrade.gov.et']);
const ALLOWED_PROTOCOLS = new Set(['https:']);

export function validateSource(url: string): SourceValidationResult {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, hostname: '', protocol: '', error: 'Invalid URL format' };
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();

  if (!ALLOWED_PROTOCOLS.has(protocol)) {
    return {
      valid: false,
      hostname,
      protocol,
      error: `Protocol "${protocol}" is not allowed — only HTTPS is permitted`,
    };
  }

  if (!ALLOWED_HOSTNAMES.has(hostname)) {
    return {
      valid: false,
      hostname,
      protocol,
      error: `Domain "${hostname}" is not in the allowed list`,
    };
  }

  if (parsed.username || parsed.password) {
    return {
      valid: false,
      hostname,
      protocol,
      error: 'URL must not contain embedded credentials (userinfo)',
    };
  }

  return { valid: true, hostname, protocol };
}

export function isAllowedHostname(hostname: string): boolean {
  return ALLOWED_HOSTNAMES.has(hostname.toLowerCase());
}

export function rejectUserinfoInUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}
