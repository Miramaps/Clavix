import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  syncFullEnheter,
  syncIncrementalEnheter,
  syncCompanyRoles,
  syncSubEntities,
} from '@/lib/services/sync-service';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { type, generateAI } = body;
    
    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user?.id,
        action: 'sync_triggered',
        entityType: 'sync_job',
        metadata: { type, generateAI },
      },
    });
    
    let jobId: string;
    
    switch (type) {
      case 'full':
        jobId = await syncFullEnheter(undefined, generateAI);
        break;
      case 'incremental':
        jobId = await syncIncrementalEnheter();
        break;
      case 'roles':
        jobId = await syncCompanyRoles();
        break;
      case 'subentities':
        jobId = await syncSubEntities();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid sync type' },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      jobId,
    });
  } catch (error) {
    console.error('Sync failed:', error);
    return NextResponse.json(
      { error: 'Sync failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    
    const jobs = await db.syncJob.findMany({
      take: limit,
      orderBy: { startedAt: 'desc' },
    });
    
    return NextResponse.json({ jobs });
  } catch (error) {
    console.error('Failed to fetch sync jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sync jobs' },
      { status: 500 }
    );
  }
}
