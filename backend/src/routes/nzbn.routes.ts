import { Router } from 'express';
import { searchNzbn } from '../controllers/nzbn.controller';
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

export default router;
