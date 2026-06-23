import { validateSource, isAllowedHostname } from './source.validator';
import {
  sanitizeInput,
  validateInputLength,
  preventJavaScriptUrls,
} from './input.validator';

describe('source.validator', () => {
  describe('validateSource', () => {
    it('accepts a valid etrade.gov.et HTTPS URL', () => {
      const result = validateSource(
        'https://etrade.gov.et/business-license-checker?licenseNo=ABC&tin=123',
      );
      expect(result.valid).toBe(true);
      expect(result.hostname).toBe('etrade.gov.et');
      expect(result.protocol).toBe('https:');
    });

    it('rejects http://', () => {
      const result = validateSource(
        'http://etrade.gov.et/business-license-checker?licenseNo=ABC&tin=123',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/protocol/i);
    });

    it('rejects fake domain', () => {
      const result = validateSource(
        'https://etrade-fake.com/business-license-checker?licenseNo=ABC&tin=123',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/domain/i);
    });

    it('rejects subdomain spoof', () => {
      const result = validateSource(
        'https://etrade.gov.et.fake.com/business-license-checker?licenseNo=ABC&tin=123',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/domain/i);
    });

    it('rejects URL with embedded credentials', () => {
      const result = validateSource(
        'https://etrade.gov.et@evil.com/business-license-checker?licenseNo=ABC&tin=123',
      );
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/(domain|credentials|userinfo)/i);
    });

    it('rejects completely invalid URL', () => {
      const result = validateSource('not-a-url');
      expect(result.valid).toBe(false);
      expect(result.error).toMatch(/invalid url/i);
    });
  });

  describe('isAllowedHostname', () => {
    it('returns true for etrade.gov.et', () => {
      expect(isAllowedHostname('etrade.gov.et')).toBe(true);
    });

    it('returns false for fake domains', () => {
      expect(isAllowedHostname('etrade-fake.com')).toBe(false);
    });

    it('returns false for subdomain spoofs', () => {
      expect(isAllowedHostname('etrade.gov.et.fake.com')).toBe(false);
    });
  });
});

describe('input.validator', () => {
  describe('sanitizeInput', () => {
    it('accepts valid input', () => {
      const result = sanitizeInput('https://etrade.gov.et/test');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('https://etrade.gov.et/test');
    });

    it('trims whitespace', () => {
      const result = sanitizeInput('  https://etrade.gov.et/test  ');
      expect(result.valid).toBe(true);
      expect(result.sanitized).toBe('https://etrade.gov.et/test');
    });

    it('rejects empty input', () => {
      const result = sanitizeInput('');
      expect(result.valid).toBe(false);
    });

    it('rejects oversized input', () => {
      const long = 'https://etrade.gov.et/' + 'A'.repeat(2100);
      const result = sanitizeInput(long);
      expect(result.valid).toBe(false);
    });
  });

  describe('validateInputLength', () => {
    it('returns true for short strings', () => {
      expect(validateInputLength('short')).toBe(true);
    });

    it('returns false for long strings', () => {
      expect(validateInputLength('A'.repeat(3000))).toBe(false);
    });
  });

  describe('preventJavaScriptUrls', () => {
    it('returns false for javascript: URLs', () => {
      expect(preventJavaScriptUrls('javascript:alert(1)')).toBe(false);
    });

    it('returns false for data: URLs', () => {
      expect(preventJavaScriptUrls('data:text/html,<script>')).toBe(false);
    });

    it('returns true for valid HTTPS URLs', () => {
      expect(preventJavaScriptUrls('https://etrade.gov.et/test')).toBe(true);
    });
  });
});
