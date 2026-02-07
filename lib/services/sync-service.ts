import { db } from '../db';
import { brregClient } from '../api/brreg/client';
import { mapEnhetToCompany, mapUnderenhetToSubEntity, mapRolleToCompanyRole } from '../api/brreg/mapper';
import { calculateLeadScore } from '../scoring/engine';
import { generateCompanySummary, formatSummaryAsText } from '../ai/summary';

export interface SyncProgress {
  type: string;
  processed: number;
  errors: number;
  currentPage?: number;
  totalPages?: number;
}

export type SyncProgressCallback = (progress: SyncProgress) => void;

/**
 * Full sync of all enheter (companies)
 */
export async function syncFullEnheter(
  onProgress?: SyncProgressCallback,
  generateAI = false
): Promise<string> {
  const syncJob = await db.syncJob.create({
    data: {
      type: 'full',
      status: 'running',
      startedAt: new Date(),
    },
  });
  
  let processed = 0;
  let errors = 0;
  const pageSize = 100;
  let currentPage = 0;
  let hasMore = true;
  
  try {
    while (hasMore) {
      onProgress?.({
        type: 'full',
        processed,
        errors,
        currentPage,
      });
      
      const response = await brregClient.getEnheter({
        page: currentPage,
        size: pageSize,
      });
      
      const enheter = response._embedded?.enheter || [];
      
      if (enheter.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const enhet of enheter) {
        try {
          const companyData = await mapEnhetToCompany(enhet);
          
          const company = await db.company.upsert({
            where: { orgnr: enhet.organisasjonsnummer },
            update: {
              ...companyData,
              lastSeenAt: new Date(),
            },
            create: companyData,
            include: {
              subEntities: true,
            },
          });
          
          // Calculate score
          const score = calculateLeadScore(company);
          
          // Update scores and explanations
          await db.company.update({
            where: { id: company.id },
            data: {
              overallLeadScore: score.overallLeadScore,
              aiUseCaseFit: score.aiUseCaseFit,
              aiUrgencyScore: score.aiUrgencyScore,
              aiDataQualityScore: score.aiDataQualityScore,
            },
          });
          
          // Store score explanations
          await db.scoreExplanation.deleteMany({
            where: { companyId: company.id },
          });
          
          await db.scoreExplanation.createMany({
            data: score.signals.map(signal => ({
              companyId: company.id,
              signal: signal.signal,
              weight: signal.weight,
              reason: signal.reason,
            })),
          });
          
          // Generate AI summary if requested
          if (generateAI && score.overallLeadScore >= 70) {
            try {
              const summary = await generateCompanySummary(company);
              const summaryText = formatSummaryAsText(summary);
              
              await db.company.update({
                where: { id: company.id },
                data: { aiSummary: summaryText },
              });
            } catch (aiError) {
              console.error(`AI summary failed for ${company.orgnr}:`, aiError);
            }
          }
          
          processed++;
        } catch (error) {
          console.error(`Failed to sync enhet ${enhet.organisasjonsnummer}:`, error);
          errors++;
        }
      }
      
      currentPage++;
      
      // Check if there are more pages
      if (!response._links?.next) {
        hasMore = false;
      }
      
      // Safety limit to prevent infinite loops
      if (currentPage >= 1000) {
        hasMore = false;
      }
    }
    
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Synced ${processed} companies with ${errors} errors`,
      },
    });
    
    return syncJob.id;
  } catch (error) {
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    });
    
    throw error;
  }
}

/**
 * Incremental sync - only fetch updates since last sync
 */
export async function syncIncrementalEnheter(
  sinceDate?: Date,
  onProgress?: SyncProgressCallback
): Promise<string> {
  const syncJob = await db.syncJob.create({
    data: {
      type: 'incremental',
      status: 'running',
      startedAt: new Date(),
    },
  });
  
  let processed = 0;
  let errors = 0;
  
  try {
    // Get date to sync from - use yesterday if no last sync
    const lastSync = sinceDate || await getLastSuccessfulSync('incremental');
    const dateString = lastSync.toISOString().split('T')[0];
    
    console.log(`Syncing updates since: ${dateString}`);
    
    let currentPage = 0;
    let hasMore = true;
    
    while (hasMore) {
      onProgress?.({
        type: 'incremental',
        processed,
        errors,
        currentPage,
      });
      
      const response = await brregClient.getEnheterOppdateringer({
        dato: dateString,
        page: currentPage,
        size: 100,
      });
      
      const updates = response._embedded?.oppdaterteEnheter || [];
      
      if (updates.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const update of updates) {
        try {
          // Fetch full enhet data
          const enhet = await brregClient.getEnhet(update.organisasjonsnummer);
          const companyData = await mapEnhetToCompany(enhet);
          
          const company = await db.company.upsert({
            where: { orgnr: update.organisasjonsnummer },
            update: {
              ...companyData,
              lastSeenAt: new Date(),
            },
            create: companyData,
            include: {
              subEntities: true,
            },
          });
          
          // Recalculate score
          const score = calculateLeadScore(company);
          
          await db.company.update({
            where: { id: company.id },
            data: {
              overallLeadScore: score.overallLeadScore,
              aiUseCaseFit: score.aiUseCaseFit,
              aiUrgencyScore: score.aiUrgencyScore,
              aiDataQualityScore: score.aiDataQualityScore,
            },
          });
          
          processed++;
        } catch (error) {
          console.error(`Failed to sync update ${update.organisasjonsnummer}:`, error);
          errors++;
        }
      }
      
      currentPage++;
      
      if (!response._links?.next) {
        hasMore = false;
      }
    }
    
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Synced ${processed} updates since ${dateString}`,
      },
    });
    
    return syncJob.id;
  } catch (error) {
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    });
    
    throw error;
  }
}

