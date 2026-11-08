'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, Shield, Bell, Search, ExternalLink } from 'lucide-react';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/auth-store';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const pathname = usePathname();
  const { user, profile, initializeAuth } = useAuthStore();

  React.useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Compute a simple page title from pathname
  const getPageTitle = () => {
    if (pathname === '/admin') return 'Dashboard Overview';
    if (pathname === '/admin/clients') return 'Client CRM Directory';
    if (pathname === '/admin/clients/new') return 'New Client Onboarding';
    if (pathname.includes('/measure')) return 'Dynamic Measurement Wizard';
    if (pathname.startsWith('/admin/clients/')) return 'Client Profile & Rooms';
    if (pathname.startsWith('/admin/products')) return 'Product Inventory';
    if (pathname.startsWith('/admin/orders')) return 'Order Lifecycle Management';
    if (pathname.startsWith('/admin/invoices')) return 'Tax Invoices & Billing';
    if (pathname.startsWith('/admin/analytics')) return 'Sales & Performance Analytics';
    if (pathname.startsWith('/admin/settings')) return 'Showroom Settings & Rate Cards';
    return 'Admin Console';
  };

  return (
    <div className="min-h-screen bg-brand-pearl flex flex-col md:flex-row font-body text-brand-espresso">
      {/* Sidebar Navigation */}
      <AdminSidebar
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Administrative Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-brand-gold/20 px-4 sm:px-6 h-16 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-card text-brand-espresso hover:bg-brand-ivory transition-colors"
              aria-label="Open navigation sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-base sm:text-lg font-bold font-display text-brand-espresso leading-tight">
                {getPageTitle()}
              </h1>
              <p className="text-[11px] text-brand-charcoal/60 hidden sm:block">
                Excellence The Furnishing Gallery · S.V. Road, Andheri West
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-brand-gold hover:text-brand-gold-dark font-medium border border-brand-gold/30 px-3 py-1.5 rounded-soft hover:bg-brand-ivory/50 transition-colors"
            >
              <span>Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <div className="flex items-center gap-2 pl-2 border-l border-brand-gold/20">
              <div className="w-8 h-8 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold-dark flex items-center justify-center font-bold text-xs">
                AC
              </div>
              <div className="hidden lg:block text-left text-xs">
                <span className="font-bold text-brand-espresso block leading-tight">
                  Mr. Altab Chauhan
                </span>
                <span className="text-[10px] text-brand-gold-dark font-medium block">
                  Proprietor
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
