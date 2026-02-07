'use client';

import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  ColumnDef,
} from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { formatDate, formatNumber, getScoreBadgeColor, cn } from '@/lib/utils';
import { getLogoPlaceholder } from '@/lib/services/logo-service';
import { ExternalLink, Phone, Globe } from 'lucide-react';

interface Company {
  id: string;
  orgnr: string;
  name: string;
  status: string;
  municipality?: string;
  industryDescription?: string;
  employeeCount?: number;
  phone?: string;
  website?: string;
  logoUrl?: string;
  overallLeadScore?: number;
  lastSeenAt: string;
}

const columns: ColumnDef<Company>[] = [
  {
    accessorKey: 'name',
    header: 'Bedrift',
    cell: ({ row }) => (
      <div className="flex items-center gap-3">
        <img
          src={row.original.logoUrl || getLogoPlaceholder(row.original.name)}
          alt={`${row.original.name} logo`}
          className="w-10 h-10 rounded object-cover border"
          onError={(e) => {
            e.currentTarget.src = getLogoPlaceholder(row.original.name);
          }}
        />
        <div>
          <div className="font-medium">{row.original.name}</div>
          <div className="text-xs text-muted-foreground">{row.original.orgnr}</div>
        </div>
      </div>
    ),
  },
  {
    accessorKey: 'municipality',
    header: 'Sted',
    cell: ({ getValue }) => getValue() || '-',
  },
  {
    accessorKey: 'industryDescription',
    header: 'Bransje',
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return (
        <div className="max-w-[200px] truncate text-sm" title={value}>
          {value || '-'}
        </div>
      );
    },
  },
  {
    accessorKey: 'employeeCount',
    header: 'Ansatte',
    cell: ({ getValue }) => formatNumber(getValue() as number),
  },
  {
    accessorKey: 'phone',
    header: 'Telefon',
    cell: ({ getValue }) => {
      const phone = getValue() as string;
      return phone ? (
        <div className="flex items-center gap-1 text-sm">
          <Phone className="h-3 w-3" />
          {phone}
        </div>
      ) : (
        '-'
      );
    },
  },
  {
    accessorKey: 'website',
    header: 'Nettside',
    cell: ({ getValue }) => {
      const website = getValue() as string;
      return website ? (
        <a
          href={website}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm text-primary hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          <Globe className="h-3 w-3" />
          Lenke
        </a>
      ) : (
        '-'
      );
    },
  },
  {
    accessorKey: 'overallLeadScore',
    header: 'Score',
    cell: ({ getValue }) => {
      const score = getValue() as number;
      return (
        <Badge className={cn('font-semibold', getScoreBadgeColor(score || 0))}>
          {score || 0}
        </Badge>
      );
    },
  },
  {
    accessorKey: 'lastSeenAt',
    header: 'Oppdatert',
    cell: ({ getValue }) => (
      <span className="text-sm text-muted-foreground">
        {formatDate(getValue() as string)}
      </span>
    ),
  },
];

interface CompaniesTableProps {
  data: Company[];
  isLoading: boolean;
  onRowClick: (company: Company) => void;
}

export function CompaniesTable({ data, isLoading, onRowClick }: CompaniesTableProps) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Laster bedrifter...</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-auto">
      <table className="w-full border-collapse">
        <thead className="sticky top-0 z-10 bg-muted/50 backdrop-blur">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="border-b px-4 py-3 text-left text-sm font-medium"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick(row.original)}
              className="cursor-pointer border-b transition-colors hover:bg-muted/50"
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className="px-4 py-3">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
