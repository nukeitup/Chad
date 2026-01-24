import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler } from '../middleware/error.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Static reference data
const ENTITY_TYPES = {
  NZ: [
    { value: 'NZ_COMPANY', label: 'NZ Limited Company', simplifiedEligible: false },
    { value: 'NZ_LIMITED_PARTNERSHIP', label: 'NZ Limited Partnership', simplifiedEligible: false },
    { value: 'NZ_LOCAL_AUTHORITY', label: 'NZ Local Authority', simplifiedEligible: true },
    { value: 'NZ_STATE_ENTERPRISE', label: 'NZ State Enterprise', simplifiedEligible: true },
    { value: 'NZ_PUBLIC_SERVICE_AGENCY', label: 'NZ Public Service Agency', simplifiedEligible: true },
    { value: 'NZ_GOVT_DEPARTMENT', label: 'NZ Government Department', simplifiedEligible: true },
    { value: 'NZ_LISTED_ISSUER', label: 'NZ Listed Issuer (NZX)', simplifiedEligible: true },
  ],
  OVERSEAS: [
    { value: 'OVERSEAS_COMPANY', label: 'Overseas Company', simplifiedEligible: false },
    { value: 'TRUST', label: 'Trust', simplifiedEligible: false },
    { value: 'FOUNDATION', label: 'Foundation', simplifiedEligible: false },
  ],
};

const DOCUMENT_TYPES = {
  ENTITY_IDENTIFICATION: [
    'Certificate of Incorporation',
    'Company Extract',
    'Partnership Agreement',
    'Trust Deed',
    'Constitution',
    'Annual Return',
  ],
  BENEFICIAL_OWNER_ID: [
    'Passport',
    'NZ Drivers Licence',
    'NZ Firearms Licence',
    'Overseas ID Document',
    'Birth Certificate',
  ],
  POABOC_ID: [
    'Passport',
    'NZ Drivers Licence',
    'NZ Firearms Licence',
    'Overseas ID Document',
  ],
  AUTHORITY_DOCUMENT: [
    'Board Resolution',
    'Power of Attorney',
    'Letter of Authority',
    'Partnership Resolution',
    'Trustee Resolution',
  ],
  SOURCE_OF_WEALTH: [
    'Financial Statements',
    'Tax Returns',
    'Business Valuation',
    'Sale/Purchase Agreement',
    'Investment Statement',
    'Other Supporting Documentation',
  ],
  SOURCE_OF_FUNDS: [
    'Bank Statement',
    'Investment Account Statement',
    'Sale Proceeds Documentation',
    'Loan Agreement',
    'Dividend Statement',
    'Other Supporting Documentation',
  ],
};

const PRODUCTS = [
  { value: 'TRANSACTION_ACCOUNT', label: 'Transaction Account', riskWeight: 0 },
  { value: 'TERM_DEPOSIT', label: 'Term Deposit', riskWeight: 0 },
  { value: 'BUSINESS_LOAN', label: 'Business Loan', riskWeight: 5 },
  { value: 'OVERDRAFT', label: 'Overdraft Facility', riskWeight: 5 },
  { value: 'FOREIGN_EXCHANGE', label: 'Foreign Exchange Services', riskWeight: 10 },
  { value: 'TRADE_FINANCE', label: 'Trade Finance', riskWeight: 10 },
  { value: 'MERCHANT_SERVICES', label: 'Merchant Services', riskWeight: 5 },
  { value: 'INTERNATIONAL_PAYMENTS', label: 'International Payments', riskWeight: 10 },
];

const FATF_HIGH_RISK_JURISDICTIONS = [
  {
    countryCode: 'KP',
    countryName: "Democratic People's Republic of Korea (North Korea)",
    riskLevel: 'HIGH',
    fatfStatus: 'Call for action',
  },
  {
    countryCode: 'IR',
    countryName: 'Iran',
    riskLevel: 'HIGH',
    fatfStatus: 'Call for action',
  },
  {
    countryCode: 'MM',
    countryName: 'Myanmar',
    riskLevel: 'HIGH',
    fatfStatus: 'Enhanced monitoring',
  },
];

