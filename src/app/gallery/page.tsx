'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Eye, X, Sparkles, Filter, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface GalleryItem {
  id: string;
  title: string;
  category: 'curtains' | 'upholstery' | 'wallpapers' | 'mattresses' | 'showroom';
  categoryLabel: string;
  image: string;
  description: string;
  location: string;
  tag: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g-1',
    title: 'Double-Pinch Acoustic Velvet Drapes',
    category: 'curtains',
    categoryLabel: 'Curtains & Drapes',
    image: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200&auto=format&fit=crop&q=80',
    description: '420 GSM blackout velvet drape with Somfy motorized tracks in a Juhu coastal penthouse.',
    location: 'Juhu Scheme, Mumbai',
    tag: 'Bespoke Curtains',
  },
  {
    id: 'g-2',
    title: 'Emerald Chesterfield Velvet Reupholstery',
    category: 'upholstery',
    categoryLabel: 'Sofa Upholstery',
    image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&auto=format&fit=crop&q=80',
    description: 'Complete revival of vintage teak sofa frame with 500 GSM plush emerald velvet and 40-density foam.',
    location: 'Lokhandwala Complex, Andheri West',
    tag: 'Sofa Reupholstery',
  },
  {
    id: 'g-3',
    title: 'Nilaya Imperial Damask Embossed Wall',
    category: 'wallpapers',
    categoryLabel: 'Wallpapers',
    image: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=1200&auto=format&fit=crop&q=80',
    description: 'Seamless wall installation with gold foil metallic accents and mold-resistant primer.',
    location: 'Bandra West Bungalow',
    tag: 'Designer Wallpapers',
  },
  {
    id: 'g-4',
    title: 'Master Bedroom Refresh Latex Haven',
    category: 'mattresses',
    categoryLabel: 'Mattresses & Sleep',
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=1200&auto=format&fit=crop&q=80',
    description: 'Custom 78x72 inch dual-comfort Refresh latex mattress on upholstered fabric bed frame.',
    location: 'Versova, Mumbai',
    tag: 'Sleep Solutions',
  },
  {
    id: 'g-5',
    title: 'Andheri West Showroom Fabric Decks',
    category: 'showroom',
    categoryLabel: 'Our Showroom',
    image: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&auto=format&fit=crop&q=80',
    description: 'Over 2,000+ catalog swatches and drapery models displayed under true daylight lighting.',
    location: 'Shop No. 226, Sajid Tower, S.V. Road',
    tag: 'Showroom Interior',
  },
  {
    id: 'g-6',
    title: 'Airy Crushed Linen Sea-Breeze Sheers',
    category: 'curtains',
    categoryLabel: 'Curtains & Drapes',
    image: 'https://images.unsplash.com/photo-1541123437800-1bb1317badc2?w=1200&auto=format&fit=crop&q=80',
    description: 'Light-diffusing linen blend sheer voiles paired with custom ceiling recessed tracks.',
    location: 'Worli Sea Face Apartment',
    tag: 'Sheer Drapes',
  },
  {
    id: 'g-7',
    title: 'Modern Minimalist Grey Modular Seating',
    category: 'upholstery',
    categoryLabel: 'Sofa Upholstery',
    image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200&auto=format&fit=crop&q=80',
    description: 'Heavy commercial-grade textured linen weave tailored for contemporary open-concept living.',
    location: 'Pali Hill, Bandra',
    tag: 'Custom Seating',
  },
  {
    id: 'g-8',
    title: 'Geometric 3D Textured Wallpaper Feature',
    category: 'wallpapers',
    categoryLabel: 'Wallpapers',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&auto=format&fit=crop&q=80',
    description: 'Acoustic-absorbing textured wallpaper for private media room and home theater.',
    location: 'Oshiwara, Andheri West',
    tag: 'Acoustic Wallpapers',
  },
  {
    id: 'g-9',
    title: 'Egyptian Satin Bedding & Velvet Cushions',
    category: 'curtains',
    categoryLabel: 'Bedding & Accents',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=1200&auto=format&fit=crop&q=80',
    description: '400 TC Egyptian satin coordinated with hand-stitched velvet bolster and cushion covers.',
    location: 'Seven Bungalows, Versova',
    tag: 'Bedding Ensemble',
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All Installations' },
  { id: 'curtains', label: 'Curtains & Drapes' },
  { id: 'upholstery', label: 'Sofa Upholstery' },
  { id: 'wallpapers', label: 'Wallpapers & Murals' },
  { id: 'mattresses', label: 'Mattresses & Sleep' },
  { id: 'showroom', label: 'Gallery Showroom' },
];

