'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Building2, 
  GitBranch, 
  RefreshCw, 
  Settings,
  LogOut 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';
import { Separator } from './ui/separator';

const navItems = [
  {
    title: 'Oversikt',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Bedrifter',
    href: '/companies',
    icon: Building2,
  },
  {
    title: 'Pipeline',
    href: '/pipeline',
    icon: GitBranch,
  },
  {
    title: 'Synkronisering',
    href: '/sync',
    icon: RefreshCw,
  },
  {
    title: 'Innstillinger',
    href: '/settings',
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-card">
      <div className="flex h-16 items-center border-b px-6">
        <h1 className="text-xl font-bold">CLAVIX 🇳🇴</h1>
      </div>
      
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}>
              <div
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </div>
            </Link>
          );
        })}
      </nav>
      
      <Separator />
      
      <div className="p-4">
        <form action="/api/auth/signout" method="POST">
          <Button variant="ghost" className="w-full justify-start" type="submit">
            <LogOut className="mr-2 h-4 w-4" />
            Logg ut
          </Button>
        </form>
      </div>
    </div>
  );
}
