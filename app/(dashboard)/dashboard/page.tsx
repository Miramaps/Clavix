'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { formatNumber, formatDate } from '@/lib/utils';
import { Building2, TrendingUp, Clock, Target, Users, Globe, Phone, Calendar, MapPin, FileText } from 'lucide-react';
import { 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend 
} from 'recharts';

export default function DashboardPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const res = await fetch('/api/dashboard/stats');
      if (res.status === 401) {
        window.location.href = '/login';
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Failed to fetch stats');
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="h-32 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Kunne ikke laste statistikk. Vennligst oppdater siden.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const syncChartData = (data?.syncHistory || [])
    .slice(0, 20)
    .reverse()
    .map((job: any) => ({
      date: new Date(job.finishedAt).toLocaleDateString('nb-NO', { month: 'short', day: 'numeric' }),
      bedrifter: job.processedCount,
    }));

  const dailyNewCompaniesData = (data?.dailyNewCompanies || [])
    .slice(0, 30)
    .reverse()
    .map((item: any) => ({
      date: new Date(item.date).toLocaleDateString('nb-NO', { month: 'short', day: 'numeric' }),
      nye: item.count,
    }));

  const employeeScoreData = (data?.avgScoreByEmployeeCount || []).map((item: any) => ({
    range: item.range,
    count: item.count,
    avgScore: item.avg_score,
  }));

  const countyData = (data?.companiesByCounty || []).slice(0, 8).map((item: any) => ({
    name: item.county,
    value: item._count,
  }));

  const orgFormData = (data?.companiesByOrgForm || []).map((item: any) => ({
    name: item.organizationFormCode,
    value: item._count,
  }));

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658', '#ff7c7c'];

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Oversikt</h1>
          <p className="text-muted-foreground">
            🇳🇴 Bedriftsintelligens for Norge
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Totalt bedrifter</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data?.totalCompanies)}</div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(data?.activeCompanies)} aktive
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Varme leads</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data?.highScoreLeads)}</div>
            <p className="text-xs text-muted-foreground">
              Score ≥75 • {formatNumber(data?.mediumScoreLeads)} gode (≥50)
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nye bedrifter</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(data?.newCompanies?.last24h)}</div>
            <p className="text-xs text-muted-foreground">
              Siste 24t • {formatNumber(data?.newCompanies?.last7d)} siste 7d
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kontaktdata</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.totalCompanies ? Math.round((data.companiesWithPhone / data.totalCompanies) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Telefon • {data?.totalCompanies ? Math.round((data.companiesWithWebsite / data.totalCompanies) * 100) : 0}% nettside
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Nye bedrifter daglig</CardTitle>
            <CardDescription>Registrerte bedrifter siste 30 dager</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyNewCompaniesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="nye" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Score etter bedriftsstørrelse</CardTitle>
            <CardDescription>Gjennomsnittlig lead-score per ansatt-gruppe</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={employeeScoreData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avgScore" name="Gj.snitt score" fill="#82ca9d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Bedrifter per fylke</CardTitle>
            <CardDescription>Geografisk fordeling</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={countyData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: ${entry.value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {countyData.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Organisasjonsformer</CardTitle>
            <CardDescription>Fordeling etter selskapstype</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={orgFormData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={60} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 3 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Synkroniseringshistorikk</CardTitle>
            <CardDescription>Bedrifter behandlet per synkronisering</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={syncChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="bedrifter" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Toppbransjer etter score</CardTitle>
            <CardDescription>Høyest scorende sektorer</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(data?.topIndustries || []).slice(0, 8).map((industry: any) => (
                <div key={industry.industryDescription} className="flex items-center justify-between">
                  <div className="flex-1 truncate">
                    <p className="text-sm font-medium">{industry.industryDescription}</p>
                    <p className="text-xs text-muted-foreground">{industry._count} bedrifter</p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <div className="w-16 bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full" 
                        style={{ width: `${Math.round(industry._avg.overallLeadScore || 0)}%` }}
                      />
                    </div>
                    <div className="text-sm font-semibold w-8 text-right">
                      {Math.round(industry._avg.overallLeadScore || 0)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
