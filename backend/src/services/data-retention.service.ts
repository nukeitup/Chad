import prisma from '../utils/prisma';

export const dataRetentionService = {
  /**
   * Archives a record in the database.
   * This is a soft delete, setting isArchived to true and archivedAt to the current timestamp.
   * @param model - The Prisma model to archive (e.g., prisma.cDDApplication)
   * @param id - The ID of the record to archive
   * @returns The archived record
   */
  async archiveRecord(
    model: any, // Prisma model client
    id: string
  ): Promise<any> {
    console.log(`Archiving record ${id} from model ${model.name}`);

    const archivedRecord = await model.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
      },
    });

    console.log(`Record ${id} archived successfully.`);
    return archivedRecord;
  },

  /**
   * Retrieves an archived record from the database.
   * @param model - The Prisma model to retrieve from
   * @param id - The ID of the archived record
   * @returns The archived record
   */
  async retrieveArchivedRecord(
    model: any,
    id: string
  ): Promise<any | null> {
    console.log(`Retrieving archived record ${id} from model ${model.name}`);

    const record = await model.findUnique({
      where: { id, isArchived: true },
    });

    if (!record) {
      console.log(`Archived record ${id} not found.`);
    } else {
      console.log(`Archived record ${id} retrieved successfully.`);
    }
    return record;
  },

  /**
   * Purges (hard deletes) archived records older than a specified duration.
   * @param model - The Prisma model to purge from
   * @param olderThanDays - Records older than this many days will be purged
   * @returns The count of purged records
   */
  async purgeArchivedRecords(
    model: any,
    olderThanDays: number
  ): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    console.log(`Purging archived records from model ${model.name} older than ${olderThanDays} days (before ${cutoffDate.toISOString()})...`);

    const { count } = await model.deleteMany({
      where: {
        isArchived: true,
        archivedAt: { lte: cutoffDate },
      },
    });

    console.log(`Purged ${count} records from model ${model.name}.`);
    return count;
  },
};
