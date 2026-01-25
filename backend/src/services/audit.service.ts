import prisma from '../utils/prisma';
import { User, AuditLog } from '../generated/prisma';

interface AuditLogData {
  userId: string;
  actionType: string;
  tableAffected: string;
  recordIdAffected: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  sessionId?: string;
  applicationId?: string;
}

export const auditService = {
  /**
   * Create a new audit log entry
   * @param data - The data for the audit log entry
   * @returns The created audit log entry
   */
  async log(data: AuditLogData): Promise<AuditLog> {
    const {
      userId,
      actionType,
      tableAffected,
      recordIdAffected,
      oldValue,
      newValue,
      ipAddress,
      sessionId,
      applicationId,
    } = data;

    return prisma.auditLog.create({
      data: {
        userId,
        actionType,
        tableAffected,
        recordIdAffected,
        oldValue: oldValue ? JSON.stringify(oldValue) : undefined,
        newValue: newValue ? JSON.stringify(newValue) : undefined,
        ipAddress,
        sessionId,
        applicationId,
      },
    });
  },
};
