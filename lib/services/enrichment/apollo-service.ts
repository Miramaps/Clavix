/**
 * Apollo.io Contact Enrichment Service
 * Finds contacts and company data
 */

interface ApolloConfig {
  apiKey: string;
  baseUrl?: string;
}

interface ApolloContact {
  email: string;
  firstName?: string;
  lastName?: string;
  title?: string;
  phone?: string;
  linkedin?: string;
  confidence: number;
}

export class ApolloService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ApolloConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.apollo.io/v1';
  }

  /**
   * Search for people at a company
   */
  async searchPeople(domain: string, organizationName?: string): Promise<ApolloContact[]> {
    try {
      const url = `${this.baseUrl}/mixed_people/search`;
      
      const body = {
        api_key: this.apiKey,
        q_organization_domains: domain,
        per_page: 25,
        page: 1,
      };

      if (organizationName) {
        (body as any).organization_names = [organizationName];
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.people) {
        return data.people.map((person: any) => ({
          email: person.email,
          firstName: person.first_name,
          lastName: person.last_name,
          title: person.title,
          phone: person.phone_numbers?.[0]?.raw_number,
          linkedin: person.linkedin_url,
          confidence: person.email_status === 'verified' ? 0.9 : 0.6,
        }));
      }

      return [];
    } catch (error) {
      console.error('Apollo API error:', error);
      throw error;
    }
  }

  /**
   * Enrich organization data
   */
  async enrichOrganization(domain: string) {
    try {
      const url = `${this.baseUrl}/organizations/enrich`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
        body: JSON.stringify({
          api_key: this.apiKey,
          domain,
        }),
      });

      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.organization;
    } catch (error) {
      console.error('Apollo organization enrichment error:', error);
      throw error;
    }
  }

  /**
   * Get account info
   */
  async getAccountInfo() {
    try {
      const url = `${this.baseUrl}/auth/health?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Apollo API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Apollo account info error:', error);
      throw error;
    }
  }
}

/**
 * Initialize Apollo service from env
 */
export function createApolloService(): ApolloService | null {
  const apiKey = process.env.APOLLO_API_KEY;
  
  if (!apiKey) {
    console.warn('APOLLO_API_KEY not set - Apollo.io enrichment disabled');
    return null;
  }

  return new ApolloService({ apiKey });
}
