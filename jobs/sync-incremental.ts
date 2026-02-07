#!/usr/bin/env tsx

import { syncIncrementalEnheter, SyncProgress } from '../lib/services/sync-service';

async function main() {
  console.log('Starting incremental sync of Norwegian companies...\n');
  
  const startTime = Date.now();
  
  const onProgress = (progress: SyncProgress) => {
    console.log(
      `Progress: ${progress.processed} processed, ${progress.errors} errors`
    );
  };
  
  try {
    const jobId = await syncIncrementalEnheter(undefined, onProgress);
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    console.log(`\n✓ Incremental sync completed in ${duration}s`);
    console.log(`Job ID: ${jobId}`);
  } catch (error) {
    console.error('\n✗ Sync failed:', error);
    process.exit(1);
  }
}

main();
