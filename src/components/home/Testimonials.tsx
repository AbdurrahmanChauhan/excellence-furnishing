import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

interface Testimonial {
  id: string;
  author: string;
  location: string;
  rating: number;
  date: string;
  text: string;
  consultant: string;
  project: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 't-1',
    author: 'Dr. Rahul Mehta',
    location: 'Amboli / Andheri West',
    rating: 5,
    date: 'February 2026',
    text: 'Mr. Altamash guided our family through hundreds of curtain swatches with remarkable patience and knowledge. The blackout drapes with eyelet pleating transformed our bedroom into a 5-star hotel suite. The stitching turnaround was lightning-quick, delivered exactly as promised!',
    consultant: 'Consultation by Mr. Altamash',
    project: 'Full 3BHK Bespoke Curtains & Sheers',
  },
  {
    id: 't-2',
    author: 'Farhana Qureshi',
    location: 'Lokhandwala Complex, Andheri West',
    rating: 5,
    date: 'January 2026',
    text: 'We wanted to reupholster our 12-year-old teak sofa set instead of buying cheap new furniture. Mr. Altaf Chauhan personally inspected the frame and recommended 500 GSM velvet jacquard with high-density foam replacement. The finished sofa looks even more opulent than Italian designer brands!',
    consultant: 'Master Oversight by Mr. Altaf Chauhan',
    project: 'Sofa Reupholstery & Turkish Velvet Cushions',
  },
  {
    id: 't-3',
    author: 'Vikram & Sunita Singhal',
    location: 'Juhu Scheme, Mumbai',
    rating: 5,
    date: 'November 2025',
    text: 'Mr. Ahmed visited our apartment with full fabric catalogs and took laser-accurate measurements. The motorized wave drapes operate silently, and the Refresh latex mattress cured my chronic morning backache. Best furnishing establishment in Mumbai without a doubt.',
    consultant: 'Consultation by Mr. Ahmed',
    project: 'Somfy Motorized Drapes & Refresh Latex Mattress',
  },
  {
    id: 't-4',
    author: 'Priya & Rajiv Sharma',
    location: 'Bandra West, Mumbai',
    rating: 5,
    date: 'October 2025',
    text: '23 years of experience truly shows in their attention to detail. Every pleat sits evenly, hem weights keep the curtains from billowing in the monsoon breeze, and the Nilaya wallpaper installation was flawless with invisible joints.',
    consultant: 'Team Excellence',
    project: 'Bespoke Curtains & Nilaya Metallic Wallpaper',
  },
];

export function Testimonials() {
  return (
    <section className="py-16 sm:py-24 bg-white border-t border-brand-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-gold/15 text-brand-gold-dark text-xs font-semibold tracking-wider uppercase mb-3">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Verified Customer Stories</span>
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-espresso">
            Trusted by 5,000+ Mumbai Homes
          </h2>
          <p className="font-accent italic text-lg sm:text-xl text-brand-burgundy mt-2">
            Read verified experiences praising our master craftsmen and personalized styling.
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 fill-brand-gold text-brand-gold" />
            ))}
            <span className="ml-2 font-display font-bold text-brand-espresso text-base">
              {SITE_CONFIG.rating} / 5.0
            </span>
            <span className="text-xs text-brand-charcoal/70">
              ({SITE_CONFIG.reviewsCount} Google Reviews)
            </span>
          </div>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {TESTIMONIALS.map((t) => (
            <div
              key={t.id}
              className="p-6 sm:p-8 rounded-card bg-brand-pearl/50 border border-brand-gold/25 shadow-card hover:shadow-card-hover transition-all flex flex-col justify-between relative"
            >
              <Quote className="absolute top-6 right-6 w-8 h-8 text-brand-gold/20" />

              <div>
                {/* Rating Stars */}
                <div className="flex items-center gap-1 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-brand-gold text-brand-gold" />
                  ))}
                  <span className="text-xs font-semibold text-brand-gold-dark ml-2">5.0</span>
                </div>

                {/* Review Text */}
                <p className="text-xs sm:text-sm text-brand-charcoal leading-relaxed italic">
                  &ldquo;{t.text}&rdquo;
                </p>

                {/* Project Tag */}
                <div className="mt-4 pt-3 border-t border-brand-gold/15">
                  <span className="text-[11px] font-semibold text-brand-burgundy block">
                    {t.project}
                  </span>
                  <span className="text-[10px] text-brand-gold-dark font-medium block mt-0.5">
                    {t.consultant}
                  </span>
                </div>
              </div>

              {/* Author Info */}
              <div className="mt-6 flex items-center justify-between pt-4 border-t border-brand-gold/15">
                <div>
                  <h4 className="font-display font-semibold text-sm text-brand-espresso">
                    {t.author}
                  </h4>
                  <p className="text-[11px] text-brand-charcoal/75">{t.location}</p>
                </div>
                <span className="text-[11px] text-brand-charcoal/50">{t.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Testimonials;
