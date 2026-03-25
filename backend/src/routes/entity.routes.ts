// @ts-nocheck
import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { config } from '../config';
import { mockDataService } from '../services/mock-data.service';

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

    // In test mode, use comprehensive mock data service
    if (config.testMode) {
      const mockResults = mockDataService.searchEntities(query);

      res.json({
        success: true,
        data: { results: mockResults },
        message: 'Test mode: Using mock NZBN data. Available test entities include: ABC TRADING, MERIDIAN ENERGY (NZX listed), AUCKLAND COUNCIL (Local Authority), KIWIRAIL (SOE), PACIFIC HOLDINGS (complex ownership), SMITH FAMILY TRUST, WELLINGTON VENTURES LP, CIVIC CONSULTANTS (PEP scenario)',
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

    let externalEntityData: any; // Data from NZBN API or mock service

    if (config.testMode) {
      // In test mode, use comprehensive mock data service
      let mockEntity = mockDataService.getEntityByNZBN(nzbn);

      if (!mockEntity) {
        // Return a generic mock for unknown NZBNs in test mode
        mockEntity = {
          nzbn,
          legalName: `TEST COMPANY ${nzbn.slice(-4)}`,
          entityType: 'NZ_COMPANY', // Default type for generic mock
          countryOfIncorporation: 'NZ',
          incorporationDate: '2020-01-01',
          entityStatus: 'ACTIVE', // Default status
          isListedIssuer: false,
          // Add other required fields for createEntitySchema or set as null/undefined
        };
      }
      externalEntityData = mockEntity;
    } else {
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
        externalEntityData = data;
      } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('Failed to fetch from NZBN registry', 502);
      }
    }

    // Map NZBN API v5 entityTypeCode to internal EntityType enum
    const entityTypeCodeMap: Record<string, string> = {
      'LTD':        'NZ_COMPANY',
      'UNLIM':      'NZ_COMPANY',
      'COOP':       'NZ_COMPANY',
      'LP':         'NZ_LIMITED_PARTNERSHIP',
      'GovtLocal':    'NZ_LOCAL_AUTHORITY',
      'GovtCentral':  'NZ_GOVT_DEPARTMENT',
      'GOVT':         'NZ_GOVT_DEPARTMENT',
      'SOE':          'NZ_STATE_ENTERPRISE',
      'T':          'TRUST',
      'FGNS':       'OVERSEAS_COMPANY',
      'I':          'NZ_COMPANY', // Incorporated Society — closest match
    };
    const resolvedEntityType = entityTypeCodeMap[externalEntityData.entityTypeCode] || 'NZ_COMPANY';

    // Map entityStatusCode to internal EntityStatus enum
    const entityStatusCodeMap: Record<string, string> = {
      '50': 'ACTIVE',
      '80': 'STRUCK_OFF',
      '70': 'STRUCK_OFF',
      '40': 'INACTIVE',
    };
    const resolvedEntityStatus = entityStatusCodeMap[externalEntityData.entityStatusCode] || 'ACTIVE';

    // Map external data to our internal Prisma Entity schema and create/update in DB
    const addressList: any[] = externalEntityData.addresses?.addressList || [];
    const registeredAddr = addressList.find((a: any) => a.addressType === 'REGISTERED');
    const serviceAddr = addressList.find((a: any) => a.addressType === 'SERVICE');
    const companyDetails = externalEntityData['company-details'];

    const entityToSave = {
      legalName: externalEntityData.entityName || externalEntityData.legalName,
      entityType: resolvedEntityType,
      nzbn: externalEntityData.nzbn,
      tradingName: externalEntityData.tradingNames?.[0]?.name || null,
      companyNumber: companyDetails?.sourceRegisterUniqueIdentifier || externalEntityData.nzbn,
      countryOfIncorporation: companyDetails?.countryOfOrigin || 'NZ',
      incorporationDate: externalEntityData.registrationDate ? new Date(externalEntityData.registrationDate) : null,
      entityStatus: resolvedEntityStatus,
      isListedIssuer: !!(companyDetails?.stockExchangeListed || companyDetails?.nzsxCode || companyDetails?.extensiveShareholding),
      listedExchange: companyDetails?.nzsxCode || (companyDetails?.extensiveShareholding ? 'NZX' : null),
      registeredStreet: registeredAddr?.address1 || null,
      registeredCity: registeredAddr?.address3 || null,
      registeredPostcode: registeredAddr?.postCode || null,
      registeredCountry: registeredAddr?.countryCode || null,
      businessStreet: serviceAddr?.address1 || null,
      businessCity: serviceAddr?.address3 || null,
      businessPostcode: serviceAddr?.postCode || null,
      businessCountry: serviceAddr?.countryCode || null,
    };

    // Ensure entityType is a valid enum member for Prisma
    if (!['NZ_COMPANY', 'NZ_LIMITED_PARTNERSHIP', 'NZ_LOCAL_AUTHORITY', 'NZ_STATE_ENTERPRISE', 'NZ_PUBLIC_SERVICE_AGENCY', 'NZ_GOVT_DEPARTMENT', 'NZ_LISTED_ISSUER', 'OVERSEAS_COMPANY', 'TRUST', 'FOUNDATION'].includes(entityToSave.entityType)) {
      entityToSave.entityType = 'NZ_COMPANY'; // Default to a valid type if conversion fails
    }
    if (!['ACTIVE', 'INACTIVE', 'STRUCK_OFF', 'LIQUIDATION'].includes(entityToSave.entityStatus)) {
      entityToSave.entityStatus = 'ACTIVE'; // Default to a valid status if conversion fails
    }


    let createdOrUpdatedEntity;
    try {
      createdOrUpdatedEntity = await prisma.entity.upsert({
        where: { nzbn: nzbn },
        update: entityToSave,
        create: entityToSave,
      });
    } catch (dbError: any) {
      console.error('Prisma upsert error:', dbError?.message);
      console.error('entityToSave:', JSON.stringify(entityToSave));
      throw new ApiError(`Database error: ${dbError?.message}`, 500);
    }

    res.json({
      success: true,
      data: {
        entity: createdOrUpdatedEntity,
        source: config.testMode ? 'mock_data' : 'nzbn_api_to_db',
      },
      message: 'Entity retrieved and stored/updated in database',
    });
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
