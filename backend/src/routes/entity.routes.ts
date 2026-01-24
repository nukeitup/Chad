// @ts-nocheck
import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { config } from '../config';

const router = Router();

// Validation schemas
const createEntitySchema = z.object({
  entityType: z.enum([
    'NZ_COMPANY',
    'NZ_LIMITED_PARTNERSHIP',
    'NZ_LOCAL_AUTHORITY',
    'NZ_STATE_ENTERPRISE',
    'NZ_PUBLIC_SERVICE_AGENCY',
    'NZ_GOVT_DEPARTMENT',
    'NZ_LISTED_ISSUER',
    'OVERSEAS_COMPANY',
    'TRUST',
    'FOUNDATION',
  ]),
  legalName: z.string().min(1, 'Legal name is required'),
  tradingName: z.string().optional(),
  nzbn: z
    .string()
    .regex(/^\d{13}$/, 'NZBN must be 13 digits')
    .optional(),
  companyNumber: z.string().optional(),
  overseasRegistrationNumber: z.string().optional(),
  countryOfIncorporation: z.string().default('NZ'),
  incorporationDate: z.string().datetime().optional(),
  registeredStreet: z.string().optional(),
  registeredCity: z.string().optional(),
  registeredPostcode: z.string().optional(),
  registeredCountry: z.string().optional(),
  businessStreet: z.string().optional(),
  businessCity: z.string().optional(),
  businessPostcode: z.string().optional(),
  businessCountry: z.string().optional(),
  isListedIssuer: z.boolean().default(false),
  listedExchange: z.string().optional(),
});

const updateEntitySchema = createEntitySchema.partial();

/**
 * GET /api/v1/entities/search
 * Search NZ entities via NZBN API
 */
router.get(
  '/search',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const query = req.query.q as string;

    if (!query || query.length < 2) {
      throw new ApiError('Search query must be at least 2 characters', 400);
    }

    // In production, this would call the actual NZBN API
    // For development, we'll simulate a response
    if (config.nodeEnv === 'development') {
      // Simulated NZBN API response
      const mockResults = [
        {
          nzbn: '9429041561467',
          entityName: 'ABC TRADING LIMITED',
          entityTypeName: 'NZ Limited Company',
          entityStatusDescription: 'Registered',
          registrationDate: '2018-03-15',
        },
        {
          nzbn: '9429041561999',
          entityName: 'ABC TRADING COMPANY LIMITED',
          entityTypeName: 'NZ Limited Company',
          entityStatusDescription: 'Registered',
          registrationDate: '2019-05-20',
        },
      ].filter((e) => e.entityName.toLowerCase().includes(query.toLowerCase()));

      res.json({
        success: true,
        data: { results: mockResults },
        message: 'Development mode: Using mock NZBN data',
      });
      return;
    }

    // Production: Call actual NZBN API
    try {
      const response = await fetch(
        `${config.nzbn.apiUrl}/entities?search-term=${encodeURIComponent(query)}`,
        {
          headers: {
            'Ocp-Apim-Subscription-Key': config.nzbn.apiKey,
          },
        }
      );

      if (!response.ok) {
        throw new ApiError('NZBN API error', 502);
      }

      const data = await response.json();

      res.json({
        success: true,
        data: { results: data },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to search NZBN registry', 502);
    }
  })
);

/**
 * GET /api/v1/entities/nzbn/:nzbn
 * Lookup entity by NZBN
 */
