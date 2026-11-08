import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Award,
  Scissors,
  Users,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export const metadata = {
  title: 'About Our 23-Year Heritage | Excellence The Furnishing Gallery',
  description:
    'Discover the 23-year master craftsmanship legacy of Excellence Furnishing in Andheri West, Mumbai. Founded in 2003 by Mr. Altab Chauhan.',
};

export default function AboutPage() {
  return (
    <div className="py-12 sm:py-16 bg-brand-pearl min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16 sm:space-y-24">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold bg-brand-ivory border border-brand-gold/30 px-3.5 py-1 rounded-full">
            Established 2003 • 23+ Years of Mastery
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl text-brand-espresso mt-4 leading-tight">
            Where Every Thread Tells a Story of Excellence
          </h1>
          <p className="font-accent italic text-lg sm:text-2xl text-brand-burgundy mt-3">
            Two decades of transforming Mumbai apartments, coastal villas, and luxury commercial spaces into soft-furnished masterpieces.
          </p>
          <div className="w-24 h-0.5 bg-brand-gold mx-auto mt-6" />
        </div>

        {/* Heritage Story Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          <div className="lg:col-span-6 relative aspect-[4/3] rounded-modal overflow-hidden border border-brand-gold/30 shadow-card">
            <Image
              src="https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80"
              alt="Excellence Furnishing Tailoring Atelier"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
            <div className="absolute bottom-6 left-6 text-white">
              <span className="font-display font-bold text-xl block">
                The Andheri West Atelier
              </span>
              <span className="text-xs text-brand-pearl/80">
                Operating continuously on S.V. Road since 2003
              </span>
            </div>
          </div>

          <div className="lg:col-span-6 space-y-5 text-sm sm:text-base text-brand-charcoal leading-relaxed">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-brand-espresso">
              Our Legacy of Tactile Perfection
            </h2>
            <p>
              In 2003, <strong>Mr. Altab Chauhan</strong> opened the doors of <em>Excellence The Furnishing Gallery</em> with a singularly focused mission: to bring authentic European and bespoke Indian soft furnishing craftsmanship to Mumbai homeowners without the impersonal markup of corporate chains.
            </p>
            <p>
              Nestled near Amboli Railway Station and next to the iconic Cafe Arfa on S.V. Road, our showroom has grown over 23 years from a neighborhood boutique into an internationally recognized destination for curtains, sofa reupholstering, designer wallpapers, and sleep wellness.
            </p>
            <p>
              Unlike mass retailers who outsource tailoring to distant factories, Excellence maintains its own master sewing workshop in Andheri West. Every curtain pleat, blackout lining surcharge, and velvet piping is stitched under the meticulous watchful eye of our senior craftsmen.
            </p>

            <div className="pt-2 flex flex-wrap gap-4">
              <div className="p-3.5 rounded-card bg-white border border-brand-gold/25 shadow-xs flex-1 min-w-[140px]">
                <strong className="font-display text-2xl text-brand-gold font-bold block">
                  {SITE_CONFIG.yearsOfLegacy}+
                </strong>
                <span className="text-xs text-brand-charcoal/75">Continuous Years</span>
              </div>
              <div className="p-3.5 rounded-card bg-white border border-brand-gold/25 shadow-xs flex-1 min-w-[140px]">
                <strong className="font-display text-2xl text-brand-gold font-bold block">
                  {SITE_CONFIG.homesDraped}
                </strong>
                <span className="text-xs text-brand-charcoal/75">Homes Styled</span>
              </div>
              <div className="p-3.5 rounded-card bg-white border border-brand-gold/25 shadow-xs flex-1 min-w-[140px]">
                <strong className="font-display text-2xl text-brand-gold font-bold block">
                  {SITE_CONFIG.rating}★
                </strong>
                <span className="text-xs text-brand-charcoal/75">{SITE_CONFIG.reviewsCount} Google Reviews</span>
              </div>
            </div>
          </div>
        </div>

        {/* Master Leadership & Core Team */}
        <div className="pt-8 border-t border-brand-gold/20">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold">
              Master Craftsmanship Leadership
            </span>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-espresso mt-2">
              The People Behind Excellence
            </h2>
            <p className="font-accent italic text-brand-burgundy text-lg mt-1">
              Personalized guidance trusted by generations of Mumbai families.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mr. Altab Chauhan */}
            <div className="p-6 rounded-card bg-white border border-brand-gold/25 shadow-card text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-brand-gold/15 border-2 border-brand-gold mx-auto flex items-center justify-center text-brand-gold-dark font-display font-bold text-3xl">
                AC
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-brand-espresso">
                  Mr. Altab Chauhan
                </h3>
                <span className="text-xs font-semibold text-brand-burgundy uppercase tracking-wider block mt-0.5">
                  Proprietor & Master Furnisher
                </span>
                <p className="text-xs text-brand-charcoal/80 mt-3 leading-relaxed">
                  Founder of Excellence in 2003. Possesses over 25+ years of specialized fabric engineering, antique furniture restoration, and bespoke drapery design.
                </p>
              </div>
            </div>

            {/* Mr. Altamash */}
            <div className="p-6 rounded-card bg-white border border-brand-gold/25 shadow-card text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-brand-gold/15 border-2 border-brand-gold mx-auto flex items-center justify-center text-brand-gold-dark font-display font-bold text-3xl">
                MA
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-brand-espresso">
                  Mr. Altamash
                </h3>
                <span className="text-xs font-semibold text-brand-burgundy uppercase tracking-wider block mt-0.5">
                  Senior Textile & Drapery Consultant
                </span>
                <p className="text-xs text-brand-charcoal/80 mt-3 leading-relaxed">
                  Praised across 100+ public customer reviews for in-depth color consultation, fabric texture matchmaking, and swift custom stitching delivery.
                </p>
              </div>
            </div>

            {/* Mr. Alim */}
            <div className="p-6 rounded-card bg-white border border-brand-gold/25 shadow-card text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-brand-gold/15 border-2 border-brand-gold mx-auto flex items-center justify-center text-brand-gold-dark font-display font-bold text-3xl">
                AL
              </div>
              <div>
                <h3 className="font-display font-bold text-xl text-brand-espresso">
                  Mr. Alim
                </h3>
                <span className="text-xs font-semibold text-brand-burgundy uppercase tracking-wider block mt-0.5">
                  Master Measurement & Sleep Specialist
                </span>
                <p className="text-xs text-brand-charcoal/80 mt-3 leading-relaxed">
                  Head of in-home precision laser measurements, Somfy motorized drapery integration, and certified Refresh / Dr. Ortho sleep ergonomics.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Pillars of Excellence */}
        <div className="p-8 sm:p-12 rounded-modal bg-brand-espresso text-brand-pearl border border-brand-gold/30 shadow-card">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="font-display font-bold text-2xl sm:text-3xl text-white">
              The 4 Pillars of Excellence Furnishing
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2 p-4 rounded-card bg-white/5 border border-brand-gold/15">
              <Scissors className="w-6 h-6 text-brand-gold" />
              <h4 className="font-display font-semibold text-white text-base">In-House Tailoring</h4>
              <p className="text-xs text-brand-pearl/75 leading-relaxed">
                Zero outsourcing. Precision single, double, and triple pinch pleats, eyelets, and wave drapery tailored on-site.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-card bg-white/5 border border-brand-gold/15">
              <ShieldCheck className="w-6 h-6 text-brand-gold" />
              <h4 className="font-display font-semibold text-white text-base">Authorized Dealerships</h4>
              <p className="text-xs text-brand-pearl/75 leading-relaxed">
                Authentic warranties for Refresh Mattress, Dr. Ortho, Dunlop, Kurlon, and Nilaya designer wall coverings.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-card bg-white/5 border border-brand-gold/15">
              <Clock className="w-6 h-6 text-brand-gold" />
              <h4 className="font-display font-semibold text-white text-base">7-Day Showroom Access</h4>
              <p className="text-xs text-brand-pearl/75 leading-relaxed">
                Open Monday to Sunday, 10:00 AM to 9:30 PM for working families and weekend interior consultations.
              </p>
            </div>

            <div className="space-y-2 p-4 rounded-card bg-white/5 border border-brand-gold/15">
              <Sparkles className="w-6 h-6 text-brand-gold" />
              <h4 className="font-display font-semibold text-white text-base">AI Visualizer Modernity</h4>
              <p className="text-xs text-brand-pearl/75 leading-relaxed">
                Bridging heritage craftsmanship with cutting-edge Gemini AI space visualization for modern homeowners.
              </p>
            </div>
          </div>
        </div>

        {/* CTA to Catalog & Contact */}
        <div className="text-center pb-8">
          <h3 className="font-display font-bold text-2xl sm:text-3xl text-brand-espresso">
            Begin Your Home Transformation
          </h3>
          <p className="text-xs sm:text-sm text-brand-charcoal/80 mt-2">
            Visit our Andheri West gallery or schedule an in-home measurement visit.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-4">
            <Link
              href="/products"
              className="btn-gradient-cta px-6 py-3 rounded-soft text-xs sm:text-sm font-semibold shadow"
            >
              Browse Catalog Collections
            </Link>
            <Link
              href="/contact"
              className="px-6 py-3 rounded-soft bg-brand-ivory text-brand-espresso border border-brand-gold/40 hover:bg-brand-gold/15 text-xs sm:text-sm font-semibold transition"
            >
              Book In-Home Consultation
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
