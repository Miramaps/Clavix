/**
 * Integration Service
 * Slack, Teams, and Webhook integrations
 */

import { db } from '../db';

export interface IntegrationConfig {
  webhookUrl?: string;
  token?: string;
  channel?: string;
  customFields?: Record<string, any>;
}

export interface IntegrationPayload {
  event: string;
  data: any;
  timestamp: Date;
}

export class IntegrationService {
  /**
   * Create a new integration
   */
  async createIntegration(
    type: 'slack' | 'teams' | 'webhook' | 'zapier',
    name: string,
    config: IntegrationConfig,
    events: string[]
  ) {
    return db.integration.create({
      data: {
        type,
        name,
        config: config as any,
        events,
        isActive: true,
      },
    });
  }

  /**
   * Update an integration
   */
  async updateIntegration(
    integrationId: string,
    updates: {
      name?: string;
      config?: IntegrationConfig;
      events?: string[];
      isActive?: boolean;
    }
  ) {
    return db.integration.update({
      where: { id: integrationId },
      data: updates,
    });
  }

  /**
   * Delete an integration
   */
  async deleteIntegration(integrationId: string) {
    return db.integration.delete({
      where: { id: integrationId },
    });
  }

  /**
   * Get all active integrations
   */
  async getActiveIntegrations() {
    return db.integration.findMany({
      where: { isActive: true },
    });
  }

  /**
   * Send event to all subscribed integrations
   */
  async triggerEvent(event: string, data: any) {
    const integrations = await db.integration.findMany({
      where: {
        isActive: true,
        events: {
          has: event,
        },
      },
    });

    const payload: IntegrationPayload = {
      event,
      data,
      timestamp: new Date(),
    };

    const results = await Promise.allSettled(
      integrations.map(integration => this.sendToIntegration(integration.id, integration.type, integration.config as IntegrationConfig, payload))
    );

    // Log results
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const integration = integrations[i];

      if (result.status === 'fulfilled') {
        await this.logSuccess(integration.id, event, payload, result.value);
      } else {
        await this.logError(integration.id, event, payload, result.reason);
      }
    }

    return results;
  }

  /**
   * Send payload to a specific integration
   */
  private async sendToIntegration(
    integrationId: string,
    type: string,
    config: IntegrationConfig,
    payload: IntegrationPayload
  ): Promise<any> {
    switch (type) {
      case 'slack':
        return this.sendToSlack(config, payload);
      case 'teams':
        return this.sendToTeams(config, payload);
      case 'webhook':
      case 'zapier':
        return this.sendToWebhook(config, payload);
      default:
        throw new Error(`Unknown integration type: ${type}`);
    }
  }

  /**
   * Send to Slack
   */
  private async sendToSlack(config: IntegrationConfig, payload: IntegrationPayload): Promise<any> {
    if (!config.webhookUrl) {
      throw new Error('Slack webhook URL not configured');
    }

    const slackMessage = this.formatSlackMessage(payload);

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage),
    });

    if (!response.ok) {
      throw new Error(`Slack API error: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Send to Microsoft Teams
   */
  private async sendToTeams(config: IntegrationConfig, payload: IntegrationPayload): Promise<any> {
    if (!config.webhookUrl) {
      throw new Error('Teams webhook URL not configured');
    }

    const teamsMessage = this.formatTeamsMessage(payload);

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(teamsMessage),
    });

    if (!response.ok) {
      throw new Error(`Teams API error: ${response.status} ${response.statusText}`);
    }

    return response.text();
  }

  /**
   * Send to generic webhook
   */
  private async sendToWebhook(config: IntegrationConfig, payload: IntegrationPayload): Promise<any> {
    if (!config.webhookUrl) {
      throw new Error('Webhook URL not configured');
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (config.token) {
      headers['Authorization'] = `Bearer ${config.token}`;
    }

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Webhook error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Format message for Slack
   */
  private formatSlackMessage(payload: IntegrationPayload): any {
    const { event, data } = payload;

    switch (event) {
      case 'deal.created':
        return {
          text: `🎯 Ny deal opprettet: ${data.title}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*🎯 Ny deal opprettet*\n\n*Navn:* ${data.title}\n*Verdi:* ${data.value} ${data.currency}\n*Bedrift:* ${data.companyName}\n*Stadium:* ${data.stageName}`,
              },
            },
          ],
        };

      case 'deal.won':
        return {
          text: `🎉 Deal vunnet: ${data.title}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*🎉 Deal vunnet!*\n\n*Navn:* ${data.title}\n*Verdi:* ${data.value} ${data.currency}\n*Bedrift:* ${data.companyName}`,
              },
            },
          ],
        };

      case 'lead.high_score':
        return {
          text: `⭐ Ny high-score lead: ${data.companyName}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*⭐ Ny high-score lead*\n\n*Bedrift:* ${data.companyName}\n*Score:* ${data.score}/100\n*Bransje:* ${data.industry}\n*Ansatte:* ${data.employeeCount}`,
              },
            },
          ],
        };

      default:
        return {
          text: `📢 ${event}`,
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: `*📢 ${event}*\n\n\`\`\`${JSON.stringify(data, null, 2)}\`\`\``,
              },
            },
          ],
        };
    }
  }

  /**
   * Format message for Microsoft Teams
   */
  private formatTeamsMessage(payload: IntegrationPayload): any {
    const { event, data } = payload;

    switch (event) {
      case 'deal.created':
        return {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: `Ny deal: ${data.title}`,
          themeColor: '0078D4',
          title: '🎯 Ny deal opprettet',
          sections: [
            {
              facts: [
                { name: 'Navn', value: data.title },
                { name: 'Verdi', value: `${data.value} ${data.currency}` },
                { name: 'Bedrift', value: data.companyName },
                { name: 'Stadium', value: data.stageName },
              ],
            },
          ],
        };

      case 'deal.won':
        return {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: `Deal vunnet: ${data.title}`,
          themeColor: '28A745',
          title: '🎉 Deal vunnet!',
          sections: [
            {
              facts: [
                { name: 'Navn', value: data.title },
                { name: 'Verdi', value: `${data.value} ${data.currency}` },
                { name: 'Bedrift', value: data.companyName },
              ],
            },
          ],
        };

      case 'lead.high_score':
        return {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: `Ny high-score lead: ${data.companyName}`,
          themeColor: 'FFC107',
          title: '⭐ Ny high-score lead',
          sections: [
            {
              facts: [
                { name: 'Bedrift', value: data.companyName },
                { name: 'Score', value: `${data.score}/100` },
                { name: 'Bransje', value: data.industry },
                { name: 'Ansatte', value: data.employeeCount.toString() },
              ],
            },
          ],
        };

      default:
        return {
          '@type': 'MessageCard',
          '@context': 'https://schema.org/extensions',
          summary: event,
          title: `📢 ${event}`,
          text: JSON.stringify(data, null, 2),
        };
    }
  }

  /**
   * Log successful integration call
   */
  private async logSuccess(integrationId: string, event: string, payload: IntegrationPayload, response: any) {
    await db.integrationLog.create({
      data: {
        integrationId,
        event,
        status: 'success',
        payload: payload as any,
        response: response as any,
      },
    });
  }

  /**
   * Log failed integration call
   */
  private async logError(integrationId: string, event: string, payload: IntegrationPayload, error: any) {
    await db.integrationLog.create({
      data: {
        integrationId,
        event,
        status: 'failed',
        payload: payload as any,
        error: error?.message || String(error),
      },
    });
  }
}

export const integrationService = new IntegrationService();
