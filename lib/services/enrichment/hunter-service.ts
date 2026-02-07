/**
 * Hunter.io Email Enrichment Service
 * Finds email addresses for companies
 */

interface HunterConfig {
  apiKey: string;
  baseUrl?: string;
}

interface HunterResult {
  email: string;
  firstName?: string;
  lastName?: string;
  position?: string;
  confidence: number;
  linkedin?: string;
}

export class HunterService {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: HunterConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.hunter.io/v2';
  }

  /**
   * Find email addresses for a domain
   */
  async findEmails(domain: string): Promise<HunterResult[]> {
    try {
      const url = `${this.baseUrl}/domain-search?domain=${domain}&api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Hunter.io API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.data?.emails) {
        return data.data.emails.map((email: any) => ({
          email: email.value,
          firstName: email.first_name,
          lastName: email.last_name,
          position: email.position,
          confidence: email.confidence / 100, // Convert to 0-1
          linkedin: email.linkedin,
        }));
      }

      return [];
    } catch (error) {
      console.error('Hunter.io API error:', error);
      throw error;
    }
  }

  /**
   * Verify an email address
   */
  async verifyEmail(email: string): Promise<{ valid: boolean; score: number }> {
    try {
      const url = `${this.baseUrl}/email-verifier?email=${email}&api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Hunter.io API error: ${response.statusText}`);
      }

      const data = await response.json();
      
      return {
        valid: data.data?.result === 'deliverable',
        score: data.data?.score || 0,
      };
    } catch (error) {
      console.error('Hunter.io verification error:', error);
      throw error;
    }
  }

  /**
   * Get account info (remaining requests, etc.)
   */
  async getAccountInfo() {
    try {
      const url = `${this.baseUrl}/account?api_key=${this.apiKey}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Hunter.io API error: ${response.statusText}`);
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Hunter.io account info error:', error);
      throw error;
    }
  }
}

/**
 * Initialize Hunter service from env
 */
export function createHunterService(): HunterService | null {
  const apiKey = process.env.HUNTER_API_KEY;
  
  if (!apiKey) {
    console.warn('HUNTER_API_KEY not set - Hunter.io enrichment disabled');
    return null;
  }

  return new HunterService({ apiKey });
}
