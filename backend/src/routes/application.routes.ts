// @ts-nocheck
import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { WorkflowState, CDDLevel, RiskRating } from '../generated/prisma';
import { auditService } from '../services/audit.service';
import { cddDeterminationService } from '../services/cdd-determination.service';
import { config } from '../config';
import { generateChecklist } from '../controllers/compliance.controller';
import { nzbnImportService } from '../services/nzbn-import.service';

const router = Router();

// Validation schemas
const createApplicationSchema = z.object({
  entityId: z.string().uuid('Invalid entity ID'),
  applicationType: z.enum(['NEW_CUSTOMER', 'EXISTING_UPLIFT']),
  cddLevel: z.enum(['SIMPLIFIED', 'STANDARD', 'ENHANCED']),
  cddLevelJustification: z.string().optional(),
});

const updateApplicationSchema = z.object({
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH', 'PROHIBITED']).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  riskRatingJustification: z.string().optional(),
  cddLevelJustification: z.string().optional(),
});

const returnApplicationSchema = z.object({
  returnedReason: z.string().min(1, 'Return reason is required'),
});

const rejectApplicationSchema = z.object({
  rejectedReason: z.string().min(1, 'Rejection reason is required'),
});

/**
 * Generate unique application number
 */
async function generateApplicationNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.cDDApplication.count({
    where: {
      applicationNumber: {
        startsWith: `A-${year}`,
      },
    },
  });
  const nextNumber = (count + 1).toString().padStart(4, '0');
  return `A-${year}-${nextNumber}`;
}

/**
 * POST /api/v1/applications
 * Create a new CDD application
 */
router.post(
  '/',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createApplicationSchema.parse(req.body);

    // Verify entity exists
    const entity = await prisma.entity.findUnique({
      where: { id: data.entityId },
    });

    if (!entity) {
      throw new ApiError('Entity not found', 404);
    }

    const applicationNumber = await generateApplicationNumber();

    const application = await prisma.cDDApplication.create({
      data: {
        applicationNumber,
        entityId: data.entityId,
        applicationType: data.applicationType,
        cddLevel: data.cddLevel,
        cddLevelJustification: data.cddLevelJustification,
        workflowState: 'DRAFT',
        assignedSpecialistId: req.user!.id,
      },
      include: {
        entity: true,
        assignedSpecialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await auditService.log({
      userId: req.user!.id,
      actionType: 'CREATE_APPLICATION',
      tableAffected: 'CDDApplication',
      recordIdAffected: application.id,
      newValue: application,
    });

    res.status(201).json({
      success: true,
      data: { application },
      message: 'Application created successfully',
    });
  })
);

/**
 * GET /api/v1/applications
 * List applications with filtering and pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as WorkflowState | undefined;
    const cddLevel = req.query.cddLevel as CDDLevel | undefined;
    const riskRating = req.query.riskRating as RiskRating | undefined;
    const assignedToMe = req.query.assignedToMe === 'true';
    const pendingApproval = req.query.pendingApproval === 'true';

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    if (status) {
      where.workflowState = status;
    }

    if (cddLevel) {
      where.cddLevel = cddLevel;
    }

    if (riskRating) {
      where.riskRating = riskRating;
    }

    if (assignedToMe) {
      where.assignedSpecialistId = req.user!.id;
    }

    if (pendingApproval) {
      where.workflowState = 'SUBMITTED';
      // Team managers see applications from their team
      if (req.user!.role === 'TEAM_MANAGER') {
        where.assignedApproverId = req.user!.id;
      }
    }

    const [applications, total] = await Promise.all([
      prisma.cDDApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
        include: {
          entity: {
            select: {
              id: true,
              legalName: true,
              entityType: true,
              nzbn: true,
              countryOfIncorporation: true,
            },
          },
          assignedSpecialist: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          assignedApprover: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      prisma.cDDApplication.count({ where }),
    ]);

    res.json({
      success: true,
      data: applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

/**
 * GET /api/v1/applications/:id
 * Get application by ID with full details
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const application = await prisma.cDDApplication.findUnique({
      where: { id },
      include: {
        entity: true,
        assignedSpecialist: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        assignedApprover: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        approvedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        beneficialOwners: {
          include: {
            person: true,
          },
        },
        personsActingOnBehalf: {
          include: {
            person: true,
          },
        },
        documents: true,
        cddTriggers: true,
        riskFactors: true,
      },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    res.json({
      success: true,
      data: { application },
    });
  })
);

/**
 * PUT /api/v1/applications/:id
 * Update application details
 */
router.put(
  '/:id',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const data = updateApplicationSchema.parse(req.body);

    const application = await prisma.cDDApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (application.workflowState !== 'DRAFT' && application.workflowState !== 'RETURNED') {
      throw new ApiError('Cannot update application in current state', 400);
    }

    const updated = await prisma.cDDApplication.update({
      where: { id },
      data,
      include: {
        entity: true,
      },
    });

    await auditService.log({
      userId: req.user!.id,
      actionType: 'UPDATE_APPLICATION',
      tableAffected: 'CDDApplication',
      recordIdAffected: application.id,
      oldValue: application,
      newValue: updated,
    });

    res.json({
      success: true,
      data: { application: updated },
      message: 'Application updated successfully',
    });
  })
);

