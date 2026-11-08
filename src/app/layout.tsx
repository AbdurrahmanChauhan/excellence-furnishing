import type { Metadata } from 'next';
import { Playfair_Display, Inter, Cormorant_Garamond } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '600', '700', '900'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  weight: ['300', '400', '500', '600', '700'],
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  variable: '--font-cormorant',
  display: 'swap',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'Excellence The Furnishing Gallery | Luxury Curtains, Upholstery & Wallpapers | Andheri West, Mumbai',
  description:
    'Where Every Thread Tells a Story of Excellence. Premium bespoke curtains, luxury sofa upholstery, designer wallpapers, and sleep solutions in Andheri West, Mumbai for over 23 years.',
  keywords: [
    'curtains Mumbai',
    'furnishing gallery Andheri West',
    'sofa upholstery',
    'luxury wallpapers',
    'Refresh mattress Mumbai',
    'custom drapes',
    'Excellence Furnishing',
  ],
};

import { StorefrontShell } from '@/components/layout/StorefrontShell';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable} ${cormorant.variable}`}>
      <body className="min-h-screen font-body bg-brand-pearl text-brand-espresso flex flex-col">
        <StorefrontShell>{children}</StorefrontShell>
      </body>
    </html>
  );
}
