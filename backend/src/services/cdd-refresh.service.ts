import prisma from '../utils/prisma';
import { CDDApplication, WorkflowState, RiskRating } from '../generated/prisma';

export const cddRefreshService = {
  /**
   * Identifies customers due for CDD refresh based on risk criteria and timeframes.
   * @returns A list of applications (customers) identified for refresh.
   */
  async identifyCustomersForRefresh(): Promise<CDDApplication[]> {
    console.log('Identifying customers due for CDD refresh...');

    const refreshTriggerDate = new Date();
    refreshTriggerDate.setFullYear(refreshTriggerDate.getFullYear() - 1); // 1 year since last approval/update

    // Criteria for refresh:
    // 1. Approved applications
    // 2. Risk rating is MEDIUM or HIGH
    // 3. Last approved date (or creation date if never approved) is older than 1 year for Medium risk
    // 4. Last approved date is older than 6 months for High risk
    // 5. Or, for Low risk, older than 3 years (not implemented in this mock, but could be added)

    const applicationsDueForRefresh = await prisma.cDDApplication.findMany({
      where: {
        workflowState: 'APPROVED',
        OR: [
          {
            riskRating: 'MEDIUM',
            approvedDate: { lte: refreshTriggerDate },
          },
          {
            riskRating: 'HIGH',
            approvedDate: {
              lte: new Date(refreshTriggerDate.setMonth(refreshTriggerDate.getMonth() - 6)), // 6 months ago
            },
          },
        ],
      },
      include: {
        entity: true,
      },
    });

    console.log(`Identified ${applicationsDueForRefresh.length} customers for CDD refresh.`);

    // In a real system, you might create new DRAFT applications or tasks here
    // For this mock, we'll just log them.
    applicationsDueForRefresh.forEach(app => {
      console.log(`- Application ${app.applicationNumber} (${app.entity.legalName}) is due for refresh. Risk: ${app.riskRating}`);
    });

    return applicationsDueForRefresh;
  },

  /**
   * Initiates a CDD refresh workflow for a given application.
   * In a real system, this might create a new application version or a specific task.
   * For this mock, we'll just log the action and change the status.
   * @param applicationId - The ID of the application to refresh.
   * @returns The updated application.
   */
  async initiateRefreshWorkflow(applicationId: string): Promise<CDDApplication> {
    console.log(`Initiating CDD refresh workflow for application ${applicationId}...`);

    const application = await prisma.cDDApplication.update({
      where: { id: applicationId },
      data: {
        workflowState: 'RETURNED', // Change state to 'RETURNED' to trigger review
        returnedReason: 'CDD Refresh required',
        // In a real system, would likely create a new DRAFT application linked to this one
      },
    });

    console.log(`CDD refresh workflow initiated for application ${applicationId}. Status set to RETURNED.`);
    return application;
  },
};
