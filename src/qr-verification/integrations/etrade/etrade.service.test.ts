import { EtradeService } from './etrade.service';

const mockGetBusinessLicense = jest.fn();

jest.mock('./etrade.client', () => ({
  EtradeClient: jest.fn().mockImplementation(() => ({
    getBusinessLicense: mockGetBusinessLicense,
  })),
}));

describe('EtradeService', () => {
  let service: EtradeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EtradeService();
  });

  const validApiResponse = {
    MainGuid: 'abc-123',
    OwnerTIN: '1234567890',
    TradeName: 'ABC Trading PLC',
    LicenceNumber: 'ABC/123',
    Status: 5,
    StatusDescription: 'Is active',
    AssociateShortInfos: [
      {
        Position: 'Manager',
        ManagerName: 'Test',
        MobilePhone: '+251911123456',
      },
    ],
    AddressInfo: {
      MobilePhone: '+251911123456',
    },
  };

  it('returns valid result when TIN matches and license is active', async () => {
    mockGetBusinessLicense.mockResolvedValue(validApiResponse);

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(true);
    expect(result.businessName).toBe('ABC Trading PLC');
    expect(result.phone).toBe('+251911123456');
  });

  it('returns invalid when TIN does not match', async () => {
    mockGetBusinessLicense.mockResolvedValue({
      ...validApiResponse,
      OwnerTIN: '9999999999',
    });

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(false);
  });

  it('returns NOT_FOUND when API returns null (204)', async () => {
    mockGetBusinessLicense.mockResolvedValue(null);

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(false);
    expect(result.licenseStatus).toBe('NOT_FOUND');
  });

  it('returns API_ERROR on network failure', async () => {
    mockGetBusinessLicense.mockRejectedValue(new Error('Network error'));

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
