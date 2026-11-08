'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Header } from './Header';
import { Footer } from './Footer';

interface StorefrontShellProps {
  children: React.ReactNode;
}

export function StorefrontShell({ children }: StorefrontShellProps) {
  const pathname = usePathname();

  // If in admin or user dashboard, let those routes render their own dedicated shells
  const isDedicatedShell =
    Boolean(pathname && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')));

  if (isDedicatedShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-brand-pearl text-brand-espresso">
      <Header />
      <div className="flex-1 flex flex-col">{children}</div>
      <Footer />
    </div>
  );
}

export default StorefrontShell;
