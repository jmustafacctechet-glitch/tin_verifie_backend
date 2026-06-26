export interface EtradeConfig {
  baseUrl: string;
  timeoutMs: number;
}

export interface BusinessLicenseApiResponse {
  MainGuid?: string;
  OwnerTIN?: string;
  DateRegistered?: string;
  TradeName?: string;
  LicenceNumber?: string;
  Status?: number;
  StatusDescription?: string;
  Capital?: number;
  AssociateShortInfos?: Array<{
    Position?: string;
    ManagerName?: string;
    ManagerNameEng?: string;
    Photo?: string;
    MobilePhone?: string;
    RegularPhone?: string;
  }>;
  AddressInfo?: {
    Region?: string;
    Zone?: string;
    Woreda?: string;
    Kebele?: string;
    HouseNo?: string;
    MobilePhone?: string;
    RegularPhone?: string;
  };
  SubGroups?: Array<{
    Code?: number;
    Description?: string;
  }>;
  RenewedTo?: string;
  RenewedToDateString?: string;
  RenewalDate?: string;
  RenewedFrom?: string;
  CancellationDate?: string | null;
}

export const DEFAULT_ETRADE_CONFIG: EtradeConfig = {
  baseUrl: 'https://etrade.gov.et',
  timeoutMs: 10000,
};
