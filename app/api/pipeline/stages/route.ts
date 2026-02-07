import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/pipeline/stages - List all pipeline stages
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const stages = await db.pipelineStage.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: { deals: true },
        },
      },
    });

    return NextResponse.json({ stages });
  } catch (error) {
    console.error('Failed to fetch pipeline stages:', error);
    return NextResponse.json({ error: 'Failed to fetch stages' }, { status: 500 });
  }
}

// POST /api/pipeline/stages - Create new stage
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, color, probability } = body;

    // Get max order
    const maxOrder = await db.pipelineStage.findFirst({
      orderBy: { order: 'desc' },
      select: { order: true },
    });

    const stage = await db.pipelineStage.create({
      data: {
        name,
        description,
        color,
        probability: probability || 0,
        order: (maxOrder?.order || 0) + 1,
      },
    });

    return NextResponse.json({ stage });
  } catch (error) {
    console.error('Failed to create stage:', error);
    return NextResponse.json({ error: 'Failed to create stage' }, { status: 500 });
  }
}
