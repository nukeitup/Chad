import { PrismaClient, UserRole, RiskRating } from '../src/generated/prisma';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting database seed...');

  // Create users
  const passwordHash = await bcrypt.hash('Password123!', 12);

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {},
      create: {
        email: 'admin@example.com',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.upsert({
      where: { email: 'compliance@example.com' },
      update: {},
      create: {
        email: 'compliance@example.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: 'Williams',
        role: UserRole.COMPLIANCE_OFFICER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'manager@example.com' },
      update: {},
      create: {
        email: 'manager@example.com',
        passwordHash,
        firstName: 'Mike',
        lastName: 'Brown',
        role: UserRole.TEAM_MANAGER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'specialist@example.com' },
      update: {},
      create: {
        email: 'specialist@example.com',
        passwordHash,
        firstName: 'John',
        lastName: 'Smith',
        role: UserRole.SPECIALIST,
      },
    }),
    prisma.user.upsert({
      where: { email: 'specialist2@example.com' },
      update: {},
      create: {
        email: 'specialist2@example.com',
        passwordHash,
        firstName: 'Jane',
        lastName: 'Doe',
        role: UserRole.SPECIALIST,
      },
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // Create countries with risk levels
  const countries = [
    // FATF Members - Low Risk
    { countryCode: 'NZ', countryName: 'New Zealand', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'AU', countryName: 'Australia', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'US', countryName: 'United States', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'GB', countryName: 'United Kingdom', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'CA', countryName: 'Canada', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'DE', countryName: 'Germany', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'FR', countryName: 'France', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'JP', countryName: 'Japan', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'SG', countryName: 'Singapore', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'HK', countryName: 'Hong Kong', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },

    // Medium Risk
    { countryCode: 'CN', countryName: 'China', riskLevel: RiskRating.MEDIUM, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'IN', countryName: 'India', riskLevel: RiskRating.MEDIUM, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'AE', countryName: 'United Arab Emirates', riskLevel: RiskRating.MEDIUM, isFATFMember: false, isFATFHighRisk: false },
    { countryCode: 'PH', countryName: 'Philippines', riskLevel: RiskRating.MEDIUM, isFATFMember: false, isFATFHighRisk: false },
    { countryCode: 'VN', countryName: 'Vietnam', riskLevel: RiskRating.MEDIUM, isFATFMember: false, isFATFHighRisk: false },

    // High Risk - FATF List
    { countryCode: 'KP', countryName: 'North Korea', riskLevel: RiskRating.HIGH, isFATFMember: false, isFATFHighRisk: true, fatfStatus: 'Call for action' },
    { countryCode: 'IR', countryName: 'Iran', riskLevel: RiskRating.HIGH, isFATFMember: false, isFATFHighRisk: true, fatfStatus: 'Call for action' },
    { countryCode: 'MM', countryName: 'Myanmar', riskLevel: RiskRating.HIGH, isFATFMember: false, isFATFHighRisk: true, fatfStatus: 'Enhanced monitoring' },

    // Offshore Jurisdictions
    { countryCode: 'KY', countryName: 'Cayman Islands', riskLevel: RiskRating.MEDIUM, isFATFMember: false, isFATFHighRisk: false },
    { countryCode: 'VG', countryName: 'British Virgin Islands', riskLevel: RiskRating.MEDIUM, isFATFMember: false, isFATFHighRisk: false },
    { countryCode: 'PA', countryName: 'Panama', riskLevel: RiskRating.MEDIUM, isFATFMember: false, isFATFHighRisk: false },
    { countryCode: 'CH', countryName: 'Switzerland', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
    { countryCode: 'LU', countryName: 'Luxembourg', riskLevel: RiskRating.LOW, isFATFMember: true, isFATFHighRisk: false },
  ];

  for (const country of countries) {
    await prisma.country.upsert({
      where: { countryCode: country.countryCode },
      update: country,
      create: country,
    });
  }

  console.log(`Created ${countries.length} countries`);

  console.log('Database seed completed successfully!');
  console.log('\nTest Users:');
  console.log('  Admin: admin@example.com / Password123!');
  console.log('  Compliance Officer: compliance@example.com / Password123!');
  console.log('  Team Manager: manager@example.com / Password123!');
  console.log('  Specialist: specialist@example.com / Password123!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
