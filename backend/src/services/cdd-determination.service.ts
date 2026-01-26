/**
 * CDD Determination Service
 *
 * Implements the automated CDD level determination logic based on:
 * - Section 18 (Simplified CDD) - AML/CFT Act 2009
 * - Sections 14-17 (Standard CDD) - AML/CFT Act 2009
 * - Section 22 (Enhanced CDD) - AML/CFT Act 2009
 *
 * This service analyzes entity characteristics to determine
 * the appropriate Customer Due Diligence level.
 */

import { Entity, BeneficialOwner, Person, CDDLevel } from '../generated/prisma';
import { mockDataService } from './mock-data.service';
import { config } from '../config';

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface SimplifiedCDDResult {
  eligible: boolean;
  reason: string;
  legalReference: string;
}

export interface EnhancedCDDTrigger {
  triggerType: string;
  description: string;
  legalReference: string;
}

export interface EnhancedCDDResult {
  required: boolean;
  triggers: EnhancedCDDTrigger[];
}

export interface CDDRequirement {
  code: string;
  description: string;
  legalReference: string;
  required: boolean;
}

export interface CDDDetermination {
  level: CDDLevel;
  reason: string;
  legalReferences: string[];
  requirements: CDDRequirement[];
  simplifiedAssessment?: SimplifiedCDDResult;
  enhancedAssessment?: EnhancedCDDResult;
}

export interface RiskFactor {
  category: 'entity' | 'geographic' | 'beneficialOwner';
  description: string;
  points: number;
}

export interface RiskRatingResult {
  rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';
  score: number;
  factors: RiskFactor[];
  justification: string;
}

// Entity types eligible for Simplified CDD
const SIMPLIFIED_CDD_ENTITY_TYPES = [
  'NZ_LISTED_ISSUER',
  'NZ_PUBLIC_SERVICE_AGENCY',
  'NZ_LOCAL_AUTHORITY',
  'NZ_STATE_ENTERPRISE',
  'NZ_GOVT_DEPARTMENT',
];

// ============================================================
// CDD DETERMINATION SERVICE
// ============================================================

