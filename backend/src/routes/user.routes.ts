// @ts-nocheck
import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { asyncHandler, ApiError } from '../middleware/error.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { AuthenticatedRequest } from '../types';

const router = Router();

// Validation schemas
const updateUserSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  role: z.enum(['SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN']).optional(),
  isActive: z.boolean().optional(),
});

const createUserSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  role: z.enum(['SPECIALIST', 'TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN']),
});

/**
 * GET /api/v1/users
 * List all users (admin only)
 */
router.get(
  '/',
  authenticate,
  authorize('ADMIN', 'COMPLIANCE_OFFICER', 'TEAM_MANAGER'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string | undefined;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};
    if (role) where.role = role;
    if (isActive !== undefined) where.isActive = isActive;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  })
);

/**
 * GET /api/v1/users/specialists
 * Get list of specialists for assignment
 */
router.get(
  '/specialists',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const specialists = await prisma.user.findMany({
      where: {
        role: 'SPECIALIST',
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
      },
      orderBy: { lastName: 'asc' },
    });

    res.json({
      success: true,
      data: { specialists },
    });
  })
);

/**
 * GET /api/v1/users/approvers
 * Get list of approvers (Team Managers and above)
 */
router.get(
  '/approvers',
  authenticate,
  asyncHandler(async (_req: AuthenticatedRequest, res: Response) => {
    const approvers = await prisma.user.findMany({
      where: {
        role: { in: ['TEAM_MANAGER', 'COMPLIANCE_OFFICER', 'ADMIN'] },
        isActive: true,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
      },
      orderBy: { lastName: 'asc' },
    });

    res.json({
      success: true,
      data: { approvers },
    });
  })
);

/**
 * GET /api/v1/users/:id
 * Get user by ID
 */
router.get(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Users can only view their own profile unless admin
    if (req.user!.id !== id && !['ADMIN', 'COMPLIANCE_OFFICER'].includes(req.user!.role)) {
      throw new ApiError('Access denied', 403);
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            assignedApplications: true,
            approvedApplications: true,
          },
        },
      },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    res.json({
      success: true,
      data: { user },
    });
  })
);

/**
 * POST /api/v1/users
 * Create a new user (admin only)
 */
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const data = createUserSchema.parse(req.body);

    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ApiError('User with this email already exists', 409);
    }

    const passwordHash = await bcrypt.hash(data.password, 12);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    res.status(201).json({
      success: true,
      data: { user },
      message: 'User created successfully',
    });
  })
);

/**
 * PUT /api/v1/users/:id
 * Update user (admin only for role/status, users can update own name)
 */
router.put(
  '/:id',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const data = updateUserSchema.parse(req.body);

    // Check authorization
    const isAdmin = ['ADMIN', 'COMPLIANCE_OFFICER'].includes(req.user!.role);
    const isOwnProfile = req.user!.id === id;

    if (!isAdmin && !isOwnProfile) {
      throw new ApiError('Access denied', 403);
    }

    // Non-admins can only update their own name
    if (!isAdmin) {
      if (data.role !== undefined || data.isActive !== undefined) {
        throw new ApiError('Only administrators can change role or status', 403);
      }
    }

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new ApiError('User not found', 404);
    }

    const user = await prisma.user.update({
      where: { id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        isActive: data.isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: { user },
      message: 'User updated successfully',
    });
  })
);

/**
 * DELETE /api/v1/users/:id
 * Deactivate user (admin only)
 */
router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    // Prevent self-deactivation
    if (req.user!.id === id) {
      throw new ApiError('Cannot deactivate your own account', 400);
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new ApiError('User not found', 404);
    }

    // Soft delete - deactivate instead of hard delete
    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  })
);

export default router;
