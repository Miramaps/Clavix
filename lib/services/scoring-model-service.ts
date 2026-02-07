/**
 * Custom Scoring Model Service
 * Allows users to create and manage their own scoring configurations
 */

import { db } from '../db';
import { Company } from '@prisma/client';

export interface ScoringSignalConfig {
  signal: string;
  weight: number;
  condition: string; // e.g. "status === 'active'", "employeeCount >= 5 && employeeCount <= 250"
  reason: string;
}

export interface ScoringModelConfig {
  signals: ScoringSignalConfig[];
  thresholds?: {
    highScore?: number; // >= 75 by default
    goodScore?: number; // >= 50 by default
  };
  targetIndustries?: string[];
  targetEmployeeRange?: {
    min?: number;
    max?: number;
  };
}

export class ScoringModelService {
  /**
   * Create a new custom scoring model
   */
  async createModel(
    userId: string | null,
    name: string,
    description: string | null,
    config: ScoringModelConfig
  ) {
    return db.scoringModel.create({
      data: {
        userId,
        name,
        description,
        isActive: false, // Don't activate by default
        isDefault: false,
        config: config as any,
      },
    });
  }

  /**
   * Update an existing scoring model
   */
  async updateModel(
    modelId: string,
    updates: {
      name?: string;
      description?: string;
      config?: ScoringModelConfig;
      isActive?: boolean;
      isDefault?: boolean;
    }
  ) {
    return db.scoringModel.update({
      where: { id: modelId },
      data: updates,
    });
  }

  /**
   * Delete a scoring model
   */
  async deleteModel(modelId: string) {
    return db.scoringModel.delete({
      where: { id: modelId },
    });
  }

