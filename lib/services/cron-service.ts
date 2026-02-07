/**
 * Cron Service for Automated Tasks
 * Handles scheduled jobs like:
 * - Daily company sync
 * - Score updates
 * - Email campaigns
 */

import { db } from '../db';
import { syncIncrementalEnheter } from './sync-service';
import { calculateLeadScore } from '../scoring/engine';

/**
 * Daily sync job - Run incremental sync
 */
export async function runDailySync() {
  console.log('[CRON] Starting daily sync...');
  
  try {
    const jobId = await syncIncrementalEnheter();
    console.log(`[CRON] Daily sync completed. Job ID: ${jobId}`);
    return { success: true, jobId };
  } catch (error) {
    console.error('[CRON] Daily sync failed:', error);
    return { success: false, error };
  }
}

/**
 * Update scores for all companies
 */
export async function updateAllScores() {
  console.log('[CRON] Starting score updates...');
  
  try {
    const companies = await db.company.findMany({
      where: { status: 'active' },
      include: {
        subEntities: true,
      },
    });

    let updated = 0;
    
    for (const company of companies) {
      try {
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

        // Update explanations
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

        updated++;

        if (updated % 100 === 0) {
          console.log(`[CRON] Updated ${updated} companies...`);
        }
      } catch (error) {
        console.error(`[CRON] Failed to update score for company ${company.id}:`, error);
      }
    }

    console.log(`[CRON] Score updates completed. Updated ${updated} companies.`);
    return { success: true, updated };
  } catch (error) {
    console.error('[CRON] Score update failed:', error);
    return { success: false, error };
  }
}

/**
 * Send scheduled email campaigns
 */
export async function sendScheduledCampaigns() {
  console.log('[CRON] Checking for scheduled campaigns...');
  
  try {
    const now = new Date();
    
    const campaigns = await db.emailCampaign.findMany({
      where: {
        status: 'scheduled',
        scheduledFor: {
          lte: now,
        },
      },
    });

    for (const campaign of campaigns) {
      try {
        // Update status to sending
        await db.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: 'sending' },
        });

        // TODO: Implement actual email sending here
        // This would integrate with Resend, SendGrid, etc.
        console.log(`[CRON] Would send campaign: ${campaign.name}`);

        // Update status to sent
        await db.emailCampaign.update({
          where: { id: campaign.id },
          data: {
            status: 'sent',
            sentAt: new Date(),
          },
        });
      } catch (error) {
        console.error(`[CRON] Failed to send campaign ${campaign.id}:`, error);
        
        await db.emailCampaign.update({
          where: { id: campaign.id },
          data: { status: 'failed' },
        });
      }
    }

    console.log(`[CRON] Processed ${campaigns.length} campaigns.`);
    return { success: true, processed: campaigns.length };
  } catch (error) {
    console.error('[CRON] Campaign processing failed:', error);
    return { success: false, error };
  }
}

/**
 * Cleanup old data
 */
export async function cleanupOldData() {
  console.log('[CRON] Starting data cleanup...');
  
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Delete old audit logs
    const deletedAudits = await db.auditLog.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo,
        },
      },
    });

    console.log(`[CRON] Deleted ${deletedAudits.count} old audit logs.`);
    return { success: true, deleted: deletedAudits.count };
  } catch (error) {
    console.error('[CRON] Data cleanup failed:', error);
    return { success: false, error };
  }
}

/**
 * Main cron job runner
 * Call this from your cron scheduler (Railway, Vercel Cron, etc.)
 */
export async function runScheduledJobs() {
  console.log('[CRON] Starting scheduled jobs...');
  
  const results = {
    sync: await runDailySync(),
    scores: await updateAllScores(),
    campaigns: await sendScheduledCampaigns(),
    cleanup: await cleanupOldData(),
  };

  console.log('[CRON] All scheduled jobs completed.');
  return results;
}
