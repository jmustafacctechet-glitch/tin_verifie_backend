import { EtradeService } from './etrade.service';
import { getBusinessByLicenseNo, ETradeError } from './etrade.client';
import type { BusinessByLicenseNo } from './etrade-types';

jest.mock('./etrade.client', () => ({
  getBusinessByLicenseNo: jest.fn(),
  ETradeError: jest.requireActual('./etrade.client').ETradeError,
}));

const mockGetBusinessByLicenseNo = getBusinessByLicenseNo as jest.Mock;

describe('EtradeService', () => {
  let service: EtradeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EtradeService();
  });

  const validApiResponse: BusinessByLicenseNo = {
    MainGuid: 'abc-123',
    OwnerTIN: '1234567890',
    DateRegistered: '16/4/2017',
    TradeName: 'ABC Trading PLC',
    LicenceNumber: 'ABC/123',
    Status: 5,
    StatusDescription: 'Is active',
    Capital: 2000000,
    AssociateShortInfos: [
      {
        Position: 'Manager',
        ManagerName: 'Test',
        ManagerNameEng: 'Test',
        Photo: null,
        MobilePhone: '+251911123456',
        RegularPhone: '+251911123456',
      },
    ],
    AddressInfo: {
      Region: 'Addis Ababa',
      Zone: 'Addis Ababa',
      Woreda: 'Kirkos',
      Kebele: '09',
      HouseNo: '123',
      MobilePhone: '+251911123456',
      RegularPhone: null,
    },
    SubGroups: [{ Code: 86521, Description: 'Consulting' }],
    RenewedTo: '2026-07-07T00:00:00',
    RenewedToDateString: '30/10/2018',
    RenewalDate: '27/4/2018',
    RenewedFrom: '1/11/2017',
    CancellationDate: null,
  };

  it('returns valid result when TIN matches and license is active', async () => {
    mockGetBusinessByLicenseNo.mockResolvedValue(validApiResponse);

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(true);
    expect(result.businessName).toBe('ABC Trading PLC');
    expect(result.phone).toBe('+251911123456');
  });

  it('returns invalid when TIN does not match', async () => {
    mockGetBusinessByLicenseNo.mockResolvedValue({
      ...validApiResponse,
      OwnerTIN: '9999999999',
    });

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(false);
  });

  it('returns invalid when license status is not Active', async () => {
    mockGetBusinessByLicenseNo.mockResolvedValue({
      ...validApiResponse,
      Status: 0,
      StatusDescription: 'Cancelled',
    });

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(false);
    expect(result.licenseStatus).toBe('Cancelled');
  });

  it('returns API_ERROR on ETradeError', async () => {
    mockGetBusinessByLicenseNo.mockRejectedValue(
      new ETradeError('API error', 502),
    );

    const result = await service.verifyBusinessLicense('ABC/123', '1234567890');

    expect(result.valid).toBe(false);
    expect(result.licenseStatus).toBe('API_ERROR');
  });

  it('returns API_ERROR on network failure', async () => {
    mockGetBusinessByLicenseNo.mockRejectedValue(new Error('Network error'));

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
