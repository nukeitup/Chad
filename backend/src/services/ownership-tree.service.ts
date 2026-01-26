/**
 * Ownership Tree Service
 *
 * Provides functionality to build and resolve recursive ownership trees
 * for entities, including:
 * - Recursive resolution of corporate shareholders through NZBN
 * - Indirect ownership percentage calculations
 * - Circular ownership detection
 * - Caching of ownership data
 *
 * References:
 * - Section 15, AML/CFT Act 2009 (Beneficial Owners)
 * - RBNZ Beneficial Ownership Guideline (April 2024)
 */

import prisma from '../utils/prisma';
import { mockDataService, MOCK_NZBN_ENTITIES } from './mock-data.service';
import { config } from '../config';

// ============================================================
// INTERFACES
// ============================================================

export interface OwnershipNode {
  id: string;
  name: string;
  type: 'entity' | 'individual';
  nzbn?: string;
  ownershipPercentage: number;
  indirectOwnershipPercentage?: number;
  isCircular?: boolean;
  maxDepthReached?: boolean;
  isBeneficialOwner?: boolean; // True if >25% direct or indirect
  children: OwnershipNode[];
  metadata?: {
    shareholderType?: string;
    allocationDate?: string;
    entityType?: string;
    entityStatus?: string;
  };
}

export interface OwnershipTreeResult {
  rootEntity: {
    id: string;
    name: string;
    nzbn?: string;
    entityType?: string;
  };
  tree: OwnershipNode[];
  beneficialOwners: OwnershipNode[];
  warnings: string[];
  circularOwnershipDetected: boolean;
  maxDepthReached: boolean;
  resolvedAt: Date;
}

interface ResolutionContext {
  visited: Set<string>;
  depth: number;
  maxDepth: number;
  warnings: string[];
  circularDetected: boolean;
  maxDepthReached: boolean;
}

// ============================================================
// CONSTANTS
// ============================================================

const DEFAULT_MAX_DEPTH = 10;
const BENEFICIAL_OWNER_THRESHOLD = 25; // 25% ownership threshold per AML/CFT Act
const CACHE_EXPIRY_HOURS = 24;

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

/**
 * Build ownership tree for an application
 *
 * Resolves the complete ownership structure starting from the application's
 * entity, recursively resolving corporate shareholders to find ultimate
 * beneficial owners.
 *
 * @param applicationId - The CDD application ID
 * @param maxDepth - Maximum depth for recursive resolution (default: 10)
 * @returns OwnershipTreeResult with full tree structure
 */
export async function buildOwnershipTree(
  applicationId: string,
  maxDepth: number = DEFAULT_MAX_DEPTH
): Promise<OwnershipTreeResult> {
  // Fetch application with entity
  const application = await prisma.cDDApplication.findUnique({
    where: { id: applicationId },
    include: {
      entity: true,
      beneficialOwners: {
        include: { person: true },
      },
    },
  });

  if (!application || !application.entity) {
    throw new Error('Application or entity not found');
  }

  const entity = application.entity;

  // Initialize result
  const result: OwnershipTreeResult = {
    rootEntity: {
      id: entity.id,
      name: entity.legalName,
      nzbn: entity.nzbn || undefined,
      entityType: entity.entityType,
    },
    tree: [],
    beneficialOwners: [],
    warnings: [],
    circularOwnershipDetected: false,
    maxDepthReached: false,
    resolvedAt: new Date(),
  };

  // If entity has NZBN, resolve ownership from Companies Office data
  if (entity.nzbn) {
    const context: ResolutionContext = {
      visited: new Set([entity.nzbn]),
      depth: 0,
      maxDepth,
      warnings: [],
      circularDetected: false,
      maxDepthReached: false,
    };

    result.tree = await resolveEntityOwners(entity.nzbn, 100, context);
    result.warnings = context.warnings;
    result.circularOwnershipDetected = context.circularDetected;
    result.maxDepthReached = context.maxDepthReached;

    // Calculate indirect ownership and identify beneficial owners
    calculateIndirectOwnership(result.tree, 100);

    // Extract beneficial owners (>25% direct or indirect)
    result.beneficialOwners = extractBeneficialOwners(result.tree);
  } else {
    // For entities without NZBN, use existing beneficial owners from application
    result.tree = application.beneficialOwners.map((bo) => {
      const ownershipPct = bo.ownershipPercentage ? Number(bo.ownershipPercentage) : 0;
      return {
        id: bo.id,
        name: bo.person?.fullName || 'Unknown',
        type: 'individual' as const,
        ownershipPercentage: ownershipPct,
        indirectOwnershipPercentage: ownershipPct,
        isBeneficialOwner: ownershipPct >= BENEFICIAL_OWNER_THRESHOLD,
        children: [],
      };
    });
    result.beneficialOwners = result.tree.filter((n) => n.isBeneficialOwner);
    result.warnings.push('Entity has no NZBN - using manually entered beneficial owners');
  }

  // Cache the result
  await cacheOwnershipTree(entity.nzbn || applicationId, result);

  return result;
}

