'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { formatDate, formatNumber, getScoreBadgeColor, cn } from '@/lib/utils';
import { getLogoPlaceholder } from '@/lib/services/logo-service';
import { Building2, MapPin, Users, Phone, Globe, Mail, RefreshCw, Download } from 'lucide-react';

interface CompanyDetailDrawerProps {
  companyId: string;
  open: boolean;
  onClose: () => void;
}

export function CompanyDetailDrawer({ companyId, open, onClose }: CompanyDetailDrawerProps) {
  const queryClient = useQueryClient();

  const { data: company, isLoading } = useQuery({
    queryKey: ['company', companyId],
    queryFn: async () => {
      const res = await fetch(`/api/companies/${companyId}`);
      if (!res.ok) throw new Error('Failed to fetch company');
      return res.json();
    },
    enabled: !!companyId,
  });

  const regenerateSummary = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/companies/${companyId}/regenerate-summary`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Failed to regenerate summary');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['company', companyId] });
    },
  });

  if (isLoading || !company) {
    return (
      <Sheet open={open} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <div className="animate-pulse space-y-4 pt-6">
            <div className="h-8 bg-muted rounded" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader className="space-y-3 pb-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0">
              <img
                src={company.logoUrl || getLogoPlaceholder(company.name)}
                alt={`${company.name} logo`}
                className="w-16 h-16 rounded-lg object-cover border"
                onError={(e) => {
                  e.currentTarget.src = getLogoPlaceholder(company.name);
                }}
              />
            </div>
            <div className="flex-1">
              <SheetTitle className="text-2xl">{company.name}</SheetTitle>
              <SheetDescription className="flex items-center gap-2 mt-1">
                <span>Org. nr: {company.orgnr}</span>
                <Badge variant="outline">{company.status === 'active' ? 'Aktiv' : 'Inaktiv'}</Badge>
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className="space-y-6">
          {/* Core Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Bedriftsinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.organizationFormName && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Organisasjonsform</span>
                  <span className="text-sm font-medium">{company.organizationFormName}</span>
                </div>
              )}
              {company.industryDescription && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Bransje</span>
                  <span className="text-sm font-medium">{company.industryDescription}</span>
                </div>
              )}
              {company.employeeCount && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Ansatte</span>
                  <span className="text-sm font-medium">{formatNumber(company.employeeCount)}</span>
                </div>
              )}
              {(company.municipality || company.county) && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Sted</span>
                  <span className="text-sm font-medium">
                    {[company.municipality, company.county].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {company.foundedDate && (
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Stiftet</span>
                  <span className="text-sm font-medium">{formatDate(company.foundedDate)}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Kontaktinformasjon
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {company.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{company.phone}</span>
                </div>
              )}
              {company.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{company.email}</span>
                </div>
              )}
              {company.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline"
                  >
                    {company.website}
                  </a>
                </div>
              )}
              {!company.phone && !company.email && !company.website && (
                <p className="text-sm text-muted-foreground">Ingen kontaktinformasjon tilgjengelig</p>
              )}
            </CardContent>
          </Card>

          {/* Lead Score */}
          <Card>
            <CardHeader>
              <CardTitle>Lead-scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Total lead-score</span>
                <Badge className={cn('text-lg px-4 py-1', getScoreBadgeColor(company.overallLeadScore || 0))}>
                  {company.overallLeadScore || 0}
                </Badge>
              </div>
              
              <Separator />
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Brukstilfelle-match</span>
                  <span className="font-medium">{company.aiUseCaseFit || 0}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Haster-score</span>
                  <span className="font-medium">{company.aiUrgencyScore || 0}/100</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Datakvalitet</span>
                  <span className="font-medium">{company.aiDataQualityScore || 0}/100</span>
                </div>
              </div>

              {company.scoreExplanations && company.scoreExplanations.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Topp signaler</p>
                    <ul className="space-y-1">
                      {company.scoreExplanations
                        .sort((a: any, b: any) => b.weight - a.weight)
                        .slice(0, 3)
                        .map((signal: any) => (
                          <li key={signal.id} className="text-xs text-muted-foreground">
                            • {signal.reason}
                          </li>
                        ))}
                    </ul>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* AI Summary */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>AI-oppsummering</CardTitle>
              <Button
                size="sm"
                variant="outline"
                onClick={() => regenerateSummary.mutate()}
                disabled={regenerateSummary.isPending}
              >
                <RefreshCw className={cn('h-3 w-3 mr-2', regenerateSummary.isPending && 'animate-spin')} />
                Regenerer
              </Button>
            </CardHeader>
            <CardContent>
              {company.aiSummary ? (
                <div className="space-y-4 text-sm">
                  {company.aiSummary.split('\n\n').map((section, idx) => {
                    // Remove markdown bold syntax
                    const cleanText = section.replace(/\*\*/g, '');
                    
                    // Check if it's a header line (starts with bold text followed by colon)
                    if (cleanText.includes(':')) {
                      const [header, ...content] = cleanText.split(':');
                      const isMainHeader = header.trim() === 'Hva de gjør' || 
                                         header.trim() === 'Hvorfor automatisering' ||
                                         header.trim() === 'Pitch-vinkel' ||
                                         header.trim() === 'Risikonotater' ||
                                         header.trim() === 'What they do' || 
                                         header.trim() === 'Why automation' ||
                                         header.trim() === 'Pitch angle' ||
                                         header.trim() === 'Risk notes';
                      
                      if (isMainHeader) {
                        return (
                          <div key={idx}>
                            <p className="font-semibold text-foreground mb-1">{header.trim()}:</p>
                            <p className="text-muted-foreground">{content.join(':').trim()}</p>
                          </div>
                        );
                      }
                    }
                    
                    // Handle "Top use cases" section with numbered list
                    if (cleanText.includes('Top use cases') || cleanText.includes('Top 3 use cases') || 
                        cleanText.includes('Topp brukstilfeller') || cleanText.includes('Topp 3 brukstilfeller')) {
                      return (
                        <div key={idx}>
                          <p className="font-semibold text-foreground mb-2">Topp brukstilfeller:</p>
                          <ul className="space-y-1 ml-4">
                            {cleanText.split('\n').slice(1).map((line, i) => {
                              const cleanLine = line.replace(/^\d+\.\s*/, '').trim();
                              return cleanLine ? (
                                <li key={i} className="text-muted-foreground list-disc">
                                  {cleanLine}
                                </li>
                              ) : null;
                            })}
                          </ul>
                        </div>
                      );
                    }
                    
                    // Handle bullet points
                    if (cleanText.includes('- ')) {
                      const lines = cleanText.split('\n');
                      const header = lines[0];
                      const items = lines.slice(1).filter(l => l.trim().startsWith('- '));
                      
                      return (
                        <div key={idx}>
                          {header && <p className="font-semibold text-foreground mb-2">{header}</p>}
                          <ul className="space-y-1 ml-4">
                            {items.map((item, i) => (
                              <li key={i} className="text-muted-foreground list-disc">
                                {item.replace(/^-\s*/, '').trim()}
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    }
                    
                    // Regular paragraph
                    return cleanText ? (
                      <p key={idx} className="text-muted-foreground">
                        {cleanText}
                      </p>
                    ) : null;
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Ingen AI-oppsummering tilgjengelig. Klikk regenerer for å lage en.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Roles */}
          {company.roles && company.roles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Ledelse & Roller ({company.roles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {company.roles.slice(0, 5).map((role: any) => (
                    <div key={role.id} className="flex justify-between text-sm">
                      <span className="font-medium">{role.personName || 'Ikke tilgjengelig'}</span>
                      <span className="text-muted-foreground">{role.roleType}</span>
                    </div>
                  ))}
                  {company.roles.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      + {company.roles.length - 5} flere roller
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Sub-entities */}
          {company.subEntities && company.subEntities.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Avdelinger ({company.subEntities.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {company.subEntities.slice(0, 5).map((sub: any) => (
                    <div key={sub.id} className="text-sm">
                      <div className="font-medium">{sub.name}</div>
                      <div className="text-xs text-muted-foreground">{sub.municipality}</div>
                    </div>
                  ))}
                  {company.subEntities.length > 5 && (
                    <p className="text-xs text-muted-foreground">
                      + {company.subEntities.length - 5} flere avdelinger
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
