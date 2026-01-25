import { CDDApplication, Entity, Person } from '../generated/prisma';

// This is a placeholder for a real core banking API client.
// In a real-world scenario, this would involve making API calls to a core banking system.

interface CoreBankingCustomer {
  id: string;
  legalName: string;
  tradingName?: string;
  entityType: string;
  customerSince: Date;
}

export const coreBankingService = {
  /**
   * Creates a customer profile in the core banking system.
   * @param application - The approved CDD application.
   * @returns The created customer profile from the core banking system.
   */
  async createCustomer(
    application: CDDApplication & { entity: Entity; beneficialOwners: { person: Person }[] }
  ): Promise<CoreBankingCustomer> {
    console.log(`Creating customer in core banking system for: ${application.entity.legalName}`);

    // Simulate API call to core banking system
    await new Promise(resolve => setTimeout(resolve, 1000));

    const coreBankingId = `CUST-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;

    const customerProfile: CoreBankingCustomer = {
      id: coreBankingId,
      legalName: application.entity.legalName,
      tradingName: application.entity.tradingName || undefined,
      entityType: application.entity.entityType,
      customerSince: new Date(),
    };

    console.log(`Successfully created customer ${coreBankingId} for ${application.entity.legalName}`);

    return customerProfile;
  },
};
