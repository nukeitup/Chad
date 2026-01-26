/**
 * Ownership Tree Routes
 *
 * API endpoints for ownership tree resolution and visualization.
 *
 * Endpoints:
 * - GET /api/v1/applications/:id/ownership-tree - Get ownership tree for application
 * - POST /api/v1/applications/:id/ownership-tree/refresh - Force refresh ownership tree
 * - GET /api/v1/entities/:nzbn/shareholders - Get shareholders for an entity
 */

// @ts-nocheck
import { Router, Response } from 'express';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';
import { ownershipTreeService } from '../services/ownership-tree.service';
import { auditService } from '../services/audit.service';
import prisma from '../utils/prisma';

const router = Router();

/**
 * GET /api/v1/applications/:id/ownership-tree
 *
 * Get the ownership tree for an application.
 * Returns cached data if available, otherwise builds fresh tree.
 *
 * Query parameters:
 * - maxDepth: Maximum recursion depth (default: 10, max: 20)
 * - refresh: Set to 'true' to force refresh
 */
router.get(
  '/applications/:id/ownership-tree',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const maxDepth = Math.min(parseInt(req.query.maxDepth as string) || 10, 20);
    const forceRefresh = req.query.refresh === 'true';

    // Verify application exists
    const application = await prisma.cDDApplication.findUnique({
      where: { id },
      include: { entity: true },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    // Check cache first (unless force refresh)
    if (!forceRefresh && application.entity?.nzbn) {
      const cached = await ownershipTreeService.getCachedOwnershipTree(
        application.entity.nzbn
      );
      if (cached) {
        res.json({
          success: true,
          data: cached,
          cached: true,
          message: 'Ownership tree retrieved from cache',
        });
        return;
      }
    }

    // Build ownership tree
    const result = await ownershipTreeService.buildOwnershipTree(id, maxDepth);

    // Audit log
    await auditService.log({
      userId: req.user!.id,
      actionType: 'VIEW_OWNERSHIP_TREE',
      tableAffected: 'CDDApplication',
      recordIdAffected: id,
      newValue: {
        beneficialOwnersCount: result.beneficialOwners.length,
        circularOwnershipDetected: result.circularOwnershipDetected,
        maxDepthReached: result.maxDepthReached,
        warningsCount: result.warnings.length,
      },
    });

    res.json({
      success: true,
      data: result,
      cached: false,
      message: result.warnings.length > 0
        ? `Ownership tree built with ${result.warnings.length} warning(s)`
        : 'Ownership tree built successfully',
    });
  })
);

/**
 * POST /api/v1/applications/:id/ownership-tree/refresh
 *
 * Force refresh the ownership tree for an application.
 * This will clear any cached data and rebuild from source.
 *
 * Request body (optional):
 * - maxDepth: Maximum recursion depth (default: 10, max: 20)
 */
router.post(
  '/applications/:id/ownership-tree/refresh',
  authenticate,
  authorize('SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const maxDepth = Math.min(req.body.maxDepth || 10, 20);

    // Verify application exists
    const application = await prisma.cDDApplication.findUnique({
      where: { id },
      include: { entity: true },
    });

    if (!application) {
      throw new ApiError('Application not found', 404);
    }

    // Force refresh ownership tree
    const result = await ownershipTreeService.refreshOwnershipTree(id, maxDepth);

    // Audit log
    await auditService.log({
      userId: req.user!.id,
      actionType: 'REFRESH_OWNERSHIP_TREE',
      tableAffected: 'CDDApplication',
      recordIdAffected: id,
      newValue: {
        beneficialOwnersCount: result.beneficialOwners.length,
        circularOwnershipDetected: result.circularOwnershipDetected,
        maxDepthReached: result.maxDepthReached,
        warningsCount: result.warnings.length,
      },
    });

    res.json({
      success: true,
      data: result,
      message: 'Ownership tree refreshed successfully',
    });
  })
);

/**
 * GET /api/v1/entities/:nzbn/shareholders
 *
 * Get shareholders for an entity by NZBN.
 * This is a simple lookup that doesn't resolve recursive ownership.
 */
router.get(
  '/entities/:nzbn/shareholders',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { nzbn } = req.params;

    // Validate NZBN format
    if (!/^\d{13}$/.test(nzbn)) {
      throw new ApiError('Invalid NZBN format. Must be 13 digits.', 400);
    }

    try {
      const result = await ownershipTreeService.getEntityShareholders(nzbn);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      if (error instanceof Error && error.message === 'Entity not found') {
        throw new ApiError('Entity not found', 404);
      }
      throw error;
    }
  })
);

export default router;
