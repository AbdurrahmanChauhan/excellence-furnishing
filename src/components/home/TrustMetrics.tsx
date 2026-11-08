import React from 'react';
import { Award, Star, Users, Home, Truck, Scissors } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

const METRICS = [
  {
    icon: Award,
    title: `${SITE_CONFIG.yearsOfLegacy}+ Years`,
    subtitle: 'Legacy of Excellence',
    desc: 'Serving Mumbai since 2003',
  },
  {
    icon: Star,
    title: `${SITE_CONFIG.rating}★ Rating`,
    subtitle: 'Google Verified',
    desc: `${SITE_CONFIG.reviewsCount} 5-Star Customer Reviews`,
  },
  {
    icon: Home,
    title: SITE_CONFIG.homesDraped,
    subtitle: 'Spaces Draped & Styled',
    desc: 'Bespoke residential & commercial',
  },
  {
    icon: Scissors,
    title: 'In-House Atelier',
    subtitle: 'Master Craftsmen',
    desc: 'Custom pleating & reupholstery',
  },
  {
    icon: Truck,
    title: 'Same Day Delivery',
    subtitle: 'Express In-Stock Dispatch',
    desc: 'Across Mumbai Western Suburbs',
  },
];

export function TrustMetrics() {
  return (
    <section className="bg-brand-ivory border-y border-brand-gold/25 py-8 sm:py-10 shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 sm:gap-8">
          {METRICS.map((m, idx) => {
            const Icon = m.icon;
            return (
              <div
                key={idx}
                className="flex flex-col items-center text-center p-3 sm:p-4 rounded-card bg-white/70 border border-brand-gold/20 shadow-xs hover:border-brand-gold/50 transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-brand-gold/15 text-brand-gold flex items-center justify-center mb-2.5">
                  <Icon className="w-5 h-5 text-brand-gold-dark" />
                </div>
                <span className="font-display font-bold text-lg sm:text-xl text-brand-espresso">
                  {m.title}
                </span>
                <span className="font-semibold text-xs text-brand-burgundy uppercase tracking-wider mt-0.5">
                  {m.subtitle}
                </span>
                <span className="text-[11px] text-brand-charcoal/80 mt-1">
                  {m.desc}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default TrustMetrics;