/**
 * Sync roles for companies
 */
export async function syncCompanyRoles(
  companyIds?: string[],
  onProgress?: SyncProgressCallback
): Promise<string> {
  const syncJob = await db.syncJob.create({
    data: {
      type: 'roles',
      status: 'running',
      startedAt: new Date(),
    },
  });
  
  let processed = 0;
  let errors = 0;
  
  try {
    // Get companies to sync
    const companies = companyIds
      ? await db.company.findMany({
          where: { id: { in: companyIds } },
        })
      : await db.company.findMany({
          where: {
            hasRolesData: false,
            status: 'active',
          },
          take: 1000,
        });
    
    for (const company of companies) {
      onProgress?.({
        type: 'roles',
        processed,
        errors,
      });
      
      try {
        const rolesResponse = await brregClient.getEnhetRoller(company.orgnr);
        
        // Delete existing roles
        await db.companyRole.deleteMany({
          where: { companyId: company.id },
        });
        
        // Create new roles
        const rollegrupper = rolesResponse.rollegrupper || [];
        for (const gruppe of rollegrupper) {
          for (const rolle of gruppe.roller) {
            if (!rolle.fratraadt) {
              const roleData = mapRolleToCompanyRole(
                rolle,
                gruppe.type.beskrivelse,
                company.id
              );
              await db.companyRole.create({ data: roleData });
            }
          }
        }
        
        await db.company.update({
          where: { id: company.id },
          data: { hasRolesData: true },
        });
        
        processed++;
      } catch (error) {
        console.error(`Failed to sync roles for ${company.orgnr}:`, error);
        errors++;
      }
    }
    
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Synced roles for ${processed} companies`,
      },
    });
    
    return syncJob.id;
  } catch (error) {
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    });
    
    throw error;
  }
}

/**
 * Sync sub-entities
 */
export async function syncSubEntities(
  onProgress?: SyncProgressCallback
): Promise<string> {
  const syncJob = await db.syncJob.create({
    data: {
      type: 'subentities',
      status: 'running',
      startedAt: new Date(),
    },
  });
  
  let processed = 0;
  let errors = 0;
  let currentPage = 0;
  let hasMore = true;
  
  try {
    while (hasMore) {
      onProgress?.({
        type: 'subentities',
        processed,
        errors,
        currentPage,
      });
      
      const response = await brregClient.getUnderenheter({
        page: currentPage,
        size: 100,
      });
      
      const underenheter = response._embedded?.underenheter || [];
      
      if (underenheter.length === 0) {
        hasMore = false;
        break;
      }
      
      for (const underenhet of underenheter) {
        try {
          // Check if parent company exists
          const parentExists = await db.company.findUnique({
            where: { orgnr: underenhet.overordnetEnhet || '' },
          });
          
          if (parentExists) {
            const subEntityData = mapUnderenhetToSubEntity(underenhet);
            
            await db.subEntity.upsert({
              where: { orgnr: underenhet.organisasjonsnummer },
              update: subEntityData,
              create: subEntityData,
            });
          }
          
          processed++;
        } catch (error) {
          console.error(`Failed to sync underenhet ${underenhet.organisasjonsnummer}:`, error);
          errors++;
        }
      }
      
      currentPage++;
      
      if (!response._links?.next) {
        hasMore = false;
      }
      
      if (currentPage >= 500) {
        hasMore = false;
      }
    }
    
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Synced ${processed} sub-entities`,
      },
    });
    
    return syncJob.id;
  } catch (error) {
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      },
    });
    
    throw error;
  }
}

/**
 * Helper to get last successful sync date
 */
async function getLastSuccessfulSync(type: string): Promise<Date> {
  const lastJob = await db.syncJob.findFirst({
    where: {
      type,
      status: 'completed',
    },
    orderBy: {
      finishedAt: 'desc',
    },
  });
  
  if (lastJob?.finishedAt) {
    return lastJob.finishedAt;
  }
  
  // Default to 1 day ago (safer for first sync)
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date;
}
