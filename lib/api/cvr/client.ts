/**
 * CVR API Client (Denmark)
 * https://datacvr.virk.dk/
 * 
 * Denmark has a free public API similar to Norway!
 * Documentation: https://datacvr.virk.dk/artikel/system-til-system-adgang-til-cvr-data
 */

export interface CVRCompany {
  cvrNummer: number;
  navn: string;
  navne?: Array<{ navn: string; periode: { gyldigFra: string; gyldigTil?: string } }>;
  virksomhedsform?: {
    kode: string;
    langBeskrivelse: string;
  };
  virksomhedsstatus?: string;
  stiftelsesdato?: string;
  kommune?: {
    kommuneKode: number;
    kommuneNavn: string;
  };
  beliggenhedsadresse?: {
    vejnavn?: string;
    husnummerFra?: number;
    postnummer?: number;
    postdistrikt?: string;
    kommune?: { kommuneKode: number; kommuneNavn: string };
  };
  hovedbranche?: {
    branchekode: string;
    branchetekst: string;
  };
  antalPersoner?: number;
  hjemmeside?: string;
  telefon?: string;
  email?: string;
}

export interface CVRSearchResponse {
  hits?: {
    hits?: Array<{
      _source?: CVRCompany;
    }>;
    total?: { value: number };
  };
}

const BASE_URL = process.env.CVR_BASE_URL || 'https://cvrapi.dk';
const USER_AGENT = process.env.CVR_USER_AGENT || 'CLAVIX/1.0 (contact@clavix.no)';

async function resilientFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`CVR API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

export class CVRClient {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search for Danish companies
   */
  async searchCompanies(params: {
    query?: string;
    cvr?: string;
    page?: number;
    pageSize?: number;
  } = {}): Promise<CVRSearchResponse> {
    try {
      if (params.cvr) {
        // Direct CVR lookup
        return await this.getCompany(params.cvr);
      }

      // NOTE: cvrapi.dk is a simple API that only supports single CVR lookups
      // For bulk queries, use the official CVR API at data.virk.dk (requires more setup)
      // For demo, we'll return empty results
      console.warn('CVR API (cvrapi.dk) does not support bulk company search. Use official data.virk.dk API for production.');
      return { hits: { hits: [], total: { value: 0 } } };
    } catch (error) {
      console.error('Error fetching Danish companies:', error);
      return { hits: { hits: [], total: { value: 0 } } };
    }
  }

  /**
   * Get single Danish company by CVR number
   */
  async getCompany(cvr: string): Promise<CVRSearchResponse> {
    try {
      const url = `${this.baseUrl}/api?vat=${cvr}&country=dk`;
      const response = await resilientFetch(url);
      const data = await response.json();
      
      // CVR API returns direct company object, not search results
      return {
        hits: {
          hits: [{ _source: data }],
          total: { value: 1 },
        },
      };
    } catch (error) {
      console.error(`Error fetching Danish company ${cvr}:`, error);
      return { hits: { hits: [], total: { value: 0 } } };
    }
  }

  /**
   * Get companies by municipality
   */
  async getCompaniesByMunicipality(municipalityCode: number): Promise<CVRSearchResponse> {
    try {
      const url = `${this.baseUrl}/api?municipality=${municipalityCode}`;
      const response = await resilientFetch(url);
      return response.json();
    } catch (error) {
      console.error(`Error fetching companies for municipality ${municipalityCode}:`, error);
      return { hits: { hits: [], total: { value: 0 } } };
    }
  }
}

export const cvrClient = new CVRClient();
