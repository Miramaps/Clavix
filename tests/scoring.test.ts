import { calculateLeadScore } from '../lib/scoring/engine';
import { Company } from '@prisma/client';

describe('Lead Scoring Engine', () => {
  const baseCompany: Company = {
    id: '1',
    orgnr: '123456789',
    name: 'Test Company AS',
    organizationFormCode: 'AS',
    organizationFormName: 'Aksjeselskap',
    status: 'active',
    foundedDate: new Date('2020-01-01'),
    municipality: 'Oslo',
    municipalityNumber: '0301',
    county: 'Oslo',
    postalCode: '0150',
    address: 'Test Street 1',
    industryCode: '52.10',
    industryDescription: 'Warehousing and storage',
    employeeCount: 50,
    website: 'https://example.com',
    phone: '+47 12345678',
    email: 'test@example.com',
    hasRolesData: true,
    aiSummary: null,
    aiUseCaseFit: 0,
    aiUrgencyScore: 0,
    aiDataQualityScore: 0,
    overallLeadScore: 0,
    tags: [],
    lastSeenAt: new Date(),
    sourceUpdatedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
    rawJson: null,
  };

  it('should score active company with optimal characteristics highly', () => {
    const result = calculateLeadScore(baseCompany);
    
    expect(result.overallLeadScore).toBeGreaterThan(70);
    expect(result.aiUseCaseFit).toBeGreaterThan(0);
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('should penalize inactive companies', () => {
    const inactiveCompany = { ...baseCompany, status: 'inactive' };
    const result = calculateLeadScore(inactiveCompany);
    
    const activeSignal = result.signals.find(s => s.signal === 'company_active');
    expect(activeSignal?.active).toBe(false);
  });

  it('should reward optimal employee count (5-250)', () => {
    const optimalSizeCompany = { ...baseCompany, employeeCount: 100 };
    const result = calculateLeadScore(optimalSizeCompany);
    
    const sizeSignal = result.signals.find(s => s.signal === 'optimal_employee_count');
    expect(sizeSignal?.active).toBe(true);
  });

  it('should reward target industry verticals', () => {
    const result = calculateLeadScore(baseCompany);
    
    const industrySignal = result.signals.find(s => s.signal === 'target_industry');
    expect(industrySignal).toBeDefined();
  });

  it('should reward having contact information', () => {
    const result = calculateLeadScore(baseCompany);
    
    const phoneSignal = result.signals.find(s => s.signal === 'has_contact_phone');
    expect(phoneSignal?.active).toBe(true);
    
    const websiteSignal = result.signals.find(s => s.signal === 'has_website');
    expect(websiteSignal?.active).toBe(true);
  });

  it('should provide top 3 reasons', () => {
    const result = calculateLeadScore(baseCompany);
    
    expect(result.topReasons).toHaveLength(3);
    expect(typeof result.topReasons[0]).toBe('string');
  });

  it('should calculate data quality score based on available information', () => {
    const result = calculateLeadScore(baseCompany);
    
    expect(result.aiDataQualityScore).toBeGreaterThan(50);
  });
});
