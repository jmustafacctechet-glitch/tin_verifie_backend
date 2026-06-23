import { parseQrData } from './parser.service';
import { ParseError } from './types';

const VALID_URL =
  'https://etrade.gov.et/business-license-checker?licenseNo=klk%2FAA%2F14%2F667%2F24665027%2F2017&tin=1234567890';

describe('parseQrData', () => {
  describe('valid URLs', () => {
    it('parses a standard Ethiopian business license URL', () => {
      const result = parseQrData(VALID_URL);
      expect(result).toEqual({
        source: 'etrade.gov.et',
        type: 'business_license',
        licenseNo: 'klk/AA/14/667/24665027/2017',
        tin: '1234567890',
      });
    });

    it('decodes URL-encoded licenseNo', () => {
      const url =
        'https://etrade.gov.et/business-license-checker?licenseNo=ABC%2F123&tin=TIN001';
      const result = parseQrData(url);
      expect(result.licenseNo).toBe('ABC/123');
      expect(result.tin).toBe('TIN001');
    });

    it('handles simple unencoded parameters', () => {
      const url =
        'https://etrade.gov.et/business-license-checker?licenseNo=ABC123&tin=1234567890';
      const result = parseQrData(url);
      expect(result.licenseNo).toBe('ABC123');
      expect(result.tin).toBe('1234567890');
    });

    it('trims whitespace from qrData', () => {
      const result = parseQrData(`  ${VALID_URL}  `);
      expect(result.source).toBe('etrade.gov.et');
    });
  });

  describe('missing parameters', () => {
    it('rejects when licenseNo is missing', () => {
      const url =
        'https://etrade.gov.et/business-license-checker?tin=1234567890';
      expect(() => parseQrData(url)).toThrow(ParseError);
      expect(() => parseQrData(url)).toThrow(/licenseNo/);
    });

    it('rejects when tin is missing', () => {
      const url =
        'https://etrade.gov.et/business-license-checker?licenseNo=ABC';
      expect(() => parseQrData(url)).toThrow(ParseError);
      expect(() => parseQrData(url)).toThrow(/tin/);
    });

    it('rejects when both parameters are missing', () => {
      const url = 'https://etrade.gov.et/business-license-checker';
      expect(() => parseQrData(url)).toThrow(ParseError);
    });

    it('rejects empty licenseNo value', () => {
      const url =
        'https://etrade.gov.et/business-license-checker?licenseNo=&tin=123';
      expect(() => parseQrData(url)).toThrow(/licenseNo/);
    });
  });

  describe('domain validation', () => {
    it('rejects fake domains', () => {
      const url =
        'https://etrade-fake.com/business-license-checker?licenseNo=ABC&tin=123';
      expect(() => parseQrData(url)).toThrow(/domain/i);
    });

    it('rejects subdomain spoofing', () => {
      const url =
        'https://etrade.gov.et.fake.com/business-license-checker?licenseNo=ABC&tin=123';
      expect(() => parseQrData(url)).toThrow(/domain/i);
    });

    it('rejects http protocol', () => {
      const url =
        'http://etrade.gov.et/business-license-checker?licenseNo=ABC&tin=123';
      expect(() => parseQrData(url)).toThrow(/protocol/i);
    });
  });

  describe('injection attacks', () => {
    it('rejects javascript: URLs', () => {
      expect(() => parseQrData('javascript:alert(document.cookie)')).toThrow(
        /protocol/i,
      );
    });

    it('rejects data: URLs', () => {
      expect(() =>
        parseQrData('data:text/html,<script>alert(1)</script>'),
      ).toThrow(/protocol/i);
    });

    it('rejects URLs with userinfo (credential injection)', () => {
      const url =
        'https://etrade.gov.et@evil.com/business-license-checker?licenseNo=ABC&tin=123';
      expect(() => parseQrData(url)).toThrow(/credentials|user/i);
    });

    it('rejects blank string', () => {
      expect(() => parseQrData('')).toThrow(/empty/i);
    });

    it('rejects whitespace-only string', () => {
      expect(() => parseQrData('   ')).toThrow(/empty/i);
    });
  });

  describe('size limits', () => {
    it('rejects oversized payloads', () => {
      const longLicenseNo = 'A'.repeat(300);
      const url = `https://etrade.gov.et/business-license-checker?licenseNo=${longLicenseNo}&tin=123`;
      expect(() => parseQrData(url)).toThrow(/exceeds/i);
    });

    it('rejects very long TIN values', () => {
      const longTin = 'A'.repeat(100);
      const url = `https://etrade.gov.et/business-license-checker?licenseNo=ABC&tin=${longTin}`;
      expect(() => parseQrData(url)).toThrow(/exceeds/i);
    });
  });
});
