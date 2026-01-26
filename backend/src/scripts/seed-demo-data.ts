/**
 * Demo Data Seeding Script
 *
 * This script populates the database with demo data for testing
 * the AML/CFT CDD application without requiring real API connections.
 *
 * Usage:
 *   npx ts-node src/scripts/seed-demo-data.ts
 *
 * Or add to package.json scripts:
 *   "seed:demo": "ts-node src/scripts/seed-demo-data.ts"
 */

import prisma from '../utils/prisma';
import bcrypt from 'bcryptjs';

async function seedDemoData() {
  console.log('Starting demo data seeding...\n');

  try {
    // ============================================================
    // 1. CREATE DEMO USERS
    // ============================================================
    console.log('Creating demo users...');

    const passwordHash = await bcrypt.hash('Demo123!', 12);

    const users = await Promise.all([
      prisma.user.upsert({
        where: { email: 'specialist@demo.com' },
        update: {},
        create: {
          email: 'specialist@demo.com',
          passwordHash,
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'SPECIALIST',
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'manager@demo.com' },
        update: {},
        create: {
          email: 'manager@demo.com',
          passwordHash,
          firstName: 'Michael',
          lastName: 'Brown',
          role: 'TEAM_MANAGER',
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'compliance@demo.com' },
        update: {},
        create: {
          email: 'compliance@demo.com',
          passwordHash,
          firstName: 'Sarah',
          lastName: 'Williams',
          role: 'COMPLIANCE_OFFICER',
          isActive: true,
        },
      }),
      prisma.user.upsert({
        where: { email: 'admin@demo.com' },
        update: {},
        create: {
          email: 'admin@demo.com',
          passwordHash,
          firstName: 'Admin',
          lastName: 'User',
          role: 'ADMIN',
          isActive: true,
        },
      }),
    ]);

    console.log(`  Created ${users.length} demo users`);

    // ============================================================
    // 2. CREATE DEMO ENTITIES
    // ============================================================
    console.log('Creating demo entities...');

    const entities = await Promise.all([
      // Standard CDD - Typical NZ Company
      prisma.entity.upsert({
        where: { nzbn: '9429041561467' },
        update: {},
        create: {
          entityType: 'NZ_COMPANY',
          legalName: 'ABC TRADING LIMITED',
          tradingName: 'ABC Trading',
          nzbn: '9429041561467',
          countryOfIncorporation: 'NZ',
          incorporationDate: new Date('2018-03-15'),
          entityStatus: 'ACTIVE',
          registeredStreet: '123 Queen Street, Level 5',
          registeredCity: 'Auckland',
          registeredPostcode: '1010',
          registeredCountry: 'NZ',
        },
      }),

      // Simplified CDD - NZX Listed
      prisma.entity.upsert({
        where: { nzbn: '9429041562000' },
        update: {},
        create: {
          entityType: 'NZ_COMPANY',
          legalName: 'MERIDIAN ENERGY LIMITED',
          nzbn: '9429041562000',
          countryOfIncorporation: 'NZ',
          incorporationDate: new Date('1998-07-01'),
          entityStatus: 'ACTIVE',
          isListedIssuer: true,
          listedExchange: 'NZX',
          registeredStreet: '33 Customhouse Quay, Level 12',
          registeredCity: 'Wellington',
          registeredPostcode: '6011',
          registeredCountry: 'NZ',
        },
      }),

      // Simplified CDD - Local Authority
      prisma.entity.upsert({
        where: { nzbn: '9429041563000' },
        update: {},
        create: {
          entityType: 'NZ_LOCAL_AUTHORITY',
          legalName: 'AUCKLAND COUNCIL',
          nzbn: '9429041563000',
          countryOfIncorporation: 'NZ',
          incorporationDate: new Date('2010-11-01'),
          entityStatus: 'ACTIVE',
          registeredStreet: '135 Albert Street',
          registeredCity: 'Auckland',
          registeredPostcode: '1010',
          registeredCountry: 'NZ',
        },
      }),

      // Enhanced CDD Scenario - Overseas High-Risk
      // For overseas entities, we first check if exists, then create if not
      (async () => {
        const existing = await prisma.entity.findFirst({
          where: { legalName: 'GLOBAL INVESTMENTS TRUST' },
        });
        if (existing) return existing;
        return prisma.entity.create({
          data: {
            entityType: 'OVERSEAS_COMPANY',
            legalName: 'GLOBAL INVESTMENTS TRUST',
            overseasRegistrationNumber: 'CI-12345',
            countryOfIncorporation: 'KY', // Cayman Islands
            incorporationDate: new Date('2019-06-15'),
            entityStatus: 'ACTIVE',
            registeredStreet: 'PO Box 309, Ugland House',
            registeredCity: 'George Town',
            registeredPostcode: 'KY1-1104',
            registeredCountry: 'KY',
          },
        });
      })(),

      // Enhanced CDD - PEP Scenario
      prisma.entity.upsert({
        where: { nzbn: '9429041568000' },
        update: {},
        create: {
          entityType: 'NZ_COMPANY',
          legalName: 'CIVIC CONSULTANTS LIMITED',
          nzbn: '9429041568000',
          countryOfIncorporation: 'NZ',
          incorporationDate: new Date('2021-03-01'),
          entityStatus: 'ACTIVE',
          registeredStreet: '45 Victoria Street',
          registeredCity: 'Wellington',
          registeredPostcode: '6011',
          registeredCountry: 'NZ',
        },
      }),
    ]);

    console.log(`  Created ${entities.length} demo entities`);

    // ============================================================
    // 3. CREATE DEMO PERSONS (for beneficial owners)
    // ============================================================
    console.log('Creating demo persons...');

    const persons = await Promise.all([
      prisma.person.create({
        data: {
          fullName: 'John Smith',
          firstName: 'John',
          lastName: 'Smith',
          dateOfBirth: new Date('1975-06-15'),
          nationality: 'NZ',
          residentialStreet: '45 Parnell Road',
          residentialCity: 'Auckland',
          residentialPostcode: '1052',
          residentialCountry: 'NZ',
          pepStatus: 'NOT_PEP',
          sanctionsScreeningResult: 'Clear',
          sanctionsScreeningDate: new Date(),
        },
      }),
      prisma.person.create({
        data: {
          fullName: 'Mary Johnson',
          firstName: 'Mary',
          lastName: 'Johnson',
          dateOfBirth: new Date('1982-03-22'),
          nationality: 'NZ',
          residentialStreet: '123 Oriental Parade',
          residentialCity: 'Wellington',
          residentialPostcode: '6011',
          residentialCountry: 'NZ',
          pepStatus: 'NOT_PEP',
          sanctionsScreeningResult: 'Clear',
          sanctionsScreeningDate: new Date(),
        },
      }),
      prisma.person.create({
        data: {
          fullName: 'David Mitchell',
          firstName: 'David',
          lastName: 'Mitchell',
          dateOfBirth: new Date('1968-09-10'),
          nationality: 'NZ',
          residentialStreet: '1 Parliament Drive',
          residentialCity: 'Wellington',
          residentialPostcode: '6160',
          residentialCountry: 'NZ',
          pepStatus: 'DOMESTIC_PEP',
          pepDetails: 'Member of Parliament, New Zealand House of Representatives',
          sanctionsScreeningResult: 'Clear',
          sanctionsScreeningDate: new Date(),
          adverseMediaResult: 'Potential match found: News article regarding political donations (March 2023)',
          adverseMediaDate: new Date(),
        },
      }),
    ]);

    console.log(`  Created ${persons.length} demo persons`);

    // ============================================================
    // 4. CREATE DEMO APPLICATIONS
    // ============================================================
    console.log('Creating demo applications...');

    const specialist = users.find(u => u.role === 'SPECIALIST');
    const manager = users.find(u => u.role === 'TEAM_MANAGER');

    // Application 1: Standard CDD - Draft
    const app1 = await prisma.cDDApplication.create({
      data: {
        applicationNumber: 'A-2026-DEMO-001',
        entityId: entities[0].id, // ABC TRADING
        applicationType: 'NEW_CUSTOMER',
        cddLevel: 'STANDARD',
        cddLevelJustification: 'Entity does not meet Simplified CDD criteria',
        workflowState: 'DRAFT',
        assignedSpecialistId: specialist!.id,
      },
    });

    // Add beneficial owners to app1
    await prisma.beneficialOwner.create({
      data: {
        applicationId: app1.id,
        entityId: entities[0].id,
        personId: persons[0].id, // John Smith
        ownershipBasis: ['ULTIMATE_OWNERSHIP', 'EFFECTIVE_CONTROL'],
        ownershipPercentage: 55,
        isNominee: false,
        verificationStatus: 'NOT_STARTED',
      },
    });

    await prisma.beneficialOwner.create({
      data: {
        applicationId: app1.id,
        entityId: entities[0].id,
        personId: persons[1].id, // Mary Johnson
        ownershipBasis: ['ULTIMATE_OWNERSHIP'],
        ownershipPercentage: 45,
        isNominee: false,
        verificationStatus: 'NOT_STARTED',
      },
    });

    // Application 2: Simplified CDD - Submitted
    const app2 = await prisma.cDDApplication.create({
      data: {
        applicationNumber: 'A-2026-DEMO-002',
        entityId: entities[1].id, // MERIDIAN ENERGY (NZX Listed)
        applicationType: 'NEW_CUSTOMER',
        cddLevel: 'SIMPLIFIED',
        cddLevelJustification: 'Listed Issuer on NZX - Section 18(1)(a), AML/CFT Act 2009',
        workflowState: 'SUBMITTED',
        submittedDate: new Date(),
        assignedSpecialistId: specialist!.id,
        assignedApproverId: manager!.id,
        riskRating: 'LOW',
        riskScore: 10,
        riskRatingJustification: 'Low risk - NZX listed entity with transparent ownership',
      },
    });

    // Application 3: Enhanced CDD - Under Review
    const app3 = await prisma.cDDApplication.create({
      data: {
        applicationNumber: 'A-2026-DEMO-003',
        entityId: entities[3].id, // GLOBAL INVESTMENTS TRUST (Cayman)
        applicationType: 'NEW_CUSTOMER',
        cddLevel: 'ENHANCED',
        cddLevelJustification: 'Multiple Enhanced CDD triggers: High-risk jurisdiction (Cayman Islands), Complex ownership structure',
        workflowState: 'UNDER_REVIEW',
        submittedDate: new Date(Date.now() - 86400000), // Yesterday
        assignedSpecialistId: specialist!.id,
        assignedApproverId: manager!.id,
        riskRating: 'HIGH',
        riskScore: 75,
        riskRatingJustification: 'High risk due to: offshore jurisdiction, complex ownership',
      },
    });

    // Add CDD triggers for Enhanced CDD application
    await prisma.cDDTrigger.createMany({
      data: [
        {
          applicationId: app3.id,
          triggerType: 'HIGH_RISK_JURISDICTION',
          triggerDescription: 'Entity incorporated in Cayman Islands (FATF monitored jurisdiction)',
          legalReference: 'Section 22(1)(a), AML/CFT Act 2009',
        },
        {
          applicationId: app3.id,
          triggerType: 'COMPLEX_OWNERSHIP',
          triggerDescription: 'Complex ownership structure with 4+ layers identified',
          legalReference: 'RBNZ Enhanced CDD Guideline (April 2024)',
        },
      ],
    });

    // Application 4: PEP Scenario - Returned
    const app4 = await prisma.cDDApplication.create({
      data: {
        applicationNumber: 'A-2026-DEMO-004',
        entityId: entities[4].id, // CIVIC CONSULTANTS (PEP)
        applicationType: 'NEW_CUSTOMER',
        cddLevel: 'ENHANCED',
        cddLevelJustification: 'Politically Exposed Person involvement detected',
        workflowState: 'RETURNED',
        submittedDate: new Date(Date.now() - 172800000), // 2 days ago
        returnedDate: new Date(Date.now() - 86400000), // Yesterday
        returnedReason: 'Additional documentation required for PEP beneficial owner verification.',
        assignedSpecialistId: specialist!.id,
        assignedApproverId: manager!.id,
        riskRating: 'HIGH',
        riskScore: 65,
        riskRatingJustification: 'High risk due to PEP involvement requiring enhanced monitoring',
      },
    });

    // Add beneficial owner (PEP) to app4
    await prisma.beneficialOwner.create({
      data: {
        applicationId: app4.id,
        entityId: entities[4].id,
        personId: persons[2].id, // David Mitchell (PEP)
        ownershipBasis: ['ULTIMATE_OWNERSHIP', 'EFFECTIVE_CONTROL'],
        ownershipPercentage: 100,
        isNominee: false,
        verificationStatus: 'IN_PROGRESS',
      },
    });

    // Add CDD trigger for PEP
    await prisma.cDDTrigger.create({
      data: {
        applicationId: app4.id,
        triggerType: 'PEP_INVOLVEMENT',
        triggerDescription: 'Beneficial owner David Mitchell identified as Domestic PEP (Member of Parliament)',
        legalReference: 'Section 22(1)(d), AML/CFT Act 2009',
      },
    });

    console.log('  Created 4 demo applications with various statuses');

    // ============================================================
    // 5. CREATE COUNTRY REFERENCE DATA
    // ============================================================
    console.log('Creating country reference data...');

    const countries = [
      { countryCode: 'NZ', countryName: 'New Zealand', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
      { countryCode: 'AU', countryName: 'Australia', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
      { countryCode: 'GB', countryName: 'United Kingdom', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
      { countryCode: 'US', countryName: 'United States', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
      { countryCode: 'SG', countryName: 'Singapore', riskLevel: 'LOW', isFATFMember: true, isFATFHighRisk: false },
      { countryCode: 'HK', countryName: 'Hong Kong', riskLevel: 'MEDIUM', isFATFMember: true, isFATFHighRisk: false },
      { countryCode: 'KY', countryName: 'Cayman Islands', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: false, fatfStatus: 'Enhanced monitoring' },
      { countryCode: 'VG', countryName: 'British Virgin Islands', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: false },
      { countryCode: 'IR', countryName: 'Iran', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: true, fatfStatus: 'Call for action' },
      { countryCode: 'KP', countryName: 'North Korea', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: true, fatfStatus: 'Call for action' },
      { countryCode: 'MM', countryName: 'Myanmar', riskLevel: 'HIGH', isFATFMember: false, isFATFHighRisk: true, fatfStatus: 'Enhanced monitoring' },
    ];

    for (const country of countries) {
      await prisma.country.upsert({
        where: { countryCode: country.countryCode },
        update: {
          countryName: country.countryName,
          riskLevel: country.riskLevel as any,
          isFATFMember: country.isFATFMember,
          isFATFHighRisk: country.isFATFHighRisk,
          fatfStatus: country.fatfStatus,
        },
        create: {
          countryCode: country.countryCode,
          countryName: country.countryName,
          riskLevel: country.riskLevel as any,
          isFATFMember: country.isFATFMember,
          isFATFHighRisk: country.isFATFHighRisk,
          fatfStatus: country.fatfStatus,
        },
      });
    }

    console.log(`  Created ${countries.length} country records`);

    // ============================================================
    // SUMMARY
    // ============================================================
    console.log('\n========================================');
    console.log('DEMO DATA SEEDING COMPLETE');
    console.log('========================================\n');

    console.log('Demo Users (password for all: Demo123!)');
    console.log('  - specialist@demo.com (Specialist)');
    console.log('  - manager@demo.com (Team Manager)');
    console.log('  - compliance@demo.com (Compliance Officer)');
    console.log('  - admin@demo.com (Admin)\n');

    console.log('Demo Applications:');
    console.log('  - A-2026-DEMO-001: Standard CDD (Draft) - ABC Trading');
    console.log('  - A-2026-DEMO-002: Simplified CDD (Submitted) - Meridian Energy');
    console.log('  - A-2026-DEMO-003: Enhanced CDD (Under Review) - Global Investments Trust');
    console.log('  - A-2026-DEMO-004: Enhanced CDD with PEP (Returned) - Civic Consultants\n');

    console.log('Test Mode NZBN Entities (use in entity search):');
    console.log('  - 9429041561467: ABC Trading (Standard CDD)');
    console.log('  - 9429041562000: Meridian Energy (Simplified CDD - NZX Listed)');
    console.log('  - 9429041563000: Auckland Council (Simplified CDD - Local Authority)');
    console.log('  - 9429041564000: KiwiRail (Simplified CDD - SOE)');
    console.log('  - 9429041565000: Pacific Holdings (Enhanced CDD - Complex ownership)');
    console.log('  - 9429041566000: Smith Family Trust (Enhanced CDD - Trust)');
    console.log('  - 9429041567000: Wellington Ventures LP (Standard CDD - LP)');
    console.log('  - 9429041568000: Civic Consultants (Enhanced CDD - PEP scenario)\n');

    console.log('Test Mode Screening Names:');
    console.log('  - John Smith, Mary Johnson, Sarah Williams: Clear');
    console.log('  - David Mitchell: Domestic PEP (MP)');
    console.log('  - Chen Wei: Foreign PEP');
    console.log('  - Ivan Petrov: Sanctions match\n');

  } catch (error) {
    console.error('Error seeding demo data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedDemoData()
  .then(() => {
    console.log('Demo data seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Demo data seeding failed:', error);
    process.exit(1);
  });
