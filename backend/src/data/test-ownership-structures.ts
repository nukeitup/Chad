/**
 * Test Ownership Structures
 *
 * Comprehensive test data for ownership tree visualization testing.
 * Includes various ownership scenarios from simple to complex.
 *
 * Usage:
 * - Import these structures to add to mock data
 * - Use for testing ownership tree service
 * - Demonstrates different CDD scenarios
 */

import { MockNZBNEntity } from '../types/mock-data.types';

// ============================================================
// SIMPLE OWNERSHIP - Direct individual shareholders
// ============================================================

/**
 * Simple Co Ltd - Two individuals with direct ownership
 * Ownership: John (55%), Mary (45%)
 * CDD: Standard
 * Beneficial Owners: John (55%), Mary (45%)
 */
export const SIMPLE_OWNERSHIP: MockNZBNEntity = {
  nzbn: '9429041570001',
  entityName: 'SIMPLE CO LIMITED',
  tradingName: 'Simple Co',
  entityTypeCode: 'LTD',
  entityTypeName: 'NZ Limited Company',
  entityStatusCode: 'REGD',
  entityStatusDescription: 'Registered',
  registrationDate: '2020-01-15',
  anzsicCode: 'G411',
  anzsicDescription: 'Supermarket and Grocery Stores',
  addresses: [
    {
      addressType: 'Registered Office',
      address1: '10 Easy Street',
      postCode: '6011',
      countryCode: 'NZ',
    },
  ],
  directors: [
    {
      directorNumber: 'D001',
      fullName: 'John Simple',
      appointmentDate: '2020-01-15',
    },
  ],
  shareholders: [
    {
      shareholderName: 'John Simple',
      shareholderType: 'Individual',
      numberOfShares: 550,
      totalShares: 1000,
      allocationDate: '2020-01-15',
    },
    {
      shareholderName: 'Mary Simple',
      shareholderType: 'Individual',
      numberOfShares: 450,
      totalShares: 1000,
      allocationDate: '2020-01-15',
    },
  ],
};

// ============================================================
// MEDIUM COMPLEXITY - One corporate + individuals
// ============================================================

/**
 * Parent Holdings Ltd - Corporate shareholder chain
 * Ownership: Corporate Sub Co (60%), Individual (40%)
 * Then Corporate Sub Co: Two individuals (50/50)
 *
 * Structure:
 * Parent Holdings Ltd
 * ├── Corporate Sub Co Ltd (60%)
 * │   ├── Alice Holder (50%) → 30% indirect
 * │   └── Bob Holder (50%) → 30% indirect
 * └── Charlie Direct (40%)
 *
 * Beneficial Owners:
 * - Alice Holder (30% indirect)
 * - Bob Holder (30% indirect)
 * - Charlie Direct (40% direct)
 */
export const MEDIUM_PARENT: MockNZBNEntity = {
  nzbn: '9429041570002',
  entityName: 'PARENT HOLDINGS LIMITED',
  tradingName: 'Parent Holdings',
  entityTypeCode: 'LTD',
  entityTypeName: 'NZ Limited Company',
  entityStatusCode: 'REGD',
  entityStatusDescription: 'Registered',
  registrationDate: '2019-06-01',
  anzsicCode: 'K624',
  anzsicDescription: 'Financial Asset Investing',
  addresses: [
    {
      addressType: 'Registered Office',
      address1: '200 Corporate Avenue',
      postCode: '1010',
      countryCode: 'NZ',
    },
  ],
  directors: [
    {
      directorNumber: 'D001',
      fullName: 'Charlie Direct',
      appointmentDate: '2019-06-01',
    },
  ],
  shareholders: [
    {
      shareholderName: 'CORPORATE SUB CO LIMITED',
      shareholderType: 'Company',
      numberOfShares: 600,
      totalShares: 1000,
      allocationDate: '2019-06-01',
    },
    {
      shareholderName: 'Charlie Direct',
      shareholderType: 'Individual',
      numberOfShares: 400,
      totalShares: 1000,
      allocationDate: '2019-06-01',
    },
  ],
};

