import React from 'react';
import Link from 'next/link';
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Instagram,
  ExternalLink,
  Award,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { SITE_CONFIG, PRODUCT_CATEGORIES } from '@/config/site';

export function Footer() {
  return (
    <footer className="bg-brand-espresso text-brand-pearl border-t border-brand-gold/25 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Top Feature Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-12 border-b border-brand-gold/20">
          <div className="flex items-start gap-3 p-4 rounded-card bg-white/5 border border-brand-gold/15">
            <div className="p-2.5 rounded-full bg-brand-gold/20 text-brand-gold shrink-0">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-white text-base">
                {SITE_CONFIG.yearsOfLegacy}+ Years of Heritage
              </h4>
              <p className="text-xs text-brand-pearl/75 mt-1 leading-relaxed">
                Founded in {SITE_CONFIG.establishedYear} by {SITE_CONFIG.proprietor}. Over {SITE_CONFIG.homesDraped} luxury homes & commercial spaces styled in Mumbai.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-card bg-white/5 border border-brand-gold/15">
            <div className="p-2.5 rounded-full bg-brand-gold/20 text-brand-gold shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-white text-base">
                Master Craftsmanship
              </h4>
              <p className="text-xs text-brand-pearl/75 mt-1 leading-relaxed">
                In-house Andheri West tailoring workshop. Precision pleating, motorized Somfy drapery tracks, and bespoke reupholstery.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 rounded-card bg-white/5 border border-brand-gold/15">
            <div className="p-2.5 rounded-full bg-brand-gold/20 text-brand-gold shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-display font-semibold text-white text-base">
                Authorized Brand Dealer
              </h4>
              <p className="text-xs text-brand-pearl/75 mt-1 leading-relaxed">
                Official dealer for Refresh Mattress, Dr. Ortho, Dunlop, Kurlon sleep systems, and Nilaya designer wallpapers.
              </p>
            </div>
          </div>
        </div>

        {/* Main Footer Links & Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 py-12">
          {/* Brand & Heritage Column */}
          <div className="space-y-4">
            <div className="flex flex-col">
              <span className="font-display font-bold text-2xl text-white tracking-tight">
                Excellence
              </span>
              <span className="font-accent italic text-brand-gold text-lg">
                The Furnishing Gallery
              </span>
            </div>
            <p className="text-xs text-brand-pearl/80 leading-relaxed">
              &ldquo;{SITE_CONFIG.tagline}&rdquo;
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-gold/20 border border-brand-gold/40 text-brand-gold text-xs font-semibold">
                ★ {SITE_CONFIG.rating} / 5.0 Rating • {SITE_CONFIG.reviewsCount} Google Reviews
              </span>
            </div>
            <div className="pt-2 text-xs text-brand-pearl/70 space-y-1">
              <p className="font-medium text-white">Proprietor & Master Consultants:</p>
              <p>{SITE_CONFIG.proprietor} (Proprietor)</p>
              <p>Senior Advisors: {SITE_CONFIG.keyStaff.join(' & ')}</p>
            </div>
          </div>

          {/* Product Categories */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4 pb-2 border-b border-brand-gold/20">
              Product Collections
            </h3>
            <ul className="space-y-2.5 text-xs text-brand-pearl/80">
              {PRODUCT_CATEGORIES.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={cat.href}
                    className="hover:text-brand-gold transition flex items-center justify-between group"
                  >
                    <span>{cat.shortName}</span>
                    <span className="text-[10px] text-brand-pearl/50 group-hover:text-brand-gold">
                      →
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Showroom & Location Column */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4 pb-2 border-b border-brand-gold/20">
              Showroom Visit
            </h3>
            <div className="space-y-3 text-xs text-brand-pearl/80">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-white font-medium">{SITE_CONFIG.address.shop}</p>
                  <p>{SITE_CONFIG.address.street}</p>
                  <p>{SITE_CONFIG.address.area}, {SITE_CONFIG.address.city} — {SITE_CONFIG.address.pincode}</p>
                  <p className="text-brand-gold text-[11px] font-medium pt-0.5">
                    Landmark: {SITE_CONFIG.address.landmark}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2">
                <Clock className="w-4 h-4 text-brand-gold shrink-0" />
                <div>
                  <p className="text-white font-medium">Visiting Hours</p>
                  <p>{SITE_CONFIG.hours}</p>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={SITE_CONFIG.mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-brand-gold hover:text-brand-gold-light text-xs font-semibold underline underline-offset-4"
                >
                  <span>Open Directions on Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Contact & Social Column */}
          <div>
            <h3 className="font-display font-semibold text-white text-sm uppercase tracking-wider mb-4 pb-2 border-b border-brand-gold/20">
              Connect & Inquire
            </h3>
            <div className="space-y-3 text-xs text-brand-pearl/80">
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-brand-gold shrink-0" />
                <a href={`tel:${SITE_CONFIG.phone}`} className="hover:text-brand-gold transition">
                  {SITE_CONFIG.phoneDisplay}
                </a>
              </div>

              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-brand-gold shrink-0" />
                <a href={`mailto:${SITE_CONFIG.email}`} className="hover:text-brand-gold transition">
                  {SITE_CONFIG.email}
                </a>
              </div>

              <div className="pt-3">
                <a
                  href={SITE_CONFIG.social.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-soft bg-gradient-to-r from-purple-900/60 to-pink-900/60 border border-pink-500/30 text-white hover:border-pink-400 transition"
                >
                  <Instagram className="w-4 h-4 text-pink-400" />
                  <span className="font-medium">{SITE_CONFIG.social.instagram}</span>
                </a>
              </div>

              <div className="pt-3">
                <Link
                  href="/contact"
                  className="block w-full text-center py-2.5 px-4 rounded-soft btn-gradient-cta text-xs font-semibold shadow hover:shadow-lg transition"
                >
                  Book Free In-Home Consultation
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Embedded Map Container */}
        <div className="py-6 border-t border-brand-gold/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 gap-2">
            <div>
              <h4 className="font-display font-semibold text-white text-sm">
                Visit Our Andheri West Showroom
              </h4>
              <p className="text-xs text-brand-pearl/70">
                Opposite Amboli Railway Station, Next to Cafe Arfa on S.V. Road
              </p>
            </div>
            <a
              href={SITE_CONFIG.mapDirectionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-gold text-xs font-semibold hover:underline flex items-center gap-1"
            >
              <span>Get Driving Directions</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="w-full h-48 sm:h-64 rounded-card overflow-hidden border border-brand-gold/30 shadow-card">
            <iframe
              title="Excellence The Furnishing Gallery Location"
              src={SITE_CONFIG.mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        {/* Bottom Legal, GSTIN & Copyright */}
        <div className="pt-8 border-t border-brand-gold/20 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-pearl/60">
          <p>
            © {new Date().getFullYear()} {SITE_CONFIG.name}. All rights reserved. Established 2003.
          </p>
          <div className="flex items-center gap-4 text-[11px]">
            <span>GSTIN: <strong className="text-brand-gold">{SITE_CONFIG.gstin}</strong> (Maharashtra)</span>
            <span>•</span>
            <Link href="/about" className="hover:text-brand-gold transition">
              About Heritage
            </Link>
            <span>•</span>
            <Link href="/gallery" className="hover:text-brand-gold transition">
              Gallery
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-brand-gold transition">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
export default Footer;
