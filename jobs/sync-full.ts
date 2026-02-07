#!/usr/bin/env tsx

import { syncFullEnheter, SyncProgress } from '../lib/services/sync-service';

async function main() {
  console.log('Starting full sync of Norwegian companies...\n');
  
  const startTime = Date.now();
  
  const onProgress = (progress: SyncProgress) => {
    console.log(
      `Progress: ${progress.processed} processed, ${progress.errors} errors` +
      (progress.currentPage ? `, page ${progress.currentPage}` : '')
    );
  };
  
  try {
    const jobId = await syncFullEnheter(onProgress, false);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✓ Full sync completed in ${duration}s`);
    console.log(`Job ID: ${jobId}`);
  } catch (error) {
    console.error('\n✗ Sync failed:', error);
    process.exit(1);
  }
}

main();