export default function GalleryPage() {
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null);

  const filteredItems =
    selectedCat === 'all'
      ? GALLERY_ITEMS
      : GALLERY_ITEMS.filter((item) => item.category === selectedCat);

  return (
    <div className="py-12 sm:py-16 bg-brand-pearl min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 sm:space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold bg-brand-ivory border border-brand-gold/30 px-3.5 py-1 rounded-full">
            Excellence Showroom Portfolio
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl text-brand-espresso mt-4">
            Curated Installation Gallery
          </h1>
          <p className="font-accent italic text-lg sm:text-xl text-brand-burgundy mt-2">
            A visual showcase of bespoke curtains, sofa transformations, designer walls, and luxury sleep setups across Mumbai.
          </p>
          <div className="w-24 h-0.5 bg-brand-gold mx-auto mt-4" />
        </div>

        {/* Filter Category Tabs */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCat(cat.id)}
              className={`px-4 py-2 rounded-soft text-xs sm:text-sm font-semibold transition min-h-[44px] ${
                selectedCat === cat.id
                  ? 'btn-gradient-cta shadow'
                  : 'bg-white text-brand-espresso hover:bg-brand-ivory border border-brand-gold/25'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Photo Portfolio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setLightboxItem(item)}
              className="group relative rounded-card overflow-hidden bg-white border border-brand-gold/25 shadow-card hover:shadow-card-hover transition-all duration-300 cursor-pointer flex flex-col"
            >
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-espresso">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                {/* Tag Badge */}
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-brand-espresso text-[11px] font-semibold border border-brand-gold/30">
                    {item.tag}
                  </span>
                </div>

                {/* Hover Zoom Icon */}
                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-brand-gold text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Eye className="w-4 h-4" />
                </div>

                {/* Caption on Image */}
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <h3 className="font-display font-semibold text-lg text-white group-hover:text-brand-gold transition-colors">
                    {item.title}
                  </h3>
                  <span className="text-[11px] text-brand-pearl/75 block mt-0.5">
                    {item.location}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-white flex-1 flex flex-col justify-between">
                <p className="text-xs text-brand-charcoal/80 leading-relaxed line-clamp-2">
                  {item.description}
                </p>
                <div className="mt-3 pt-2 border-t border-brand-gold/15 flex items-center justify-between text-[11px] font-semibold text-brand-gold">
                  <span>View Project Details</span>
                  <span>Click to Expand ↗</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Lightbox Modal */}
        {lightboxItem && (
          <div
            className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
            onClick={() => setLightboxItem(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-white rounded-modal overflow-hidden shadow-2xl border border-brand-gold/40 flex flex-col max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-black/60 hover:bg-brand-burgundy text-white transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close image lightbox"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Large Image */}
              <div className="relative w-full h-80 sm:h-[450px] bg-black">
                <Image
                  src={lightboxItem.image}
                  alt={lightboxItem.title}
                  fill
                  className="object-contain"
                  sizes="100vw"
                />
              </div>

              {/* Modal Details Footer */}
              <div className="p-6 bg-brand-espresso text-brand-pearl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gold">
                      {lightboxItem.categoryLabel}
                    </span>
                    <span className="text-white/40">•</span>
                    <span className="text-xs text-brand-pearl/70">{lightboxItem.location}</span>
                  </div>
                  <h3 className="font-display font-bold text-xl text-white">
                    {lightboxItem.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-brand-pearl/80 mt-1 max-w-xl">
                    {lightboxItem.description}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    href="/contact"
                    className="btn-gradient-cta px-5 py-2.5 rounded-soft text-xs font-semibold shadow flex items-center gap-2 min-h-[44px]"
                  >
                    <span>Request Similar Styling</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
