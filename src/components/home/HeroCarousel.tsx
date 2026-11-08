'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Sparkles, Calendar, ArrowRight } from 'lucide-react';

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  tagline: string;
  image: string;
  ctaText: string;
  ctaLink: string;
  badge: string;
}

const HERO_SLIDES: Slide[] = [
  {
    id: 1,
    badge: 'Heritage Collection 2026',
    title: 'Where Every Thread Tells a Story of Excellence',
    subtitle: 'Bespoke Curtains & Architectural Drapery',
    tagline: 'Tailored to perfection in our Andheri West atelier with Somfy motorization and acoustic velvet linings.',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1600&auto=format&fit=crop&q=80',
    ctaText: 'Explore Collections',
    ctaLink: '/products?category=curtains_window_treatments',
  },
  {
    id: 2,
    badge: 'Master Reupholstery',
    title: 'Transform Your Living Space with Turkish Velvets',
    subtitle: 'Hand-Tufted Sofas & High-Resilience Foams',
    tagline: 'Revitalize heirloom sofas or design bespoke seating with over 500+ commercial-grade jacquards and rexines.',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1600&auto=format&fit=crop&q=80',
    ctaText: 'View Upholstery Fabrics',
    ctaLink: '/products?category=sofa_upholstery_fabrics',
  },
  {
    id: 3,
    badge: 'Exclusive Wall Murals',
    title: 'Nilaya & European Textures for Mumbai Homes',
    subtitle: 'Metallic Damasks, Non-Woven & 3D Wallpapers',
    tagline: 'Seamless professional wall installation with mold-resistant treatments tailored for coastal living.',
    image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1600&auto=format&fit=crop&q=80',
    ctaText: 'Browse Wallpapers',
    ctaLink: '/products?category=wallpapers',
  },
];

export function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);

  return (
    <section className="relative w-full h-[520px] sm:h-[600px] lg:h-[680px] overflow-hidden bg-brand-espresso">
      {/* Slides */}
      {HERO_SLIDES.map((slide, idx) => {
        const isActive = idx === currentSlide;
        return (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
              isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
            }`}
          >
            {/* Background Image with Dark Vignette Overlay */}
            <div className="absolute inset-0">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                priority={idx === 0}
                className="object-cover object-center filter brightness-[0.45] contrast-[1.05]"
                sizes="100vw"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/30" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
            </div>

            {/* Slide Content */}
            <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
              <div className="max-w-2xl sm:max-w-3xl space-y-4 sm:space-y-6">
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-gold/25 border border-brand-gold/50 backdrop-blur-sm text-brand-gold-light text-xs sm:text-sm font-medium tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-brand-gold" />
                  <span>{slide.badge}</span>
                </div>

                {/* Subtitle */}
                <p className="font-accent italic text-brand-ivory text-lg sm:text-2xl text-shadow-sm">
                  {slide.subtitle}
                </p>

                {/* Main Heading */}
                <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl text-white tracking-tight leading-[1.15]">
                  {slide.title}
                </h1>

                {/* Tagline Description */}
                <p className="text-sm sm:text-base text-brand-pearl/85 max-w-xl leading-relaxed">
                  {slide.tagline}
                </p>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-wrap gap-4 items-center">
                  <Link
                    href={slide.ctaLink}
                    className="btn-gradient-cta px-6 sm:px-8 py-3.5 rounded-soft text-sm sm:text-base font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2 min-h-[44px]"
                  >
                    <span>{slide.ctaText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>

                  <Link
                    href="/contact"
                    className="px-6 sm:px-8 py-3.5 rounded-soft bg-white/10 hover:bg-white/20 border border-brand-gold/40 text-brand-pearl backdrop-blur-sm text-sm sm:text-base font-semibold transition min-h-[44px] flex items-center gap-2"
                  >
                    <Calendar className="w-4 h-4 text-brand-gold" />
                    <span>Book In-Home Consultation</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Carousel Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-brand-gold text-white backdrop-blur-sm transition min-w-[44px] min-h-[44px] flex items-center justify-center border border-white/20"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2.5 rounded-full bg-black/40 hover:bg-brand-gold text-white backdrop-blur-sm transition min-w-[44px] min-h-[44px] flex items-center justify-center border border-white/20"
        aria-label="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {HERO_SLIDES.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => setCurrentSlide(idx)}
            className={`transition-all duration-300 h-2 rounded-full ${
              idx === currentSlide ? 'w-8 bg-brand-gold' : 'w-2 bg-white/40 hover:bg-white/70'
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroCarousel;
