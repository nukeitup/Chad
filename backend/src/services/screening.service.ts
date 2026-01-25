import { Person, PEPStatus } from '../generated/prisma';
import { config } from '../config';
import { mockDataService, MOCK_SCREENING_RESULTS } from './mock-data.service';

// This is a placeholder for a real screening API client.
// In production, this would involve making API calls to a third-party provider.

interface ScreeningResult {
  pepStatus: PEPStatus;
  pepDetails?: string;
  sanctionsScreeningResult: string;
  adverseMediaResult: string;
}

export const screeningService = {
  /**
   * Screens a person against Sanctions & PEP lists.
   * @param person - The person to be screened.
   * @returns The screening results.
   *
   * In test mode, returns deterministic results based on predefined test scenarios:
   * - John Smith, Mary Johnson, Sarah Williams, Robert Smith: Clear
   * - David Mitchell: Domestic PEP (Member of Parliament)
   * - Chen Wei: Foreign PEP (Former Deputy Minister, China)
   * - Ivan Petrov: Sanctions match
   */
  async screenPerson(
    person: Person
  ): Promise<ScreeningResult> {
    console.log(`Screening person: ${person.fullName}`);

    // In test mode, use deterministic mock data for consistent testing
    if (config.testMode) {
      // Simulate API latency (shorter in test mode)
      await new Promise(resolve => setTimeout(resolve, 500));

      const result = await mockDataService.screenPerson(person.fullName);

      console.log(`[TEST MODE] Screening complete for ${person.fullName}:`, result);

      return result as ScreeningResult;
    }

    // Production: Call actual screening API
    // Simulate API call to screening provider
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate different potential outcomes (for non-test environments without real API)
    const mockScenario = Math.random();
    let result: ScreeningResult;

    if (mockScenario < 0.8) {
      // 80% chance of being clear
      result = {
        pepStatus: 'NOT_PEP',
        sanctionsScreeningResult: 'Clear',
        adverseMediaResult: 'Clear',
      };
    } else if (mockScenario < 0.95) {
      // 15% chance of being a PEP
      result = {
        pepStatus: 'DOMESTIC_PEP',
        pepDetails: 'Member of Parliament, New Zealand',
        sanctionsScreeningResult: 'Clear',
        adverseMediaResult: 'Potential match found: News article regarding political donations.',
      };
    } else {
      // 5% chance of a sanctions match
      result = {
        pepStatus: 'NOT_PEP',
        sanctionsScreeningResult: 'Potential match found: UN Sanctions List (Ref: #12345)',
        adverseMediaResult: 'Clear',
      };
    }

    console.log(`Screening complete for ${person.fullName}:`, result);

    return result;
  },
};
