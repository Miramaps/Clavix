import { BrregEnhet, BrregUnderenhet, BrregRolle } from './types';
import { Prisma } from '@prisma/client';
import { getCompanyLogo } from '@/lib/services/logo-service';

/**
 * Map Brreg Enhet to Company data for Prisma
 */
export async function mapEnhetToCompany(enhet: BrregEnhet): Promise<Prisma.CompanyCreateInput> {
  const address = enhet.forretningsadresse || enhet.beliggenhetsadresse;
  
  // Determine status
  let status = 'active';
  if (enhet.konkurs) status = 'inactive';
  if (enhet.underAvvikling || enhet.underTvangsavviklingEllerTvangsopplosning) status = 'inactive';
  
  // Try to fetch logo if website is available
  let logoUrl: string | null = null;
  if (enhet.hjemmeside) {
    logoUrl = await getCompanyLogo(enhet.hjemmeside, enhet.navn);
  }

  return {
    orgnr: enhet.organisasjonsnummer,
    name: enhet.navn,
    organizationFormCode: enhet.organisasjonsform?.kode,
    organizationFormName: enhet.organisasjonsform?.beskrivelse,
    status,
    foundedDate: enhet.stiftelsesdato ? new Date(enhet.stiftelsesdato) : undefined,
    municipality: address?.kommune,
    municipalityNumber: address?.kommunenummer,
    county: getCountyFromMunicipalityNumber(address?.kommunenummer),
    postalCode: address?.postnummer,
    address: address?.adresse?.join(', '),
    industryCode: enhet.naeringskode1?.kode,
    industryDescription: enhet.naeringskode1?.beskrivelse,
    employeeCount: enhet.antallAnsatte,
    website: enhet.hjemmeside,
    logoUrl,
    sourceUpdatedAt: enhet.registreringsdatoEnhetsregisteret 
      ? new Date(enhet.registreringsdatoEnhetsregisteret)
      : undefined,
    rawJson: enhet as unknown as Prisma.InputJsonValue,
  };
}

/**
 * Map Brreg Underenhet to SubEntity data for Prisma
 */
export function mapUnderenhetToSubEntity(underenhet: BrregUnderenhet): Prisma.SubEntityCreateInput {
  const address = underenhet.beliggenhetsadresse;
  
  return {
    orgnr: underenhet.organisasjonsnummer,
    parentOrgnr: underenhet.overordnetEnhet || '',
    name: underenhet.navn,
    status: 'active',
    industryCode: underenhet.naeringskode1?.kode,
    address: address?.adresse?.join(', '),
    municipality: address?.kommune,
    rawJson: underenhet as unknown as Prisma.InputJsonValue,
    parentCompany: {
      connect: { orgnr: underenhet.overordnetEnhet || '' }
    }
  };
}

/**
 * Map Brreg Rolle to CompanyRole data for Prisma
 */
export function mapRolleToCompanyRole(
  rolle: BrregRolle,
  roleGroup: string,
  companyId: string
): Prisma.CompanyRoleCreateInput {
  const personName = rolle.person
    ? `${rolle.person.fornavn} ${rolle.person.etternavn || ''}`.trim()
    : undefined;
  
  return {
    company: { connect: { id: companyId } },
    roleType: rolle.type.beskrivelse,
    roleGroup,
    personName,
    birthDate: rolle.person?.fodselsdato ? new Date(rolle.person.fodselsdato) : undefined,
    rawJson: rolle as unknown as Prisma.InputJsonValue,
  };
}

/**
 * Get county (fylke) name from municipality number
 */
function getCountyFromMunicipalityNumber(kommunenummer?: string): string | undefined {
  if (!kommunenummer) return undefined;
  
  const countyMap: Record<string, string> = {
    '03': 'Oslo',
    '11': 'Rogaland',
    '15': 'Møre og Romsdal',
    '18': 'Nordland',
    '31': 'Østfold',
    '32': 'Akershus',
    '33': 'Buskerud',
    '34': 'Innlandet',
    '38': 'Vestfold og Telemark',
    '42': 'Agder',
    '46': 'Vestland',
    '50': 'Trøndelag',
    '54': 'Troms og Finnmark',
  };
  
  const prefix = kommunenummer.substring(0, 2);
  return countyMap[prefix];
}

/**
 * Normalize industry codes to target verticals
 */
export function getIndustryVertical(industryCode?: string): string | null {
  if (!industryCode) return null;
  
  const code = industryCode.substring(0, 2);
  
  const verticalMap: Record<string, string> = {
    '10': 'Manufacturing - Food',
    '25': 'Manufacturing - Metal',
    '41': 'Construction',
    '42': 'Construction',
    '43': 'Construction',
    '45': 'Retail - Automotive',
    '46': 'Wholesale Trade',
    '47': 'Retail Trade',
    '49': 'Transportation',
    '50': 'Transportation',
    '51': 'Transportation',
    '52': 'Warehousing',
    '55': 'Accommodation',
    '56': 'Food Services',
    '62': 'IT Services',
    '68': 'Real Estate',
    '69': 'Legal & Accounting',
    '70': 'Management Consulting',
    '71': 'Architecture & Engineering',
    '81': 'Facility Services',
    '86': 'Healthcare',
    '87': 'Social Services',
  };
  
  return verticalMap[code] || null;
}

/**
 * Check if organization form is commercial
 */
export function isCommercialOrganization(orgFormCode?: string): boolean {
  if (!orgFormCode) return false;
  
  const commercialCodes = [
    'AS',   // Aksjeselskap
    'ASA',  // Allmennaksjeselskap
    'ENK',  // Enkeltpersonforetak
    'ANS',  // Ansvarlig selskap
    'DA',   // Selskap med delt ansvar
    'FLI',  // Filial av utenlandsk foretak
    'NUF',  // Norskregistrert utenlandsk foretak
  ];
  
  return commercialCodes.includes(orgFormCode);
}