/**
 * DELETE /api/v1/applications
 * Delete ALL applications (admin only - for demo reset)
 */
router.delete(
  '/',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const count = await prisma.cDDApplication.count();

    await prisma.cDDApplication.deleteMany({});

    await auditService.log({
      userId: req.user!.id,
      actionType: 'DELETE_APPLICATION',
      tableAffected: 'CDDApplication',
      recordIdAffected: 'ALL',
      newValue: { deletedCount: count },
    });

    res.json({
      success: true,
      message: `${count} application(s) deleted successfully`,
    });
  })
);

/**
 * DELETE /api/v1/applications/:id
 * Delete a draft application
 */
router.delete(
  '/:id',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const application = await prisma.cDDApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (application.workflowState !== 'DRAFT') {
      throw new ApiError('Only draft applications can be deleted', 400);
    }

    await prisma.cDDApplication.delete({
      where: { id },
    });

    await auditService.log({
      userId: req.user!.id,
      actionType: 'DELETE_APPLICATION',
      tableAffected: 'CDDApplication',
      recordIdAffected: application.id,
      oldValue: application,
    });

    res.json({
      success: true,
      message: 'Application deleted successfully',
    });
  })
);

/**
 * POST /api/v1/applications/:id/submit
 * Submit application for approval
 */
router.post(
  '/:id/submit',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const application = await prisma.cDDApplication.findUnique({
      where: { id },
      include: {
        beneficialOwners: true,
        personsActingOnBehalf: true,
        documents: true,
      },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (application.workflowState !== 'DRAFT' && application.workflowState !== 'RETURNED') {
      throw new ApiError('Application cannot be submitted in current state', 400);
    }

    // Validate application completeness
    const errors: string[] = [];

    // For Standard and Enhanced CDD, require beneficial owners and directors
    // For Simplified CDD, these requirements are relaxed per Section 18, AML/CFT Act 2009
    if (application.cddLevel !== 'SIMPLIFIED') {
      if (application.beneficialOwners.length === 0) {
        errors.push('At least one beneficial owner is required');
      }

      if (application.personsActingOnBehalf.length === 0) {
        errors.push('At least one person acting on behalf is required');
      }
    }

    if (!application.riskRating) {
      errors.push('Risk rating is required');
    }

    if (errors.length > 0) {
      throw new ApiError(`Application incomplete: ${errors.join(', ')}`, 400);
    }


    const updated = await prisma.cDDApplication.update({
      where: { id },
      data: {
        workflowState: 'SUBMITTED',
        submittedDate: new Date(),
      },
    });

    await auditService.log({
      userId: req.user!.id,
      actionType: 'SUBMIT_APPLICATION',
      tableAffected: 'CDDApplication',
      recordIdAffected: application.id,
      oldValue: application,
      newValue: updated,
    });

    res.json({
      success: true,
      data: { application: updated },
      message: 'Application submitted for approval',
    });
  })
);

