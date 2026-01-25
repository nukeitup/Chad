import { Person, PEPStatus } from '../generated/prisma';

// This is a placeholder for a real screening API client.
// In a real-world scenario, this would involve making API calls to a third-party provider.

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
   */
  async screenPerson(
    person: Person
  ): Promise<ScreeningResult> {
    console.log(`Screening person: ${person.fullName}`);

    // Simulate API call to screening provider
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate different potential outcomes
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
