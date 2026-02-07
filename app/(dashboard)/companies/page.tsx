'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CompaniesTable } from './companies-table';
import { CompanyDetailDrawer } from './company-detail-drawer';
import { CompaniesFilters } from './companies-filters';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';

export default function CompaniesPage() {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    search: '',
    status: 'active',
    minScore: 0,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['companies', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.set(key, value.toString());
        }
      });
      const res = await fetch(`/api/companies?${params.toString()}`);
      if (res.status === 401) {
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Failed to fetch companies');
      return res.json();
    },
  });

  const handleExport = async () => {
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters, format: 'csv' }),
      });
      
      if (!res.ok) throw new Error('Export failed');
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `companies-export-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  const handleRunSync = async () => {
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'incremental', generateAI: false }),
      });
      
      if (res.status === 401) {
        alert('Sesjonen din har utløpt. Vennligst logg inn på nytt.');
        window.location.href = '/login';
        return;
      }
      
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || error.error || 'Synkronisering feilet');
      }
      
      const result = await res.json();
      alert(`Synkronisering startet for Norge! ${result.message || ''}`);
      refetch();
    } catch (error) {
      console.error('Sync failed:', error);
      alert(error instanceof Error ? error.message : 'Synkronisering feilet');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b">
        <div className="flex items-center justify-between p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bedrifter</h1>
            <p className="text-muted-foreground">
              {data?.meta?.total || 0} norske bedrifter indeksert
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              Eksporter
            </Button>
            <Button onClick={handleRunSync}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Kjør synk
            </Button>
          </div>
        </div>
        
        <div className="px-6 pb-4">
          <CompaniesFilters filters={filters} onFiltersChange={setFilters} />
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <CompaniesTable
          data={data?.data || []}
          isLoading={isLoading}
          onRowClick={(company) => setSelectedCompanyId(company.id)}
        />
      </div>

      {selectedCompanyId && (
        <CompanyDetailDrawer
          companyId={selectedCompanyId}
          open={!!selectedCompanyId}
          onClose={() => setSelectedCompanyId(null)}
        />
      )}
    </div>
  );
}
