'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  User,
  LogOut,
  Sparkles,
  Store,
  Menu,
  X,
  Phone,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, logout, initializeAuth, isLoading } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const navLinks = [
    {
      href: '/dashboard',
      label: 'Overview',
      icon: LayoutDashboard,
      active: pathname === '/dashboard',
    },
    {
      href: '/dashboard/orders',
      label: 'My Orders',
      icon: ShoppingBag,
      active: pathname.startsWith('/dashboard/orders'),
    },
    {
      href: '/dashboard/profile',
      label: 'My Profile',
      icon: User,
      active: pathname === '/dashboard/profile',
    },
  ];

  const displayName = profile?.displayName || user?.displayName || 'Valued Customer';
  const displayEmail = profile?.email || user?.email || 'customer@excellencefurnishing.com';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-brand-pearl flex flex-col">
      {/* Top Notice Bar */}
      <div className="bg-brand-espresso text-brand-ivory text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-accent italic text-brand-gold">Excellence Furnishing Gallery</span>
            <span className="hidden sm:inline text-brand-ivory/60">· Andheri West, Mumbai</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-brand-ivory/80">
            <span className="hidden sm:inline">Mon–Sun 10:00 AM – 9:30 PM</span>
            <a
              href="tel:+919820012345"
              className="hover:text-brand-gold flex items-center gap-1 transition-colors"
            >
              <Phone className="w-3 h-3 text-brand-gold" />
              <span>+91 98200 XXXXX</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Dashboard Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-brand-gold/20 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Brand Logo & Tag */}
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-card bg-brand-espresso flex items-center justify-center text-brand-gold border border-brand-gold/40 shadow-xs">
                  <span className="font-display font-bold text-lg">E</span>
                </div>
                <div>
                  <span className="font-display font-bold text-lg sm:text-xl text-brand-espresso tracking-tight block leading-tight">
                    Excellence
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-brand-gold font-semibold block">
                    Customer Portal
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'flex items-center gap-2 px-3.5 py-2 rounded-soft text-sm font-medium transition-all',
                      link.active
                        ? 'bg-brand-gold text-brand-ivory font-semibold shadow-xs'
                        : 'text-brand-espresso hover:bg-brand-ivory hover:text-brand-gold-dark'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <div className="h-6 w-px bg-brand-gold/20 mx-2" />

              <Link
                href="/products"
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-brand-gold hover:text-brand-gold-dark hover:underline transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>Showroom Catalog</span>
              </Link>
            </nav>

            {/* User Profile & Actions */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-2.5 pl-2">
                <div className="w-9 h-9 rounded-full bg-brand-ivory text-brand-gold-dark border border-brand-gold/40 flex items-center justify-center font-bold text-xs shadow-xs">
                  {initials}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-brand-espresso line-clamp-1 max-w-[130px]">
                    {displayName}
                  </div>
                  <div className="text-[10px] text-brand-charcoal/60 line-clamp-1 max-w-[130px]">
                    {user?.role === 'admin' ? 'Administrator' : 'Valued Client'}
                  </div>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="text-brand-charcoal/70 hover:text-brand-burgundy hover:bg-red-50 text-xs gap-1.5 ml-1"
                title="Sign out of account"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Logout</span>
              </Button>
            </div>

            {/* Mobile Hamburger Trigger */}
            <div className="md:hidden flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-soft text-brand-espresso hover:bg-brand-ivory focus:outline-none"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-brand-gold/20 bg-white px-4 pt-3 pb-4 space-y-2 shadow-lg animate-in slide-in-from-top-2">
            <div className="flex items-center gap-3 p-2 bg-brand-pearl rounded-card mb-2">
              <div className="w-9 h-9 rounded-full bg-brand-ivory text-brand-gold-dark border border-brand-gold/40 flex items-center justify-center font-bold text-xs shrink-0">
                {initials}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold text-brand-espresso truncate">{displayName}</p>
                <p className="text-xs text-brand-charcoal/60 truncate">{displayEmail}</p>
              </div>
            </div>

            <div className="space-y-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-soft text-sm font-medium',
                      link.active
                        ? 'bg-brand-gold text-brand-ivory font-semibold'
                        : 'text-brand-espresso hover:bg-brand-ivory'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}

              <Link
                href="/products"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 px-3 py-2.5 rounded-soft text-sm font-medium text-brand-gold hover:bg-brand-ivory"
              >
                <Store className="w-4 h-4" />
                <span>Showroom Catalog</span>
              </Link>
            </div>

            <div className="pt-2 border-t border-brand-gold/15 mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="w-full justify-center text-xs text-brand-burgundy border-red-200 hover:bg-red-50 gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {children}
      </main>

      {/* Mobile Sticky Bottom Tab Bar */}
      <div className="md:hidden sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-brand-gold/20 py-1.5 px-3 flex items-center justify-around shadow-elevated">
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-3 rounded-soft text-[10px] font-semibold transition-colors',
                link.active
                  ? 'text-brand-gold font-bold'
                  : 'text-brand-charcoal/70 hover:text-brand-espresso'
              )}
            >
              <Icon className={cn('w-5 h-5 mb-0.5', link.active && 'stroke-[2.5]')} />
              <span>{link.label}</span>
            </Link>
          );
        })}
        <Link
          href="/products"
          className="flex flex-col items-center justify-center py-1 px-3 rounded-soft text-[10px] font-semibold text-brand-charcoal/70 hover:text-brand-espresso"
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span>Catalog</span>
        </Link>
      </div>

      {/* Portal Footer */}
      <footer className="bg-white border-t border-brand-gold/20 py-4 px-4 text-center text-xs text-brand-charcoal/60">
        <p>
          Excellence The Furnishing Gallery · Shop No. 226, Sajid Tower, S.V. Road, Opp. Amboli
          Railway Station, Andheri West, Mumbai — 400058
        </p>
        <p className="mt-1 text-[11px]">
          Dedicated Customer Care: +91 98200 XXXXX · contact@excellencefurnishing.in
        </p>
      </footer>
    </div>
  );
}
