import cron from 'node-cron';
import { cddRefreshService } from '../services/cdd-refresh.service';

/**
 * Schedules a cron job to identify and initiate CDD refresh workflows.
 * Runs once a week, for example every Sunday at 00:00.
 */
export const scheduleCddRefreshJob = () => {
  cron.schedule('0 0 * * SUN', async () => {
    console.log('Running scheduled CDD refresh job...');
    try {
      const applicationsToRefresh = await cddRefreshService.identifyCustomersForRefresh();
      for (const app of applicationsToRefresh) {
        await cddRefreshService.initiateRefreshWorkflow(app.id);
      }
      console.log('CDD refresh job completed successfully.');
    } catch (error) {
      console.error('Error during scheduled CDD refresh job:', error);
    }
  });

  console.log('CDD refresh job scheduled.');
};
