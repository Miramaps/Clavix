import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create demo user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const user = await prisma.user.upsert({
    where: { email: 'admin@clavix.no' },
    update: {},
    create: {
      email: 'admin@clavix.no',
      name: 'Administrator',
      password: hashedPassword,
    },
  });

  console.log('✓ Opprettet demo-bruker:', user.email);

  // Create sample companies
  const sampleCompanies = [
    {
      orgnr: '123456789',
      name: 'Oslo Logistics AS',
      organizationFormCode: 'AS',
      organizationFormName: 'Aksjeselskap',
      status: 'active',
      municipality: 'Oslo',
      county: 'Oslo',
      postalCode: '0150',
      industryCode: '52.10',
      industryDescription: 'Lager og oppbevaring',
      employeeCount: 45,
      website: 'https://example.com',
      phone: '+47 22 12 34 56',
      logoUrl: 'https://logo.clearbit.com/example.com',
      overallLeadScore: 82,
      aiUseCaseFit: 85,
      aiUrgencyScore: 80,
      aiDataQualityScore: 90,
      aiSummary: 'Hva de gjør:\nOslo Logistics AS tilbyr lager- og distribusjonstjenester for e-handel og detaljhandelsbedrifter i Norge.\n\nHvorfor automatisering:\nHøyt volum av repetitive oppgaver i lagerstyring og ordrebehandling.\n\nTopp brukstilfeller:\n• Automatisert lagersporing og prognoser\n• Ordrebehandling og fraktautomatisering\n• Kundeservice chatbot for sporingsspørsmål\n\nPitch-vinkel:\nFokuser på å redusere manuell dataregistrering og forbedre ordrenøyaktighet.\n\nRisikonotater:\n- Ingen - sterk datakvalitet',
    },
    {
      orgnr: '987654321',
      name: 'Bergen Bygg & Anlegg',
      organizationFormCode: 'AS',
      organizationFormName: 'Aksjeselskap',
      status: 'active',
      municipality: 'Bergen',
      county: 'Vestland',
      postalCode: '5003',
      industryCode: '41.20',
      industryDescription: 'Oppføring av bygninger',
      employeeCount: 120,
      phone: '+47 55 12 34 56',
      overallLeadScore: 75,
      aiUseCaseFit: 70,
      aiUrgencyScore: 75,
      aiDataQualityScore: 80,
      aiSummary: 'Hva de gjør:\nByggeentreprenør som spesialiserer seg på bolig- og næringsbygg.\n\nHvorfor automatisering:\nProsjektstyrings-kompleksitet med flere entreprenører og tidsfrister.\n\nTopp brukstilfeller:\n• Dokumenthåndtering og godkjenningsarbeidsflyter\n• Entreprenør-koordinering og planlegging\n• Budsjettstyring og fakturabehandling\n\nPitch-vinkel:\nReduser prosjektforsinkelser gjennom bedre koordineringsautomatisering.\n\nRisikonotater:\n- Ingen nettside - digital modenhet usikker',
    },
    {
      orgnr: '456789123',
      name: 'Trondheim IT Consulting',
      organizationFormCode: 'AS',
      organizationFormName: 'Aksjeselskap',
      status: 'active',
      municipality: 'Trondheim',
      county: 'Trøndelag',
      postalCode: '7030',
      industryCode: '62.02',
      industryDescription: 'Konsulentvirksomhet tilknyttet informasjonsteknologi',
      employeeCount: 25,
      website: 'https://example.com',
      phone: '+47 73 12 34 56',
      email: 'post@example.no',
      overallLeadScore: 68,
      aiUseCaseFit: 60,
      aiUrgencyScore: 65,
      aiDataQualityScore: 95,
    },
  ];

  for (const companyData of sampleCompanies) {
    const company = await prisma.company.upsert({
      where: { orgnr: companyData.orgnr },
      update: companyData,
      create: companyData,
    });

    console.log(`✓ Created company: ${company.name}`);

    // Add score explanations
    await prisma.scoreExplanation.createMany({
      data: [
        {
          companyId: company.id,
          signal: 'company_active',
          weight: 20,
          reason: 'Company is actively operating',
        },
        {
          companyId: company.id,
          signal: 'optimal_employee_count',
          weight: 15,
          reason: `${company.employeeCount} employees - ideal SMB size`,
        },
        {
          companyId: company.id,
          signal: 'has_contact_phone',
          weight: 8,
          reason: 'Contact phone available',
        },
      ],
    });
  }

  // Create filter presets
  const presets = [
    {
      name: 'Hot Leads',
      description: 'Companies with score ≥75',
      filters: { minScore: 75, status: 'active' },
    },
    {
      name: 'SMB Operations',
      description: 'Small-medium businesses in operations-heavy sectors',
      filters: { minEmployees: 10, maxEmployees: 200, industryCode: '52' },
    },
    {
      name: 'Enterprise Multi-branch',
      description: 'Large companies with multiple locations',
      filters: { minEmployees: 100, hasSubEntities: true },
    },
  ];

  for (const preset of presets) {
    await prisma.filterPreset.create({
      data: preset,
    });
    console.log(`✓ Created filter preset: ${preset.name}`);
  }

  // ============================================
  // SEED CUSTOM SCORING MODELS
  // ============================================
  console.log('\n📊 Seeding custom scoring models...');

  const scoringModels = [
    {
      id: 'default-standard',
      userId: null,
      name: 'Standard CLAVIX-modell',
      description: 'Standard score-modell for alle bransjer',
      isActive: false,
      isDefault: true,
      config: {
        signals: [
          {
            signal: 'company_active',
            weight: 20,
            condition: "status === 'active'",
            reason: 'Bedriften er aktivt i drift',
          },
          {
            signal: 'optimal_employee_count',
            weight: 15,
            condition: 'employeeCount >= 5 && employeeCount <= 250',
            reason: 'Ideell SMB-størrelse',
          },
          {
            signal: 'has_website',
            weight: 8,
            condition: 'hasWebsite === true',
            reason: 'Har nettilstedeværelse',
          },
          {
            signal: 'has_contact_phone',
            weight: 8,
            condition: 'hasPhone === true',
            reason: 'Kontakttelefon tilgjengelig',
          },
          {
            signal: 'has_roles_data',
            weight: 5,
            condition: 'hasRolesData === true',
            reason: 'Ledelse/beslutningstakere identifisert',
          },
        ],
        thresholds: {
          highScore: 75,
          goodScore: 50,
        },
      },
    },
    {
      id: 'default-enterprise',
      userId: null,
      name: 'Enterprise-modell',
      description: 'Fokuserer på større bedrifter',
      isActive: false,
      isDefault: false,
      config: {
        signals: [
          {
            signal: 'company_active',
            weight: 20,
            condition: "status === 'active'",
            reason: 'Bedriften er aktivt i drift',
          },
          {
            signal: 'large_company',
            weight: 25,
            condition: 'employeeCount >= 250',
            reason: 'Enterprise-størrelse',
          },
          {
            signal: 'has_website',
            weight: 5,
            condition: 'hasWebsite === true',
            reason: 'Har nettilstedeværelse',
          },
          {
            signal: 'has_roles_data',
            weight: 10,
            condition: 'hasRolesData === true',
            reason: 'Ledelse/beslutningstakere identifisert',
          },
        ],
        thresholds: {
          highScore: 70,
          goodScore: 45,
        },
      },
    },
  ];

  for (const model of scoringModels) {
    await prisma.scoringModel.upsert({
      where: { id: model.id },
      update: model,
      create: model,
    });
    console.log(`✓ Opprettet scoring-modell: ${model.name}`);
  }

  // ============================================
  // SEED SAMPLE INTEGRATION (for testing)
  // ============================================
  console.log('\n🔗 Seeding sample integration...');

  await prisma.integration.upsert({
    where: { id: 'sample-webhook' },
    create: {
      id: 'sample-webhook',
      type: 'webhook',
      name: 'Sample Webhook (Test)',
      isActive: false,
      config: {
        webhookUrl: 'https://webhook.site/unique-url',
      },
      events: ['deal.created', 'deal.won', 'lead.high_score'],
    },
    update: {},
  });
  console.log('✓ Opprettet sample integration');

  console.log('\n🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