/**
 * Recursively resolve entity owners from NZBN data
 *
 * @param nzbn - The NZBN to resolve
 * @param parentOwnership - The ownership percentage of the parent
 * @param context - Resolution context for tracking visited nodes and depth
 * @returns Array of OwnershipNodes representing shareholders
 */
async function resolveEntityOwners(
  nzbn: string,
  parentOwnership: number,
  context: ResolutionContext
): Promise<OwnershipNode[]> {
  // Check depth limit
  if (context.depth >= context.maxDepth) {
    context.maxDepthReached = true;
    context.warnings.push(`Maximum depth (${context.maxDepth}) reached while resolving ${nzbn}`);
    return [];
  }

  // Get entity data (mock or real)
  let entityData;
  if (config.testMode) {
    entityData = MOCK_NZBN_ENTITIES[nzbn];
  } else {
    // In production, fetch from NZBN API
    // For now, fall back to mock data
    entityData = MOCK_NZBN_ENTITIES[nzbn];
  }

  if (!entityData) {
    context.warnings.push(`Could not resolve entity with NZBN ${nzbn}`);
    return [];
  }

  const shareholders = entityData.shareholders || [];
  const totalShares = shareholders.reduce((sum, s) => sum + s.numberOfShares, 0);

  const nodes: OwnershipNode[] = [];

  for (const shareholder of shareholders) {
    const shareholderTotal = shareholder.totalShares || totalShares;
    const ownershipPct = (shareholder.numberOfShares / shareholderTotal) * 100;

    const node: OwnershipNode = {
      id: `${nzbn}-${shareholder.shareholderName}`,
      name: shareholder.shareholderName,
      type: shareholder.shareholderType === 'Individual' ? 'individual' : 'entity',
      ownershipPercentage: Math.round(ownershipPct * 100) / 100,
      children: [],
      metadata: {
        shareholderType: shareholder.shareholderType,
        allocationDate: shareholder.allocationDate,
      },
    };

    // If corporate shareholder, try to resolve recursively
    if (shareholder.shareholderType === 'Company') {
      // Check if we have an NZBN for this corporate shareholder
      const corporateNzbn = findCorporateNzbn(shareholder.shareholderName);

      if (corporateNzbn) {
        // Check for circular ownership
        if (context.visited.has(corporateNzbn)) {
          node.isCircular = true;
          context.circularDetected = true;
          context.warnings.push(
            `Circular ownership detected: ${shareholder.shareholderName} (${corporateNzbn})`
          );
        } else {
          // Recursively resolve
          context.visited.add(corporateNzbn);
          context.depth++;

          node.nzbn = corporateNzbn;
          node.children = await resolveEntityOwners(corporateNzbn, ownershipPct, context);

          context.depth--;
        }
      } else {
        // Corporate shareholder without resolvable NZBN
        context.warnings.push(
          `Corporate shareholder "${shareholder.shareholderName}" has no resolvable NZBN - requires manual investigation`
        );
      }
    }

    nodes.push(node);
  }

  return nodes;
}

/**
 * Calculate indirect ownership percentages through the tree
 *
 * For each node, calculates the effective ownership by multiplying
 * through the ownership chain.
 *
 * @param nodes - Array of ownership nodes
 * @param parentEffectiveOwnership - The effective ownership at the parent level
 */
function calculateIndirectOwnership(
  nodes: OwnershipNode[],
  parentEffectiveOwnership: number
): void {
  for (const node of nodes) {
    // Calculate indirect ownership = (parent's effective %) * (this node's direct %)
    node.indirectOwnershipPercentage =
      Math.round((parentEffectiveOwnership * node.ownershipPercentage) / 100 * 100) / 100;

    // Mark as beneficial owner if indirect ownership >= threshold
    node.isBeneficialOwner =
      node.indirectOwnershipPercentage >= BENEFICIAL_OWNER_THRESHOLD;

    // Recursively calculate for children
    if (node.children.length > 0) {
      calculateIndirectOwnership(node.children, node.indirectOwnershipPercentage);
    }
  }
}

/**
 * Extract all beneficial owners (>25% indirect ownership) from the tree
 *
 * @param nodes - Array of ownership nodes
 * @returns Flat array of nodes that qualify as beneficial owners
 */
