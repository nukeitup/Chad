// @ts-nocheck
import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Validation schemas
const createBeneficialOwnerSchema = z.object({
  applicationId: z.string().uuid('Invalid application ID'),
  // Person details
  fullName: z.string().min(1, 'Full name is required'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  nationality: z.string().optional(),
  residentialStreet: z.string().optional(),
  residentialCity: z.string().optional(),
  residentialPostcode: z.string().optional(),
  residentialCountry: z.string().optional(),
  // Ownership details
  ownershipBasis: z.array(
    z.enum(['ULTIMATE_OWNERSHIP', 'EFFECTIVE_CONTROL', 'PERSON_ON_WHOSE_BEHALF'])
  ),
  ownershipPercentage: z.number().min(0).max(100).optional(),
  indirectOwnershipPath: z.string().optional(),
  isNominee: z.boolean().default(false),
  nomineeForPersonId: z.string().uuid().optional(),
});

const updateBeneficialOwnerSchema = z.object({
  // Person details
  fullName: z.string().min(1).optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  dateOfBirth: z.string().datetime().optional(),
  nationality: z.string().optional(),
  residentialStreet: z.string().optional(),
  residentialCity: z.string().optional(),
  residentialPostcode: z.string().optional(),
  residentialCountry: z.string().optional(),
  // Identity document
  idDocumentType: z.string().optional(),
  idDocumentNumber: z.string().optional(),
  idDocumentExpiry: z.string().datetime().optional(),
  idDocumentCountry: z.string().optional(),
  // Ownership details
  ownershipBasis: z
    .array(z.enum(['ULTIMATE_OWNERSHIP', 'EFFECTIVE_CONTROL', 'PERSON_ON_WHOSE_BEHALF']))
    .optional(),
  ownershipPercentage: z.number().min(0).max(100).optional(),
  indirectOwnershipPath: z.string().optional(),
  isNominee: z.boolean().optional(),
  nomineeForPersonId: z.string().uuid().optional().nullable(),
  // Screening
  pepStatus: z
    .enum(['NOT_PEP', 'DOMESTIC_PEP', 'FOREIGN_PEP', 'INTERNATIONAL_ORG_PEP'])
    .optional(),
  pepDetails: z.string().optional(),
});

const verifyBeneficialOwnerSchema = z.object({
  verificationNotes: z.string().optional(),
});

/**
 * POST /api/v1/applications/:applicationId/beneficial-owners
 * Add a beneficial owner to an application
 */
router.post(
  '/applications/:applicationId/beneficial-owners',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { applicationId } = req.params;
    const data = createBeneficialOwnerSchema.parse({
      ...req.body,
      applicationId,
    });

    // Verify application exists and is editable
    const application = await prisma.cDDApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    if (application.workflowState !== 'DRAFT' && application.workflowState !== 'RETURNED') {
      throw new ApiError('Cannot add beneficial owner to application in current state', 400);
    }

    // Create or find person
    let person = await prisma.person.findFirst({
      where: {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
      },
    });

    if (!person) {
      person = await prisma.person.create({
        data: {
          fullName: data.fullName,
          firstName: data.firstName,
          lastName: data.lastName,
          dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
          nationality: data.nationality,
          residentialStreet: data.residentialStreet,
          residentialCity: data.residentialCity,
          residentialPostcode: data.residentialPostcode,
          residentialCountry: data.residentialCountry,
        },
      });
    }

    // Check if beneficial owner already exists for this application
    const existingBO = await prisma.beneficialOwner.findUnique({
      where: {
        applicationId_personId: {
          applicationId,
          personId: person.id,
        },
      },
    });

    if (existingBO) {
      throw new ApiError('This person is already a beneficial owner for this application', 409);
    }

    // Create beneficial owner record
    const beneficialOwner = await prisma.beneficialOwner.create({
      data: {
        applicationId,
        entityId: application.entityId,
        personId: person.id,
        ownershipBasis: data.ownershipBasis,
        ownershipPercentage: data.ownershipPercentage,
        indirectOwnershipPath: data.indirectOwnershipPath,
        isNominee: data.isNominee,
        nomineeForPersonId: data.nomineeForPersonId,
        verificationStatus: 'NOT_STARTED',
      },
      include: {
        person: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { beneficialOwner },
      message: 'Beneficial owner added successfully',
    });
  })
);

