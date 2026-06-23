export interface SourceValidationResult {
  valid: boolean;
  hostname: string;
  protocol: string;
  error?: string;
}

export interface InputValidationResult {
  valid: boolean;
  sanitized: string;
  error?: string;
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
