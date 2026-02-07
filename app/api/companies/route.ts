import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const session = await auth();
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const { searchParams } = new URL(request.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const skip = (page - 1) * limit;
    
    // Filters
    const status = searchParams.get('status');
    const minScore = searchParams.get('minScore');
    const maxScore = searchParams.get('maxScore');
    const municipality = searchParams.get('municipality');
    const county = searchParams.get('county');
    const industryCode = searchParams.get('industryCode');
    const minEmployees = searchParams.get('minEmployees');
    const maxEmployees = searchParams.get('maxEmployees');
    const hasPhone = searchParams.get('hasPhone');
    const hasWebsite = searchParams.get('hasWebsite');
    const hasRoles = searchParams.get('hasRoles');
    const search = searchParams.get('search');
    const updatedSince = searchParams.get('updatedSince');
    const organizationForm = searchParams.get('organizationForm');
    const createdAfter = searchParams.get('createdAfter');
    
    // Build where clause
    const where: any = {};
    
    if (status) where.status = status;
    if (minScore) where.overallLeadScore = { ...where.overallLeadScore, gte: parseInt(minScore) };
    if (maxScore) where.overallLeadScore = { ...where.overallLeadScore, lte: parseInt(maxScore) };
    if (municipality) where.municipality = { contains: municipality, mode: 'insensitive' };
    if (county) where.county = county;
    if (industryCode) where.industryCode = { startsWith: industryCode };
    if (minEmployees) where.employeeCount = { ...where.employeeCount, gte: parseInt(minEmployees) };
    if (maxEmployees) where.employeeCount = { ...where.employeeCount, lte: parseInt(maxEmployees) };
    if (hasPhone === 'true') where.phone = { not: null };
    if (hasPhone === 'false') where.phone = null;
    if (hasWebsite === 'true') where.website = { not: null };
    if (hasWebsite === 'false') where.website = null;
    if (hasRoles === 'true') where.hasRolesData = true;
    if (organizationForm) where.organizationFormCode = organizationForm;
    if (createdAfter) where.createdAt = { gte: new Date(createdAfter) };
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { orgnr: { contains: search } },
      ];
    }
    if (updatedSince) {
      where.lastSeenAt = { gte: new Date(updatedSince) };
    }
    
    // Sort
    const sortBy = searchParams.get('sortBy') || 'overallLeadScore';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          subEntities: true,
          _count: {
            select: {
              roles: true,
              subEntities: true,
            },
          },
        },
      }),
      db.company.count({ where }),
    ]);
    
    return NextResponse.json({
      data: companies,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Failed to fetch companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}
