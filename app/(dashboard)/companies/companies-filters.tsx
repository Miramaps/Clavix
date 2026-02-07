'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter, Calendar, Building2, Users, MapPin } from 'lucide-react';
import { useState } from 'react';

interface CompaniesFiltersProps {
  filters: {
    search?: string;
    status?: string;
    minScore?: number;
    maxScore?: number;
    municipality?: string;
    county?: string;
    industryCode?: string;
    minEmployees?: number;
    maxEmployees?: number;
    hasPhone?: boolean;
    hasWebsite?: boolean;
    organizationForm?: string;
    createdAfter?: string;
  };
  onFiltersChange: (filters: any) => void;
}

export function CompaniesFilters({ filters, onFiltersChange }: CompaniesFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value, page: 1 });
  };

  const handleMinScoreChange = (score: number) => {
    onFiltersChange({ ...filters, minScore: score, page: 1 });
  };

  const handleFilterChange = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value, page: 1 });
  };

  const clearFilters = () => {
    onFiltersChange({ page: 1, limit: 50, status: 'active' });
  };

  const hasActiveFilters = 
    filters.search || 
    (filters.minScore && filters.minScore > 0) || 
    filters.municipality ||
    filters.county ||
    filters.industryCode ||
    filters.minEmployees ||
    filters.maxEmployees ||
    filters.hasPhone ||
    filters.hasWebsite ||
    filters.organizationForm ||
    filters.createdAfter;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[300px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Søk etter navn eller org.nr..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex gap-2">
          <Button
            variant={filters.minScore === 75 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleMinScoreChange(filters.minScore === 75 ? 0 : 75)}
          >
            Varme leads (≥75)
          </Button>
          
          <Button
            variant={filters.minScore === 50 ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleMinScoreChange(filters.minScore === 50 ? 0 : 50)}
          >
            Gode leads (≥50)
          </Button>

          <Button
            variant={showAdvanced ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            <Filter className="mr-2 h-4 w-4" />
            Avansert
          </Button>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" />
              Nullstill
            </Button>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 p-4 border rounded-lg bg-muted/50">
          {/* Kommune filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Kommune
            </label>
            <Input
              placeholder="F.eks. Oslo, Bergen..."
              value={filters.municipality || ''}
              onChange={(e) => handleFilterChange('municipality', e.target.value)}
            />
          </div>

          {/* Fylke filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Fylke
            </label>
            <Select 
              value={filters.county || ''} 
              onValueChange={(value) => handleFilterChange('county', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg fylke..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle fylker</SelectItem>
                <SelectItem value="OSLO">Oslo</SelectItem>
                <SelectItem value="VIKEN">Viken</SelectItem>
                <SelectItem value="INNLANDET">Innlandet</SelectItem>
                <SelectItem value="VESTFOLD OG TELEMARK">Vestfold og Telemark</SelectItem>
                <SelectItem value="AGDER">Agder</SelectItem>
                <SelectItem value="ROGALAND">Rogaland</SelectItem>
                <SelectItem value="VESTLAND">Vestland</SelectItem>
                <SelectItem value="MØRE OG ROMSDAL">Møre og Romsdal</SelectItem>
                <SelectItem value="TRØNDELAG">Trøndelag</SelectItem>
                <SelectItem value="NORDLAND">Nordland</SelectItem>
                <SelectItem value="TROMS OG FINNMARK">Troms og Finnmark</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Organisasjonsform */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Org.form
            </label>
            <Select 
              value={filters.organizationForm || ''} 
              onValueChange={(value) => handleFilterChange('organizationForm', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Velg type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle</SelectItem>
                <SelectItem value="AS">Aksjeselskap (AS)</SelectItem>
                <SelectItem value="ASA">Allmennaksjeselskap (ASA)</SelectItem>
                <SelectItem value="ENK">Enkeltpersonforetak (ENK)</SelectItem>
                <SelectItem value="NUF">Norskregistrert utenlandsk foretak (NUF)</SelectItem>
                <SelectItem value="ANS">Ansvarlig selskap (ANS)</SelectItem>
                <SelectItem value="DA">Selskap med delt ansvar (DA)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ansatte filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Ansatte
            </label>
            <Select 
              value={
                filters.minEmployees === 1 && filters.maxEmployees === 10 ? '1-10' :
                filters.minEmployees === 11 && filters.maxEmployees === 50 ? '11-50' :
                filters.minEmployees === 51 && filters.maxEmployees === 250 ? '51-250' :
                filters.minEmployees === 251 ? '251+' : ''
              }
              onValueChange={(value) => {
                if (value === '1-10') {
                  handleFilterChange('minEmployees', 1);
                  handleFilterChange('maxEmployees', 10);
                } else if (value === '11-50') {
                  handleFilterChange('minEmployees', 11);
                  handleFilterChange('maxEmployees', 50);
                } else if (value === '51-250') {
                  handleFilterChange('minEmployees', 51);
                  handleFilterChange('maxEmployees', 250);
                } else if (value === '251+') {
                  handleFilterChange('minEmployees', 251);
                  handleFilterChange('maxEmployees', undefined);
                } else {
                  handleFilterChange('minEmployees', undefined);
                  handleFilterChange('maxEmployees', undefined);
                }
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle størrelser" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle størrelser</SelectItem>
                <SelectItem value="1-10">1-10 ansatte</SelectItem>
                <SelectItem value="11-50">11-50 ansatte</SelectItem>
                <SelectItem value="51-250">51-250 ansatte</SelectItem>
                <SelectItem value="251+">251+ ansatte</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bransje filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Bransjekode</label>
            <Input
              placeholder="F.eks. 62, 41, 52..."
              value={filters.industryCode || ''}
              onChange={(e) => handleFilterChange('industryCode', e.target.value)}
            />
          </div>

          {/* Dato filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Registrert etter
            </label>
            <Input
              type="date"
              value={filters.createdAfter || ''}
              onChange={(e) => handleFilterChange('createdAfter', e.target.value)}
            />
          </div>

          {/* Har nettside */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nettside</label>
            <Select 
              value={filters.hasWebsite === true ? 'true' : filters.hasWebsite === false ? 'false' : ''} 
              onValueChange={(value) => handleFilterChange('hasWebsite', value === 'true' ? true : value === 'false' ? false : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle</SelectItem>
                <SelectItem value="true">Har nettside</SelectItem>
                <SelectItem value="false">Ingen nettside</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Har telefon */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Telefon</label>
            <Select 
              value={filters.hasPhone === true ? 'true' : filters.hasPhone === false ? 'false' : ''} 
              onValueChange={(value) => handleFilterChange('hasPhone', value === 'true' ? true : value === 'false' ? false : undefined)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle</SelectItem>
                <SelectItem value="true">Har telefon</SelectItem>
                <SelectItem value="false">Ingen telefon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