export const MEDIUM_SUBSIDIARY: MockNZBNEntity = {
  nzbn: '9429041570003',
  entityName: 'CORPORATE SUB CO LIMITED',
  tradingName: 'Corporate Sub',
  entityTypeCode: 'LTD',
  entityTypeName: 'NZ Limited Company',
  entityStatusCode: 'REGD',
  entityStatusDescription: 'Registered',
  registrationDate: '2018-01-01',
  anzsicCode: 'K624',
  anzsicDescription: 'Financial Asset Investing',
  addresses: [
    {
      addressType: 'Registered Office',
      address1: '201 Corporate Avenue',
      postCode: '1010',
      countryCode: 'NZ',
    },
  ],
  directors: [
    {
      directorNumber: 'D001',
      fullName: 'Alice Holder',
      appointmentDate: '2018-01-01',
    },
    {
      directorNumber: 'D002',
      fullName: 'Bob Holder',
      appointmentDate: '2018-01-01',
    },
  ],
  shareholders: [
    {
      shareholderName: 'Alice Holder',
      shareholderType: 'Individual',
      numberOfShares: 500,
      totalShares: 1000,
      allocationDate: '2018-01-01',
    },
    {
      shareholderName: 'Bob Holder',
      shareholderType: 'Individual',
      numberOfShares: 500,
      totalShares: 1000,
      allocationDate: '2018-01-01',
    },
  ],
};

// ============================================================
// COMPLEX OWNERSHIP - 4+ layers deep
// ============================================================

/**
 * Deep Holdings Ltd - Multi-layer corporate structure
 *
 * Structure (4 layers):
 * Deep Holdings Ltd
 * ├── Layer Two Ltd (70%)
 * │   ├── Layer Three Ltd (80%)
 * │   │   ├── Ultimate Owner A (60%) → 26.88% indirect
 * │   │   └── Ultimate Owner B (40%) → 17.92% indirect
 * │   └── Layer Two Individual (20%) → 14% indirect
 * └── Direct Shareholder (30%)
 *
 * Beneficial Owners:
 * - Direct Shareholder (30% direct)
 * - Ultimate Owner A (26.88% indirect)
 * - Ultimate Owner B (17.92% indirect - below threshold, not BO)
 * - Layer Two Individual (14% indirect - below threshold, not BO)
 */
export const COMPLEX_TOP: MockNZBNEntity = {
  nzbn: '9429041570010',
  entityName: 'DEEP HOLDINGS LIMITED',
  tradingName: 'Deep Holdings',
  entityTypeCode: 'LTD',
  entityTypeName: 'NZ Limited Company',
  entityStatusCode: 'REGD',
  entityStatusDescription: 'Registered',
  registrationDate: '2015-03-01',
  anzsicCode: 'K624',
  anzsicDescription: 'Financial Asset Investing',
  addresses: [
    {
      addressType: 'Registered Office',
      address1: '1 Deep Street',
      postCode: '6011',
      countryCode: 'NZ',
    },
  ],
  directors: [
    {
      directorNumber: 'D001',
      fullName: 'Direct Shareholder',
      appointmentDate: '2015-03-01',
    },
  ],
  shareholders: [
    {
      shareholderName: 'LAYER TWO LIMITED',
      shareholderType: 'Company',
      numberOfShares: 700,
      totalShares: 1000,
      allocationDate: '2015-03-01',
    },
    {
      shareholderName: 'Direct Shareholder',
      shareholderType: 'Individual',
      numberOfShares: 300,
      totalShares: 1000,
      allocationDate: '2015-03-01',
    },
  ],
};

