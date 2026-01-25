import prisma from '../utils/prisma';

// In a real-world scenario, this data would be fetched from a reliable source,
// such as the official FATF website or a commercial data provider.
const MOCK_FATF_DATA = {
  highRisk: ['IRN', 'PRK', 'MMR'], // Iran, North Korea, Myanmar
  monitored: [
    'BGR', 'BFA', 'CMR', 'HRV', 'COD', 'HTI', 'JAM', 'KEN', 'MLI', 'MOZ', 'NAM', 'NGA', 'PHL',
    'SEN', 'ZAF', 'SSD', 'SYR', 'TZA', 'TUR', 'UGA', 'VNM', 'YEM'
  ],
};

export const fatfService = {
  /**
   * Fetches the latest FATF lists and updates the database.
   */
  async updateFatfLists(): Promise<void> {
    console.log('Starting FATF watchlist update...');

    // Reset current FATF flags
    await prisma.country.updateMany({
      data: {
        isFATFHighRisk: false,
        fatfStatus: null,
      },
    });

    // Update high-risk countries
    await prisma.country.updateMany({
      where: {
        countryCode: { in: MOCK_FATF_DATA.highRisk },
      },
      data: {
        isFATFHighRisk: true,
        fatfStatus: 'High-Risk Jurisdiction subject to a call for action',
      },
    });

    // Update monitored jurisdictions
    await prisma.country.updateMany({
      where: {
        countryCode: { in: MOCK_FATF_DATA.monitored },
      },
      data: {
        fatfStatus: 'Jurisdiction under increased monitoring',
      },
    });

    console.log('FATF watchlist update completed successfully.');
  },
};
