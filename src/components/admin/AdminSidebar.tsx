'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Package,
  ClipboardList,
  Receipt,
  BarChart3,
  Settings,
  Store,
  LogOut,
  Ruler,
  ShieldCheck,
  ChevronRight,
  Menu,
  X,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';

interface AdminSidebarProps {
  className?: string;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}

export const ADMIN_NAV_ITEMS = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: '/admin/clients',
    label: 'Clients CRM',
    icon: Users,
    exact: false,
    badge: 'CRM',
  },
  {
    href: '/admin/products',
    label: 'Products',
    icon: Package,
    exact: false,
  },
  {
    href: '/admin/orders',
    label: 'Orders',
    icon: ClipboardList,
    exact: false,
  },
  {
    href: '/admin/invoices',
    label: 'Invoices',
    icon: Receipt,
    exact: false,
  },
  {
    href: '/admin/analytics',
    label: 'Analytics',
    icon: BarChart3,
    exact: false,
  },
  {
    href: '/admin/visualizer',
    label: 'AI Visualizer',
    icon: Sparkles,
    exact: false,
    badge: 'AI',
  },
  {
    href: '/admin/settings',
    label: 'Settings',
    icon: Settings,
    exact: false,
  },
];

export function AdminSidebar({ className, mobileOpen, onMobileClose }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const isLinkActive = (href: string, exact: boolean) => {
    if (exact) {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-brand-espresso text-brand-ivory select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-white/10 flex items-center justify-between">
        <Link href="/admin" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-card bg-brand-gold/20 border border-brand-gold/40 flex items-center justify-center text-brand-gold shadow-xs group-hover:bg-brand-gold group-hover:text-brand-espresso transition-all">
            <span className="font-display font-bold text-xl">E</span>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-base tracking-tight text-white group-hover:text-brand-gold transition-colors">
              Excellence
            </span>
            <span className="text-[10px] uppercase tracking-widest text-brand-gold font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-brand-gold" />
              <span>Admin Gallery</span>
            </span>
          </div>
        </Link>

        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="md:hidden text-white/70 hover:text-white p-1 rounded-md"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-brand-ivory/50">
          Management Console
        </div>
        {ADMIN_NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = isLinkActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onMobileClose}
              className={cn(
                'flex items-center justify-between px-3.5 py-2.5 rounded-card text-sm font-medium transition-all group',
                active
                  ? 'bg-brand-gold text-brand-espresso font-semibold shadow-sm'
                  : 'text-brand-ivory/80 hover:bg-white/5 hover:text-white'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'w-4 h-4 transition-colors',
                    active ? 'text-brand-espresso' : 'text-brand-gold group-hover:text-white'
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge ? (
                <span
                  className={cn(
                    'text-[10px] font-bold px-1.5 py-0.5 rounded-full',
                    active
                      ? 'bg-brand-espresso/20 text-brand-espresso'
                      : 'bg-brand-gold/20 text-brand-gold'
                  )}
                >
                  {item.badge}
                </span>
              ) : active ? (
                <ChevronRight className="w-3.5 h-3.5 text-brand-espresso opacity-70" />
              ) : null}
            </Link>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-brand-ivory/50">
          Quick Showroom Switcher
        </div>
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-3 px-3.5 py-2.5 rounded-card text-xs font-medium text-brand-ivory/70 hover:bg-white/5 hover:text-brand-gold transition-colors"
        >
          <Store className="w-4 h-4 text-brand-gold" />
          <span>View Public Storefront ↗</span>
        </Link>
      </div>

      {/* Admin Profile & Actions */}
      <div className="p-4 border-t border-white/10 bg-black/20">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold flex items-center justify-center font-bold text-xs shrink-0">
            AC
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white truncate">Mr. Altaf Chauhan</p>
            <p className="text-[10px] text-brand-gold/90 truncate">Proprietor (Est. 2003)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="w-full text-brand-ivory/80 hover:text-white hover:bg-white/10 text-xs justify-center gap-2 py-1.5 h-8 border border-white/10"
          >
            <LogOut className="w-3.5 h-3.5 text-brand-burgundy" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col w-64 shrink-0 border-r border-brand-gold/20 shadow-md min-h-screen sticky top-0 h-screen',
          className
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onMobileClose}
          />
          <div className="relative flex flex-col w-72 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
