import { EtradeService } from './etrade.service';

const mockGetBusinessLicensePage = jest.fn();
const mockScrapeLicensePage = jest.fn();

jest.mock('./etrade.client', () => ({
  EtradeClient: jest.fn().mockImplementation(() => ({
    getBusinessLicensePage: mockGetBusinessLicensePage,
    postBusinessLicenseLookup: jest.fn(),
  })),
}));

jest.mock('./etrade.scraper', () => ({
  EtradeScraper: jest.fn().mockImplementation(() => ({
    scrapeLicensePage: mockScrapeLicensePage,
  })),
}));

describe('EtradeService', () => {
  let service: EtradeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EtradeService();
  });

  it('returns valid result when TIN matches and license is active', async () => {
    mockGetBusinessLicensePage.mockResolvedValue('<html>mock</html>');
    mockScrapeLicensePage.mockReturnValue({
      businessName: 'ABC Trading PLC',
      licenseStatus: 'Active',
      tin: '1234567890',
      phone: '+251911123456',
    });

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(true);
    expect(result.businessName).toBe('ABC Trading PLC');
    expect(result.phone).toBe('+251911123456');
  });

  it('returns invalid when TIN does not match', async () => {
    mockGetBusinessLicensePage.mockResolvedValue('<html>mock</html>');
    mockScrapeLicensePage.mockReturnValue({
      businessName: 'ABC Trading PLC',
      licenseStatus: 'Active',
      tin: '9999999999',
      phone: '+251911123456',
    });

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(false);
  });

  it('returns NOT_FOUND when no TIN in scraped data', async () => {
    mockGetBusinessLicensePage.mockResolvedValue('<html>not found</html>');
    mockScrapeLicensePage.mockReturnValue({
      businessName: '',
      licenseStatus: 'NOT_FOUND',
      tin: '',
    });

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(false);
    expect(result.licenseStatus).toBe('NOT_FOUND');
  });

  it('returns API_ERROR on network failure', async () => {
    mockGetBusinessLicensePage.mockRejectedValue(new Error('Network error'));

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(false);
    expect(result.licenseStatus).toBe('API_ERROR');
  });

  it('rejects empty inputs', async () => {
    const result1 = await service.verifyBusinessLicense('', '12345');
    expect(result1.valid).toBe(false);

    const result2 = await service.verifyBusinessLicense('ABC', '');
    expect(result2.valid).toBe(false);
  });
});
