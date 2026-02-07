/**
 * Integration Event Trigger API
 * For testing and manual event triggering
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { integrationService } from '@/lib/services/integration-service';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = (session as any).userId;
    const body = await request.json();
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json({ error: 'Missing event or data' }, { status: 400 });
    }

    // Log audit
    await db.auditLog.create({
      data: {
        userId,
        action: 'integration_event_triggered',
        entityType: 'integration',
        metadata: { event, data },
      },
    });

    // Trigger the event
    const results = await integrationService.triggerEvent(event, data);

    const successCount = results.filter(r => r.status === 'fulfilled').length;
    const errorCount = results.filter(r => r.status === 'rejected').length;

    return NextResponse.json({
      success: true,
      message: `Event triggered: ${successCount} succeeded, ${errorCount} failed`,
      results: results.map((r, i) => ({
        status: r.status,
        value: r.status === 'fulfilled' ? r.value : undefined,
        error: r.status === 'rejected' ? r.reason?.message : undefined,
      })),
    });
  } catch (error: any) {
    console.error('Error triggering integration event:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to trigger integration event' },
      { status: 500 }
    );
  }
}
