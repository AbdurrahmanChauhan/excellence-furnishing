import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowUpRight } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/config/site';

export function CategoryGrid() {
  return (
    <section className="py-16 sm:py-24 bg-brand-pearl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold bg-brand-ivory border border-brand-gold/30 px-3.5 py-1 rounded-full">
            Curated Showroom Collections
          </span>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-espresso mt-4">
            Explore by Design Category
          </h2>
          <p className="font-accent italic text-lg sm:text-xl text-brand-burgundy mt-2">
            Every fabric inspected for tactile luxury, acoustic density, and longevity.
          </p>
          <div className="w-24 h-0.5 bg-brand-gold mx-auto mt-4" />
        </div>

        {/* 6 Category Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {PRODUCT_CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={cat.href}
              className="group relative rounded-card overflow-hidden bg-white border border-brand-gold/20 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col"
            >
              {/* Image Container with Fabric Drape Zoom Effect */}
              <div className="relative h-64 sm:h-72 w-full overflow-hidden bg-brand-espresso">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover object-center group-hover:scale-105 group-hover:brightness-95 transition-transform duration-700 ease-out"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                {/* Badge */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/90 backdrop-blur-sm text-brand-espresso shadow-xs border border-brand-gold/30">
                    {cat.itemCount}
                  </span>
                </div>

                {/* Floating Arrow CTA */}
                <div className="absolute top-4 right-4 w-9 h-9 rounded-full bg-brand-gold text-white flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-0 translate-x-2 transition-all duration-300 shadow">
                  <ArrowUpRight className="w-5 h-5" />
                </div>

                {/* Title Overlay in Image */}
                <div className="absolute bottom-4 left-4 right-4 text-white">
                  <h3 className="font-display font-bold text-xl sm:text-2xl group-hover:text-brand-gold transition-colors">
                    {cat.name}
                  </h3>
                </div>
              </div>

              {/* Card Footer Details */}
              <div className="p-5 flex-1 flex flex-col justify-between bg-white">
                <p className="text-xs sm:text-sm text-brand-charcoal/80 leading-relaxed">
                  {cat.description}
                </p>
                <div className="mt-4 pt-3 border-t border-brand-gold/15 flex items-center justify-between text-xs font-semibold text-brand-gold group-hover:text-brand-burgundy transition-colors">
                  <span>Browse Catalog</span>
                  <span>View Details →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default CategoryGrid;
