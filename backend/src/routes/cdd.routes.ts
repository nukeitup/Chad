/**
 * CDD Determination Routes
 *
 * API endpoints for automated CDD level determination and risk calculation.
 *
 * Endpoints:
 * - POST /api/v1/applications/:id/determine-cdd-level
 * - POST /api/v1/applications/:id/calculate-risk
 */

// @ts-nocheck
import { Router, Response } from 'express';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { cddDeterminationService } from '../services/cdd-determination.service';
import { auditService } from '../services/audit.service';

const router = Router();

/**
 * POST /api/v1/applications/:id/determine-cdd-level
 *
 * Automatically determines the appropriate CDD level for an application
 * based on entity characteristics and beneficial ownership structure.
 *
 * Returns:
 * - CDD Level (SIMPLIFIED, STANDARD, or ENHANCED)
 * - Justification with legal references
 * - List of requirements for the determined level
 * - Assessment details (Simplified eligibility, Enhanced triggers)
 */
router.post(
  '/:id/determine-cdd-level',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Fetch application with entity and beneficial owners
    const application = await prisma.cDDApplication.findUnique({
      where: { id },
      include: {
        entity: true,
        beneficialOwners: {
          include: {
            person: true,
          },
        },
      },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (!application.entity) {
      throw new ApiError('Application has no associated entity', 400);
    }

    // Extract risk factors from request body (optional)
    const riskFactors = req.body?.riskFactors || {};

    // Determine CDD level
    const determination = await cddDeterminationService.determineCDDLevel(
      application.entity,
      application.beneficialOwners,
      riskFactors
    );

    // Update application with determined CDD level
    const updated = await prisma.cDDApplication.update({
      where: { id },
      data: {
        cddLevel: determination.level,
        cddLevelJustification: determination.reason,
      },
    });

    // Store CDD triggers if Enhanced CDD
    if (determination.enhancedAssessment?.required) {
      // Delete existing triggers first
      await prisma.cDDTrigger.deleteMany({
        where: { applicationId: id },
      });

      // Create new triggers
      await prisma.cDDTrigger.createMany({
        data: determination.enhancedAssessment.triggers.map(trigger => ({
          applicationId: id,
          triggerType: trigger.triggerType,
          triggerDescription: trigger.description,
          legalReference: trigger.legalReference,
        })),
      });
    }

    // Audit log
    await auditService.log({
      userId: req.user!.id,
      actionType: 'DETERMINE_CDD_LEVEL',
      tableAffected: 'CDDApplication',
      recordIdAffected: id,
      oldValue: { cddLevel: application.cddLevel, cddLevelJustification: application.cddLevelJustification },
      newValue: { cddLevel: determination.level, cddLevelJustification: determination.reason },
    });

    res.json({
      success: true,
      data: {
        determination,
        application: updated,
      },
      message: `CDD level determined as ${determination.level}`,
    });
  })
);

/**
 * POST /api/v1/applications/:id/calculate-risk
 *
 * Calculates the overall risk rating for an application
 * based on entity characteristics, geographic factors, and beneficial owner screening.
 *
 * Risk factors are based on publicly available information only:
 * - Entity type and ownership complexity
 * - Geographic risk (FATF jurisdiction status)
 * - Beneficial owner PEP status, sanctions, and adverse media
 *
 * Returns:
 * - Risk Rating (LOW, MEDIUM, HIGH, or PROHIBITED)
 * - Risk Score (0-100)
 * - Risk Factors breakdown by category
 * - Justification and recommended actions
 */
router.post(
  '/:id/calculate-risk',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Fetch application with all necessary data
    const application = await prisma.cDDApplication.findUnique({
      where: { id },
      include: {
        entity: true,
        beneficialOwners: {
          include: {
            person: true,
          },
        },
      },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (!application.entity) {
      throw new ApiError('Application has no associated entity', 400);
    }

    // Calculate risk rating based on public data factors only
    const riskResult = await cddDeterminationService.calculateRiskRating(
      application.entity,
      application.beneficialOwners
    );

    // Update application with calculated risk
    const updated = await prisma.cDDApplication.update({
      where: { id },
      data: {
        riskRating: riskResult.rating,
        riskScore: riskResult.score,
        riskRatingJustification: riskResult.justification,
      },
    });

    // Store risk factors
    await prisma.riskFactor.deleteMany({
      where: { applicationId: id },
    });

    if (riskResult.factors.length > 0) {
      await prisma.riskFactor.createMany({
        data: riskResult.factors.map(factor => ({
          applicationId: id,
          factorCategory: factor.category,
          factorDescription: factor.description,
          riskPoints: factor.points,
        })),
      });
    }

    // Audit log
    await auditService.log({
      userId: req.user!.id,
      actionType: 'CALCULATE_RISK',
      tableAffected: 'CDDApplication',
      recordIdAffected: id,
      oldValue: {
        riskRating: application.riskRating,
        riskScore: application.riskScore,
        riskRatingJustification: application.riskRatingJustification,
      },
      newValue: {
        riskRating: riskResult.rating,
        riskScore: riskResult.score,
        riskRatingJustification: riskResult.justification,
      },
    });

    res.json({
      success: true,
      data: {
        riskRating: riskResult,
        application: updated,
      },
      message: `Risk rating calculated as ${riskResult.rating} (score: ${riskResult.score}/100)`,
    });
  })
);

/**
 * GET /api/v1/applications/:id/cdd-assessment
 *
 * Returns the complete CDD assessment for an application including:
 * - Current CDD level and justification
 * - CDD triggers (for Enhanced CDD)
 * - Risk factors breakdown
 * - Compliance requirements checklist
 */
router.get(
  '/:id/cdd-assessment',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const application = await prisma.cDDApplication.findUnique({
      where: { id },
      include: {
        entity: true,
        beneficialOwners: {
          include: {
            person: true,
          },
        },
        cddTriggers: true,
        riskFactors: true,
      },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    // Get requirements for current CDD level
    let requirements;
    switch (application.cddLevel) {
      case 'SIMPLIFIED':
        requirements = cddDeterminationService.getSimplifiedCDDRequirements();
        break;
      case 'ENHANCED':
        requirements = cddDeterminationService.getEnhancedCDDRequirements();
        break;
      default:
        requirements = cddDeterminationService.getStandardCDDRequirements();
    }

    res.json({
      success: true,
      data: {
        applicationId: id,
        entityName: application.entity?.legalName,
        cddLevel: application.cddLevel,
        cddLevelJustification: application.cddLevelJustification,
        riskRating: application.riskRating,
        riskScore: application.riskScore,
        riskRatingJustification: application.riskRatingJustification,
        cddTriggers: application.cddTriggers,
        riskFactors: application.riskFactors,
        requirements,
      },
    });
  })
);

/**
 * GET /api/v1/cdd/mandatory-document-types
 *
 * Returns a list of mandatory document types for a given CDD level.
 * This respects the test mode setting for non-mandatory documents.
 */
router.get(
  '/mandatory-document-types',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { cddLevel } = req.query;

    if (!cddLevel || !['SIMPLIFIED', 'STANDARD', 'ENHANCED'].includes(cddLevel as string)) {
      throw new ApiError('Invalid or missing cddLevel query parameter', 400);
    }

    const mandatoryDocumentTypes = cddDeterminationService.getMandatoryEntityDocumentTypes(cddLevel as CDDLevel);

    res.json({
      success: true,
      data: { mandatoryDocumentTypes },
    });
  })
);

export default router;