export const COMPLEX_LAYER_TWO: MockNZBNEntity = {
  nzbn: '9429041570011',
  entityName: 'LAYER TWO LIMITED',
  entityTypeCode: 'LTD',
  entityTypeName: 'NZ Limited Company',
  entityStatusCode: 'REGD',
  entityStatusDescription: 'Registered',
  registrationDate: '2014-01-01',
  anzsicCode: 'K624',
  anzsicDescription: 'Financial Asset Investing',
  addresses: [
    {
      addressType: 'Registered Office',
      address1: '2 Deep Street',
      postCode: '6011',
      countryCode: 'NZ',
    },
  ],
  directors: [],
  shareholders: [
    {
      shareholderName: 'LAYER THREE LIMITED',
      shareholderType: 'Company',
      numberOfShares: 800,
      totalShares: 1000,
      allocationDate: '2014-01-01',
    },
    {
      shareholderName: 'Layer Two Individual',
      shareholderType: 'Individual',
      numberOfShares: 200,
      totalShares: 1000,
      allocationDate: '2014-01-01',
    },
  ],
};

export const COMPLEX_LAYER_THREE: MockNZBNEntity = {
  nzbn: '9429041570012',
  entityName: 'LAYER THREE LIMITED',
  entityTypeCode: 'LTD',
  entityTypeName: 'NZ Limited Company',
  entityStatusCode: 'REGD',
  entityStatusDescription: 'Registered',
  registrationDate: '2013-01-01',
  anzsicCode: 'K624',
  anzsicDescription: 'Financial Asset Investing',
  addresses: [
    {
      addressType: 'Registered Office',
      address1: '3 Deep Street',
      postCode: '6011',
      countryCode: 'NZ',
    },
  ],
  directors: [],
  shareholders: [
    {
      shareholderName: 'Ultimate Owner A',
      shareholderType: 'Individual',
      numberOfShares: 600,
      totalShares: 1000,
      allocationDate: '2013-01-01',
    },
    {
      shareholderName: 'Ultimate Owner B',
      shareholderType: 'Individual',
      numberOfShares: 400,
      totalShares: 1000,
      allocationDate: '2013-01-01',
    },
  ],
};

// ============================================================
// CIRCULAR OWNERSHIP - Company A → B → A
// ============================================================

/**
 * Circular A Ltd - Circular ownership structure (should trigger warning)
 *
 * Structure:
 * Circular A Ltd
 * └── Circular B Ltd (60%)
 *     └── Circular A Ltd (40%) ← CIRCULAR!
 *
 * This structure should:
 * - Trigger circular ownership detection
 * - Stop recursion to prevent infinite loop
 * - Generate appropriate warnings
 */
export const CIRCULAR_A: MockNZBNEntity = {
  nzbn: '9429041570020',
  entityName: 'CIRCULAR A LIMITED',
  entityTypeCode: 'LTD',
  entityTypeName: 'NZ Limited Company',
  entityStatusCode: 'REGD',
  entityStatusDescription: 'Registered',
  registrationDate: '2021-01-01',
  anzsicCode: 'K624',
  anzsicDescription: 'Financial Asset Investing',
  addresses: [
    {
      addressType: 'Registered Office',
      address1: '1 Loop Lane',
      postCode: '1010',
      countryCode: 'NZ',
    },
  ],
  directors: [
    {
      directorNumber: 'D001',
      fullName: 'Circular Director',
      appointmentDate: '2021-01-01',
    },
  ],
  shareholders: [
    {
      shareholderName: 'CIRCULAR B LIMITED',
      shareholderType: 'Company',
      numberOfShares: 600,
      totalShares: 1000,
      allocationDate: '2021-01-01',
    },
    {
      shareholderName: 'Non Circular Person',
      shareholderType: 'Individual',
      numberOfShares: 400,
      totalShares: 1000,
      allocationDate: '2021-01-01',
    },
  ],
};

