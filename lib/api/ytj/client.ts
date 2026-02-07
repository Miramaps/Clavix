/**
 * YTJ (Yritys- ja yhteisötietojärjestelmä) API Client (Finland)
 * https://www.avoindata.fi/data/fi/dataset/ytj
 * 
 * Finland also provides free public business registry data!
 * API: https://avoindata.prh.fi/
 */

export interface YTJCompany {
  businessId: string; // Y-tunnus (e.g. "1234567-8")
  name: string;
  registrationDate?: string;
  companyForm?: string;
  businessLine?: string;
  businessIdChanges?: Array<{ change: string; changeDate: string }>;
  addresses?: Array<{
    street?: string;
    postCode?: string;
    city?: string;
    type?: string;
  }>;
  contactDetails?: Array<{
    type?: string;
    value?: string;
  }>;
  companyForms?: Array<{
    name: string;
    language: string;
    registrationDate?: string;
  }>;
  businessLines?: Array<{
    code: string;
    name: string;
    language: string;
  }>;
}

export interface YTJSearchResponse {
  results?: YTJCompany[];
  totalResults?: number;
  resultsFrom?: number;
  maxResults?: number;
}

const BASE_URL = process.env.YTJ_BASE_URL || 'https://avoindata.prh.fi/bis/v1';
const USER_AGENT = process.env.YTJ_USER_AGENT || 'CLAVIX/1.0 (contact@clavix.no)';

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
    throw new Error(`YTJ API error: ${response.status} ${response.statusText}`);
  }

  return response;
}

export class YTJClient {
  private baseUrl: string;

  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Search for Finnish companies
   */
  async searchCompanies(params: {
    name?: string;
    businessId?: string;
    companyForm?: string;
    maxResults?: number;
    resultsFrom?: number;
  } = {}): Promise<YTJSearchResponse> {
    try {
      const searchParams = new URLSearchParams();
      
      if (params.name) searchParams.set('name', params.name);
      if (params.businessId) searchParams.set('businessId', params.businessId);
      if (params.companyForm) searchParams.set('companyForm', params.companyForm);
      if (params.maxResults !== undefined) searchParams.set('maxResults', params.maxResults.toString());
      if (params.resultsFrom !== undefined) searchParams.set('resultsFrom', params.resultsFrom.toString());

      const url = `${this.baseUrl}?${searchParams.toString()}`;
      const response = await resilientFetch(url);
      const data = await response.json();

      return {
        results: data.results || [],
        totalResults: data.totalResults || 0,
        resultsFrom: data.resultsFrom || 0,
        maxResults: data.maxResults || 0,
      };
    } catch (error) {
      console.error('Error fetching Finnish companies:', error);
      return { results: [], totalResults: 0 };
    }
  }

  /**
   * Get single Finnish company by business ID (Y-tunnus)
   */
  async getCompany(businessId: string): Promise<YTJCompany | null> {
    try {
      const url = `${this.baseUrl}/${businessId}`;
      const response = await resilientFetch(url);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        return data.results[0];
      }
      
      return null;
    } catch (error) {
      console.error(`Error fetching Finnish company ${businessId}:`, error);
      return null;
    }
  }

  /**
   * Get companies by company form
   */
  async getCompaniesByForm(companyForm: string, maxResults: number = 100): Promise<YTJSearchResponse> {
    return this.searchCompanies({ companyForm, maxResults });
  }
}

export const ytjClient = new YTJClient();
