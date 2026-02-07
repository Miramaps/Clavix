/**
 * Nordic Sync API
 * Sync companies from Sweden, Denmark, Finland
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { nordicSyncService } from '@/lib/services/nordic-sync-service';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { country, limit = 100 } = body;

    // Log audit
    await db.auditLog.create({
      data: {
        userId: (session.user as any).id,
        action: 'nordic_sync_triggered',
        entityType: 'sync_job',
        metadata: { country, limit },
      },
    });

    let result;

    switch (country) {
      case 'SE':
        result = await nordicSyncService.syncSwedishCompanies(limit);
        break;
      case 'DK':
        result = await nordicSyncService.syncDanishCompanies(limit);
        break;
      case 'FI':
        result = await nordicSyncService.syncFinnishCompanies(limit);
        break;
      case 'ALL':
        result = await nordicSyncService.syncAllNordic(limit);
        break;
      default:
        return NextResponse.json({ error: 'Invalid country code' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Nordic sync completed for ${country}`,
      result,
    });
  } catch (error: any) {
    console.error('Nordic sync error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync Nordic companies' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get registry status
    const registries = await db.companyRegistry.findMany({
      orderBy: { country: 'asc' },
    });

    // Get company counts per country
    const companyCounts = await Promise.all(
      registries.map(async (registry) => {
        const count = await db.companyNordic.count({
          where: { country: registry.country },
        });
        return {
          country: registry.country,
          registryName: registry.registryName,
          count,
          lastSyncAt: registry.lastSyncAt,
          isActive: registry.isActive,
        };
      })
    );

    return NextResponse.json({
      registries: companyCounts,
    });
  } catch (error: any) {
    console.error('Error fetching Nordic registry status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch registry status' },
      { status: 500 }
    );
  }
}