export const CIRCULAR_B: MockNZBNEntity = {
  nzbn: '9429041570021',
  entityName: 'CIRCULAR B LIMITED',
  entityTypeCode: 'LTD',
  entityTypeName: 'NZ Limited Company',
  entityStatusCode: 'REGD',
  entityStatusDescription: 'Registered',
  registrationDate: '2021-01-01',
  anzsicCode: 'K624',
  anzsicDescription: 'Financial Asset Investing',
  addresses: [
    {
      addressType: 'Registered Office',
      address1: '2 Loop Lane',
      postCode: '1010',
      countryCode: 'NZ',
    },
  ],
  directors: [],
  shareholders: [
    {
      shareholderName: 'CIRCULAR A LIMITED',
      shareholderType: 'Company',
      numberOfShares: 400,
      totalShares: 1000,
      allocationDate: '2021-01-01',
    },
    {
      shareholderName: 'Circular Investor',
      shareholderType: 'Individual',
      numberOfShares: 600,
      totalShares: 1000,
      allocationDate: '2021-01-01',
    },
  ],
};

// ============================================================
// OVERSEAS CORPORATE - Foreign shareholder requiring EDD
// ============================================================

/**
 * NZ Subsidiary of Overseas Ltd
 *
 * Structure:
 * NZ Subsidiary Ltd
 * └── BVI Holdings Co (100%) ← Overseas, requires enhanced investigation
 *
 * This should:
 * - Flag the overseas corporate shareholder
 * - Generate warning about unresolvable NZBN
 * - Potentially trigger Enhanced CDD
 */
export const OVERSEAS_SUBSIDIARY: MockNZBNEntity = {
  nzbn: '9429041570030',
  entityName: 'NZ SUBSIDIARY OF OVERSEAS LIMITED',
  entityTypeCode: 'LTD',
  entityTypeName: 'NZ Limited Company',
  entityStatusCode: 'REGD',
  entityStatusDescription: 'Registered',
  registrationDate: '2020-06-01',
  anzsicCode: 'L672',
  anzsicDescription: 'Non-Financial Asset Investing',
  addresses: [
    {
      addressType: 'Registered Office',
      address1: '1 International Way',
      postCode: '1010',
      countryCode: 'NZ',
    },
  ],
  directors: [
    {
      directorNumber: 'D001',
      fullName: 'Overseas Corporate Services Ltd',
      appointmentDate: '2020-06-01',
    },
  ],
  shareholders: [
    {
      shareholderName: 'BVI Holdings Company Limited',
      shareholderType: 'Company',
      numberOfShares: 1000,
      totalShares: 1000,
      allocationDate: '2020-06-01',
    },
  ],
};

// ============================================================
// EXPORT ALL TEST STRUCTURES
// ============================================================

export const TEST_OWNERSHIP_ENTITIES: Record<string, MockNZBNEntity> = {
  // Simple
  [SIMPLE_OWNERSHIP.nzbn]: SIMPLE_OWNERSHIP,

  // Medium complexity
  [MEDIUM_PARENT.nzbn]: MEDIUM_PARENT,
  [MEDIUM_SUBSIDIARY.nzbn]: MEDIUM_SUBSIDIARY,

  // Complex (4+ layers)
  [COMPLEX_TOP.nzbn]: COMPLEX_TOP,
  [COMPLEX_LAYER_TWO.nzbn]: COMPLEX_LAYER_TWO,
  [COMPLEX_LAYER_THREE.nzbn]: COMPLEX_LAYER_THREE,

  // Circular
  [CIRCULAR_A.nzbn]: CIRCULAR_A,
  [CIRCULAR_B.nzbn]: CIRCULAR_B,

  // Overseas
  [OVERSEAS_SUBSIDIARY.nzbn]: OVERSEAS_SUBSIDIARY,
};

/**
 * Merge test ownership entities with main mock data
 * Call this function to add test structures to the mock data service
 */
export function getTestOwnershipStructures(): Record<string, MockNZBNEntity> {
  return TEST_OWNERSHIP_ENTITIES;
}

export default TEST_OWNERSHIP_ENTITIES;
