import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { calculateLeadScore } from '@/lib/scoring/engine';
import { generateCompanySummary, formatSummaryAsText } from '@/lib/ai/summary';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const company = await db.company.findUnique({
      where: { id: params.id },
      include: {
        roles: true,
        subEntities: true,
        scoreExplanations: true,
      },
    });
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    return NextResponse.json(company);
  } catch (error) {
    console.error('Failed to fetch company:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    
    const company = await db.company.update({
      where: { id: params.id },
      data: body,
    });
    
    return NextResponse.json(company);
  } catch (error) {
    console.error('Failed to update company:', error);
    return NextResponse.json(
      { error: 'Failed to update company' },
      { status: 500 }
    );
  }
}
