import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function POST(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { filters, format = 'csv' } = body;
    
    // Build where clause from filters
    const where: any = {};
    
    if (filters.status) where.status = filters.status;
    if (filters.minScore) where.overallLeadScore = { gte: filters.minScore };
    if (filters.maxScore) where.overallLeadScore = { ...where.overallLeadScore, lte: filters.maxScore };
    if (filters.municipality) where.municipality = filters.municipality;
    if (filters.county) where.county = filters.county;
    if (filters.industryCode) where.industryCode = { startsWith: filters.industryCode };
    
    const companies = await db.company.findMany({
      where,
      include: {
        scoreExplanations: true,
      },
      take: 10000, // Limit exports
    });
    
    // Create audit log
    await db.auditLog.create({
      data: {
        userId: session.user?.id,
        action: 'export_csv',
        entityType: 'company',
        metadata: { count: companies.length, filters },
      },
    });
    
    if (format === 'csv') {
      const csv = generateCSV(companies);
      
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="companies-export-${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    } else {
      // JSON export
      return NextResponse.json(companies);
    }
  } catch (error) {
    console.error('Export failed:', error);
    return NextResponse.json(
      { error: 'Export failed' },
      { status: 500 }
    );
  }
}

function generateCSV(companies: any[]): string {
  const headers = [
    'Name',
    'Org Number',
    'Status',
    'Industry',
    'Employees',
    'Municipality',
    'County',
    'Phone',
    'Website',
    'Email',
    'Lead Score',
    'Use Case Fit',
    'Urgency Score',
    'Data Quality',
    'Top Reasons',
  ];
  
  const rows = companies.map(c => {
    const topReasons = c.scoreExplanations
      ?.sort((a: any, b: any) => b.weight - a.weight)
      .slice(0, 3)
      .map((s: any) => s.reason)
      .join('; ') || '';
    
    return [
      escapeCSV(c.name),
      c.orgnr,
      c.status,
      escapeCSV(c.industryDescription || ''),
      c.employeeCount || '',
      escapeCSV(c.municipality || ''),
      escapeCSV(c.county || ''),
      c.phone || '',
      c.website || '',
      c.email || '',
      c.overallLeadScore || 0,
      c.aiUseCaseFit || 0,
      c.aiUrgencyScore || 0,
      c.aiDataQualityScore || 0,
      escapeCSV(topReasons),
    ];
  });
  
  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(',')),
  ].join('\n');
  
  return csvContent;
}

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
