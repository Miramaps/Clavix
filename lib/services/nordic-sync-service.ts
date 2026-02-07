/**
 * Nordic Sync Service
 * Unified service for syncing companies from all Nordic countries
 */

import { db } from '../db';
import { bolagsverketClient, BolagsverketCompany } from '../api/bolagsverket/client';
import { cvrClient, CVRCompany } from '../api/cvr/client';
import { ytjClient, YTJCompany } from '../api/ytj/client';

export class NordicSyncService {
  /**
   * Sync Swedish companies from Bolagsverket
   */
  async syncSwedishCompanies(limit: number = 100): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    try {
      // Ensure registry exists
      const registry = await db.companyRegistry.upsert({
        where: { country: 'SE' },
        create: {
          country: 'SE',
          registryName: 'Bolagsverket',
          apiBaseUrl: process.env.BOLAGSVERKET_BASE_URL || 'https://api.bolagsverket.se',
          isActive: true,
        },
        update: {},
      });

      // Fetch companies
      const response = await bolagsverketClient.searchCompanies({ pageSize: limit });
      
      if (response.hits) {
        for (const company of response.hits) {
          try {
            await this.upsertSwedishCompany(registry.id, company);
            success++;
          } catch (error) {
            console.error(`Error upserting Swedish company ${company.organisationsnummer}:`, error);
            errors++;
          }
        }
      }

      // Update last sync
      await db.companyRegistry.update({
        where: { id: registry.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (error) {
      console.error('Error syncing Swedish companies:', error);
      errors++;
    }

    return { success, errors };
  }

  /**
   * Sync Danish companies from CVR
   */
  async syncDanishCompanies(limit: number = 100): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    try {
      // Ensure registry exists
      const registry = await db.companyRegistry.upsert({
        where: { country: 'DK' },
        create: {
          country: 'DK',
          registryName: 'CVR (Centrale Virksomhedsregister)',
          apiBaseUrl: process.env.CVR_BASE_URL || 'https://cvrapi.dk',
          isActive: true,
        },
        update: {},
      });

      // Fetch companies
      const response = await cvrClient.searchCompanies({ pageSize: limit });
      
      if (response.hits?.hits) {
        for (const hit of response.hits.hits) {
          if (hit._source) {
            try {
              await this.upsertDanishCompany(registry.id, hit._source);
              success++;
            } catch (error) {
              console.error(`Error upserting Danish company ${hit._source.cvrNummer}:`, error);
              errors++;
            }
          }
        }
      }

      // Update last sync
      await db.companyRegistry.update({
        where: { id: registry.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (error) {
      console.error('Error syncing Danish companies:', error);
      errors++;
    }

    return { success, errors };
  }

  /**
   * Sync Finnish companies from YTJ
   */
  async syncFinnishCompanies(limit: number = 100): Promise<{ success: number; errors: number }> {
    let success = 0;
    let errors = 0;

    try {
      // Ensure registry exists
      const registry = await db.companyRegistry.upsert({
        where: { country: 'FI' },
        create: {
          country: 'FI',
          registryName: 'YTJ (Yritys- ja yhteisötietojärjestelmä)',
          apiBaseUrl: process.env.YTJ_BASE_URL || 'https://avoindata.prh.fi/bis/v1',
          isActive: true,
        },
        update: {},
      });

      // Fetch companies (use wildcard name search since API might require it)
      const response = await ytjClient.searchCompanies({ 
        name: '*', // Wildcard to get all companies
        maxResults: limit 
      });
      
      if (response.results) {
        for (const company of response.results) {
          try {
            await this.upsertFinnishCompany(registry.id, company);
            success++;
          } catch (error) {
            console.error(`Error upserting Finnish company ${company.businessId}:`, error);
            errors++;
          }
        }
      }

      // Update last sync
      await db.companyRegistry.update({
        where: { id: registry.id },
        data: { lastSyncAt: new Date() },
      });
    } catch (error) {
      console.error('Error syncing Finnish companies:', error);
      errors++;
    }

    return { success, errors };
  }

  /**
   * Sync all Nordic countries
   */
  async syncAllNordic(limitPerCountry: number = 100): Promise<{
    sweden: { success: number; errors: number };
    denmark: { success: number; errors: number };
    finland: { success: number; errors: number };
  }> {
    const [sweden, denmark, finland] = await Promise.all([
      this.syncSwedishCompanies(limitPerCountry),
      this.syncDanishCompanies(limitPerCountry),
      this.syncFinnishCompanies(limitPerCountry),
    ]);

    return { sweden, denmark, finland };
  }

  /**
   * Private helper methods
   */
  private async upsertSwedishCompany(registryId: string, company: BolagsverketCompany) {
    await db.companyNordic.upsert({
      where: {
        registrationNumber_country: {
          registrationNumber: company.organisationsnummer,
          country: 'SE',
        },
      },
      create: {
        registryId,
        registrationNumber: company.organisationsnummer,
        country: 'SE',
        name: company.namn,
        organizationFormCode: company.organisationsform,
        organizationFormName: company.organisationsform,
        status: company.status || 'unknown',
        foundedDate: company.registreringsdatum ? new Date(company.registreringsdatum) : null,
        municipality: company.kommun,
        county: company.lan,
        postalCode: company.postnummer,
        address: company.adress,
        industryCode: company.sni,
        employeeCount: company.antalAnstallda,
        website: company.hemsida,
        phone: company.telefon,
        email: company.epost,
        rawJson: company as any,
        lastSeenAt: new Date(),
      },
      update: {
        name: company.namn,
        status: company.status || 'unknown',
        municipality: company.kommun,
        county: company.lan,
        website: company.hemsida,
        phone: company.telefon,
        email: company.epost,
        rawJson: company as any,
        lastSeenAt: new Date(),
      },
    });
  }

  private async upsertDanishCompany(registryId: string, company: CVRCompany) {
    await db.companyNordic.upsert({
      where: {
        registrationNumber_country: {
          registrationNumber: company.cvrNummer.toString(),
          country: 'DK',
        },
      },
      create: {
        registryId,
        registrationNumber: company.cvrNummer.toString(),
        country: 'DK',
        name: company.navn,
        organizationFormCode: company.virksomhedsform?.kode,
        organizationFormName: company.virksomhedsform?.langBeskrivelse,
        status: company.virksomhedsstatus || 'unknown',
        foundedDate: company.stiftelsesdato ? new Date(company.stiftelsesdato) : null,
        municipality: company.kommune?.kommuneNavn,
        municipalityCode: company.kommune?.kommuneKode.toString(),
        postalCode: company.beliggenhedsadresse?.postnummer?.toString(),
        address: `${company.beliggenhedsadresse?.vejnavn || ''} ${company.beliggenhedsadresse?.husnummerFra || ''}`.trim(),
        industryCode: company.hovedbranche?.branchekode,
        industryDescription: company.hovedbranche?.branchetekst,
        employeeCount: company.antalPersoner,
        website: company.hjemmeside,
        phone: company.telefon,
        email: company.email,
        rawJson: company as any,
        lastSeenAt: new Date(),
      },
      update: {
        name: company.navn,
        status: company.virksomhedsstatus || 'unknown',
        municipality: company.kommune?.kommuneNavn,
        website: company.hjemmeside,
        phone: company.telefon,
        email: company.email,
        rawJson: company as any,
        lastSeenAt: new Date(),
      },
    });
  }

  private async upsertFinnishCompany(registryId: string, company: YTJCompany) {
    const address = company.addresses?.find(a => a.type === 'POSTAL' || !a.type);
    const phone = company.contactDetails?.find(c => c.type === 'Puhelin')?.value;
    const email = company.contactDetails?.find(c => c.type === 'Kotisivun www-osoite')?.value;
    const website = company.contactDetails?.find(c => c.type === 'Kotisivun www-osoite')?.value;

    await db.companyNordic.upsert({
      where: {
        registrationNumber_country: {
          registrationNumber: company.businessId,
          country: 'FI',
        },
      },
      create: {
        registryId,
        registrationNumber: company.businessId,
        country: 'FI',
        name: company.name,
        organizationFormCode: company.companyForm,
        organizationFormName: company.companyForms?.[0]?.name,
        status: 'active', // YTJ doesn't always provide status
        foundedDate: company.registrationDate ? new Date(company.registrationDate) : null,
        postalCode: address?.postCode,
        address: address ? `${address.street || ''} ${address.city || ''}`.trim() : null,
        industryCode: company.businessLines?.[0]?.code,
        industryDescription: company.businessLines?.[0]?.name,
        website,
        phone,
        email,
        rawJson: company as any,
        lastSeenAt: new Date(),
      },
      update: {
        name: company.name,
        website,
        phone,
        email,
        rawJson: company as any,
        lastSeenAt: new Date(),
      },
    });
  }
}

export const nordicSyncService = new NordicSyncService();
