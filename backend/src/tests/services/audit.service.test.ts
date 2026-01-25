import { auditService } from '../../services/audit.service';
import prisma from '../../utils/prisma';

jest.mock('../../utils/prisma', () => ({
  auditLog: {
    create: jest.fn(),
  },
}));

describe('Audit Service', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create an audit log entry', async () => {
    const logData = {
      userId: 'test-user-id',
      actionType: 'TEST_ACTION',
      tableAffected: 'TestTable',
      recordIdAffected: 'test-record-id',
    };

    const expectedLog = {
      id: 'test-audit-id',
      ...logData,
      timestamp: new Date(),
      oldValue: null,
      newValue: null,
      ipAddress: null,
      sessionId: null,
      applicationId: null,
    };

    (prisma.auditLog.create as jest.Mock).mockResolvedValue(expectedLog);

    const result = await auditService.log(logData);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        ...logData,
        oldValue: undefined,
        newValue: undefined,
      },
    });
    expect(result).toEqual(expectedLog);
  });

  it('should stringify oldValue and newValue when provided', async () => {
    const logData = {
      userId: 'test-user-id',
      actionType: 'TEST_ACTION',
      tableAffected: 'TestTable',
      recordIdAffected: 'test-record-id',
      oldValue: { key: 'old' },
      newValue: { key: 'new' },
    };

    await auditService.log(logData);

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        ...logData,
        oldValue: JSON.stringify(logData.oldValue),
        newValue: JSON.stringify(logData.newValue),
      },
    });
  });
});
