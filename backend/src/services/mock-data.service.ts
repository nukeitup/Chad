/**
 * Mock Data Service for Test Mode
 *
 * Provides comprehensive mock data for testing the AML/CFT CDD system
 * without requiring actual API keys or external service connections.
 *
 * Enable test mode by setting TEST_MODE=true in environment variables.
 */

import { PEPStatus } from '../generated/prisma';

// ============================================================
// MOCK NZBN ENTITIES
// ============================================================

export interface MockNZBNEntity {
  nzbn: string;
  entityName: string;
  tradingName?: string;
  entityTypeCode: string;
  entityTypeName: string;
  entityStatusCode: string;
  entityStatusDescription: string;
  registrationDate: string;
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

// Comprehensive mock entities covering different CDD scenarios
export const MOCK_NZBN_ENTITIES: Record<string, MockNZBNEntity> = {
  // Standard CDD - Typical NZ Company
  '9429041561467': {
    nzbn: '9429041561467',
    entityName: 'ABC TRADING LIMITED',
    tradingName: 'ABC Trading',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2018-03-15',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '123 Queen Street',
        address2: 'Level 5',
        address3: 'Auckland CBD',
        postCode: '1010',
        countryCode: 'NZ',
      },
    ],
    directors: [
      {
        directorNumber: 'D001',
        fullName: 'John Smith',
        appointmentDate: '2018-03-15',
      },
      {
        directorNumber: 'D002',
        fullName: 'Mary Johnson',
        appointmentDate: '2019-06-01',
      },
    ],
    shareholders: [
      {
        shareholderName: 'John Smith',
        shareholderType: 'Individual',
        numberOfShares: 550,
        totalShares: 1000,
        allocationDate: '2018-03-15',
      },
      {
        shareholderName: 'Mary Johnson',
        shareholderType: 'Individual',
        numberOfShares: 450,
        totalShares: 1000,
        allocationDate: '2018-03-15',
      },
    ],
  },

  // Simplified CDD - NZX Listed Company
  '9429041562000': {
    nzbn: '9429041562000',
    entityName: 'MERIDIAN ENERGY LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '1998-07-01',
    isListedIssuer: true,
    listedExchange: 'NZX',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '33 Customhouse Quay',
        address2: 'Level 12',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [
      {
        directorNumber: 'D001',
        fullName: 'Mark Cairns',
        appointmentDate: '2020-01-15',
      },
    ],
    shareholders: [
      {
        shareholderName: 'NZ Government',
        shareholderType: 'Company',
        numberOfShares: 51000000,
        totalShares: 100000000,
        allocationDate: '1998-07-01',
      },
    ],
  },

  // Simplified CDD - Local Authority
  '9429041563000': {
    nzbn: '9429041563000',
    entityName: 'AUCKLAND COUNCIL',
    entityTypeCode: 'LA',
    entityTypeName: 'Local Authority',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2010-11-01',
    isLocalAuthority: true,
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '135 Albert Street',
        postCode: '1010',
        countryCode: 'NZ',
      },
    ],
    directors: [],
    shareholders: [],
  },

  // Simplified CDD - State Enterprise
  '9429041564000': {
    nzbn: '9429041564000',
    entityName: 'KIWIRAIL HOLDINGS LIMITED',
    entityTypeCode: 'SOE',
    entityTypeName: 'State Owned Enterprise',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2008-07-01',
    isStateEnterprise: true,
    addresses: [
      {
        addressType: 'Registered Office',
        address1: 'Wellington Railway Station',
        address2: 'Bunny Street',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [],
    shareholders: [],
  },

  // Enhanced CDD - Complex Ownership (multiple layers)
  '9429041565000': {
    nzbn: '9429041565000',
    entityName: 'PACIFIC HOLDINGS NZ LIMITED',
    tradingName: 'Pacific Holdings',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2020-01-15',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '1 Grey Street',
        address2: 'Level 10',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [
      {
        directorNumber: 'D001',
        fullName: 'Corporate Services (NZ) Ltd',
        appointmentDate: '2020-01-15',
      },
    ],
    shareholders: [
      {
        shareholderName: 'Pacific Investments BVI Ltd',
        shareholderType: 'Company',
        numberOfShares: 1000,
        totalShares: 1000,
        allocationDate: '2020-01-15',
      },
    ],
  },

  // Enhanced CDD - Trust Structure
  '9429041566000': {
    nzbn: '9429041566000',
    entityName: 'SMITH FAMILY TRUST LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2015-06-01',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '100 Lambton Quay',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [
      {
        directorNumber: 'D001',
        fullName: 'Robert Smith',
        appointmentDate: '2015-06-01',
      },
      {
        directorNumber: 'D002',
        fullName: 'ABC Trustee Company Ltd',
        appointmentDate: '2015-06-01',
      },
    ],
    shareholders: [
      {
        shareholderName: 'The Smith Family Trust',
        shareholderType: 'Company',
        numberOfShares: 100,
        totalShares: 100,
        allocationDate: '2015-06-01',
      },
    ],
  },

  // Standard CDD - NZ Limited Partnership
  '9429041567000': {
    nzbn: '9429041567000',
    entityName: 'WELLINGTON VENTURES LP',
    entityTypeCode: 'LP',
    entityTypeName: 'NZ Limited Partnership',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2019-09-01',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '50 Willis Street',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [],
    shareholders: [
      {
        shareholderName: 'Wellington GP Limited',
        shareholderType: 'Company',
        numberOfShares: 1,
        allocationDate: '2019-09-01',
      },
      {
        shareholderName: 'Tech Investor Fund LP',
        shareholderType: 'Company',
        numberOfShares: 50,
        allocationDate: '2019-09-01',
      },
      {
        shareholderName: 'Sarah Williams',
        shareholderType: 'Individual',
        numberOfShares: 49,
        allocationDate: '2019-09-01',
      },
    ],
  },

  // PEP Scenario - Director is a politician
  '9429041568000': {
    nzbn: '9429041568000',
    entityName: 'CIVIC CONSULTANTS LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2021-03-01',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '45 Victoria Street',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [
      {
        directorNumber: 'D001',
        fullName: 'David Mitchell',
        appointmentDate: '2021-03-01',
      },
    ],
    shareholders: [
      {
        shareholderName: 'David Mitchell',
        shareholderType: 'Individual',
        numberOfShares: 100,
        totalShares: 100,
        allocationDate: '2021-03-01',
      },
    ],
  },
};

// ============================================================
// MOCK SCREENING RESULTS (PEP/SANCTIONS)
// ============================================================

export interface MockScreeningResult {
  pepStatus: PEPStatus;
  pepDetails?: string;
  sanctionsScreeningResult: string;
  adverseMediaResult: string;
}

// Predefined screening results for test scenarios
export const MOCK_SCREENING_RESULTS: Record<string, MockScreeningResult> = {
  // Clear results
  'John Smith': {
    pepStatus: 'NOT_PEP',
    sanctionsScreeningResult: 'Clear',
    adverseMediaResult: 'Clear',
  },
  'Mary Johnson': {
    pepStatus: 'NOT_PEP',
    sanctionsScreeningResult: 'Clear',
    adverseMediaResult: 'Clear',
  },
  'Sarah Williams': {
    pepStatus: 'NOT_PEP',
    sanctionsScreeningResult: 'Clear',
    adverseMediaResult: 'Clear',
  },
  'Robert Smith': {
    pepStatus: 'NOT_PEP',
    sanctionsScreeningResult: 'Clear',
    adverseMediaResult: 'Clear',
  },
  // PEP - Domestic
  'David Mitchell': {
    pepStatus: 'DOMESTIC_PEP',
    pepDetails: 'Member of Parliament, New Zealand House of Representatives',
    sanctionsScreeningResult: 'Clear',
    adverseMediaResult: 'Potential match found: News article regarding political donations (March 2023)',
  },
  // PEP - Foreign
  'Chen Wei': {
    pepStatus: 'FOREIGN_PEP',
    pepDetails: 'Former Deputy Minister, Ministry of Commerce, China',
    sanctionsScreeningResult: 'Clear',
    adverseMediaResult: 'Clear',
  },
  // Sanctions Match (test scenario)
  'Ivan Petrov': {
    pepStatus: 'NOT_PEP',
    sanctionsScreeningResult: 'Potential match found: UN Sanctions List (Ref: #UN-2022-1234)',
    adverseMediaResult: 'Multiple adverse media hits found',
  },
};

// ============================================================
// MOCK COUNTRY DATA
// ============================================================

export interface MockCountryRisk {
  countryCode: string;
  countryName: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  isFATFMember: boolean;
  isFATFHighRisk: boolean;
  fatfStatus?: string;
}

export const MOCK_COUNTRY_RISKS: Record<string, MockCountryRisk> = {
  NZ: { countryCode: 'NZ', countryName: 'New Zealand', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
  AU: { countryCode: 'AU', countryName: 'Australia', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
  GB: { countryCode: 'GB', countryName: 'United Kingdom', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
  US: { countryCode: 'US', countryName: 'United States', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
  SG: { countryCode: 'SG', countryName: 'Singapore', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
  HK: { countryCode: 'HK', countryName: 'Hong Kong', riskLevel: 'MEDIUM', isFATFMember: true, isFATFHighRisk: false },
  VG: { countryCode: 'VG', countryName: 'British Virgin Islands', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: false },
  KY: { countryCode: 'KY', countryName: 'Cayman Islands', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: false },
  PA: { countryCode: 'PA', countryName: 'Panama', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: false, fatfStatus: 'Enhanced monitoring' },
  IR: { countryCode: 'IR', countryName: 'Iran', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: true, fatfStatus: 'Call for action' },
  KP: { countryCode: 'KP', countryName: 'North Korea', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: true, fatfStatus: 'Call for action' },
  MM: { countryCode: 'MM', countryName: 'Myanmar', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: true, fatfStatus: 'Enhanced monitoring' },
};

// ============================================================
// MOCK DATA SERVICE
// ============================================================

export const mockDataService = {
  /**
   * Search for entities by name or NZBN
   */
  searchEntities(query: string): MockSearchResult[] {
    const lowerQuery = query.toLowerCase();

    return Object.values(MOCK_NZBN_ENTITIES)
      .filter(entity =>
        entity.entityName.toLowerCase().includes(lowerQuery) ||
        entity.nzbn.includes(query) ||
        (entity.tradingName && entity.tradingName.toLowerCase().includes(lowerQuery))
      )
      .map(entity => ({
        nzbn: entity.nzbn,
        entityName: entity.entityName,
        entityTypeName: entity.entityTypeName,
        entityStatusDescription: entity.entityStatusDescription,
        registrationDate: entity.registrationDate,
      }));
  },

  /**
   * Get entity by NZBN
   */
  getEntityByNZBN(nzbn: string): MockNZBNEntity | null {
    return MOCK_NZBN_ENTITIES[nzbn] || null;
  },

  /**
   * Screen a person against PEP/Sanctions lists
   */
  async screenPerson(fullName: string): Promise<MockScreeningResult> {
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));

    // Check for predefined results
    if (MOCK_SCREENING_RESULTS[fullName]) {
      return MOCK_SCREENING_RESULTS[fullName];
    }

    // Default to clear results for unknown names
    return {
      pepStatus: 'NOT_PEP',
      sanctionsScreeningResult: 'Clear',
      adverseMediaResult: 'Clear',
    };
  },

  /**
   * Get country risk information
   */
  getCountryRisk(countryCode: string): MockCountryRisk | null {
    return MOCK_COUNTRY_RISKS[countryCode] || {
      countryCode,
      countryName: countryCode,
      riskLevel: 'MEDIUM',
      isFATFMember: false,
      isFATFHighRisk: false,
    };
  },

  /**
   * Check if country is FATF member (for Simplified CDD overseas govt bodies)
   */
  isFATFMemberCountry(countryCode: string): boolean {
    const country = MOCK_COUNTRY_RISKS[countryCode];
    return country?.isFATFMember ?? false;
  },

  /**
   * Check if country is FATF high-risk
   */
  isFATFHighRiskCountry(countryCode: string): boolean {
    const country = MOCK_COUNTRY_RISKS[countryCode];
    return country?.isFATFHighRisk ?? false;
  },
};

export default mockDataService;
