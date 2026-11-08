'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  Search,
  ShoppingBag,
  User,
  Phone,
  Clock,
  MapPin,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  Shield,
} from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';
import { MAIN_NAV_ITEMS, CATEGORY_NAV_ITEMS } from '@/config/navigation';
import { useCartStore } from '@/store/cart-store';
import { cn } from '@/lib/utils';

export default function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [clientRole, setClientRole] = useState<'admin' | 'user' | null>(null);

  const cartItems = useCartStore((s) => s.items);
  const itemCount = (cartItems || []).reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      const match = document.cookie.match(/(?:^|;\s*)(?:user_role|ef_role)=([^;]*)/);
      if (match) {
        const role = decodeURIComponent(match[1]);
        if (role === 'admin' || role === 'user') {
          setClientRole(role as 'admin' | 'user');
        } else {
          setClientRole(null);
        }
      } else {
        setClientRole(null);
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    if (typeof document !== 'undefined') {
      const expired = 'path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = `session=; ${expired}`;
      document.cookie = `user_role=; ${expired}`;
      document.cookie = `ef_session=; ${expired}`;
      document.cookie = `ef_role=; ${expired}`;
      document.cookie = `ef_uid=; ${expired}`;
      setClientRole(null);
      window.location.href = '/login';
    }
  };

  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim() && typeof window !== 'undefined') {
      window.location.href = `/products?search=${encodeURIComponent(searchQuery.trim())}`;
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      {/* Top Banner Bar - Heritage & Contact Details */}
      <div className="bg-brand-espresso text-brand-pearl text-xs border-b border-brand-gold/20 py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-brand-gold">
              <span className="inline-block w-2 h-2 rounded-full bg-brand-gold animate-pulse" />
              <strong className="font-medium text-white">{SITE_CONFIG.yearsOfLegacy}+ Years Legacy</strong> (Est. {SITE_CONFIG.establishedYear})
            </span>
            <span className="flex items-center gap-1.5 text-brand-pearl/80">
              <MapPin className="w-3.5 h-3.5 text-brand-gold" />
              <span>{SITE_CONFIG.address.shop}, S.V. Road, Andheri West</span>
            </span>
            <span className="flex items-center gap-1.5 text-brand-pearl/80">
              <Clock className="w-3.5 h-3.5 text-brand-gold" />
              <span>{SITE_CONFIG.hours}</span>
            </span>
          </div>

          <div className="flex items-center gap-5">
            <a
              href={`tel:${SITE_CONFIG.phone}`}
              className="flex items-center gap-1.5 text-brand-pearl/90 hover:text-brand-gold transition"
            >
              <Phone className="w-3.5 h-3.5 text-brand-gold" />
              <span>{SITE_CONFIG.phoneDisplay}</span>
            </a>
            <span className="text-brand-gold/40">|</span>
            <span className="text-brand-gold font-medium">
              ★ {SITE_CONFIG.rating} ({SITE_CONFIG.reviewsCount} Google Reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Main Sticky Navigation Bar */}
      <header
        className={cn(
          'sticky top-0 z-40 w-full transition-all duration-200 border-b',
          isScrolled
            ? 'bg-white/95 backdrop-blur-md shadow-card border-brand-gold/20 py-2.5'
            : 'bg-white border-brand-gold/15 py-3.5'
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-4">
          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 -ml-2 rounded-soft text-brand-espresso hover:text-brand-gold hover:bg-brand-pearl transition min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label={mobileMenuOpen ? 'Close Menu' : 'Open Menu'}
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Brand Logo & Tagline */}
          <Link href="/" className="flex flex-col text-left group">
            <span className="font-display font-bold text-xl sm:text-2xl text-brand-espresso tracking-tight group-hover:text-brand-gold transition-colors flex items-center gap-2">
              <span className="text-brand-gold font-serif">✦</span>
              <span>Excellence</span>
              <span className="font-accent text-brand-gold italic font-normal text-lg sm:text-xl hidden xs:inline">
                The Furnishing Gallery
              </span>
            </span>
            <span className="font-accent italic text-[11px] sm:text-xs text-brand-burgundy tracking-wide -mt-0.5">
              &ldquo;{SITE_CONFIG.tagline}&rdquo;
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Main Navigation">
            {MAIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'text-sm font-medium transition-colors relative py-1 hover:text-brand-gold',
                    isActive ? 'text-brand-gold font-semibold' : 'text-brand-espresso'
                  )}
                >
                  {item.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-gold rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Icons (Search, Cart/Inquiry, Auth/Dashboard) */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Search Trigger */}
            <button
              type="button"
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2.5 rounded-full text-brand-espresso hover:text-brand-gold hover:bg-brand-pearl transition min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Search catalog"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Cart / Inquiry Badge */}
            <Link
              href="/products"
              className="p-2.5 rounded-full text-brand-espresso hover:text-brand-gold hover:bg-brand-pearl transition relative min-w-[44px] min-h-[44px] flex items-center justify-center group"
              aria-label={`View inquiries (${itemCount} items)`}
              title="Catalog & Inquiries"
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 bg-brand-burgundy text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-sm">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Auth Button / Dashboard Link */}
            {clientRole ? (
              <div className="flex items-center gap-2">
                <Link
                  href={clientRole === 'admin' ? '/admin' : '/dashboard'}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-soft bg-brand-ivory text-brand-espresso border border-brand-gold/30 hover:border-brand-gold hover:bg-brand-gold/10 text-xs font-semibold transition min-h-[44px]"
                  title={clientRole === 'admin' ? 'Admin Portal' : 'Customer Dashboard'}
                >
                  {clientRole === 'admin' ? (
                    <Shield className="w-4 h-4 text-brand-burgundy" />
                  ) : (
                    <LayoutDashboard className="w-4 h-4 text-brand-gold" />
                  )}
                  <span className="hidden sm:inline">
                    {clientRole === 'admin' ? 'Admin' : 'Dashboard'}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2.5 rounded-soft text-brand-charcoal hover:text-brand-burgundy hover:bg-brand-pearl transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Sign Out"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-soft btn-gradient-cta text-xs font-semibold shadow-sm transition min-h-[44px]"
              >
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}
          </div>
        </div>

        {/* Collapsible Search Bar */}
        {searchOpen && (
          <div className="border-t border-brand-gold/15 bg-brand-pearl px-4 py-3 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="max-w-3xl mx-auto">
              <form onSubmit={handleSearchSubmit} className="relative flex items-center">
                <Search className="absolute left-3.5 w-4 h-4 text-brand-charcoal/60" />
                <input
                  type="text"
                  placeholder="Search curtains, velvet upholstery, Nilaya wallpaper, Refresh mattresses..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-24 py-2.5 rounded-card bg-white border border-brand-gold/30 focus:border-brand-gold focus:ring-1 focus:ring-brand-gold text-sm text-brand-espresso placeholder:text-brand-charcoal/50 outline-none shadow-sm"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 px-3.5 py-1.5 bg-brand-gold text-white hover:bg-brand-gold-dark rounded-soft text-xs font-medium transition"
                >
                  Search
                </button>
              </form>
            </div>
          </div>
        )}
      </header>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-4/5 max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-brand-gold/20">
                <div>
                  <span className="font-display font-bold text-lg text-brand-espresso">
                    Excellence
                  </span>
                  <span className="block text-[11px] text-brand-gold font-medium">
                    {SITE_CONFIG.yearsOfLegacy}+ Years of Bespoke Furnishings
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-soft text-brand-espresso hover:text-brand-gold min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Main Nav Items */}
              <nav className="py-4 space-y-1">
                {MAIN_NAV_ITEMS.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center justify-between px-3 py-3 rounded-soft text-base font-medium transition min-h-[44px]',
                        isActive
                          ? 'bg-brand-ivory text-brand-gold font-semibold'
                          : 'text-brand-espresso hover:bg-brand-pearl hover:text-brand-gold'
                      )}
                    >
                      <span>{item.label}</span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </Link>
                  );
                })}
              </nav>

              {/* Categories Subsection */}
              <div className="pt-2 border-t border-brand-gold/15">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70 px-3">
                  Shop Categories
                </span>
                <div className="mt-2 space-y-1">
                  {CATEGORY_NAV_ITEMS.map((cat) => (
                    <Link
                      key={cat.href}
                      href={cat.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block px-3 py-2 text-sm text-brand-charcoal hover:text-brand-gold hover:bg-brand-pearl rounded-soft transition"
                    >
                      {cat.label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            {/* Drawer Footer Contact Details */}
            <div className="pt-6 border-t border-brand-gold/20 text-xs text-brand-charcoal space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <span>{SITE_CONFIG.address.shop}, S.V. Road, Opp. Amboli Station, Andheri West</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-gold shrink-0" />
                <span>{SITE_CONFIG.hours}</span>
              </div>
              <div className="pt-2 flex flex-col gap-2">
                <a
                  href={`tel:${SITE_CONFIG.phone}`}
                  className="w-full text-center py-2.5 px-4 bg-brand-gold text-white font-semibold rounded-soft shadow hover:bg-brand-gold-dark transition min-h-[44px] flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  <span>Call {SITE_CONFIG.phoneDisplay}</span>
                </a>
                <a
                  href={`https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent('Hello Excellence Furnishing, I would like to inquire about fabrics and custom drapery.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full text-center py-2.5 px-4 bg-[#25D366] text-white font-semibold rounded-soft hover:bg-[#20ba5a] transition min-h-[44px] flex items-center justify-center gap-2"
                >
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export { Header };


