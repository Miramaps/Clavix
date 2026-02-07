import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    // Get date ranges
    const now = new Date();
    const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const [
      totalCompanies,
      activeCompanies,
      highScoreLeads,
      mediumScoreLeads,
      recentUpdates,
      industryStats,
      syncHistory,
      newCompaniesLast24h,
      newCompaniesLast7d,
      newCompaniesLast30d,
      companiesByCounty,
      companiesByOrgForm,
      avgScoreByEmployeeCount,
      companiesWithWebsite,
      companiesWithPhone,
      dailyNewCompanies,
    ] = await Promise.all([
      db.company.count(),
      db.company.count({ where: { status: 'active' } }),
      db.company.count({
        where: {
          overallLeadScore: { gte: 75 },
          status: 'active',
        },
      }),
      db.company.count({
        where: {
          overallLeadScore: { gte: 50, lt: 75 },
          status: 'active',
        },
      }),
      db.company.count({
        where: {
          lastSeenAt: {
            gte: last7Days,
          },
        },
      }),
      db.company.groupBy({
        by: ['industryDescription'],
        where: {
          industryDescription: { not: null },
          status: 'active',
        },
        _count: true,
        _avg: {
          overallLeadScore: true,
        },
        orderBy: {
          _avg: {
            overallLeadScore: 'desc',
          },
        },
        take: 10,
      }),
      db.syncJob.findMany({
        where: { status: 'completed' },
        orderBy: { finishedAt: 'desc' },
        take: 30,
      }),
      db.company.count({
        where: {
          createdAt: { gte: last24Hours },
        },
      }),
      db.company.count({
        where: {
          createdAt: { gte: last7Days },
        },
      }),
      db.company.count({
        where: {
          createdAt: { gte: last30Days },
        },
      }),
      db.company.groupBy({
        by: ['county'],
        where: {
          county: { not: null },
          status: 'active',
        },
        _count: true,
        orderBy: {
          _count: {
            county: 'desc',
          },
        },
        take: 10,
      }),
      db.company.groupBy({
        by: ['organizationFormCode'],
        where: {
          organizationFormCode: { not: null },
          status: 'active',
        },
        _count: true,
        orderBy: {
          _count: {
            organizationFormCode: 'desc',
          },
        },
        take: 8,
      }),
      db.$queryRaw`
        SELECT 
          CASE
            WHEN "employeeCount" BETWEEN 1 AND 10 THEN '1-10'
            WHEN "employeeCount" BETWEEN 11 AND 50 THEN '11-50'
            WHEN "employeeCount" BETWEEN 51 AND 250 THEN '51-250'
            WHEN "employeeCount" > 250 THEN '251+'
            ELSE 'Ukjent'
          END as range,
          COUNT(*)::int as count,
          ROUND(AVG("overallLeadScore"))::int as avg_score
        FROM "Company"
        WHERE status = 'active' AND "employeeCount" IS NOT NULL
        GROUP BY range
        ORDER BY 
          CASE range
            WHEN '1-10' THEN 1
            WHEN '11-50' THEN 2
            WHEN '51-250' THEN 3
            WHEN '251+' THEN 4
            ELSE 5
          END
      ` as any[],
      db.company.count({
        where: {
          website: { not: null },
          status: 'active',
        },
      }),
      db.company.count({
        where: {
          phone: { not: null },
          status: 'active',
        },
      }),
      // Get daily new companies for last 30 days
      db.$queryRaw`
        SELECT 
          DATE("createdAt") as date,
          COUNT(*)::int as count
        FROM "Company"
        WHERE "createdAt" >= ${last30Days}
        GROUP BY DATE("createdAt")
        ORDER BY date DESC
      ` as any[],
    ]);
    
    return NextResponse.json({
      totalCompanies,
      activeCompanies,
      highScoreLeads,
      mediumScoreLeads,
      recentUpdates,
      topIndustries: industryStats,
      syncHistory,
      newCompanies: {
        last24h: newCompaniesLast24h,
        last7d: newCompaniesLast7d,
        last30d: newCompaniesLast30d,
      },
      companiesByCounty,
      companiesByOrgForm,
      avgScoreByEmployeeCount,
      companiesWithWebsite,
      companiesWithPhone,
      dailyNewCompanies,
    });
  } catch (error) {
    console.error('Failed to fetch dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
