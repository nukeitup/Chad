import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { config } from '../config';

const router = Router();

// Ensure upload directory exists
const uploadDir = path.resolve(config.upload.uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = [
    'application/pdf',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, JPEG, PNG, GIF, DOC, DOCX'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
  },
});

/**
 * POST /api/v1/applications/:applicationId/documents
 * Upload a document for an application
 */
router.post(
  '/applications/:applicationId/documents',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  upload.single('file'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { applicationId } = req.params;
    const { documentType, documentCategory, beneficialOwnerId, poabocId } = req.body;

    if (!req.file) {
      throw new ApiError('No file uploaded', 400);
    }

    // Verify application exists
    const application = await prisma.cDDApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      // Delete uploaded file
      fs.unlinkSync(req.file.path);
      throw new ApiError('Application not found', 404);
    }

    // Validate document category
    const validCategories = [
      'ENTITY_IDENTIFICATION',
      'BENEFICIAL_OWNER_ID',
      'POABOC_ID',
      'AUTHORITY_DOCUMENT',
      'SOURCE_OF_WEALTH',
      'SOURCE_OF_FUNDS',
      'OTHER',
    ];

    if (!validCategories.includes(documentCategory)) {
      fs.unlinkSync(req.file.path);
      throw new ApiError('Invalid document category', 400);
    }

    // Validate beneficial owner if specified
    if (beneficialOwnerId) {
      const bo = await prisma.beneficialOwner.findUnique({
        where: { id: beneficialOwnerId },
      });
      if (!bo || bo.applicationId !== applicationId) {
        fs.unlinkSync(req.file.path);
        throw new ApiError('Invalid beneficial owner ID', 400);
      }
    }

    // Validate POABOC if specified
    if (poabocId) {
      const poaboc = await prisma.personActingOnBehalf.findUnique({
        where: { id: poabocId },
      });
      if (!poaboc || poaboc.applicationId !== applicationId) {
        fs.unlinkSync(req.file.path);
        throw new ApiError('Invalid person acting on behalf ID', 400);
      }
    }

    const document = await prisma.document.create({
      data: {
        applicationId,
        beneficialOwnerId: beneficialOwnerId || null,
        poabocId: poabocId || null,
        documentType: documentType || 'Other',
        documentCategory,
        fileName: req.file.originalname,
        filePath: req.file.path,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
        uploadedById: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: { document },
      message: 'Document uploaded successfully',
    });
  })
);

/**
 * GET /api/v1/documents/:id
 * Get document metadata
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        application: {
          select: {
            id: true,
            applicationNumber: true,
          },
        },
      },
    });

    if (!document) {
      throw new ApiError('Document not found', 404);
    }

    res.json({
      success: true,
      data: { document },
    });
  })
);

/**
 * GET /api/v1/documents/:id/download
 * Download a document
 */
router.get(
  '/:id/download',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
    });

    if (!document) {
      throw new ApiError('Document not found', 404);
    }

    // Check if file exists
    if (!fs.existsSync(document.filePath)) {
      throw new ApiError('Document file not found on server', 404);
    }

    res.setHeader('Content-Type', document.fileType);
    res.setHeader('Content-Disposition', `attachment; filename="${document.fileName}"`);
    res.setHeader('Content-Length', document.fileSize.toString());

    const fileStream = fs.createReadStream(document.filePath);
    fileStream.pipe(res);
  })
);

/**
 * DELETE /api/v1/documents/:id
 * Delete a document
 */
router.delete(
  '/:id',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const document = await prisma.document.findUnique({
      where: { id },
      include: {
        application: true,
      },
    });

    if (!document) {
      throw new ApiError('Document not found', 404);
    }

    if (
      document.application.workflowState !== 'DRAFT' &&
      document.application.workflowState !== 'RETURNED'
    ) {
      throw new ApiError('Cannot delete document for application in current state', 400);
    }

    // Delete file from disk
    if (fs.existsSync(document.filePath)) {
      fs.unlinkSync(document.filePath);
    }

    // Delete database record
    await prisma.document.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  })
);

/**
 * GET /api/v1/applications/:applicationId/documents
 * List all documents for an application
 */
router.get(
  '/applications/:applicationId/documents',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { applicationId } = req.params;

    const documents = await prisma.document.findMany({
      where: { applicationId },
      include: {
        uploadedBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { uploadDate: 'desc' },
    });

    res.json({
      success: true,
      data: { documents },
    });
  })
);

export default router;