/**
 * GET /api/v1/beneficial-owners/:id
 * Get beneficial owner by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const beneficialOwner = await prisma.beneficialOwner.findUnique({
      where: { id },
      include: {
        person: true,
        application: {
          select: {
            id: true,
            applicationNumber: true,
            workflowState: true,
          },
        },
        documents: true,
        verifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!beneficialOwner) {
      throw new ApiError('Beneficial owner not found', 404);
    }

    res.json({
      success: true,
      data: { beneficialOwner },
    });
  })
);

/**
 * PUT /api/v1/beneficial-owners/:id
 * Update beneficial owner details
 */
router.put(
  '/:id',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const data = updateBeneficialOwnerSchema.parse(req.body);

    const beneficialOwner = await prisma.beneficialOwner.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!beneficialOwner) {
      throw new ApiError('Beneficial owner not found', 404);
    }

    if (
      beneficialOwner.application.workflowState !== 'DRAFT' &&
      beneficialOwner.application.workflowState !== 'RETURNED'
    ) {
      throw new ApiError('Cannot update beneficial owner for application in current state', 400);
    }

    // Update person details
    await prisma.person.update({
      where: { id: beneficialOwner.personId },
      data: {
        fullName: data.fullName,
        firstName: data.firstName,
        lastName: data.lastName,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : undefined,
        nationality: data.nationality,
        residentialStreet: data.residentialStreet,
        residentialCity: data.residentialCity,
        residentialPostcode: data.residentialPostcode,
        residentialCountry: data.residentialCountry,
        idDocumentType: data.idDocumentType,
        idDocumentNumber: data.idDocumentNumber,
        idDocumentExpiry: data.idDocumentExpiry ? new Date(data.idDocumentExpiry) : undefined,
        idDocumentCountry: data.idDocumentCountry,
        pepStatus: data.pepStatus,
        pepDetails: data.pepDetails,
      },
    });

    // Update beneficial owner record
    const updated = await prisma.beneficialOwner.update({
      where: { id },
      data: {
        ownershipBasis: data.ownershipBasis,
        ownershipPercentage: data.ownershipPercentage,
        indirectOwnershipPath: data.indirectOwnershipPath,
        isNominee: data.isNominee,
        nomineeForPersonId: data.nomineeForPersonId,
      },
      include: {
        person: true,
      },
    });

    res.json({
      success: true,
      data: { beneficialOwner: updated },
      message: 'Beneficial owner updated successfully',
    });
  })
);

/**
 * POST /api/v1/beneficial-owners/:id/verify
 * Mark beneficial owner as verified
 */
router.post(
  '/:id/verify',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { verificationNotes } = verifyBeneficialOwnerSchema.parse(req.body);

    const beneficialOwner = await prisma.beneficialOwner.findUnique({
      where: { id },
      include: {
        person: true,
      },
    });

    if (!beneficialOwner) {
      throw new ApiError('Beneficial owner not found', 404);
    }

    // Validate that identity documents are present
    if (
      !beneficialOwner.person.idDocumentType ||
      !beneficialOwner.person.idDocumentNumber
    ) {
      throw new ApiError('Identity document details are required for verification', 400);
    }

    const updated = await prisma.beneficialOwner.update({
      where: { id },
      data: {
        verificationStatus: 'VERIFIED',
        verifiedDate: new Date(),
        verifiedById: req.user!.id,
        verificationNotes,
      },
      include: {
        person: true,
        verifiedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: { beneficialOwner: updated },
      message: 'Beneficial owner verified successfully',
    });
  })
);

/**
 * DELETE /api/v1/beneficial-owners/:id
 * Remove beneficial owner from application
 */
router.delete(
  '/:id',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const beneficialOwner = await prisma.beneficialOwner.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!beneficialOwner) {
      throw new ApiError('Beneficial owner not found', 404);
    }

    if (
      beneficialOwner.application.workflowState !== 'DRAFT' &&
      beneficialOwner.application.workflowState !== 'RETURNED'
    ) {
      throw new ApiError('Cannot remove beneficial owner from application in current state', 400);
    }

    await prisma.beneficialOwner.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Beneficial owner removed successfully',
    });
  })
);

export default router;
