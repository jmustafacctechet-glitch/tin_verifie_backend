// ── Shared ────────────────────────────────────────────────────────────────

interface BaseAssociateInfo {
  ManagerName: string;
  ManagerNameEng: string;
  Photo: string | null;
  MobilePhone: string | null;
  RegularPhone: string | null;
}

export interface BusinessSubGroup {
  Code: number;
  Description: string;
}

// ── Endpoint 1: GetRegistrationInfoByTin ────────────────────────────────────
// GET /api/Registration/GetRegistrationInfoByTin/{tin}/{lang}

export interface TinAssociateInfo extends BaseAssociateInfo {
  Position: string | null;
}

export interface TinBusiness {
  MainGuid: string;
  OwnerTIN: string;
  DateRegistered: string;
  TradeNameAmh: string;
  TradesName: string;
  LicenceNumber: string;
  RenewalDate: string;
  RenewedFrom: string;
  RenewedTo: string;
  BusinessLicensingGroupMain: unknown | null;
  SubGroups: BusinessSubGroup[];
}

export interface RegistrationInfo {
  Tin: string;
  LegalCondtion: string;
  RegNo: string;
  RegDate: string;
  BusinessName: string;
  BusinessNameAmh: string;
  PaidUpCapital: number;
  AssociateShortInfos: TinAssociateInfo[];
  Businesses: TinBusiness[];
}

// ── Endpoint 2: GetBusinessByLicenseNo ──────────────────────────────────────
// GET /api/BusinessMain/GetBusinessByLicenseNo?LicenseNo=...&Tin=...&Lang=...

export interface LicenseAssociateInfo extends BaseAssociateInfo {
  Position: string;
}

export interface AddressInfo {
  Region: string;
  Zone: string;
  Woreda: string;
  Kebele: string;
  HouseNo: string;
  MobilePhone: string | null;
  RegularPhone: string | null;
}

export enum BusinessStatus {
  Active = 5,
}

export interface BusinessByLicenseNo {
  MainGuid: string;
  OwnerTIN: string;
  DateRegistered: string;
  TradeName: string;
  LicenceNumber: string;
  Status: number;
  StatusDescription: string;
  Capital: number;
  AssociateShortInfos: LicenseAssociateInfo[];
  AddressInfo: AddressInfo;
  SubGroups: BusinessSubGroup[];
  RenewedTo: string;
  RenewedToDateString: string;
  RenewalDate: string;
  RenewedFrom: string;
  CancellationDate: string | null;
}
