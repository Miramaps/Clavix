import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

// GET /api/saved-searches - List saved searches
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searches = await db.filterPreset.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ searches });
  } catch (error) {
    console.error('Failed to fetch saved searches:', error);
    return NextResponse.json({ error: 'Failed to fetch searches' }, { status: 500 });
  }
}

// POST /api/saved-searches - Create saved search
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, description, filters } = body;

    const search = await db.filterPreset.create({
      data: {
        name,
        description,
        filters,
      },
    });

    return NextResponse.json({ search });
  } catch (error) {
    console.error('Failed to create saved search:', error);
    return NextResponse.json({ error: 'Failed to create search' }, { status: 500 });
  }
}

// DELETE /api/saved-searches/[id] - Delete saved search
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    await db.filterPreset.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete saved search:', error);
    return NextResponse.json({ error: 'Failed to delete search' }, { status: 500 });
  }
}
