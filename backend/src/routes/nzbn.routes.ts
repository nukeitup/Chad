import { Router } from 'express';
import { searchNzbn, getEntityByNzbn } from '../controllers/nzbn.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * GET /api/v1/nzbn/search
 * Search for an entity on the NZBN register.
 * Requires authentication.
 * Query parameters:
 *  - q: The search query (company name, NZBN, or company number)
 */
router.get('/search', authenticate, searchNzbn);

/**
 * GET /api/v1/nzbn/:nzbn
 * Get full entity details by NZBN.
 * Includes shareholders, directors, ANZSIC classification, and simplified CDD eligibility.
 * Requires authentication.
 */
router.get('/:nzbn', authenticate, getEntityByNzbn);

export default router;
