/**
 * Bolagsverket API Client (Sweden)
 * https://www.bolagsverket.se/
 * 
 * Note: Bolagsverket doesn't have a free public API like Norway's Brønnøysundregistrene.
 * This is a framework for integration when API access is obtained.
 * Alternative: Use third-party services like Allabolag API or scraping (with permission).
 */

export interface BolagsverketCompany {
  organisationsnummer: string;
  namn: string;
  organisationsform?: string;
  status?: string;
  registreringsdatum?: string;
  kommun?: string;
  lan?: string;
  adress?: string;
  postnummer?: string;
  ort?: string;
  sni?: string; // SNI-kod (industry code)
  antalAnstallda?: number;
  hemsida?: string;
  telefon?: string;
  epost?: string;
}

export interface BolagsverketResponse {
  hits?: BolagsverketCompany[];
  totalHits?: number;
  page?: number;
  pageSize?: number;
}

const BASE_URL = process.env.BOLAGSVERKET_BASE_URL || 'https://api.bolagsverket.se';
const API_KEY = process.env.BOLAGSVERKET_API_KEY || '';

async function resilientFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Bolagsverket API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

export class BolagsverketClient {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search for Swedish companies
   * Note: Actual implementation depends on available API
   */
  async searchCompanies(params: {
    query?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<BolagsverketResponse> {
    if (!API_KEY) {
      console.warn('BOLAGSVERKET_API_KEY not configured. Returning empty results.');
      return { hits: [], totalHits: 0 };
    }

    const searchParams = new URLSearchParams();
    if (params.query) searchParams.set('q', params.query);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.pageSize !== undefined) searchParams.set('size', params.pageSize.toString());

    try {
      const url = `${this.baseUrl}/search?${searchParams.toString()}`;
      const response = await resilientFetch(url);
      return response.json();
    } catch (error) {
      console.error('Error fetching Swedish companies:', error);
      return { hits: [], totalHits: 0 };
    }
  }

  /**
   * Get single Swedish company by organisationsnummer
   */
  async getCompany(orgnr: string): Promise<BolagsverketCompany | null> {
    if (!API_KEY) {
      console.warn('BOLAGSVERKET_API_KEY not configured.');
      return null;
    }

    try {
      const url = `${this.baseUrl}/companies/${orgnr}`;
      const response = await resilientFetch(url);
      return response.json();
    } catch (error) {
      console.error(`Error fetching Swedish company ${orgnr}:`, error);
      return null;
    }
  }
}

export const bolagsverketClient = new BolagsverketClient();
