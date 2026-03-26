import { Response } from 'express';
import axios from 'axios';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../types';
import { config } from '../config';
import { mockDataService, MOCK_NZBN_ENTITIES } from '../services/mock-data.service';

const NZBN_API_URL = 'https://api.business.govt.nz/gateway/nzbn/v5/entities';

/**
 * Search for an entity on the NZBN register.
 * In test mode, returns mock data without calling the real API.
 */
export const searchNzbn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new ApiError('Search query "q" is required.', 400);
    }

    // In test mode, use mock data
    if (config.testMode) {
      const mockResults = mockDataService.searchEntities(q);

      res.json({
        success: true,
        data: { items: mockResults },
        message: 'Test mode: Using mock NZBN data. Try searching for: ABC, Meridian, Auckland, KiwiRail, Pacific, Smith, Wellington, Civic',
      });
      return;
    }

    // Production: Call real NZBN API
    try {
      const response = await axios.get(NZBN_API_URL, {
        headers: {
          'Ocp-Apim-Subscription-Key': config.nzbn.apiKey,
        },
        params: {
          'search-term': q,
        },
      });

      res.json({
        success: true,
        data: response.data,
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error('NZBN API Error status:', error.response?.status);
        console.error('NZBN API Error data:', JSON.stringify(error.response?.data));
        console.error('NZBN API Request URL:', error.config?.url);
        console.error('NZBN API Request params:', JSON.stringify(error.config?.params));
        throw new ApiError(
          `NZBN API error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`,
          502
        );
      }
      throw new ApiError('An unexpected error occurred while searching NZBN.', 500);
    }
  }
);

/**
 * Get full entity details by NZBN.
 * Includes shareholders, directors, and ANZSIC classification.
 * In test mode, returns mock data without calling the real API.
 */
export const getEntityByNzbn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const nzbn = req.params.nzbn as string;

    if (!nzbn || !/^\d{13}$/.test(nzbn)) {
      throw new ApiError('Valid 13-digit NZBN is required.', 400);
    }

    // In test mode, use mock data
    if (config.testMode) {
      const mockEntity = MOCK_NZBN_ENTITIES[nzbn];

      if (!mockEntity) {
        throw new ApiError('Entity not found in test data.', 404);
      }

      // Transform mock entity to response format
      const response = {
        nzbn: mockEntity.nzbn,
        entityName: mockEntity.entityName,
        tradingName: mockEntity.tradingName,
        entityTypeCode: mockEntity.entityTypeCode,
        entityTypeName: mockEntity.entityTypeName,
        entityStatusCode: mockEntity.entityStatusCode,
        entityStatusDescription: mockEntity.entityStatusDescription,
        registrationDate: mockEntity.registrationDate,
        anzsicCode: mockEntity.anzsicCode,
        anzsicDescription: mockEntity.anzsicDescription,
        addresses: mockEntity.addresses,
        directors: mockEntity.directors,
        shareholders: mockEntity.shareholders,
        // Simplified CDD eligibility
        isListedIssuer: mockEntity.isListedIssuer || false,
        listedExchange: mockEntity.listedExchange,
        isGovernmentBody: mockEntity.isGovernmentBody || false,
        isLocalAuthority: mockEntity.isLocalAuthority || false,
        isStateEnterprise: mockEntity.isStateEnterprise || false,
      };

      res.json({
        success: true,
        data: response,
        message: 'Test mode: Using mock NZBN data.',
      });
      return;
    }

    // Production: Call real NZBN API
    try {
      const response = await axios.get(`${NZBN_API_URL}/${nzbn}`, {
        headers: {
          'Ocp-Apim-Subscription-Key': config.nzbn.apiKey,
        },
      });

      const d = response.data;
      const companyDetails = d['company-details'];
      const totalShares = companyDetails?.shareholding?.numberOfShares || 1;
      const shareAllocations = companyDetails?.shareholding?.shareAllocation || [];

      const shareholders = shareAllocations.flatMap((alloc: any) =>
        (alloc.shareholder || []).map((s: any) => {
          const isIndividual = !!s.individualShareholder;
          const name = isIndividual
            ? `${s.individualShareholder.firstName} ${s.individualShareholder.lastName}`.trim()
            : s.otherShareholder?.currentEntityName || '';
          return {
            shareholderName: name,
            shareholderType: isIndividual ? 'Individual' : 'Company',
            numberOfShares: alloc.allocation,
            totalShares,
            allocationDate: s.appointmentDate || '',
            shareholderNzbn: s.otherShareholder?.nzbn || undefined,
          };
        })
      );

      const directors = (d.roles || [])
        .filter((r: any) => r.roleType === 'Director' && r.roleStatus === 'ACTIVE')
        .map((r: any) => ({
          directorNumber: r.uniqueIdentifier ?? '',
          fullName: `${r.rolePerson?.firstName || ''} ${r.rolePerson?.lastName || ''}`.trim(),
          appointmentDate: r.startDate ?? '',
          residentialAddress: r.roleAddress?.[0]
            ? [r.roleAddress[0].address1, r.roleAddress[0].address3, r.roleAddress[0].postCode].filter(Boolean).join(', ')
            : undefined,
        }));

      res.json({
        success: true,
        data: {
          nzbn: d.nzbn,
          entityName: d.entityName,
          tradingName: d.tradingName,
          entityTypeCode: d.entityTypeCode,
          entityTypeName: d.entityTypeName,
          entityStatusCode: d.entityStatusCode,
          entityStatusDescription: d.entityStatusDescription,
          registrationDate: d.registrationDate,
          addresses: d.addresses,
          shareholders,
          directors,
        },
      });
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new ApiError('Entity not found.', 404);
        }
        console.error('NZBN API Error status:', error.response?.status);
        console.error('NZBN API Error data:', JSON.stringify(error.response?.data));
        throw new ApiError(
          `NZBN API error: ${error.response?.status} - ${JSON.stringify(error.response?.data)}`,
          502
        );
      }
      throw new ApiError('An unexpected error occurred while fetching entity details.', 500);
    }
  }
);
