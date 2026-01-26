/**
 * NZBN Import Service
 *
 * Provides functionality to auto-populate beneficial owners and persons
 * acting on behalf from NZBN (Companies Office) data including:
 * - Shareholders with >25% ownership
 * - Directors as persons acting on behalf
 *
 * References:
 * - Section 15, AML/CFT Act 2009 (Beneficial Owners)
 * - Section 11(1)(c), AML/CFT Act 2009 (Persons Acting on Behalf)
 */

import prisma from '../utils/prisma';
import { OwnershipBasis, VerificationStatus } from '../generated/prisma';

// ============================================================
// INTERFACES
// ============================================================

export interface ShareholderData {
  shareholderName: string;
  shareholderType: 'Individual' | 'Company';
  numberOfShares: number;
  totalShares?: number;
  allocationDate: string;
}

export interface DirectorData {
  directorNumber: string;
  fullName: string;
  appointmentDate: string;
  residentialAddress?: string;
}

export interface ImportResult {
  success: boolean;
  beneficialOwnersCreated: number;
  personsActingCreated: number;
  corporateShareholdersFound: string[];
  errors: string[];
}

// ============================================================
// SERVICE FUNCTIONS
// ============================================================

/**
 * Import beneficial owners from NZBN shareholder data
 *
 * Creates Person records and BeneficialOwner records for shareholders
 * meeting the >25% ownership threshold (Section 15, AML/CFT Act 2009)
 *
 * @param applicationId - The CDD application ID
 * @param entityId - The entity ID
 * @param shareholders - Array of shareholder data from NZBN
 * @returns ImportResult with counts and any errors
 */