export const cddDeterminationService = {
  /**
   * Determines the appropriate CDD level for an entity
   */
  async determineCDDLevel(
    entity: Entity,
    beneficialOwners: (BeneficialOwner & { person: Person })[],
    riskFactors?: {
      personalAssetVehicle?: boolean;
      bearerShares?: boolean;
      hasNominees?: boolean;
    }
  ): Promise<CDDDetermination> {
    // Step 1: Check for Simplified CDD eligibility
    const simplifiedResult = await this.checkSimplifiedCDDEligibility(entity);

    if (simplifiedResult.eligible) {
      return {
        level: 'SIMPLIFIED',
        reason: simplifiedResult.reason,
        legalReferences: [simplifiedResult.legalReference],
        requirements: this.getSimplifiedCDDRequirements(),
        simplifiedAssessment: simplifiedResult,
      };
    }

    // Step 2: Check for Enhanced CDD triggers
    const enhancedResult = await this.checkEnhancedCDDTriggers(
      entity,
      beneficialOwners,
      riskFactors
    );

    if (enhancedResult.required) {
      const legalRefs: string[] = Array.from(new Set(enhancedResult.triggers.map(t => t.legalReference)));
      return {
        level: 'ENHANCED',
        reason: enhancedResult.triggers.map(t => t.description).join('; '),
        legalReferences: legalRefs,
        requirements: this.getEnhancedCDDRequirements(),
        simplifiedAssessment: simplifiedResult,
        enhancedAssessment: enhancedResult,
      };
    }

    // Step 3: Default to Standard CDD
    return {
      level: 'STANDARD',
      reason: 'Entity does not meet Simplified CDD criteria and no Enhanced CDD triggers identified',
      legalReferences: ['Sections 14-17, AML/CFT Act 2009'],
      requirements: this.getStandardCDDRequirements(),
      simplifiedAssessment: simplifiedResult,
      enhancedAssessment: enhancedResult,
    };
  },

  /**
   * Checks if entity qualifies for Simplified CDD
   * Implements Section 18, AML/CFT Act 2009
   */
  async checkSimplifiedCDDEligibility(entity: Entity): Promise<SimplifiedCDDResult> {
    // Check NZ entity types eligible for Simplified CDD
    if (SIMPLIFIED_CDD_ENTITY_TYPES.includes(entity.entityType)) {
      const reasons: Record<string, { reason: string; ref: string }> = {
        NZ_LISTED_ISSUER: {
          reason: 'Listed Issuer on NZX',
          ref: 'Section 18(1)(a), AML/CFT Act 2009',
        },
        NZ_PUBLIC_SERVICE_AGENCY: {
          reason: 'NZ Public Service Agency',
          ref: 'Section 18(1)(b), AML/CFT Act 2009',
        },
        NZ_LOCAL_AUTHORITY: {
          reason: 'NZ Local Authority',
          ref: 'Section 18(1)(c), AML/CFT Act 2009',
        },
        NZ_STATE_ENTERPRISE: {
          reason: 'NZ State Enterprise',
          ref: 'Section 18(1)(d), AML/CFT Act 2009',
        },
        NZ_GOVT_DEPARTMENT: {
          reason: 'NZ Government Department',
          ref: 'Section 18(1)(e), AML/CFT Act 2009',
        },
      };

      const match = reasons[entity.entityType];
      return {
        eligible: true,
        reason: match.reason,
        legalReference: match.ref,
      };
    }

    // Check if company is listed on NZX (via isListedIssuer flag)
    if (entity.isListedIssuer && entity.listedExchange === 'NZX') {
      return {
        eligible: true,
        reason: 'Listed Issuer on NZX',
        legalReference: 'Section 18(1)(a), AML/CFT Act 2009',
      };
    }

    // Check overseas government body from FATF member country
    if (
      entity.entityType === 'OVERSEAS_COMPANY' &&
      entity.countryOfIncorporation !== 'NZ'
    ) {
      // In test mode, use mock data
      const isFATFMember = config.testMode
        ? mockDataService.isFATFMemberCountry(entity.countryOfIncorporation)
        : false; // In production, call actual FATF service

      // Note: Would need additional flag to identify government bodies
      // For now, this is a placeholder for the logic
    }

    return {
      eligible: false,
      reason: 'Does not meet Simplified CDD criteria',
      legalReference: 'Standard CDD required per Sections 14-17, AML/CFT Act 2009',
    };
  },

  /**
   * Checks for Enhanced CDD triggers
   * Implements Section 22, AML/CFT Act 2009
   */
  async checkEnhancedCDDTriggers(
    entity: Entity,
    beneficialOwners: (BeneficialOwner & { person: Person })[],
    riskFactors?: {
      personalAssetVehicle?: boolean;
      bearerShares?: boolean;
      hasNominees?: boolean;
    }
  ): Promise<EnhancedCDDResult> {
    const triggers: EnhancedCDDTrigger[] = [];

    // 1. Check country risk (FATF high-risk jurisdiction)
    const countryRisk = config.testMode
      ? mockDataService.getCountryRisk(entity.countryOfIncorporation)
      : null;

    if (countryRisk?.isFATFHighRisk) {
      triggers.push({
        triggerType: 'HIGH_RISK_JURISDICTION',
        description: `Entity from FATF high-risk jurisdiction: ${countryRisk.countryName}`,
        legalReference: 'Section 22(1)(a), AML/CFT Act 2009',
      });
    }

    // 2. Check ownership complexity (>3 layers)
    const ownershipLayers = this.calculateOwnershipLayers(beneficialOwners);
    if (ownershipLayers > 3) {
      triggers.push({
        triggerType: 'COMPLEX_OWNERSHIP',
        description: `Complex ownership structure with ${ownershipLayers} layers detected`,
        legalReference: 'RBNZ Enhanced CDD Guideline (April 2024)',
      });
    }

    // 3. Check for nominee arrangements
    const hasNominees = riskFactors?.hasNominees ||
      beneficialOwners.some(bo => bo.isNominee);
    if (hasNominees) {
      triggers.push({
        triggerType: 'NOMINEE_ARRANGEMENT',
        description: 'Nominee shareholder or director arrangement present',
        legalReference: 'Regulation 12, AML/CFT Regulations 2011',
      });
    }

    // 4. Check for PEPs among beneficial owners
    const hasPEP = beneficialOwners.some(bo =>
      bo.person.pepStatus !== 'NOT_PEP'
    );
    if (hasPEP) {
      const pepTypes = beneficialOwners
        .filter(bo => bo.person.pepStatus !== 'NOT_PEP')
        .map(bo => `${bo.person.fullName} (${bo.person.pepStatus})`);
      triggers.push({
        triggerType: 'PEP_INVOLVEMENT',
        description: `Politically Exposed Person(s) involved: ${pepTypes.join(', ')}`,
        legalReference: 'Section 22(1)(d), AML/CFT Act 2009',
      });
    }

    // 5. Check if personal asset holding vehicle (trusts)
    if (entity.entityType === 'TRUST' || riskFactors?.personalAssetVehicle) {
      triggers.push({
        triggerType: 'PERSONAL_ASSET_VEHICLE',
        description: 'Entity is a vehicle for holding personal assets',
        legalReference: 'Section 22(1)(c), AML/CFT Act 2009',
      });
    }

    // 6. Check for bearer shares
    if (riskFactors?.bearerShares) {
      triggers.push({
        triggerType: 'BEARER_SHARES',
        description: 'Bearer shares identified in ownership structure',
        legalReference: 'RBNZ Enhanced CDD Guideline (April 2024)',
      });
    }

    // 7. Non-resident from country with insufficient AML/CFT systems
    if (!entity.nzbn && countryRisk?.riskLevel === 'HIGH' && !countryRisk.isFATFMember) {
      triggers.push({
        triggerType: 'INSUFFICIENT_AML_CFT',
        description: `Non-resident customer from country with insufficient AML/CFT systems: ${countryRisk.countryName}`,
        legalReference: 'Section 22(1)(f), AML/CFT Act 2009',
      });
    }

    return {
      required: triggers.length > 0,
      triggers,
    };
  },

  /**
   * Calculates the number of ownership layers in the structure
   */
  calculateOwnershipLayers(
    beneficialOwners: (BeneficialOwner & { person: Person })[]
  ): number {
    // Simple heuristic: check indirect ownership paths
    let maxLayers = 1;

    for (const bo of beneficialOwners) {
      if (bo.indirectOwnershipPath) {
        // Count separators in path (e.g., "Company A -> Company B -> Person" = 3 layers)
        const layers = (bo.indirectOwnershipPath.match(/->/g) || []).length + 1;
        maxLayers = Math.max(maxLayers, layers);
      }
    }

    return maxLayers;
  },

  /**
   * Returns Simplified CDD requirements
   */
  getSimplifiedCDDRequirements(): CDDRequirement[] {
    return [
      {
        code: 'SCDD-01',
        description: 'Confirm entity name and registration',
        legalReference: 'Section 18(2), AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'SCDD-02',
        description: 'Obtain evidence of listed issuer status or government body status',
        legalReference: 'Section 18(2), AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'SCDD-03',
        description: 'Document basis for Simplified CDD determination',
        legalReference: 'Section 18(3), AML/CFT Act 2009',
        required: true,
      },
    ];
  },

  /**
   * Returns Standard CDD requirements
   */
  getStandardCDDRequirements(): CDDRequirement[] {
    return [
      {
        code: 'CDD-01',
        description: 'Verify entity identity using reliable, independent source documents',
        legalReference: 'Section 14, AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'CDD-02',
        description: 'Obtain and verify information about beneficial owners (>25% ownership or effective control)',
        legalReference: 'Section 15, AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'CDD-03',
        description: 'Verify identity of all beneficial owners to AIVCOP 2013 standard',
        legalReference: 'Section 15, AML/CFT Act 2009; AIVCOP 2013',
        required: true,
      },
      {
        code: 'CDD-04',
        description: 'Identify and verify persons acting on behalf of the entity',
        legalReference: 'Section 11(1)(c), AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'CDD-05',
        description: 'Obtain information on nature and purpose of business relationship',
        legalReference: 'Section 16, AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'CDD-06',
        description: 'Conduct risk assessment and document risk rating',
        legalReference: 'Section 58, AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'CDD-07',
        description: 'Conduct ongoing CDD and monitoring',
        legalReference: 'Section 17, AML/CFT Act 2009',
        required: true,
      },
    ];
  },

  /**
   * Returns Enhanced CDD requirements
   */
  getEnhancedCDDRequirements(): CDDRequirement[] {
    return [
      // All Standard CDD requirements
      ...this.getStandardCDDRequirements(),
      // Enhanced CDD additional requirements
      {
        code: 'ECDD-01',
        description: 'Obtain Source of Wealth (origin of entire body of wealth)',
        legalReference: 'Section 22(2)(a), AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'ECDD-02',
        description: 'Obtain Source of Funds (origin of specific funds for transaction)',
        legalReference: 'Section 22(2)(b), AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'ECDD-03',
        description: 'Enhanced verification from additional independent, reliable sources',
        legalReference: 'AIVCOP 2013 Enhanced Verification Requirements',
        required: true,
      },
      {
        code: 'ECDD-04',
        description: 'Obtain Senior Management approval before establishing relationship',
        legalReference: 'Section 22(2)(c), AML/CFT Act 2009',
        required: true,
      },
      {
        code: 'ECDD-05',
        description: 'Establish enhanced ongoing monitoring procedures',
        legalReference: 'RBNZ Guidance: Ongoing CDD for high-risk customers',
        required: true,
      },
    ];
  },

  /**
   * Calculates overall risk rating based on public data factors only
   *
   * Risk factors (rescaled after removing product/transaction factors):
   * - Entity factors: 0-35 points
   * - Geographic factors: 0-35 points
   * - Beneficial owner factors: 0-30 points
   * Total: 0-100 points
   */
  async calculateRiskRating(
    entity: Entity,
    beneficialOwners: (BeneficialOwner & { person: Person })[]
  ): Promise<RiskRatingResult> {
    const factors: RiskFactor[] = [];
    let riskScore = 0;

    // ========================================
    // Entity Risk Factors (0-35 points)
    // ========================================

    // Entity type risk (rescaled from 0-15 to 0-20)
    if (entity.entityType === 'TRUST') {
      factors.push({ category: 'entity', description: 'Entity type: Trust (higher risk)', points: 20 });
      riskScore += 20;
    } else if (entity.entityType === 'FOUNDATION') {
      factors.push({ category: 'entity', description: 'Entity type: Foundation', points: 15 });
      riskScore += 15;
    } else if (entity.entityType === 'NZ_LIMITED_PARTNERSHIP') {
      factors.push({ category: 'entity', description: 'Entity type: Limited Partnership', points: 8 });
      riskScore += 8;
    }

    // Ownership complexity (rescaled from 0-15 to 0-15)
    const ownershipLayers = this.calculateOwnershipLayers(beneficialOwners);
    if (ownershipLayers > 3) {
      factors.push({ category: 'entity', description: `Complex ownership: ${ownershipLayers} layers`, points: 15 });
      riskScore += 15;
    } else if (ownershipLayers > 1) {
      factors.push({ category: 'entity', description: `Moderate ownership complexity: ${ownershipLayers} layers`, points: 8 });
      riskScore += 8;
    }

    // ========================================
    // Geographic Risk Factors (0-35 points)
    // ========================================

    const countryRisk = config.testMode
      ? mockDataService.getCountryRisk(entity.countryOfIncorporation)
      : { riskLevel: 'MEDIUM', isFATFHighRisk: false };

    if (countryRisk?.isFATFHighRisk) {
      factors.push({ category: 'geographic', description: 'FATF high-risk jurisdiction (call for action)', points: 35 });
      riskScore += 35;
    } else if (countryRisk?.riskLevel === 'HIGH') {
      factors.push({ category: 'geographic', description: 'High-risk jurisdiction', points: 25 });
      riskScore += 25;
    } else if (countryRisk?.riskLevel === 'MEDIUM') {
      factors.push({ category: 'geographic', description: 'Medium-risk jurisdiction', points: 12 });
      riskScore += 12;
    }

    // ========================================
    // Beneficial Owner Risk Factors (0-30 points)
    // ========================================

    // Check for sanctions matches
    const sanctionsMatch = beneficialOwners.some(
      bo => bo.person.sanctionsScreeningResult &&
            bo.person.sanctionsScreeningResult !== 'Clear'
    );
    if (sanctionsMatch) {
      // Potential sanctions match - PROHIBITED
      return {
        rating: 'PROHIBITED',
        score: 100,
        factors: [{ category: 'beneficialOwner', description: 'Sanctions list match detected', points: 100 }],
        justification: 'Account opening prohibited due to sanctions list match. Escalate to Compliance Officer immediately.',
      };
    }

    // Check for PEPs (rescaled from 15 to 18)
    const hasPEP = beneficialOwners.some(bo => bo.person.pepStatus !== 'NOT_PEP');
    if (hasPEP) {
      const pepDetails = beneficialOwners
        .filter(bo => bo.person.pepStatus !== 'NOT_PEP')
        .map(bo => `${bo.person.fullName}: ${bo.person.pepStatus}`)
        .join(', ');
      factors.push({ category: 'beneficialOwner', description: `PEP involvement: ${pepDetails}`, points: 18 });
      riskScore += 18;
    }

    // Check for adverse media (rescaled from 10 to 12)
    const hasAdverseMedia = beneficialOwners.some(
      bo => bo.person.adverseMediaResult &&
            bo.person.adverseMediaResult !== 'Clear'
    );
    if (hasAdverseMedia) {
      factors.push({ category: 'beneficialOwner', description: 'Adverse media matches found', points: 12 });
      riskScore += 12;
    }

    // ========================================
    // Determine Rating (adjusted thresholds)
    // ========================================

    let rating: 'LOW' | 'MEDIUM' | 'HIGH' | 'PROHIBITED';
    let justification: string;

    // Adjusted thresholds: LOW 0-35, MEDIUM 36-60, HIGH 61+
    if (riskScore >= 61) {
      rating = 'HIGH';
      justification = `High risk rating (score: ${riskScore}/100). Enhanced CDD and senior management approval required. Quarterly review trigger activated.`;
    } else if (riskScore >= 36) {
      rating = 'MEDIUM';
      justification = `Medium risk rating (score: ${riskScore}/100). Standard CDD procedures apply. Annual review trigger.`;
    } else {
      rating = 'LOW';
      justification = `Low risk rating (score: ${riskScore}/100). Standard CDD procedures apply. Biennial review trigger.`;
    }

    return {
      rating,
      score: riskScore,
      factors,
      justification,
    };
  },
};

export default cddDeterminationService;