router.get(
  '/nzbn/:nzbn',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { nzbn } = req.params;

    if (!/^\d{13}$/.test(nzbn)) {
      throw new ApiError('Invalid NZBN format. Must be 13 digits.', 400);
    }

    // Check if entity already exists in our database
    const existingEntity = await prisma.entity.findUnique({
      where: { nzbn },
    });

    if (existingEntity) {
      res.json({
        success: true,
        data: {
          entity: existingEntity,
          source: 'database',
        },
      });
      return;
    }

    // In production, fetch from NZBN API
    if (config.nodeEnv === 'development') {
      // Simulated NZBN entity data
      const mockEntity = {
        nzbn,
        entityName: 'ABC TRADING LIMITED',
        tradingName: 'ABC Trading',
        entityTypeCode: 'LTD',
        entityTypeName: 'NZ Limited Company',
        entityStatusCode: 'REGD',
        entityStatusDescription: 'Registered',
        registrationDate: '2018-03-15',
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
            allocationDate: '2018-03-15',
          },
          {
            shareholderName: 'Mary Johnson',
            shareholderType: 'Individual',
            numberOfShares: 450,
            allocationDate: '2018-03-15',
          },
        ],
      };

      res.json({
        success: true,
        data: {
          entity: mockEntity,
          source: 'nzbn_api',
        },
        message: 'Development mode: Using mock NZBN data',
      });
      return;
    }

    // Production: Call actual NZBN API
    try {
      const response = await fetch(`${config.nzbn.apiUrl}/entities/${nzbn}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': config.nzbn.apiKey,
        },
      });

      if (response.status === 404) {
        throw new ApiError('Entity not found in NZBN registry', 404);
      }

      if (!response.ok) {
        throw new ApiError('NZBN API error', 502);
      }

      const data = await response.json();

      res.json({
        success: true,
        data: {
          entity: data,
          source: 'nzbn_api',
        },
      });
    } catch (error) {
      if (error instanceof ApiError) throw error;
      throw new ApiError('Failed to fetch from NZBN registry', 502);
    }
  })
);

/**
 * POST /api/v1/entities
 * Create a new entity (for overseas entities or manual entry)
 */
router.post(
  '/',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createEntitySchema.parse(req.body);

    // Check if NZBN already exists
    if (data.nzbn) {
      const existing = await prisma.entity.findUnique({
        where: { nzbn: data.nzbn },
      });

      if (existing) {
        throw new ApiError('Entity with this NZBN already exists', 409);
      }
    }

    const entity = await prisma.entity.create({
      data: {
        ...data,
        incorporationDate: data.incorporationDate ? new Date(data.incorporationDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: { entity },
      message: 'Entity created successfully',
    });
  })
);

/**
 * POST /api/v1/entities/overseas
 * Create an overseas entity
 */
router.post(
  '/overseas',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createEntitySchema.parse({
      ...req.body,
      entityType: 'OVERSEAS_COMPANY',
    });

    if (data.countryOfIncorporation === 'NZ') {
      throw new ApiError('Overseas entities cannot be incorporated in NZ', 400);
    }

    const entity = await prisma.entity.create({
      data: {
        ...data,
        incorporationDate: data.incorporationDate ? new Date(data.incorporationDate) : null,
      },
    });

    res.status(201).json({
      success: true,
      data: { entity },
      message: 'Overseas entity created successfully',
    });
  })
);

/**
 * GET /api/v1/entities/:id
 * Get entity by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const entity = await prisma.entity.findUnique({
      where: { id },
      include: {
        applications: {
          select: {
            id: true,
            applicationNumber: true,
            workflowState: true,
            cddLevel: true,
            riskRating: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    });

    if (!entity) {
      throw new ApiError('Entity not found', 404);
    }

    res.json({
      success: true,
      data: { entity },
    });
  })
);

/**
 * PUT /api/v1/entities/:id
 * Update entity details
 */
router.put(
  '/:id',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const data = updateEntitySchema.parse(req.body);

    const existing = await prisma.entity.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new ApiError('Entity not found', 404);
    }

    const entity = await prisma.entity.update({
      where: { id },
      data: {
        ...data,
        incorporationDate: data.incorporationDate ? new Date(data.incorporationDate) : undefined,
      },
    });

    res.json({
      success: true,
      data: { entity },
      message: 'Entity updated successfully',
    });
  })
);

/**
 * GET /api/v1/entities
 * List all entities with pagination
 */
router.get(
  '/',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = req.query.search as string | undefined;
    const entityType = req.query.entityType as string | undefined;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { legalName: { contains: search, mode: 'insensitive' } },
        { tradingName: { contains: search, mode: 'insensitive' } },
        { nzbn: { contains: search } },
      ];
    }

    if (entityType) {
      where.entityType = entityType;
    }

    const [entities, total] = await Promise.all([
      prisma.entity.findMany({
        where,
        skip,
        take: limit,
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.entity.count({ where }),
    ]);

    res.json({
      success: true,
      data: entities,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

export default router;
