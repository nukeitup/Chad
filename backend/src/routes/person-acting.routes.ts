import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Validation schemas
const createPOABOCSchema = z.object({
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
  // Role details
  roleTitle: z.string().min(1, 'Role title is required'),
  authorityDocumentType: z.string().optional(),
  authorityDocumentRef: z.string().optional(),
});

const updatePOABOCSchema = z.object({
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
  // Role details
  roleTitle: z.string().min(1).optional(),
  authorityDocumentType: z.string().optional(),
  authorityDocumentRef: z.string().optional(),
});

const verifyPOABOCSchema = z.object({
  verificationNotes: z.string().optional(),
});

/**
 * POST /api/v1/applications/:applicationId/persons-acting
 * Add a person acting on behalf to an application
 */
router.post(
  '/applications/:applicationId/persons-acting',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { applicationId } = req.params;
    const data = createPOABOCSchema.parse({
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
      throw new ApiError('Cannot add person acting on behalf to application in current state', 400);
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

    // Check if POABOC already exists for this application
    const existingPOABOC = await prisma.personActingOnBehalf.findUnique({
      where: {
        applicationId_personId: {
          applicationId,
          personId: person.id,
        },
      },
    });

    if (existingPOABOC) {
      throw new ApiError(
        'This person is already acting on behalf for this application',
        409
      );
    }

    // Create POABOC record
    const poaboc = await prisma.personActingOnBehalf.create({
      data: {
        applicationId,
        personId: person.id,
        roleTitle: data.roleTitle,
        authorityDocumentType: data.authorityDocumentType,
        authorityDocumentRef: data.authorityDocumentRef,
        verificationStatus: 'NOT_STARTED',
      },
      include: {
        person: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { personActingOnBehalf: poaboc },
      message: 'Person acting on behalf added successfully',
    });
  })
);

/**
 * GET /api/v1/persons-acting/:id
 * Get person acting on behalf by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const poaboc = await prisma.personActingOnBehalf.findUnique({
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

    if (!poaboc) {
      throw new ApiError('Person acting on behalf not found', 404);
    }

    res.json({
      success: true,
      data: { personActingOnBehalf: poaboc },
    });
  })
);

/**
 * PUT /api/v1/persons-acting/:id
 * Update person acting on behalf details
 */
router.put(
  '/:id',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const data = updatePOABOCSchema.parse(req.body);

    const poaboc = await prisma.personActingOnBehalf.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!poaboc) {
      throw new ApiError('Person acting on behalf not found', 404);
    }

    if (
      poaboc.application.workflowState !== 'DRAFT' &&
      poaboc.application.workflowState !== 'RETURNED'
    ) {
      throw new ApiError(
        'Cannot update person acting on behalf for application in current state',
        400
      );
    }

    // Update person details
    await prisma.person.update({
      where: { id: poaboc.personId },
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
      },
    });

    // Update POABOC record
    const updated = await prisma.personActingOnBehalf.update({
      where: { id },
      data: {
        roleTitle: data.roleTitle,
        authorityDocumentType: data.authorityDocumentType,
        authorityDocumentRef: data.authorityDocumentRef,
      },
      include: {
        person: true,
      },
    });

    res.json({
      success: true,
      data: { personActingOnBehalf: updated },
      message: 'Person acting on behalf updated successfully',
    });
  })
);

/**
 * POST /api/v1/persons-acting/:id/verify
 * Mark person acting on behalf as verified
 */
router.post(
  '/:id/verify',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { verificationNotes } = verifyPOABOCSchema.parse(req.body);

    const poaboc = await prisma.personActingOnBehalf.findUnique({
      where: { id },
      include: {
        person: true,
      },
    });

    if (!poaboc) {
      throw new ApiError('Person acting on behalf not found', 404);
    }

    // Validate that identity documents are present
    if (!poaboc.person.idDocumentType || !poaboc.person.idDocumentNumber) {
      throw new ApiError('Identity document details are required for verification', 400);
    }

    const updated = await prisma.personActingOnBehalf.update({
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
      data: { personActingOnBehalf: updated },
      message: 'Person acting on behalf verified successfully',
    });
  })
);

/**
 * DELETE /api/v1/persons-acting/:id
 * Remove person acting on behalf from application
 */
router.delete(
  '/:id',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const poaboc = await prisma.personActingOnBehalf.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!poaboc) {
      throw new ApiError('Person acting on behalf not found', 404);
    }

    if (
      poaboc.application.workflowState !== 'DRAFT' &&
      poaboc.application.workflowState !== 'RETURNED'
    ) {
      throw new ApiError(
        'Cannot remove person acting on behalf from application in current state',
        400
      );
    }

    await prisma.personActingOnBehalf.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Person acting on behalf removed successfully',
    });
  })
);

export default router;