function extractBeneficialOwners(nodes: OwnershipNode[]): OwnershipNode[] {
  const beneficialOwners: OwnershipNode[] = [];

  function traverse(nodeList: OwnershipNode[]): void {
    for (const node of nodeList) {
      // Include individuals with >= 25% indirect ownership
      if (
        node.type === 'individual' &&
        node.indirectOwnershipPercentage &&
        node.indirectOwnershipPercentage >= BENEFICIAL_OWNER_THRESHOLD
      ) {
        beneficialOwners.push(node);
      }

      // Also include entities that couldn't be resolved (may contain BOs)
      if (
        node.type === 'entity' &&
        node.children.length === 0 &&
        !node.isCircular &&
        node.indirectOwnershipPercentage &&
        node.indirectOwnershipPercentage >= BENEFICIAL_OWNER_THRESHOLD
      ) {
        beneficialOwners.push(node);
      }

      // Traverse children
      if (node.children.length > 0) {
        traverse(node.children);
      }
    }
  }

  traverse(nodes);
  return beneficialOwners;
}

/**
 * Find NZBN for a corporate shareholder name
 *
 * Attempts to match the shareholder name to a known NZBN in our data.
 * In test mode, searches mock entities; in production, would query NZBN API.
 *
 * @param shareholderName - Name of the corporate shareholder
 * @returns NZBN if found, null otherwise
 */
function findCorporateNzbn(shareholderName: string): string | null {
  const normalizedName = shareholderName.toUpperCase();

  // Search mock entities for matching name
  for (const [nzbn, entity] of Object.entries(MOCK_NZBN_ENTITIES)) {
    if (
      entity.entityName.toUpperCase() === normalizedName ||
      (entity.tradingName && entity.tradingName.toUpperCase() === normalizedName)
    ) {
      return nzbn;
    }
  }

  return null;
}

/**
 * Cache the ownership tree result
 *
 * @param key - Cache key (NZBN or application ID)
 * @param result - The ownership tree result to cache
 */
async function cacheOwnershipTree(key: string, result: OwnershipTreeResult): Promise<void> {
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + CACHE_EXPIRY_HOURS);

  await prisma.ownershipCache.upsert({
    where: { nzbn: key },
    create: {
      nzbn: key,
      ownershipData: JSON.parse(JSON.stringify(result.tree)),
      resolvedTree: JSON.parse(JSON.stringify(result)),
      fetchedAt: new Date(),
      expiresAt,
    },
    update: {
      ownershipData: JSON.parse(JSON.stringify(result.tree)),
      resolvedTree: JSON.parse(JSON.stringify(result)),
      fetchedAt: new Date(),
      expiresAt,
    },
  });
}

/**
 * Get cached ownership tree if available and not expired
 *
 * @param key - Cache key (NZBN or application ID)
 * @returns Cached result or null if not found/expired
 */
export async function getCachedOwnershipTree(
  key: string
): Promise<OwnershipTreeResult | null> {
  const cached = await prisma.ownershipCache.findUnique({
    where: { nzbn: key },
  });

  if (!cached) {
    return null;
  }

  // Check if expired
  if (new Date() > cached.expiresAt) {
    // Delete expired cache
    await prisma.ownershipCache.delete({ where: { nzbn: key } });
    return null;
  }

  return cached.resolvedTree as unknown as OwnershipTreeResult;
}

/**
 * Refresh ownership tree (force rebuild ignoring cache)
 *
 * @param applicationId - The CDD application ID
 * @param maxDepth - Maximum depth for recursive resolution
 * @returns Fresh OwnershipTreeResult
 */
export async function refreshOwnershipTree(
  applicationId: string,
  maxDepth: number = DEFAULT_MAX_DEPTH
): Promise<OwnershipTreeResult> {
  // Simply rebuild - cacheOwnershipTree will update the cache
  return buildOwnershipTree(applicationId, maxDepth);
}

/**
 * Get shareholders for an entity by NZBN
 *
 * @param nzbn - The NZBN to look up
 * @returns Array of shareholder data
 */
export async function getEntityShareholders(nzbn: string): Promise<{
  entityName: string;
  shareholders: Array<{
    name: string;
    type: 'Individual' | 'Company';
    percentage: number;
    shares: number;
  }>;
}> {
  let entityData;

  if (config.testMode) {
    entityData = MOCK_NZBN_ENTITIES[nzbn];
  } else {
    // In production, fetch from NZBN API
    entityData = MOCK_NZBN_ENTITIES[nzbn];
  }

  if (!entityData) {
    throw new Error('Entity not found');
  }

  const totalShares = entityData.shareholders.reduce((sum, s) => sum + s.numberOfShares, 0);

  return {
    entityName: entityData.entityName,
    shareholders: entityData.shareholders.map((s) => ({
      name: s.shareholderName,
      type: s.shareholderType,
      percentage: Math.round((s.numberOfShares / (s.totalShares || totalShares)) * 100 * 100) / 100,
      shares: s.numberOfShares,
    })),
  };
}

// Export service object
export const ownershipTreeService = {
  buildOwnershipTree,
  getCachedOwnershipTree,
  refreshOwnershipTree,
  getEntityShareholders,
};

export default ownershipTreeService;
