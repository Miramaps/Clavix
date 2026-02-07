import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { generateCompanySummary, formatSummaryAsText } from '@/lib/ai/summary';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { id } = await params;
    const company = await db.company.findUnique({
      where: { id },
      include: {
        roles: true,
        subEntities: true,
      },
    });
    
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }
    
    const summary = await generateCompanySummary(company);
    const summaryText = formatSummaryAsText(summary);
    
    const updated = await db.company.update({
      where: { id },
      data: { aiSummary: summaryText },
    });
    
    return NextResponse.json({
      success: true,
      summary: summaryText,
    });
  } catch (error) {
    console.error('Failed to regenerate summary:', error);
    return NextResponse.json(
      { error: 'Failed to regenerate summary' },
      { status: 500 }
    );
  }
}
