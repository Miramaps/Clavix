#!/usr/bin/env tsx

import { db } from '../lib/db';
import { brregClient } from '../lib/api/brreg/client';
import { mapEnhetToCompany } from '../lib/api/brreg/mapper';
import { calculateLeadScore } from '../lib/scoring/engine';

async function main() {
  console.log('🚀 Starter test-synkronisering (5 sider = ~500 bedrifter)...\n');
  
  const startTime = Date.now();
  
  const syncJob = await db.syncJob.create({
    data: {
      type: 'full',
      status: 'running',
      startedAt: new Date(),
    },
  });
  
  let processed = 0;
  let errors = 0;
  const maxPages = 5; // Bare første 5 sider
  const pageSize = 100;
  
  try {
    for (let page = 0; page < maxPages; page++) {
      console.log(`\n📄 Henter side ${page + 1}/${maxPages}...`);
      
      const response = await brregClient.getEnheter({
        page,
        size: pageSize,
      });
      
      const enheter = response._embedded?.enheter || [];
      console.log(`   Fant ${enheter.length} bedrifter på denne siden`);
      
      if (enheter.length === 0) {
        console.log('   ⚠️  Ingen flere bedrifter funnet');
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
          
          // Kalkuler score
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
          
          // Lagre score-forklaringer
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
          
          processed++;
          
          if (processed % 50 === 0) {
            console.log(`   ✓ ${processed} bedrifter behandlet...`);
          }
        } catch (error) {
          console.error(`   ✗ Feil ved synkronisering av ${enhet.organisasjonsnummer}:`, error);
          errors++;
        }
      }
    }
    
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'completed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Test-synkronisering fullført: ${processed} bedrifter behandlet, ${errors} feil`,
      },
    });
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✅ Test-synkronisering fullført på ${duration} sekunder!`);
    console.log(`📊 Totalt: ${processed} bedrifter behandlet, ${errors} feil`);
    console.log(`🆔 Jobb-ID: ${syncJob.id}`);
  } catch (error) {
    await db.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: 'failed',
        finishedAt: new Date(),
        processedCount: processed,
        errorCount: errors,
        log: `Feil: ${error instanceof Error ? error.message : 'Ukjent feil'}`,
      },
    });
    
    console.error('\n❌ Synkronisering feilet:', error);
    process.exit(1);
  }
}

main();
