import { InputValidationResult } from './types';

const MAX_QR_DATA_LENGTH = 2048;
const MAX_PARAM_LENGTH = 200;
const MAX_TIN_LENGTH = 50;

const MALICIOUS_PROTOCOLS = /^(javascript|data|vbscript|file|ftp):/i;

export function sanitizeInput(input: string): InputValidationResult {
  if (!input || input.trim().length === 0) {
    return { valid: false, sanitized: '', error: 'Input is empty' };
  }

  const trimmed = input.trim();

  if (trimmed.length > MAX_QR_DATA_LENGTH) {
    return {
      valid: false,
      sanitized: trimmed,
      error: `Input exceeds maximum length of ${MAX_QR_DATA_LENGTH} characters`,
    };
  }

  return { valid: true, sanitized: trimmed };
}

export function validateInputLength(
  input: string,
  maxLength: number = MAX_QR_DATA_LENGTH,
): boolean {
  return input.length <= maxLength;
}

export function preventJavaScriptUrls(input: string): boolean {
  if (MALICIOUS_PROTOCOLS.test(input)) {
    return false;
  }

  try {
    const url = new URL(input);
    const protocol = url.protocol.toLowerCase();
    return !MALICIOUS_PROTOCOLS.test(protocol);
  } catch {
    return true;
  }
}

export function validateParameterLength(value: string): boolean {
  return value.length <= MAX_PARAM_LENGTH;
}

export function validateTinLength(tin: string): boolean {
  return tin.length <= MAX_TIN_LENGTH;
}