export async function importBeneficialOwnersFromShareholders(
  applicationId: string,
  entityId: string,
  shareholders: ShareholderData[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    beneficialOwnersCreated: 0,
    personsActingCreated: 0,
    corporateShareholdersFound: [],
    errors: [],
  };

  // Calculate total shares if not provided
  const totalShares = shareholders.reduce((sum, s) => sum + s.numberOfShares, 0);

  for (const shareholder of shareholders) {
    try {
      // Calculate ownership percentage
      const shareholderTotal = shareholder.totalShares || totalShares;
      const ownershipPercentage = (shareholder.numberOfShares / shareholderTotal) * 100;

      // Track corporate shareholders (they need further investigation)
      if (shareholder.shareholderType === 'Company') {
        result.corporateShareholdersFound.push(shareholder.shareholderName);

        // For corporate shareholders with >25%, still create a record
        // but mark that further investigation is needed
        if (ownershipPercentage >= 25) {
          // Create a placeholder person record for the corporate entity
          const person = await prisma.person.create({
            data: {
              fullName: shareholder.shareholderName,
              pepStatus: 'NOT_PEP',
            },
          });

          // Create beneficial owner record
          await prisma.beneficialOwner.create({
            data: {
              applicationId,
              entityId,
              personId: person.id,
              ownershipBasis: [OwnershipBasis.ULTIMATE_OWNERSHIP],
              ownershipPercentage: Math.round(ownershipPercentage * 100) / 100,
              indirectOwnershipPath: `Corporate shareholder - requires further investigation`,
              isNominee: false,
              verificationStatus: VerificationStatus.NOT_STARTED,
            },
          });

          result.beneficialOwnersCreated++;
        }
        continue;
      }

      // For individuals with >25% ownership, create beneficial owner records
      if (ownershipPercentage >= 25) {
        // Parse name into first/last if possible
        const nameParts = shareholder.shareholderName.split(' ');
        const firstName = nameParts.slice(0, -1).join(' ') || shareholder.shareholderName;
        const lastName = nameParts.slice(-1)[0] || '';

        // Check if person already exists in this application
        const existingBO = await prisma.beneficialOwner.findFirst({
          where: {
            applicationId,
            person: {
              fullName: shareholder.shareholderName,
            },
          },
        });

        if (existingBO) {
          // Update existing beneficial owner's ownership percentage
          await prisma.beneficialOwner.update({
            where: { id: existingBO.id },
            data: {
              ownershipPercentage: Math.round(ownershipPercentage * 100) / 100,
            },
          });
          continue;
        }

        // Create person record
        const person = await prisma.person.create({
          data: {
            fullName: shareholder.shareholderName,
            firstName,
            lastName,
            pepStatus: 'NOT_PEP',
          },
        });

        // Determine ownership basis
        const ownershipBasis: OwnershipBasis[] = [OwnershipBasis.ULTIMATE_OWNERSHIP];

        // Create beneficial owner record
        await prisma.beneficialOwner.create({
          data: {
            applicationId,
            entityId,
            personId: person.id,
            ownershipBasis,
            ownershipPercentage: Math.round(ownershipPercentage * 100) / 100,
            isNominee: false,
            verificationStatus: VerificationStatus.NOT_STARTED,
          },
        });

        result.beneficialOwnersCreated++;
      }
    } catch (error) {
      result.errors.push(
        `Failed to import shareholder ${shareholder.shareholderName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Import persons acting on behalf from NZBN director data
 *
 * Creates Person records and PersonActingOnBehalf records for directors
 * (Section 11(1)(c), AML/CFT Act 2009)
 *
 * @param applicationId - The CDD application ID
 * @param directors - Array of director data from NZBN
 * @returns ImportResult with counts and any errors
 */
export async function importPersonsActingFromDirectors(
  applicationId: string,
  directors: DirectorData[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    beneficialOwnersCreated: 0,
    personsActingCreated: 0,
    corporateShareholdersFound: [],
    errors: [],
  };

  for (const director of directors) {
    try {
      // Check if this is a corporate director (common in NZ)
      const isCorporateDirector =
        director.fullName.toLowerCase().includes('limited') ||
        director.fullName.toLowerCase().includes('ltd') ||
        director.fullName.toLowerCase().includes('company') ||
        director.fullName.toLowerCase().includes('trustee');

      if (isCorporateDirector) {
        result.corporateShareholdersFound.push(director.fullName);
        // Still create the record but note it's corporate
      }

      // Check if person already exists as POABOC in this application
      const existingPOABOC = await prisma.personActingOnBehalf.findFirst({
        where: {
          applicationId,
          person: {
            fullName: director.fullName,
          },
        },
      });

      if (existingPOABOC) {
        // Already exists, skip
        continue;
      }

      // Parse name into first/last if possible (and not corporate)
      let firstName = director.fullName;
      let lastName = '';
      if (!isCorporateDirector) {
        const nameParts = director.fullName.split(' ');
        firstName = nameParts.slice(0, -1).join(' ') || director.fullName;
        lastName = nameParts.slice(-1)[0] || '';
      }

      // Create person record
      const person = await prisma.person.create({
        data: {
          fullName: director.fullName,
          firstName,
          lastName,
          pepStatus: 'NOT_PEP',
        },
      });

      // Create person acting on behalf record
      await prisma.personActingOnBehalf.create({
        data: {
          applicationId,
          personId: person.id,
          roleTitle: 'Director',
          authorityDocumentType: 'Companies Office Registration',
          authorityDocumentRef: director.directorNumber,
          verificationStatus: VerificationStatus.NOT_STARTED,
        },
      });

      result.personsActingCreated++;
    } catch (error) {
      result.errors.push(
        `Failed to import director ${director.fullName}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  result.success = result.errors.length === 0;
  return result;
}

/**
 * Import all data from NZBN entity (shareholders and directors)
 *
 * Convenience function that imports both beneficial owners and
 * persons acting on behalf in a single transaction.
 *
 * @param applicationId - The CDD application ID
 * @param entityId - The entity ID
 * @param shareholders - Array of shareholder data from NZBN
 * @param directors - Array of director data from NZBN
 * @returns Combined ImportResult
 */
export async function importAllFromNZBN(
  applicationId: string,
  entityId: string,
  shareholders: ShareholderData[],
  directors: DirectorData[]
): Promise<ImportResult> {
  const result: ImportResult = {
    success: true,
    beneficialOwnersCreated: 0,
    personsActingCreated: 0,
    corporateShareholdersFound: [],
    errors: [],
  };

  // Import beneficial owners from shareholders
  const boResult = await importBeneficialOwnersFromShareholders(
    applicationId,
    entityId,
    shareholders
  );
  result.beneficialOwnersCreated = boResult.beneficialOwnersCreated;
  result.corporateShareholdersFound.push(...boResult.corporateShareholdersFound);
  result.errors.push(...boResult.errors);

  // Import persons acting on behalf from directors
  const poaResult = await importPersonsActingFromDirectors(applicationId, directors);
  result.personsActingCreated = poaResult.personsActingCreated;
  result.corporateShareholdersFound.push(
    ...poaResult.corporateShareholdersFound.filter(
      (name) => !result.corporateShareholdersFound.includes(name)
    )
  );
  result.errors.push(...poaResult.errors);

  result.success = result.errors.length === 0;
  return result;
}

// Export as named service
export const nzbnImportService = {
  importBeneficialOwnersFromShareholders,
  importPersonsActingFromDirectors,
  importAllFromNZBN,
};

export default nzbnImportService;
