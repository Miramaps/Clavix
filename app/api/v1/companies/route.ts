/**
 * External API v1 for integrations
 * Webhook-friendly JSON API
 */
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// Verify API key from header
function verifyApiKey(request: NextRequest): boolean {
  const apiKey = request.headers.get('x-api-key');
  const validKey = process.env.EXTERNAL_API_KEY;
  
  if (!validKey) {
    console.warn('EXTERNAL_API_KEY not set - external API disabled');
    return false;
  }
  
  return apiKey === validKey;
}

// GET /api/v1/companies - List companies (external API)
export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;
    
    const minScore = searchParams.get('minScore');
    const status = searchParams.get('status') || 'active';
    const municipality = searchParams.get('municipality');
    const county = searchParams.get('county');

    const where: any = { status };
    if (minScore) where.overallLeadScore = { gte: parseInt(minScore) };
    if (municipality) where.municipality = { contains: municipality, mode: 'insensitive' };
    if (county) where.county = county;

    const [companies, total] = await Promise.all([
      db.company.findMany({
        where,
        skip,
        take: limit,
        orderBy: { overallLeadScore: 'desc' },
        select: {
          id: true,
          orgnr: true,
          name: true,
          organizationFormCode: true,
          status: true,
          municipality: true,
          county: true,
          address: true,
          industryCode: true,
          industryDescription: true,
          employeeCount: true,
          website: true,
          phone: true,
          email: true,
          overallLeadScore: true,
          aiUseCaseFit: true,
          aiUrgencyScore: true,
          aiDataQualityScore: true,
          aiSummary: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      db.company.count({ where }),
    ]);

    return NextResponse.json({
      data: companies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      meta: {
        apiVersion: '1.0',
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('External API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/v1/companies/webhook - Webhook endpoint
export async function POST(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { event, data } = body;

    // Handle different webhook events
    switch (event) {
      case 'company.created':
        // Handle new company webhook
        console.log('Webhook: Company created', data);
        break;
      
      case 'company.updated':
        // Handle company update webhook
        console.log('Webhook: Company updated', data);
        break;
      
      case 'deal.created':
        // Handle new deal webhook
        console.log('Webhook: Deal created', data);
        break;
      
      default:
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      event,
      processedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}
