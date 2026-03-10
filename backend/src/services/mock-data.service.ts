/**
 * Mock Data Service for Test Mode
 *
 * Provides comprehensive mock data for testing the AML/CFT CDD system
 * without requiring actual API keys or external service connections.
 *
 * Enable test mode by setting TEST_MODE=true in environment variables.
 */

import { PEPStatus } from '../generated/prisma';
import { MockNZBNEntity, MockSearchResult } from '../types/mock-data.types';
import { TEST_OWNERSHIP_ENTITIES } from '../data/test-ownership-structures';

// Re-export types for backwards compatibility
export type { MockNZBNEntity, MockSearchResult } from '../types/mock-data.types';

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
    anzsicCode: 'F331',
    anzsicDescription: 'Wholesaling - Grocery, Liquor and Tobacco Product',
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
    entityType: 'NZ_LISTED_ISSUER', // Explicit entity type for Simplified CDD
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '1998-07-01',
    anzsicCode: 'D261',
    anzsicDescription: 'Electricity Generation',
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
      {
        directorNumber: 'D002',
        fullName: 'Jan Dawson',
        appointmentDate: '2019-08-01',
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
    entityType: 'NZ_LOCAL_AUTHORITY',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2010-11-01',
    anzsicCode: 'O753',
    anzsicDescription: 'Local Government Administration',
    isLocalAuthority: true,
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '135 Albert Street',
        postCode: '1010',
        countryCode: 'NZ',
      },
    ],
    directors: [
      {
        directorNumber: 'D001',
        fullName: 'Wayne Brown',
        appointmentDate: '2022-10-01',
      },
    ],
    shareholders: [
      {
        shareholderName: 'New Zealand Crown',
        shareholderType: 'Company',
        numberOfShares: 100,
        totalShares: 100,
        allocationDate: '2010-11-01',
      },
    ],
  },

  // Simplified CDD - State Enterprise
  '9429041564000': {
    nzbn: '9429041564000',
    entityName: 'KIWIRAIL HOLDINGS LIMITED',
    entityTypeCode: 'SOE',
    entityTypeName: 'State Owned Enterprise',
    entityType: 'NZ_STATE_ENTERPRISE', // Explicit entity type for Simplified CDD
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2008-07-01',
    anzsicCode: 'I471',
    anzsicDescription: 'Rail Freight Transport',
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
    directors: [
      {
        directorNumber: 'D001',
        fullName: 'David McLean',
        appointmentDate: '2020-03-01',
      },
      {
        directorNumber: 'D002',
        fullName: 'Sue McCormack',
        appointmentDate: '2019-06-15',
      },
    ],
    shareholders: [
      {
        shareholderName: 'NZ Government (Crown)',
        shareholderType: 'Company',
        numberOfShares: 100,
        totalShares: 100,
        allocationDate: '2008-07-01',
      },
    ],
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
    anzsicCode: 'K624',
    anzsicDescription: 'Financial Asset Investing',
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
    anzsicCode: 'L672',
    anzsicDescription: 'Non-Financial Asset Investing',
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

  // Standard CDD - NZ Limited Partnership (resolves 3 levels deep)
  '9429041567000': {
    nzbn: '9429041567000',
    entityName: 'WELLINGTON VENTURES LP',
    entityTypeCode: 'LP',
    entityTypeName: 'NZ Limited Partnership',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2019-09-01',
    anzsicCode: 'K623',
    anzsicDescription: 'Non-Depository Financing',
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
        shareholderName: 'WELLINGTON GP LIMITED',
        shareholderType: 'Company',
        numberOfShares: 1,
        totalShares: 100,
        allocationDate: '2019-09-01',
        shareholderNzbn: '9429041580007',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'TECH INVESTOR FUND LP',
        shareholderType: 'Company',
        numberOfShares: 50,
        totalShares: 100,
        allocationDate: '2019-09-01',
        shareholderNzbn: '9429041580008',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'Sarah Williams',
        shareholderType: 'Individual',
        numberOfShares: 49,
        totalShares: 100,
        allocationDate: '2019-09-01',
        shareholderCountry: 'NZ',
      },
    ],
  },

  // Wellington GP Limited — General Partner of Wellington Ventures LP
  '9429041580007': {
    nzbn: '9429041580007',
    entityName: 'WELLINGTON GP LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2019-08-01',
    anzsicCode: 'K623',
    anzsicDescription: 'Non-Depository Financing',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '50 Willis Street',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'James Wellington', appointmentDate: '2019-08-01' },
    ],
    shareholders: [
      {
        shareholderName: 'James Wellington',
        shareholderType: 'Individual',
        numberOfShares: 60,
        totalShares: 100,
        allocationDate: '2019-08-01',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'WELLINGTON MANAGEMENT SERVICES LIMITED',
        shareholderType: 'Company',
        numberOfShares: 40,
        totalShares: 100,
        allocationDate: '2019-08-01',
        shareholderNzbn: '9429041580009',
        shareholderCountry: 'NZ',
      },
    ],
  },

  // Wellington Management Services — owns 40% of Wellington GP
  '9429041580009': {
    nzbn: '9429041580009',
    entityName: 'WELLINGTON MANAGEMENT SERVICES LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2015-03-22',
    anzsicCode: 'M696',
    anzsicDescription: 'Management Advice and Related Consulting Services',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '12 Manners Street',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'Claire Henderson', appointmentDate: '2015-03-22' },
    ],
    shareholders: [
      {
        shareholderName: 'Claire Henderson',
        shareholderType: 'Individual',
        numberOfShares: 100,
        totalShares: 100,
        allocationDate: '2015-03-22',
        shareholderCountry: 'NZ',
      },
    ],
  },

  // Tech Investor Fund LP — Limited Partner in Wellington Ventures LP
  '9429041580008': {
    nzbn: '9429041580008',
    entityName: 'TECH INVESTOR FUND LP',
    entityTypeCode: 'LP',
    entityTypeName: 'NZ Limited Partnership',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2018-06-01',
    anzsicCode: 'K624',
    anzsicDescription: 'Financial Asset Investing',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '23 Lambton Quay',
        address2: 'Level 5',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [],
    shareholders: [
      {
        shareholderName: 'NZ Angel Network Limited',
        shareholderType: 'Company',
        numberOfShares: 45,
        totalShares: 100,
        allocationDate: '2018-06-01',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'NZ Government Innovation Fund',
        shareholderType: 'Company',
        numberOfShares: 30,
        totalShares: 100,
        allocationDate: '2018-06-01',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'Michael Chang',
        shareholderType: 'Individual',
        numberOfShares: 15,
        totalShares: 100,
        allocationDate: '2018-06-01',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'Emma Patel',
        shareholderType: 'Individual',
        numberOfShares: 10,
        totalShares: 100,
        allocationDate: '2018-06-01',
        shareholderCountry: 'AU',
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
    anzsicCode: 'M696',
    anzsicDescription: 'Management Advice and Related Consulting Services',
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

  // ── ACME GROUP ── Multi-level NZ + Overseas structure (3 layers)
  '9429041580001': {
    nzbn: '9429041580001',
    entityName: 'ACME HOLDINGS LIMITED',
    tradingName: 'Acme Holdings',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2015-03-10',
    anzsicCode: 'K624',
    anzsicDescription: 'Financial Asset Investing',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '22 Shortland Street',
        address2: 'Level 8',
        address3: 'Auckland CBD',
        postCode: '1010',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'James Acme', appointmentDate: '2015-03-10' },
    ],
    shareholders: [
      {
        shareholderName: 'ALPHA CAPITAL LIMITED',
        shareholderType: 'Company',
        numberOfShares: 600,
        totalShares: 1000,
        allocationDate: '2015-03-10',
        shareholderNzbn: '9429041580002',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'Offshore Ventures Ltd',
        shareholderType: 'Company',
        numberOfShares: 400,
        totalShares: 1000,
        allocationDate: '2015-03-10',
        shareholderCountry: 'GB',
      },
    ],
  },

  // Alpha Capital — NZ company, shareholder of Acme (Layer 2)
  '9429041580002': {
    nzbn: '9429041580002',
    entityName: 'ALPHA CAPITAL LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2012-07-01',
    anzsicCode: 'K623',
    anzsicDescription: 'Non-Depository Financing',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '50 Customhouse Quay',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'John Smith', appointmentDate: '2012-07-01' },
    ],
    shareholders: [
      {
        shareholderName: 'John Smith',
        shareholderType: 'Individual',
        numberOfShares: 700,
        totalShares: 1000,
        allocationDate: '2012-07-01',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'BETA TRUST LIMITED',
        shareholderType: 'Company',
        numberOfShares: 300,
        totalShares: 1000,
        allocationDate: '2012-07-01',
        shareholderNzbn: '9429041580003',
        shareholderCountry: 'NZ',
      },
    ],
  },

  // Beta Trust — NZ company, shareholder of Alpha Capital (Layer 3 — ultimate individuals)
  '9429041580003': {
    nzbn: '9429041580003',
    entityName: 'BETA TRUST LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2010-01-20',
    anzsicCode: 'L672',
    anzsicDescription: 'Non-Financial Asset Investing',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '77 Victoria Street',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'Jane Doe', appointmentDate: '2010-01-20' },
    ],
    shareholders: [
      {
        shareholderName: 'Jane Doe',
        shareholderType: 'Individual',
        numberOfShares: 500,
        totalShares: 1000,
        allocationDate: '2010-01-20',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'Robert Johnson',
        shareholderType: 'Individual',
        numberOfShares: 500,
        totalShares: 1000,
        allocationDate: '2010-01-20',
        shareholderCountry: 'NZ',
      },
    ],
  },

  // ── TAURANGA GROUP ── 4-layer chain ending at Cayman Islands ultimate owner
  '9429041580004': {
    nzbn: '9429041580004',
    entityName: 'TAURANGA DEVELOPMENT LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2018-09-01',
    anzsicCode: 'E301',
    anzsicDescription: 'Residential Building Construction',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '10 Cameron Road',
        postCode: '3110',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'Chen Wei', appointmentDate: '2018-09-01' },
    ],
    shareholders: [
      {
        shareholderName: 'BAY OF PLENTY INVESTMENTS LIMITED',
        shareholderType: 'Company',
        numberOfShares: 750,
        totalShares: 1000,
        allocationDate: '2018-09-01',
        shareholderNzbn: '9429041580010',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'Chen Wei',
        shareholderType: 'Individual',
        numberOfShares: 250,
        totalShares: 1000,
        allocationDate: '2018-09-01',
        shareholderCountry: 'CN',
      },
    ],
  },

  // Bay of Plenty Investments — Layer 2 of Tauranga chain
  '9429041580010': {
    nzbn: '9429041580010',
    entityName: 'BAY OF PLENTY INVESTMENTS LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2016-04-12',
    anzsicCode: 'K624',
    anzsicDescription: 'Financial Asset Investing',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '3 Devonport Road',
        postCode: '3110',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'Thomas Ngata', appointmentDate: '2016-04-12' },
    ],
    shareholders: [
      {
        shareholderName: 'PACIFIC RIM HOLDINGS NZ LIMITED',
        shareholderType: 'Company',
        numberOfShares: 800,
        totalShares: 1000,
        allocationDate: '2016-04-12',
        shareholderNzbn: '9429041580011',
        shareholderCountry: 'NZ',
      },
      {
        shareholderName: 'Thomas Ngata',
        shareholderType: 'Individual',
        numberOfShares: 200,
        totalShares: 1000,
        allocationDate: '2016-04-12',
        shareholderCountry: 'NZ',
      },
    ],
  },

  // Pacific Rim Holdings NZ — Layer 3, held by Cayman vehicle
  '9429041580011': {
    nzbn: '9429041580011',
    entityName: 'PACIFIC RIM HOLDINGS NZ LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2014-11-30',
    anzsicCode: 'K624',
    anzsicDescription: 'Financial Asset Investing',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '88 The Terrace',
        address2: 'Level 14',
        postCode: '6011',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'CR Pacific Director Services Ltd', appointmentDate: '2014-11-30' },
    ],
    shareholders: [
      {
        // Ultimate beneficial owner — Cayman Islands special purpose vehicle
        shareholderName: 'CR Pacific Special Purpose Vehicle Ltd',
        shareholderType: 'Company',
        numberOfShares: 1000,
        totalShares: 1000,
        allocationDate: '2014-11-30',
        shareholderCountry: 'KY', // Cayman Islands — HIGH RISK jurisdiction
      },
    ],
  },

  // ── QUEENSTOWN RESORT GROUP ── Overseas + NZ mixed structure
  '9429041580005': {
    nzbn: '9429041580005',
    entityName: 'QUEENSTOWN RESORT GROUP LIMITED',
    tradingName: 'QRG',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2017-05-15',
    anzsicCode: 'H510',
    anzsicDescription: 'Accommodation',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '38 The Mall',
        address2: 'Queenstown',
        postCode: '9300',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'Olivia Turner', appointmentDate: '2017-05-15' },
      { directorNumber: 'D002', fullName: 'Singapore Resort Holdings Nominee', appointmentDate: '2020-01-01' },
    ],
    shareholders: [
      {
        shareholderName: 'Singapore Resort Holdings Pte Ltd',
        shareholderType: 'Company',
        numberOfShares: 650,
        totalShares: 1000,
        allocationDate: '2017-05-15',
      },
      {
        shareholderName: 'Olivia Turner',
        shareholderType: 'Individual',
        numberOfShares: 200,
        totalShares: 1000,
        allocationDate: '2017-05-15',
      },
      {
        shareholderName: 'NZ Tourism Fund Limited',
        shareholderType: 'Company',
        numberOfShares: 150,
        totalShares: 1000,
        allocationDate: '2019-03-01',
      },
    ],
  },

  // ── CHRISTCHURCH REBUILD PARTNERS ── Three-way JV structure
  '9429041580006': {
    nzbn: '9429041580006',
    entityName: 'CHRISTCHURCH REBUILD PARTNERS LIMITED',
    entityTypeCode: 'LTD',
    entityTypeName: 'NZ Limited Company',
    entityStatusCode: 'REGD',
    entityStatusDescription: 'Registered',
    registrationDate: '2013-02-22',
    anzsicCode: 'E302',
    anzsicDescription: 'Non-Residential Building Construction',
    addresses: [
      {
        addressType: 'Registered Office',
        address1: '150 Victoria Street',
        postCode: '8013',
        countryCode: 'NZ',
      },
    ],
    directors: [
      { directorNumber: 'D001', fullName: 'Sarah Williams', appointmentDate: '2013-02-22' },
      { directorNumber: 'D002', fullName: 'David Mitchell', appointmentDate: '2013-02-22' },
    ],
    shareholders: [
      {
        shareholderName: 'Canterbury Construction Holdings Ltd',
        shareholderType: 'Company',
        numberOfShares: 334,
        totalShares: 1000,
        allocationDate: '2013-02-22',
      },
      {
        shareholderName: 'NZ Rebuild Fund LP',
        shareholderType: 'Company',
        numberOfShares: 333,
        totalShares: 1000,
        allocationDate: '2013-02-22',
      },
      {
        shareholderName: 'David Mitchell',
        shareholderType: 'Individual',
        numberOfShares: 333,
        totalShares: 1000,
        allocationDate: '2013-02-22',
      },
    ],
  },

  // Add test ownership structures for ownership tree testing
  ...TEST_OWNERSHIP_ENTITIES,
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
