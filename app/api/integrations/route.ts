/**
 * Integrations API (Slack, Teams, Webhooks)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { integrationService } from '@/lib/services/integration-service';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const integrations = await db.integration.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        logs: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return NextResponse.json({ integrations });
  } catch (error: any) {
    console.error('Error fetching integrations:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch integrations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can create integrations
    const userId = (session.user as any).id;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can create integrations' }, { status: 403 });
    }

    const body = await request.json();
    const { type, name, config, events } = body;

    if (!type || !name || !config || !events) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const integration = await integrationService.createIntegration(
      type,
      name,
      config,
      events
    );

    return NextResponse.json({
      success: true,
      integration,
    });
  } catch (error: any) {
    console.error('Error creating integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create integration' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can update integrations
    const userId = (session.user as any).id;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can update integrations' }, { status: 403 });
    }

    const body = await request.json();
    const { integrationId, ...updates } = body;

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 });
    }

    const integration = await integrationService.updateIntegration(integrationId, updates);

    return NextResponse.json({
      success: true,
      integration,
    });
  } catch (error: any) {
    console.error('Error updating integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update integration' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete integrations
    const userId = (session.user as any).id;
    const user = await db.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Only admins can delete integrations' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const integrationId = searchParams.get('id');

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID required' }, { status: 400 });
    }

    await integrationService.deleteIntegration(integrationId);

    return NextResponse.json({
      success: true,
      message: 'Integration deleted',
    });
  } catch (error: any) {
    console.error('Error deleting integration:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete integration' },
      { status: 500 }
    );
  }
}