const FATF_MEMBER_COUNTRIES = [
  'AU', 'AT', 'BE', 'BR', 'CA', 'CN', 'DK', 'FI', 'FR', 'DE',
  'GR', 'HK', 'IS', 'IN', 'IE', 'IL', 'IT', 'JP', 'KR', 'LU',
  'MY', 'MX', 'NL', 'NZ', 'NO', 'PT', 'RU', 'SA', 'SG', 'ZA',
  'ES', 'SE', 'CH', 'TR', 'GB', 'US',
];

/**
 * GET /api/v1/reference/entity-types
 * Get available entity types
 */
router.get(
  '/entity-types',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: { entityTypes: ENTITY_TYPES },
    });
  })
);

/**
 * GET /api/v1/reference/document-types
 * Get document types by category
 */
router.get(
  '/document-types',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: { documentTypes: DOCUMENT_TYPES },
    });
  })
);

/**
 * GET /api/v1/reference/products
 * Get available products
 */
router.get(
  '/products',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: { products: PRODUCTS },
    });
  })
);

/**
 * GET /api/v1/reference/countries
 * Get country list with risk levels
 */
router.get(
  '/countries',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const countries = await prisma.country.findMany({
      orderBy: { countryName: 'asc' },
    });

    res.json({
      success: true,
      data: { countries },
    });
  })
);

/**
 * GET /api/v1/reference/fatf-jurisdictions
 * Get FATF high-risk jurisdictions
 */
router.get(
  '/fatf-jurisdictions',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    res.json({
      success: true,
      data: {
        highRiskJurisdictions: FATF_HIGH_RISK_JURISDICTIONS,
        memberCountries: FATF_MEMBER_COUNTRIES,
      },
    });
  })
);

/**
 * GET /api/v1/reference/cdd-requirements
 * Get CDD requirements by level
 */
router.get(
  '/cdd-requirements',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const requirements = {
      SIMPLIFIED: {
        level: 'Simplified CDD',
        legalReference: 'Section 18, AML/CFT Act 2009',
        requirements: [
          'Obtain basic identity information',
          'Verify entity registration status',
          'Obtain nature and purpose of business relationship',
        ],
        eligibleEntities: [
          'Listed issuer on NZX or approved overseas exchange',
          'NZ public service agency',
          'NZ local authority',
          'NZ state enterprise',
          'NZ government department',
          'Overseas government body (FATF member country)',
        ],
      },
      STANDARD: {
        level: 'Standard CDD',
        legalReference: 'Sections 14-17, AML/CFT Act 2009',
        requirements: [
          'Verify customer identity (Section 14)',
          'Identify and verify beneficial owners >25% (Section 15)',
          'Identify persons acting on behalf (Section 11)',
          'Obtain nature and purpose of business relationship (Section 16)',
          'Conduct risk assessment (Section 58)',
          'Obtain source of funds information',
        ],
        documents: [
          'Certificate of Incorporation',
          'Company Constitution/Trust Deed',
          'Register of Directors and Shareholders',
          'Board Resolution',
          'Beneficial Owner ID documents',
          'POABOC ID documents',
        ],
      },
      ENHANCED: {
        level: 'Enhanced CDD',
        legalReference: 'Section 22, AML/CFT Act 2009',
        additionalRequirements: [
          'Source of Wealth documentation (Section 22(2)(a))',
          'Source of Funds for specific transaction (Section 22(2)(b))',
          'Enhanced identity verification (AIVCOP 2013)',
          'Senior management approval',
          'Enhanced ongoing monitoring',
        ],
        triggers: [
          'High-risk country involvement (FATF list)',
          'Complex ownership structure (>3 layers)',
          'Nominee arrangements',
          'Politically Exposed Person (PEP) involvement',
          'Vehicle for holding personal assets',
          'Bearer shares',
          'Non-resident from insufficient AML/CFT country',
        ],
      },
    };

    res.json({
      success: true,
      data: { requirements },
    });
  })
);