/**
 * POST /api/v1/applications/:id/approve
 * Approve an application
 */
router.post(
  '/:id/approve',
  authenticate,
  authorize('TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
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
      },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (application.workflowState !== 'SUBMITTED' && application.workflowState !== 'UNDER_REVIEW') {
      throw new ApiError('Application cannot be approved in current state', 400);
    }

    const updated = await prisma.cDDApplication.update({
      where: { id },
      data: {
        workflowState: 'APPROVED',
        approvedDate: new Date(),
        approvedById: req.user!.id,
      },
    });

    await auditService.log({
      userId: req.user!.id,
      actionType: 'APPROVE_APPLICATION',
      tableAffected: 'CDDApplication',
      recordIdAffected: application.id,
      oldValue: application,
      newValue: updated,
    });

    res.json({
      success: true,
      data: { application: updated },
      message: 'Application approved successfully',
    });
  })
);

/**
 * POST /api/v1/applications/:id/return
 * Return application for corrections
 */
router.post(
  '/:id/return',
  authenticate,
  authorize('TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { returnedReason } = returnApplicationSchema.parse(req.body);

    const application = await prisma.cDDApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (application.workflowState !== 'SUBMITTED' && application.workflowState !== 'UNDER_REVIEW') {
      throw new ApiError('Application cannot be returned in current state', 400);
    }

    const updated = await prisma.cDDApplication.update({
      where: { id },
      data: {
        workflowState: 'RETURNED',
        returnedDate: new Date(),
        returnedReason,
      },
    });

    await auditService.log({
      userId: req.user!.id,
      actionType: 'RETURN_APPLICATION',
      tableAffected: 'CDDApplication',
      recordIdAffected: application.id,
      oldValue: application,
      newValue: updated,
    });

    res.json({
      success: true,
      data: { application: updated },
      message: 'Application returned for corrections',
    });
  })
);

/**
 * POST /api/v1/applications/:id/reject
 * Reject an application
 */
router.post(
  '/:id/reject',
  authenticate,
  authorize('TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { rejectedReason } = rejectApplicationSchema.parse(req.body);

    const application = await prisma.cDDApplication.findUnique({
      where: { id },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (application.workflowState !== 'SUBMITTED' && application.workflowState !== 'UNDER_REVIEW') {
      throw new ApiError('Application cannot be rejected in current state', 400);
    }

    const updated = await prisma.cDDApplication.update({
      where: { id },
      data: {
        workflowState: 'REJECTED',
        rejectedDate: new Date(),
        rejectedReason,
      },
    });

    await auditService.log({
      userId: req.user!.id,
      actionType: 'REJECT_APPLICATION',
      tableAffected: 'CDDApplication',
      recordIdAffected: application.id,
      oldValue: application,
      newValue: updated,
    });

    res.json({
      success: true,
      data: { application: updated },
      message: 'Application rejected',
    });
  })
);

/**
 * GET /api/v1/applications/stats/summary
 * Get application statistics
 */
router.get(
  '/stats/summary',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const [
      total,
      draft,
      submitted,
      underReview,
      approved,
      returned,
      rejected,
      lowRisk,
      mediumRisk,
      highRisk,
      prohibited,
      simplified,
      standard,
      enhanced,
    ] = await Promise.all([
      prisma.cDDApplication.count(),
      prisma.cDDApplication.count({ where: { workflowState: 'DRAFT' } }),
      prisma.cDDApplication.count({ where: { workflowState: 'SUBMITTED' } }),
      prisma.cDDApplication.count({ where: { workflowState: 'UNDER_REVIEW' } }),
      prisma.cDDApplication.count({ where: { workflowState: 'APPROVED' } }),
      prisma.cDDApplication.count({ where: { workflowState: 'RETURNED' } }),
      prisma.cDDApplication.count({ where: { workflowState: 'REJECTED' } }),
      prisma.cDDApplication.count({ where: { riskRating: 'LOW' } }),
      prisma.cDDApplication.count({ where: { riskRating: 'MEDIUM' } }),
      prisma.cDDApplication.count({ where: { riskRating: 'HIGH' } }),
      prisma.cDDApplication.count({ where: { riskRating: 'PROHIBITED' } }),
      prisma.cDDApplication.count({ where: { cddLevel: 'SIMPLIFIED' } }),
      prisma.cDDApplication.count({ where: { cddLevel: 'STANDARD' } }),
      prisma.cDDApplication.count({ where: { cddLevel: 'ENHANCED' } }),
    ]);

    res.json({
      success: true,
      data: {
        total,
        byStatus: {
          draft,
          submitted,
          underReview,
          approved,
          returned,
          rejected,
        },
        byRiskRating: {
          low: lowRisk,
          medium: mediumRisk,
          high: highRisk,
          prohibited,
        },
        byCDDLevel: {
          simplified,
          standard,
          enhanced,
        },
      },
    });
  })
);

