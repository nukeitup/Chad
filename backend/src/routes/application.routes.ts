import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { WorkflowState, CDDLevel, RiskRating } from '../generated/prisma';

const router = Router();

// Validation schemas
const createApplicationSchema = z.object({
  entityId: z.string().uuid('Invalid entity ID'),
  applicationType: z.enum(['NEW_CUSTOMER', 'EXISTING_UPLIFT']),
  cddLevel: z.enum(['SIMPLIFIED', 'STANDARD', 'ENHANCED']),
  cddLevelJustification: z.string().optional(),
});

const updateApplicationSchema = z.object({
  naturePurposeRelationship: z.string().optional(),
  anticipatedMonthlyVolume: z.number().int().positive().optional(),
  anticipatedMonthlyValue: z.number().positive().optional(),
  productsRequested: z.array(z.string()).optional(),
  sourceOfFunds: z.string().optional(),
  sourceOfWealth: z.string().optional(),
  riskRating: z.enum(['LOW', 'MEDIUM', 'HIGH', 'PROHIBITED']).optional(),
  riskScore: z.number().int().min(0).max(100).optional(),
  riskRatingJustification: z.string().optional(),
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
      data: {
        ...data,
        anticipatedMonthlyValue: data.anticipatedMonthlyValue
          ? data.anticipatedMonthlyValue
          : undefined,
      },
      include: {
        entity: true,
      },
    });

    res.json({
      success: true,
      data: { application: updated },
      message: 'Application updated successfully',
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

    if (!application.naturePurposeRelationship) {
      errors.push('Nature and purpose of relationship is required');
    }

    if (application.beneficialOwners.length === 0) {
      errors.push('At least one beneficial owner is required');
    }

    if (application.personsActingOnBehalf.length === 0) {
      errors.push('At least one person acting on behalf is required');
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

export default router;