  /**
   * Get all scoring models for a user (including global models)
   */
  async getModelsForUser(userId: string) {
    return db.scoringModel.findMany({
      where: {
        OR: [
          { userId },
          { userId: null }, // Global models
        ],
      },
      orderBy: [
        { isDefault: 'desc' },
        { isActive: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get active model for a user
   */
  async getActiveModel(userId: string) {
    // First try to find user's active model
    const userModel = await db.scoringModel.findFirst({
      where: {
        userId,
        isActive: true,
      },
    });

    if (userModel) return userModel;

    // Fall back to global default model
    return db.scoringModel.findFirst({
      where: {
        userId: null,
        isDefault: true,
      },
    });
  }

  /**
   * Set a model as active for a user
   */
  async setActiveModel(userId: string, modelId: string) {
    // Deactivate all user's models
    await db.scoringModel.updateMany({
      where: { userId },
      data: { isActive: false },
    });

    // Activate the selected model
    return db.scoringModel.update({
      where: { id: modelId },
      data: { isActive: true },
    });
  }

  /**
   * Apply a scoring model to a company
   */
  async applyModel(modelId: string, company: Company): Promise<{
    score: number;
    signals: Array<{ signal: string; weight: number; reason: string; active: boolean }>;
  }> {
    const model = await db.scoringModel.findUnique({
      where: { id: modelId },
    });

    if (!model) {
      throw new Error('Scoring model not found');
    }

    const config = model.config as ScoringModelConfig;
    const signals = [];
    let totalWeight = 0;
    let earnedScore = 0;

    for (const signalConfig of config.signals) {
      const isActive = this.evaluateCondition(signalConfig.condition, company);
      
      signals.push({
        signal: signalConfig.signal,
        weight: signalConfig.weight,
        reason: signalConfig.reason,
        active: isActive,
      });

      totalWeight += signalConfig.weight;
      if (isActive) {
        earnedScore += signalConfig.weight;
      }
    }

    const score = Math.round((earnedScore / totalWeight) * 100);

    return { score, signals };
  }

  /**
   * Evaluate a condition string against a company
   * SECURITY NOTE: This uses eval() which is dangerous in production.
   * In a real system, use a safe expression evaluator library.
   */
  private evaluateCondition(condition: string, company: Company): boolean {
    try {
      // Create a safe context with only company data
      const safeContext = {
        status: company.status,
        employeeCount: company.employeeCount,
        industryCode: company.industryCode,
        hasWebsite: !!company.website,
        hasPhone: !!company.phone,
        hasEmail: !!company.email,
        hasRolesData: company.hasRolesData,
        organizationFormCode: company.organizationFormCode,
      };

      // Simple condition evaluator (replace with proper expression parser in production)
      const func = new Function(...Object.keys(safeContext), `return ${condition}`);
      return func(...Object.values(safeContext));
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  /**
   * Create default scoring models
   */
  async seedDefaultModels() {
    // Standard CLAVIX Model
    await db.scoringModel.upsert({
      where: { id: 'default-standard' },
      create: {
        id: 'default-standard',
        userId: null,
        name: 'Standard CLAVIX-modell',
        description: 'Standard score-modell for alle bransjer',
        isActive: false,
        isDefault: true,
        config: {
          signals: [
            {
              signal: 'company_active',
              weight: 20,
              condition: "status === 'active'",
              reason: 'Bedriften er aktivt i drift',
            },
            {
              signal: 'optimal_employee_count',
              weight: 15,
              condition: 'employeeCount >= 5 && employeeCount <= 250',
              reason: 'Ideell SMB-størrelse',
            },
            {
              signal: 'has_website',
              weight: 8,
              condition: 'hasWebsite === true',
              reason: 'Har nettilstedeværelse',
            },
            {
              signal: 'has_contact_phone',
              weight: 8,
              condition: 'hasPhone === true',
              reason: 'Kontakttelefon tilgjengelig',
            },
            {
              signal: 'has_roles_data',
              weight: 5,
              condition: 'hasRolesData === true',
              reason: 'Ledelse/beslutningstakere identifisert',
            },
          ],
          thresholds: {
            highScore: 75,
            goodScore: 50,
          },
        } as any,
      },
      update: {},
    });

    // Enterprise-focused model
    await db.scoringModel.upsert({
      where: { id: 'default-enterprise' },
      create: {
        id: 'default-enterprise',
        userId: null,
        name: 'Enterprise-modell',
        description: 'Fokuserer på større bedrifter',
        isActive: false,
        isDefault: false,
        config: {
          signals: [
            {
              signal: 'company_active',
              weight: 20,
              condition: "status === 'active'",
              reason: 'Bedriften er aktivt i drift',
            },
            {
              signal: 'large_company',
              weight: 25,
              condition: 'employeeCount >= 250',
              reason: 'Enterprise-størrelse',
            },
            {
              signal: 'has_website',
              weight: 5,
              condition: 'hasWebsite === true',
              reason: 'Har nettilstedeværelse',
            },
            {
              signal: 'has_roles_data',
              weight: 10,
              condition: 'hasRolesData === true',
              reason: 'Ledelse/beslutningstakere identifisert',
            },
          ],
          thresholds: {
            highScore: 70,
            goodScore: 45,
          },
        } as any,
      },
      update: {},
    });

    // SMB-focused model
    await db.scoringModel.upsert({
      where: { id: 'default-smb' },
      create: {
        id: 'default-smb',
        userId: null,
        name: 'SMB-modell',
        description: 'Fokuserer på små og mellomstore bedrifter',
        isActive: false,
        isDefault: false,
        config: {
          signals: [
            {
              signal: 'company_active',
              weight: 20,
              condition: "status === 'active'",
              reason: 'Bedriften er aktivt i drift',
            },
            {
              signal: 'smb_size',
              weight: 25,
              condition: 'employeeCount >= 5 && employeeCount <= 100',
              reason: 'SMB-størrelse',
            },
            {
              signal: 'has_website',
              weight: 10,
              condition: 'hasWebsite === true',
              reason: 'Har nettilstedeværelse',
            },
            {
              signal: 'has_contact_phone',
              weight: 10,
              condition: 'hasPhone === true',
              reason: 'Kontakttelefon tilgjengelig',
            },
          ],
          thresholds: {
            highScore: 75,
            goodScore: 55,
          },
        } as any,
      },
      update: {},
    });
  }
}

export const scoringModelService = new ScoringModelService();
