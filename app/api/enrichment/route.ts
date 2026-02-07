import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { createHunterService } from '@/lib/services/enrichment/hunter-service';
import { createApolloService } from '@/lib/services/enrichment/apollo-service';

// POST /api/enrichment - Enrich company contacts
export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { companyId, provider } = body;

    // Get company
    const company = await db.company.findUnique({
      where: { id: companyId },
      select: { id: true, name: true, website: true, orgnr: true },
    });

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    if (!company.website) {
      return NextResponse.json({ error: 'Company has no website' }, { status: 400 });
    }

    // Extract domain from website
    const domain = new URL(company.website).hostname.replace('www.', '');
    
    let contacts: any[] = [];

    // Use Hunter.io
    if (provider === 'hunter' || provider === 'all') {
      const hunter = createHunterService();
      if (hunter) {
        try {
          const hunterResults = await hunter.findEmails(domain);
          contacts.push(...hunterResults.map(c => ({ ...c, provider: 'hunter' })));
        } catch (error) {
          console.error('Hunter.io enrichment failed:', error);
        }
      }
    }

    // Use Apollo.io
    if (provider === 'apollo' || provider === 'all') {
      const apollo = createApolloService();
      if (apollo) {
        try {
          const apolloResults = await apollo.searchPeople(domain, company.name);
          contacts.push(...apolloResults.map(c => ({ ...c, provider: 'apollo' })));
        } catch (error) {
          console.error('Apollo.io enrichment failed:', error);
        }
      }
    }

    // Save contacts to database
    const enrichments = [];
    for (const contact of contacts) {
      const enrichment = await db.contactEnrichment.create({
        data: {
          companyId: company.id,
          providerName: contact.provider,
          contactName: contact.firstName && contact.lastName 
            ? `${contact.firstName} ${contact.lastName}`
            : undefined,
          title: contact.title || contact.position,
          email: contact.email,
          phone: contact.phone,
          linkedin: contact.linkedin,
          confidence: contact.confidence,
          rawData: contact,
        },
      });
      enrichments.push(enrichment);
    }

    // Create activity log
    await db.activity.create({
      data: {
        companyId: company.id,
        userId: session.user?.id!,
        type: 'note',
        title: 'Kontakter beriket',
        description: `Fant ${contacts.length} kontakter via ${provider}`,
        status: 'completed',
        completedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      count: enrichments.length,
      enrichments,
    });
  } catch (error) {
    console.error('Enrichment failed:', error);
    return NextResponse.json(
      { error: 'Enrichment failed', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// GET /api/enrichment/providers - List available providers
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const providers = [
    {
      id: 'hunter',
      name: 'Hunter.io',
      enabled: !!process.env.HUNTER_API_KEY,
      description: 'Finn e-postadresser basert på domene',
    },
    {
      id: 'apollo',
      name: 'Apollo.io',
      enabled: !!process.env.APOLLO_API_KEY,
      description: 'Finn kontakter og bedriftsdata',
    },
  ];

  return NextResponse.json({ providers });
}
