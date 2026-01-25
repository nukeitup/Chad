import cron from 'node-cron';
import { fatfService } from '../services/fatf.service';

/**
 * Schedules a cron job to update the FATF watchlist every day at midnight.
 */
export const scheduleFatfUpdate = () => {
  cron.schedule('0 0 * * *', () => {
    console.log('Running scheduled FATF watchlist update...');
    fatfService.updateFatfLists().catch((error) => {
      console.error('Error during scheduled FATF update:', error);
    });
  });

  console.log('FATF watchlist update job scheduled.');
};
