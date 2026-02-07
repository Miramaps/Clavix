import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/pipeline/deals - List deals
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'open';
    const stageId = searchParams.get('stageId');
    const priority = searchParams.get('priority');
    const ownerId = searchParams.get('ownerId');

    const where: any = { status };
    if (stageId) where.stageId = stageId;
    if (priority) where.priority = priority;
    if (ownerId) where.ownerId = ownerId;

    const deals = await db.deal.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            orgnr: true,
            municipality: true,
            overallLeadScore: true,
            logoUrl: true,
          },
        },
        stage: true,
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        _count: {
          select: {
            activities: true,
            notes: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    // Calculate stats
    const stats = await db.deal.groupBy({
      by: ['stageId'],
      where: { status: 'open' },
      _count: true,
      _sum: { value: true },
    });

    return NextResponse.json({ deals, stats });
  } catch (error) {
    console.error('Failed to fetch deals:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

// POST /api/pipeline/deals - Create deal
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const {
      companyId,
      title,
      description,
      value,
      stageId,
      priority,
      expectedCloseDate,
      contactPerson,
      contactEmail,
      contactPhone,
    } = body;

    const deal = await db.deal.create({
      data: {
        companyId,
        title,
        description,
        value: value ? parseFloat(value) : null,
        stageId,
        ownerId: session.user?.id,
        priority: priority || 'medium',
        expectedCloseDate: expectedCloseDate ? new Date(expectedCloseDate) : null,
        contactPerson,
        contactEmail,
        contactPhone,
      },
      include: {
        company: true,
        stage: true,
        owner: true,
      },
    });

    // Create activity
    await db.activity.create({
      data: {
        dealId: deal.id,
        companyId,
        userId: session.user?.id!,
        type: 'note',
        title: 'Deal opprettet',
        description: `Deal "${title}" ble opprettet`,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({ deal });
  } catch (error) {
    console.error('Failed to create deal:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
