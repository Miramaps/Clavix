import { Company, SubEntity } from '@prisma/client';
import { getIndustryVertical, isCommercialOrganization } from '../api/brreg/mapper';

export interface ScoreSignal {
  signal: string;
  weight: number;
  reason: string;
  active: boolean;
}

export interface ScoringResult {
  overallLeadScore: number;
  aiUseCaseFit: number;
  aiUrgencyScore: number;
  aiDataQualityScore: number;
  signals: ScoreSignal[];
  topReasons: string[];
}

interface CompanyWithSubEntities extends Company {
  subEntities?: SubEntity[];
}

/**
 * Target industry verticals with high automation potential
 */
const TARGET_VERTICALS = [
  'Manufacturing - Food',
  'Manufacturing - Metal',
  'Construction',
  'Wholesale Trade',
  'Retail Trade',
  'Transportation',
  'Warehousing',
  'Food Services',
  'Facility Services',
  'Real Estate',
  'Legal & Accounting',
];

/**
 * Main lead scoring engine with explainability
 */
export function calculateLeadScore(
  company: CompanyWithSubEntities
): ScoringResult {
  const signals: ScoreSignal[] = [];
  
  // Signal 1: Company is active
  const isActive = company.status === 'active';
  signals.push({
    signal: 'company_active',
    weight: 20,
    reason: isActive ? 'Bedriften er aktivt i drift' : 'Bedriften er inaktiv',
    active: isActive,
  });
  
  // Signal 2: Optimal employee count (5-250 = SMB sweet spot)
  const employeeCount = company.employeeCount || 0;
  const hasOptimalSize = employeeCount >= 5 && employeeCount <= 250;
  signals.push({
    signal: 'optimal_employee_count',
    weight: 15,
    reason: hasOptimalSize
      ? `${employeeCount} ansatte - ideell SMB-størrelse`
      : employeeCount > 250
      ? 'Enterprise-størrelse - kan trenge skreddersydd løsning'
      : 'For liten - begrenset budsjett',
    active: hasOptimalSize,
  });
  
  // Signal 3: Target industry vertical
  const vertical = getIndustryVertical(company.industryCode);
  const isTargetVertical = vertical ? TARGET_VERTICALS.includes(vertical) : false;
  signals.push({
    signal: 'target_industry',
    weight: 20,
    reason: isTargetVertical
      ? `${vertical} - høyt automatiseringspotensial`
      : `${vertical || 'Ukjent bransje'} - ikke primærmål`,
    active: isTargetVertical,
  });
  
  // Signal 4: Multiple sub-entities/branches
  const subEntityCount = company.subEntities?.length || 0;
  const hasMultipleBranches = subEntityCount > 0;
  signals.push({
    signal: 'multiple_branches',
    weight: 10,
    reason: hasMultipleBranches
      ? `${subEntityCount} avdelinger - koordineringsbehov`
      : 'Enkelt sted',
    active: hasMultipleBranches,
  });
  
  // Signal 5: Has website
  const hasWebsite = !!company.website;
  signals.push({
    signal: 'has_website',
    weight: 8,
    reason: hasWebsite
      ? 'Har nettilstedeværelse'
      : 'Ingen nettside - kan mangle digital modenhet',
    active: hasWebsite,
  });
  
  // Signal 6: Has contact phone
  const hasPhone = !!company.phone;
  signals.push({
    signal: 'has_contact_phone',
    weight: 8,
    reason: hasPhone
      ? 'Kontakttelefon tilgjengelig'
      : 'Ingen telefon - vanskeligere å nå',
    active: hasPhone,
  });
  
  // Signal 7: Recently updated
  const daysSinceUpdate = company.sourceUpdatedAt
    ? Math.floor((Date.now() - company.sourceUpdatedAt.getTime()) / (1000 * 60 * 60 * 24))
    : 9999;
  const isRecentlyUpdated = daysSinceUpdate <= 90;
  signals.push({
    signal: 'recently_updated',
    weight: 8,
    reason: isRecentlyUpdated
      ? `Oppdatert for ${daysSinceUpdate} dager siden - aktive endringer`
      : 'Ikke nylig oppdatert i registeret',
    active: isRecentlyUpdated,
  });
  
  // Signal 8: Commercial organization form
  const isCommercial = isCommercialOrganization(company.organizationFormCode);
  signals.push({
    signal: 'commercial_org_form',
    weight: 6,
    reason: isCommercial
      ? `${company.organizationFormCode} - kommersiell enhet`
      : 'Ideell eller ikke-kommersiell',
    active: isCommercial,
  });
  
  // Signal 9: Has decision maker roles data
  const hasRolesData = company.hasRolesData;
  signals.push({
    signal: 'has_roles_data',
    weight: 5,
    reason: hasRolesData
      ? 'Ledelse/beslutningstakere identifisert'
      : 'Ingen rolledata tilgjengelig',
    active: hasRolesData,
  });
  
  // Calculate overall score
  const totalPossible = signals.reduce((sum, s) => sum + s.weight, 0);
  const earnedScore = signals.filter(s => s.active).reduce((sum, s) => sum + s.weight, 0);
  const overallLeadScore = Math.round((earnedScore / totalPossible) * 100);
  
  // Calculate component scores
  const aiUseCaseFit = calculateUseCaseFit(company, isTargetVertical, hasOptimalSize);
  const aiUrgencyScore = calculateUrgency(company, isRecentlyUpdated, hasMultipleBranches);
  const aiDataQualityScore = calculateDataQuality(company, hasPhone, hasWebsite, hasRolesData);
  
  // Get top 3 reasons
  const activeSignals = signals.filter(s => s.active).sort((a, b) => b.weight - a.weight);
  const topReasons = activeSignals.slice(0, 3).map(s => s.reason);
  
  return {
    overallLeadScore,
    aiUseCaseFit,
    aiUrgencyScore,
    aiDataQualityScore,
    signals,
    topReasons,
  };
}

function calculateUseCaseFit(
  company: Company,
  isTargetVertical: boolean,
  hasOptimalSize: boolean
): number {
  let score = 50; // Base score
  
  if (isTargetVertical) score += 30;
  if (hasOptimalSize) score += 20;
  
  // Bonus for specific high-value industries
  if (company.industryCode?.startsWith('52')) score += 10; // Warehousing
  if (company.industryCode?.startsWith('49')) score += 10; // Transportation
  
  return Math.min(100, score);
}

function calculateUrgency(
  company: Company,
  isRecentlyUpdated: boolean,
  hasMultipleBranches: boolean
): number {
  let score = 40; // Base score
  
  if (isRecentlyUpdated) score += 25;
  if (hasMultipleBranches) score += 20;
  
  // High urgency for larger operations
  if (company.employeeCount && company.employeeCount > 50) score += 15;
  
  return Math.min(100, score);
}

function calculateDataQuality(
  company: Company,
  hasPhone: boolean,
  hasWebsite: boolean,
  hasRolesData: boolean
): number {
  let score = 30; // Base score
  
  if (hasPhone) score += 20;
  if (hasWebsite) score += 20;
  if (hasRolesData) score += 20;
  if (company.email) score += 10;
  
  return Math.min(100, score);
}

/**
 * Batch scoring for multiple companies
 */
export async function batchScoreCompanies(
  companies: CompanyWithSubEntities[]
): Promise<Map<string, ScoringResult>> {
  const results = new Map<string, ScoringResult>();
  
  for (const company of companies) {
    const score = calculateLeadScore(company);
    results.set(company.id, score);
  }
  
  return results;
}
