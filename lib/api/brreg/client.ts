import {
  BrregEnhet,
  BrregEnheterResponse,
  BrregUnderenhet,
  BrregUnderenheterResponse,
  BrregRollerResponse,
  BrregOppdateringerResponse,
  BrregOrganisasjonsform,
  BrregRolletype,
} from './types';

const BASE_URL = process.env.BRREG_BASE_URL || 'https://data.brreg.no';
const USER_AGENT = process.env.BRREG_USER_AGENT || 'ClawdSalesNorway/0.1.0';

interface FetchOptions {
  retries?: number;
  retryDelay?: number;
}

/**
 * Resilient fetch with exponential backoff
 */
async function resilientFetch(
  url: string,
  options: RequestInit & FetchOptions = {}
): Promise<Response> {
  const { retries = 3, retryDelay = 1000, ...fetchOptions } = options;
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'application/json',
          ...fetchOptions.headers,
        },
      });
      
      if (response.ok) {
        return response;
      }
      
      // Don't retry 4xx errors (except 429)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Retry on 5xx or 429
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (error) {
      lastError = error as Error;
      if (attempt < retries) {
        const delay = retryDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Request failed');
}

export class BrregClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = BASE_URL) {
    this.baseUrl = baseUrl;
  }
  
  /**
   * Get all enheter (main entities) with pagination
   */
  async getEnheter(params: {
    page?: number;
    size?: number;
    navn?: string;
    organisasjonsform?: string;
    naeringskode?: string;
    kommunenummer?: string;
    konkurs?: boolean;
  } = {}): Promise<BrregEnheterResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.navn) searchParams.set('navn', params.navn);
    if (params.organisasjonsform) searchParams.set('organisasjonsform', params.organisasjonsform);
    if (params.naeringskode) searchParams.set('naeringskode', params.naeringskode);
    if (params.kommunenummer) searchParams.set('kommunenummer', params.kommunenummer);
    if (params.konkurs !== undefined) searchParams.set('konkurs', params.konkurs.toString());
    
    const url = `${this.baseUrl}/enhetsregisteret/api/enheter?${searchParams.toString()}`;
    const response = await resilientFetch(url);
    return response.json();
  }
  
  /**
   * Get single enhet by organization number
   */
  async getEnhet(orgnr: string): Promise<BrregEnhet> {
    const url = `${this.baseUrl}/enhetsregisteret/api/enheter/${orgnr}`;
    const response = await resilientFetch(url);
    return response.json();
  }
  
  /**
   * Get roles for a specific enhet
   */
  async getEnhetRoller(orgnr: string): Promise<BrregRollerResponse> {
    const url = `${this.baseUrl}/enhetsregisteret/api/enheter/${orgnr}/roller`;
    const response = await resilientFetch(url);
    return response.json();
  }
  
  /**
   * Get all underenheter (sub-entities) with pagination
   */
  async getUnderenheter(params: {
    page?: number;
    size?: number;
    navn?: string;
    overordnetEnhet?: string;
    naeringskode?: string;
    kommunenummer?: string;
  } = {}): Promise<BrregUnderenheterResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    if (params.navn) searchParams.set('navn', params.navn);
    if (params.overordnetEnhet) searchParams.set('overordnetEnhet', params.overordnetEnhet);
    if (params.naeringskode) searchParams.set('naeringskode', params.naeringskode);
    if (params.kommunenummer) searchParams.set('kommunenummer', params.kommunenummer);
    
    const url = `${this.baseUrl}/enhetsregisteret/api/underenheter?${searchParams.toString()}`;
    const response = await resilientFetch(url);
    return response.json();
  }
  
  /**
   * Get single underenhet by organization number
   */
  async getUnderenhet(orgnr: string): Promise<BrregUnderenhet> {
    const url = `${this.baseUrl}/enhetsregisteret/api/underenheter/${orgnr}`;
    const response = await resilientFetch(url);
    return response.json();
  }
  
  /**
   * Get updates for enheter since a specific date
   */
  async getEnheterOppdateringer(params: {
    dato?: string; // YYYY-MM-DD
    page?: number;
    size?: number;
  } = {}): Promise<BrregOppdateringerResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.dato) searchParams.set('dato', params.dato);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    
    const url = `${this.baseUrl}/enhetsregisteret/api/oppdateringer/enheter?${searchParams.toString()}`;
    const response = await resilientFetch(url);
    return response.json();
  }
  
  /**
   * Get updates for underenheter since a specific date
   */
  async getUnderenheterOppdateringer(params: {
    dato?: string; // YYYY-MM-DD
    page?: number;
    size?: number;
  } = {}): Promise<BrregOppdateringerResponse> {
    const searchParams = new URLSearchParams();
    
    if (params.dato) searchParams.set('dato', params.dato);
    if (params.page !== undefined) searchParams.set('page', params.page.toString());
    if (params.size !== undefined) searchParams.set('size', params.size.toString());
    
    const url = `${this.baseUrl}/enhetsregisteret/api/oppdateringer/underenheter?${searchParams.toString()}`;
    const response = await resilientFetch(url);
    return response.json();
  }
  
  /**
   * Get all organization forms
   */
  async getOrganisasjonsformer(): Promise<BrregOrganisasjonsform[]> {
    const url = `${this.baseUrl}/enhetsregisteret/api/organisasjonsformer/enheter`;
    const response = await resilientFetch(url);
    const data = await response.json();
    return data._embedded?.organisasjonsformer || [];
  }
  
  /**
   * Get all role types
   */
  async getRolletyper(): Promise<BrregRolletype[]> {
    const url = `${this.baseUrl}/enhetsregisteret/api/roller/rolletyper`;
    const response = await resilientFetch(url);
    const data = await response.json();
    return data._embedded?.rolletyper || [];
  }
  
  /**
   * Download CSV/JSON data (bulk)
   * Note: These endpoints return large files, use with caution
   */
  async downloadEnheterCsv(): Promise<string> {
    const url = `${this.baseUrl}/enhetsregisteret/api/enheter/lastned/csv`;
    const response = await resilientFetch(url);
    return response.text();
  }
  
  async downloadUnderenheterCsv(): Promise<string> {
    const url = `${this.baseUrl}/enhetsregisteret/api/underenheter/lastned/csv`;
    const response = await resilientFetch(url);
    return response.text();
  }
}

export const brregClient = new BrregClient();
