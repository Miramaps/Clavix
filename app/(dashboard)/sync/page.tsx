'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatNumber } from '@/lib/utils';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export default function SyncPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['sync-jobs'],
    queryFn: async () => {
      const res = await fetch('/api/sync');
      if (!res.ok) throw new Error('Failed to fetch sync jobs');
      return res.json();
    },
    refetchInterval: 5000, // Refresh every 5 seconds
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running':
        return <Clock className="h-4 w-4 text-yellow-600 animate-pulse" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'destructive' | 'secondary'> = {
      completed: 'default',
      failed: 'destructive',
      running: 'secondary',
    };
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>;
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Synkronisering</h1>
        <p className="text-muted-foreground">
          Overvåk datasynkronisering fra Brønnøysundregistrene
        </p>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-muted-foreground">Laster synkroniseringshistorikk...</p>
            </CardContent>
          </Card>
        ) : (
          (data?.jobs || []).map((job: any) => (
            <Card key={job.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(job.status)}
                    <div>
                      <CardTitle className="text-lg capitalize">{job.type === 'full' ? 'Full' : job.type === 'incremental' ? 'Inkrementell' : job.type === 'roles' ? 'Roller' : 'Underenheter'} synk</CardTitle>
                      <CardDescription>
                        Startet {formatDate(job.startedAt)}
                        {job.finishedAt && ` • Fullført ${formatDate(job.finishedAt)}`}
                      </CardDescription>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-8 text-sm">
                  <div>
                    <span className="text-muted-foreground">Behandlet:</span>{' '}
                    <span className="font-medium">{formatNumber(job.processedCount)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Feil:</span>{' '}
                    <span className="font-medium">{formatNumber(job.errorCount)}</span>
                  </div>
                </div>
                {job.log && (
                  <p className="mt-2 text-sm text-muted-foreground">{job.log}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
