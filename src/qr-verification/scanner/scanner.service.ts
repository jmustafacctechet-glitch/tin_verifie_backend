export interface RawQrInput {
  qrData: string;
}

export interface ScannerResult {
  valid: boolean;
  qrData: string;
  error?: string;
}

class ScannerService {
  validate(input: RawQrInput): ScannerResult {
    if (!input || typeof input.qrData !== 'string') {
      return { valid: false, qrData: '', error: 'QR data must be a non-empty string' };
    }

    const trimmed = input.qrData.trim();

    if (trimmed.length === 0) {
      return { valid: false, qrData: '', error: 'QR data must not be empty' };
    }

    return { valid: true, qrData: trimmed };
  }
}

export const scannerService = new ScannerService();
