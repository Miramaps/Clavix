import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

/**
 * Advanced Analytics API
 * Provides detailed metrics and insights
 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const periodDays = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - periodDays);

    // Company growth over time
    const companyGrowth = await db.$queryRaw<any[]>`
      SELECT 
        DATE("createdAt") as date,
        COUNT(*)::int as count,
        SUM(CASE WHEN "overallLeadScore" >= 75 THEN 1 ELSE 0 END)::int as hot_leads,
        SUM(CASE WHEN "overallLeadScore" >= 50 AND "overallLeadScore" < 75 THEN 1 ELSE 0 END)::int as warm_leads
      FROM "Company"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt")
      ORDER BY date ASC
    `;

    // Score distribution
    const scoreDistribution = await db.$queryRaw<any[]>`
      SELECT 
        CASE
          WHEN "overallLeadScore" >= 90 THEN '90-100'
          WHEN "overallLeadScore" >= 80 THEN '80-89'
          WHEN "overallLeadScore" >= 70 THEN '70-79'
          WHEN "overallLeadScore" >= 60 THEN '60-69'
          WHEN "overallLeadScore" >= 50 THEN '50-59'
          WHEN "overallLeadScore" >= 40 THEN '40-49'
          WHEN "overallLeadScore" >= 30 THEN '30-39'
          WHEN "overallLeadScore" >= 20 THEN '20-29'
          WHEN "overallLeadScore" >= 10 THEN '10-19'
          ELSE '0-9'
        END as range,
        COUNT(*)::int as count
      FROM "Company"
      WHERE status = 'active'
      GROUP BY range
      ORDER BY range DESC
    `;

    // Industry performance
    const industryPerformance = await db.company.groupBy({
      by: ['industryDescription'],
      where: {
        industryDescription: { not: null },
        status: 'active',
      },
      _count: true,
      _avg: {
        overallLeadScore: true,
        employeeCount: true,
      },
      orderBy: {
        _avg: {
          overallLeadScore: 'desc',
        },
      },
      take: 20,
    });

    // Geographic insights
    const geoInsights = await db.company.groupBy({
      by: ['county', 'municipality'],
      where: {
        county: { not: null },
        status: 'active',
      },
      _count: true,
      _avg: {
        overallLeadScore: true,
      },
      orderBy: {
        _count: {
          county: 'desc',
        },
      },
      take: 50,
    });

    // Contact data completeness
    const dataCompleteness = await db.$queryRaw<any[]>`
      SELECT 
        COUNT(CASE WHEN website IS NOT NULL THEN 1 END)::int as has_website,
        COUNT(CASE WHEN phone IS NOT NULL THEN 1 END)::int as has_phone,
        COUNT(CASE WHEN email IS NOT NULL THEN 1 END)::int as has_email,
        COUNT(CASE WHEN "logoUrl" IS NOT NULL THEN 1 END)::int as has_logo,
        COUNT(CASE WHEN "aiSummary" IS NOT NULL THEN 1 END)::int as has_summary,
        COUNT(*)::int as total
      FROM "Company"
      WHERE status = 'active'
    `;

    // Pipeline metrics (if deals exist)
    const pipelineMetrics = await db.deal.groupBy({
      by: ['status'],
      _count: true,
      _sum: { value: true },
      _avg: { value: true },
    });

    // Activity trends
    const activityTrends = await db.$queryRaw<any[]>`
      SELECT 
        DATE("createdAt") as date,
        type,
        COUNT(*)::int as count
      FROM "Activity"
      WHERE "createdAt" >= ${startDate}
      GROUP BY DATE("createdAt"), type
      ORDER BY date ASC
    `;

    // Enrichment stats
    const enrichmentStats = await db.contactEnrichment.groupBy({
      by: ['providerName'],
      _count: true,
      _avg: { confidence: true },
    });

    // Conversion funnel (if we have deals)
    const conversionFunnel = await db.$queryRaw<any[]>`
      SELECT 
        stage.name,
        stage.order,
        COUNT(d.id)::int as count,
        SUM(d.value) as total_value,
        AVG(d.value) as avg_value
      FROM "PipelineStage" stage
      LEFT JOIN "Deal" d ON d."stageId" = stage.id AND d.status = 'open'
      WHERE stage."isActive" = true
      GROUP BY stage.id, stage.name, stage.order
      ORDER BY stage.order ASC
    `;

    return NextResponse.json({
      period: periodDays,
      companyGrowth,
      scoreDistribution,
      industryPerformance,
      geoInsights,
      dataCompleteness: dataCompleteness[0] || {},
      pipelineMetrics,
      activityTrends,
      enrichmentStats,
      conversionFunnel,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to fetch advanced analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
