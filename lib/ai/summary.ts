import OpenAI from 'openai';
import { Company, CompanyRole, SubEntity } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.AI_API_KEY,
  baseURL: process.env.AI_API_BASE_URL,
});

const AI_MODEL = process.env.AI_MODEL || 'gpt-4o-mini';

interface CompanyWithRelations extends Company {
  roles?: CompanyRole[];
  subEntities?: SubEntity[];
}

export interface CompanySummary {
  whatTheyDo: string;
  whyAutomation: string;
  topUseCases: string[];
  pitchAngle: string;
  riskNotes: string[];
}

/**
 * Generate AI summary for a company
 */
export async function generateCompanySummary(
  company: CompanyWithRelations
): Promise<CompanySummary> {
  const prompt = buildPrompt(company);
  
  try {
    const response = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [
        {
          role: 'system',
          content: `Du er en AI-salgsanalytiker som spesialiserer seg på å identifisere automatiseringsmuligheter for norske bedrifter.
Generer konsise, handlingskraftige innsikter basert på tilgjengelige data.
Hvis dataene er sparsomme, oppgi eksplisitt usikkerhet.
Hold svarene under 120 ord totalt.
Svar på NORSK.
Output i JSON-format.`,
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 500,
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }
    
    const parsed = JSON.parse(content) as CompanySummary;
    return parsed;
  } catch (error) {
    console.error('AI summary generation failed:', error);
    return generateFallbackSummary(company);
  }
}

/**
 * Build prompt from company data
 */
function buildPrompt(company: CompanyWithRelations): string {
  const parts: string[] = [
    `Company: ${company.name}`,
    `Organization Number: ${company.orgnr}`,
  ];
  
  if (company.organizationFormName) {
    parts.push(`Legal Form: ${company.organizationFormName}`);
  }
  
  if (company.industryDescription) {
    parts.push(`Industry: ${company.industryDescription} (${company.industryCode})`);
  }
  
  if (company.employeeCount) {
    parts.push(`Employees: ${company.employeeCount}`);
  }
  
  if (company.municipality) {
    parts.push(`Location: ${company.municipality}${company.county ? `, ${company.county}` : ''}`);
  }
  
  if (company.website) {
    parts.push(`Website: ${company.website}`);
  }
  
  if (company.subEntities && company.subEntities.length > 0) {
    parts.push(`Branches: ${company.subEntities.length} sub-entities`);
  }
  
  if (company.roles && company.roles.length > 0) {
    const roleTypes = [...new Set(company.roles.map(r => r.roleType))];
    parts.push(`Leadership: ${roleTypes.join(', ')}`);
  }
  
  parts.push('\nBasert på disse dataene, vennligst oppgi (på NORSK):');
  parts.push('1. whatTheyDo: Kort beskrivelse av hva dette selskapet sannsynligvis gjør (maks 2 setninger)');
  parts.push('2. whyAutomation: Hvorfor de kan trenge AI-automatisering (1-2 setninger)');
  parts.push('3. topUseCases: Array med 3 spesifikke automatiseringsbrukstilfeller vi kan selge');
  parts.push('4. pitchAngle: Foreslått tilnærming for første kontakt (1 setning)');
  parts.push('5. riskNotes: Array med bekymringer eller manglende data (hvis noen)');
  
  return parts.join('\n');
}

/**
 * Fallback summary when AI fails or is unavailable
 */
function generateFallbackSummary(company: Company): CompanySummary {
  const whatTheyDo = company.industryDescription
    ? `${company.name} opererer innen ${company.industryDescription}.`
    : `${company.name} er en norsk bedrift.`;
  
  const whyAutomation = 
    'Manuelle prosesser i drift, kundeservice eller administrasjon kan dra nytte av automatisering.';
  
  const topUseCases = [
    'Prosessautomatisering og arbeidsflytoptimalisering',
    'Kundekommunikasjon og CRM-automatisering',
    'Dataregistrering og dokumentbehandling',
  ];
  
  const pitchAngle = 
    'Fokuser på operasjonell effektivitet og kostnadsreduksjon gjennom målrettet automatisering.';
  
  const riskNotes = [];
  if (!company.phone && !company.email) {
    riskNotes.push('Begrenset kontaktinformasjon tilgjengelig');
  }
  if (!company.website) {
    riskNotes.push('Ingen nettside - digital modenhet usikker');
  }
  if (!company.employeeCount) {
    riskNotes.push('Antall ansatte ukjent - størrelse/budsjett uklart');
  }
  
  return {
    whatTheyDo,
    whyAutomation,
    topUseCases,
    pitchAngle,
    riskNotes: riskNotes.length > 0 ? riskNotes : ['Begrensede data tilgjengelig for detaljert analyse'],
  };
}

/**
 * Format summary as plain text for storage
 */
export function formatSummaryAsText(summary: CompanySummary): string {
  const parts = [
    `Hva de gjør:\n${summary.whatTheyDo}`,
    '',
    `Hvorfor automatisering:\n${summary.whyAutomation}`,
    '',
    'Topp brukstilfeller:',
    ...summary.topUseCases.map((uc) => `• ${uc}`),
    '',
    `Pitch-vinkel:\n${summary.pitchAngle}`,
  ];
  
  if (summary.riskNotes.length > 0) {
    parts.push('', 'Risikonotater:', ...summary.riskNotes.map(rn => `- ${rn}`));
  }
  
  return parts.join('\n');
}

/**
 * Batch generate summaries with rate limiting
 */
export async function batchGenerateSummaries(
  companies: CompanyWithRelations[],
  batchSize = 5,
  delayMs = 1000
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  
  for (let i = 0; i < companies.length; i += batchSize) {
    const batch = companies.slice(i, i + batchSize);
    
    const promises = batch.map(async (company) => {
      try {
        const summary = await generateCompanySummary(company);
        const text = formatSummaryAsText(summary);
        return { id: company.id, text };
      } catch (error) {
        console.error(`Failed to generate summary for ${company.orgnr}:`, error);
        return { id: company.id, text: '' };
      }
    });
    
    const batchResults = await Promise.all(promises);
    batchResults.forEach(({ id, text }) => {
      if (text) results.set(id, text);
    });
    
    // Rate limiting delay
    if (i + batchSize < companies.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  return results;
}