/**
 * GET /api/v1/reference/risk-factors
 * Get risk factor categories and weights
 */
router.get(
  '/risk-factors',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const riskFactors = {
      entityRisk: {
        maxPoints: 30,
        factors: [
          { factor: 'Trust', points: 15, description: 'Entity type is Trust (higher risk)' },
          { factor: 'Foundation', points: 10, description: 'Entity type is Foundation' },
          { factor: 'Complex ownership (>3 layers)', points: 15, description: 'Multiple layers of ownership' },
          { factor: 'Moderate ownership complexity', points: 5, description: '2-3 layers of ownership' },
          { factor: 'Cash-intensive business', points: 10, description: 'Business deals primarily in cash' },
        ],
      },
      geographicRisk: {
        maxPoints: 30,
        factors: [
          { factor: 'FATF high-risk country', points: 30, description: 'Country on FATF high-risk list' },
          { factor: 'Medium-risk country', points: 15, description: 'Country with moderate AML/CFT concerns' },
          { factor: 'International operations', points: 5, description: 'Operations in multiple countries' },
        ],
      },
      productRisk: {
        maxPoints: 20,
        factors: [
          { factor: 'Foreign exchange services', points: 10, description: 'FX products requested' },
          { factor: 'Trade finance', points: 10, description: 'Trade finance products' },
          { factor: 'International payments', points: 10, description: 'Cross-border payment services' },
        ],
      },
      transactionRisk: {
        maxPoints: 20,
        factors: [
          { factor: 'High value (>$1M/month)', points: 15, description: 'Monthly value exceeds $1M NZD' },
          { factor: 'Elevated value ($500K-$1M/month)', points: 10, description: 'Monthly value $500K-$1M NZD' },
        ],
      },
      beneficialOwnerRisk: {
        maxPoints: 20,
        factors: [
          { factor: 'PEP involvement', points: 15, description: 'Politically exposed person involved' },
          { factor: 'Sanctions match', points: 20, description: 'Potential sanctions list match' },
          { factor: 'Adverse media', points: 10, description: 'Negative media coverage' },
        ],
      },
    };

    const ratingThresholds = {
      LOW: { min: 0, max: 39, description: 'Standard monitoring' },
      MEDIUM: { min: 40, max: 69, description: 'Team Manager approval, annual review' },
      HIGH: { min: 70, max: 99, description: 'Enhanced CDD, Compliance Officer approval, quarterly review' },
      PROHIBITED: { min: 100, max: 100, description: 'Account opening prohibited' },
    };

    res.json({
      success: true,
      data: { riskFactors, ratingThresholds },
    });
  })
);

/**
 * GET /api/v1/reference/verification-methods
 * Get AIVCOP 2013 verification methods
 */
router.get(
  '/verification-methods',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const verificationMethods = {
      standard: {
        name: 'Standard Verification',
        reference: 'AIVCOP 2013',
        methods: [
          {
            method: 'Government-issued photo ID',
            examples: ['NZ Passport', 'NZ Drivers Licence', 'NZ Firearms Licence'],
            requirements: 'Current and unexpired',
          },
          {
            method: 'Electronic verification',
            examples: ['DIA Identity Verification Service', 'Credit bureau check'],
            requirements: 'Match on key identifying data',
          },
        ],
      },
      enhanced: {
        name: 'Enhanced Verification',
        reference: 'AIVCOP 2013 + RBNZ Guidance',
        methods: [
          {
            method: 'Two forms of ID',
            examples: ['Passport + Drivers Licence', 'Passport + Bank Statement'],
            requirements: 'At least one government-issued photo ID',
          },
          {
            method: 'Certified copy',
            examples: ['Certified by lawyer', 'Certified by JP', 'Certified by accountant'],
            requirements: 'Certified within last 3 months',
          },
          {
            method: 'In-person verification',
            examples: ['Face-to-face meeting', 'Video verification'],
            requirements: 'Original documents sighted',
          },
        ],
      },
    };

    res.json({
      success: true,
      data: { verificationMethods },
    });
  })
);

export default router;
