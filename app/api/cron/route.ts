import { NextRequest, NextResponse } from 'next/server';
import { runScheduledJobs, runDailySync, updateAllScores } from '@/lib/services/cron-service';

/**
 * Cron endpoint for Railway/Vercel
 * Secure with CRON_SECRET in production
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret in production
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const job = searchParams.get('job');

    let result;
    
    switch (job) {
      case 'sync':
        result = await runDailySync();
        break;
      case 'scores':
        result = await updateAllScores();
        break;
      case 'all':
      default:
        result = await runScheduledJobs();
        break;
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      result,
    });
  } catch (error) {
    console.error('Cron job failed:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
