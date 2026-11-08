import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Phone,
  Compass,
  Calendar,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export function ShowroomInvite() {
  return (
    <section className="py-16 sm:py-24 bg-brand-pearl border-t border-brand-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-modal bg-brand-espresso text-brand-pearl overflow-hidden border border-brand-gold/30 shadow-elevated grid grid-cols-1 lg:grid-cols-12">
          {/* Left Details Column */}
          <div className="lg:col-span-7 p-8 sm:p-12 lg:p-16 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold-light text-xs font-semibold uppercase tracking-wider mb-4">
                <Compass className="w-3.5 h-3.5" />
                <span>Visit Us in Andheri West</span>
              </div>

              <h2 className="font-display font-bold text-3xl sm:text-4xl text-white leading-tight">
                Experience Luxury Textures in Person
              </h2>

              <p className="font-accent italic text-lg sm:text-xl text-brand-ivory mt-2">
                Walk through thousands of fabrics, feel velvet drapes under natural lighting, and test Refresh mattresses.
              </p>

              {/* Location & Details Badges */}
              <div className="mt-8 space-y-4 text-xs sm:text-sm text-brand-pearl/85">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-brand-gold/20 text-brand-gold shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Showroom Address:</strong>
                    <span>{SITE_CONFIG.address.shop}, {SITE_CONFIG.address.street}</span>
                    <span className="block">{SITE_CONFIG.address.area}, {SITE_CONFIG.address.city} — {SITE_CONFIG.address.pincode}</span>
                    <span className="text-brand-gold text-xs block mt-0.5 font-medium">
                      Landmark: {SITE_CONFIG.address.landmark}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-brand-gold/20 text-brand-gold shrink-0 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Store Operating Hours:</strong>
                    <span>{SITE_CONFIG.hours}</span>
                    <span className="block text-brand-pearl/70 text-xs">
                      Open all 7 days including Sunday evenings
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-full bg-brand-gold/20 text-brand-gold shrink-0 mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <strong className="text-white block font-medium">Direct Telephone & WhatsApp:</strong>
                    <a href={`tel:${SITE_CONFIG.phone}`} className="text-brand-gold hover:underline">
                      {SITE_CONFIG.phoneDisplay}
                    </a>
                    <span className="block text-brand-pearl/70 text-xs">
                      Guidance by Mr. Altamash & Mr. Alim
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* CTAs */}
            <div className="mt-10 pt-6 border-t border-brand-gold/20 flex flex-wrap gap-4 items-center">
              <a
                href={SITE_CONFIG.mapDirectionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-gradient-cta px-6 py-3 rounded-soft text-sm font-semibold shadow hover:shadow-lg transition min-h-[44px] flex items-center gap-2"
              >
                <Compass className="w-4 h-4" />
                <span>Get Google Maps Directions</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <Link
                href="/contact"
                className="px-6 py-3 rounded-soft bg-white/10 hover:bg-white/20 border border-brand-gold/40 text-brand-pearl text-sm font-semibold transition min-h-[44px] flex items-center gap-2"
              >
                <Calendar className="w-4 h-4 text-brand-gold" />
                <span>Schedule In-Home Measurement</span>
              </Link>
            </div>
          </div>

          {/* Right Map Preview Column */}
          <div className="lg:col-span-5 relative min-h-[320px] lg:min-h-full border-t lg:border-t-0 lg:border-l border-brand-gold/20">
            <iframe
              title="Excellence The Furnishing Gallery Showroom Map"
              src={SITE_CONFIG.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '320px' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default ShowroomInvite;
