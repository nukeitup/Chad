/**
 * Mock Data Types
 *
 * Shared type definitions for mock data to avoid circular imports.
 */

export interface MockNZBNEntity {
  nzbn: string;
  entityName: string;
  tradingName?: string;
  entityTypeCode: string;
  entityTypeName: string;
  entityType?: string; // Internal entity type for CDD determination (e.g., 'NZ_STATE_ENTERPRISE', 'NZ_LISTED_ISSUER')
  entityStatusCode: string;
  entityStatusDescription: string;
  registrationDate: string;
  // ANZSIC Industry Classification
  anzsicCode?: string;
  anzsicDescription?: string;
  addresses: Array<{
    addressType: string;
    address1: string;
    address2?: string;
    address3?: string;
    postCode: string;
    countryCode: string;
  }>;
  directors: Array<{
    directorNumber: string;
    fullName: string;
    appointmentDate: string;
    residentialAddress?: string;
  }>;
  shareholders: Array<{
    shareholderName: string;
    shareholderType: 'Individual' | 'Company';
    numberOfShares: number;
    totalShares?: number;
    allocationDate: string;
    shareholderNzbn?: string;    // NZBN of NZ company shareholder — enables recursive ownership fetch
    shareholderCountry?: string; // Country code for overseas shareholders (e.g. 'KY', 'VG', 'SG')
  }>;
  // Simplified CDD eligibility flags
  isListedIssuer?: boolean;
  listedExchange?: string;
  isGovernmentBody?: boolean;
  isLocalAuthority?: boolean;
  isStateEnterprise?: boolean;
}

export interface MockSearchResult {
  nzbn: string;
  entityName: string;
  entityTypeName: string;
  entityStatusDescription: string;
  registrationDate: string;
}
