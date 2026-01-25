import { Response } from 'express';
import axios from 'axios';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { AuthenticatedRequest } from '../types';
import { config } from '../config';

const NZBN_API_URL = 'https://api.business.govt.nz/services/v4/nzbn/entities';

/**
 * Search for an entity on the NZBN register.
 */
export const searchNzbn = asyncHandler(
  async (req: AuthenticatedRequest, res: Response) => {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      throw new ApiError('Search query "q" is required.', 400);
    }

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
        console.error('NZBN API Error:', error.response?.data);
        throw new ApiError(
          'Failed to fetch data from NZBN API.',
          error.response?.status || 500
        );
      }
      throw new ApiError('An unexpected error occurred while searching NZBN.', 500);
    }
  }
);