/**
 * GET /api/v1/applications/:id/checklist
 * Generate compliance checklist for an application
 */
router.get(
  '/:id/checklist',
  authenticate,
  authorize('TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  generateChecklist
);

/**
 * POST /api/v1/applications/:id/import-nzbn
 * Import beneficial owners and persons acting on behalf from NZBN data
 *
 * Request body should contain:
 * - shareholders: Array of shareholder data
 * - directors: Array of director data
 */
const importNZBNSchema = z.object({
  shareholders: z.array(z.object({
    shareholderName: z.string(),
    shareholderType: z.enum(['Individual', 'Company']),
    numberOfShares: z.number(),
    totalShares: z.number().optional(),
    allocationDate: z.string(),
  })).optional().default([]),
  directors: z.array(z.object({
    directorNumber: z.string(),
    fullName: z.string(),
    appointmentDate: z.string(),
    residentialAddress: z.string().optional(),
  })).optional().default([]),
});

router.post(
  '/:id/import-nzbn',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const data = importNZBNSchema.parse(req.body);

    // Fetch application with entity
    const application = await prisma.cDDApplication.findUnique({
      where: { id },
      include: { entity: true },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (!application.entityId) {
      throw new ApiError('Application has no associated entity', 400);
    }

    if (application.workflowState !== 'DRAFT' && application.workflowState !== 'RETURNED') {
      throw new ApiError('Can only import NZBN data for draft or returned applications', 400);
    }

    // Import data from NZBN
    const result = await nzbnImportService.importAllFromNZBN(
      id,
      application.entityId,
      data.shareholders,
      data.directors
    );

    // Audit log
    await auditService.log({
      userId: req.user!.id,
      actionType: 'IMPORT_NZBN_DATA',
      tableAffected: 'CDDApplication',
      recordIdAffected: id,
      newValue: {
        beneficialOwnersCreated: result.beneficialOwnersCreated,
        personsActingCreated: result.personsActingCreated,
        corporateShareholdersFound: result.corporateShareholdersFound,
      },
    });

    res.json({
      success: result.success,
      data: {
        beneficialOwnersCreated: result.beneficialOwnersCreated,
        personsActingCreated: result.personsActingCreated,
        corporateShareholdersFound: result.corporateShareholdersFound,
        errors: result.errors,
      },
      message: result.success
        ? `Imported ${result.beneficialOwnersCreated} beneficial owners and ${result.personsActingCreated} persons acting on behalf`
        : 'Import completed with errors',
    });
  })
);

export default router;