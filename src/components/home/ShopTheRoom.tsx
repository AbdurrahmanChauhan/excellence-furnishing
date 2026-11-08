'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Sparkles, ArrowRight, X, ExternalLink } from 'lucide-react';
import { formatINR } from '@/lib/utils';

interface Hotspot {
  id: string;
  xPercent: number; // 0 - 100
  yPercent: number; // 0 - 100
  productNumber: number;
  productId: string;
  name: string;
  categoryName: string;
  pricePaise: number;
  unit: string;
  swatchUrl: string;
  productUrl: string;
}

interface RoomScene {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  hotspots: Hotspot[];
}

const ROOM_SCENES: RoomScene[] = [
  {
    id: 'living-room',
    title: 'The Andheri West Grand Living Salon',
    description:
      'A harmonious pairing of 420 GSM blackout royal velvet drapes, hand-pleated emerald sofa upholstery, and imperial damask wallpaper.',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1600&auto=format&fit=crop&q=80',
    hotspots: [
      {
        id: 'pin-1',
        xPercent: 18,
        yPercent: 35,
        productNumber: 1,
        productId: 'curt-velvet-royal-gold',
        name: 'Royal Gold Heritage Velvet Drapery',
        categoryName: 'Bespoke Curtains',
        pricePaise: 220000,
        unit: 'meter',
        swatchUrl: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=300',
        productUrl: '/products/curt-velvet-royal-gold',
      },
      {
        id: 'pin-2',
        xPercent: 48,
        yPercent: 68,
        productNumber: 2,
        productId: 'uph-velvet-emerald-green',
        name: 'Emerald Heritage Velvet Upholstery',
        categoryName: 'Sofa Upholstery',
        pricePaise: 240000,
        unit: 'meter',
        swatchUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300',
        productUrl: '/products/uph-velvet-emerald-green',
      },
      {
        id: 'pin-3',
        xPercent: 78,
        yPercent: 28,
        productNumber: 3,
        productId: 'wall-nilaya-imperial-damask',
        name: 'Nilaya Imperial Damask Wallpaper',
        categoryName: 'Wallpapers & Murals',
        pricePaise: 480000,
        unit: 'roll',
        swatchUrl: 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=300',
        productUrl: '/products/wall-nilaya-imperial-damask',
      },
    ],
  },
  {
    id: 'master-bedroom',
    title: 'The Juhu Master Bedroom Sanctuary',
    description:
      'Airy linen sheer curtains diffusing Arabian Sea sunlight, framed by Refresh orthopedic latex bedding and acoustic headboard fabrics.',
    imageUrl: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1600&auto=format&fit=crop&q=80',
    hotspots: [
      {
        id: 'pin-4',
        xPercent: 25,
        yPercent: 42,
        productNumber: 1,
        productId: 'curt-sheer-amboli-voile',
        name: 'Amboli Crushed Linen Sheer Voile',
        categoryName: 'Sheer Curtains',
        pricePaise: 65000,
        unit: 'meter',
        swatchUrl: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=300',
        productUrl: '/products/curt-sheer-amboli-voile',
      },
      {
        id: 'pin-5',
        xPercent: 62,
        yPercent: 72,
        productNumber: 2,
        productId: 'mat-refresh-natural-latex',
        name: 'Refresh Organic 7-Zone Pure Latex',
        categoryName: 'Mattresses & Sleep',
        pricePaise: 3800000,
        unit: 'piece',
        swatchUrl: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=300',
        productUrl: '/products/mat-refresh-natural-latex',
      },
      {
        id: 'pin-6',
        xPercent: 70,
        yPercent: 38,
        productNumber: 3,
        productId: 'bed-egyptian-cotton-gold',
        name: '400 TC Egyptian Satin Bed Sheet Set',
        categoryName: 'Bedding & Accessories',
        pricePaise: 420000,
        unit: 'piece',
        swatchUrl: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=300',
        productUrl: '/products/bed-egyptian-cotton-gold',
      },
    ],
  },
];

export function ShopTheRoom() {
  const [selectedSceneId, setSelectedSceneId] = useState<string>('living-room');
  const [activePin, setActivePin] = useState<Hotspot | null>(null);

  const activeScene = ROOM_SCENES.find((s) => s.id === selectedSceneId) || ROOM_SCENES[0];

  return (
    <section className="py-16 sm:py-24 bg-brand-ivory/50 border-t border-brand-gold/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 sm:mb-12 gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-gold/15 border border-brand-gold/30 text-brand-gold-dark text-xs font-semibold uppercase tracking-wider mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Interactive Room Styling</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl text-brand-espresso">
              Shop The Curated Room
            </h2>
            <p className="font-accent italic text-lg sm:text-xl text-brand-burgundy mt-1">
              Click the interactive pins to explore individual fabrics, wallpapers, and sleep solutions.
            </p>
          </div>

          {/* Room Scene Tabs */}
          <div className="flex items-center gap-2 p-1.5 rounded-card bg-white border border-brand-gold/25 shadow-xs shrink-0 self-start md:self-auto">
            {ROOM_SCENES.map((scene) => (
              <button
                key={scene.id}
                type="button"
                onClick={() => {
                  setSelectedSceneId(scene.id);
                  setActivePin(null);
                }}
                className={`px-4 py-2 rounded-soft text-xs sm:text-sm font-semibold transition min-h-[44px] ${
                  selectedSceneId === scene.id
                    ? 'btn-gradient-cta shadow'
                    : 'text-brand-espresso hover:text-brand-gold hover:bg-brand-pearl'
                }`}
              >
                {scene.title.split(' ')[2] || scene.title}
              </button>
            ))}
          </div>
        </div>

        {/* Room Visual Canvas */}
        <div className="relative rounded-card overflow-hidden border border-brand-gold/30 shadow-card bg-brand-espresso">
          <div className="relative w-full h-[380px] sm:h-[500px] lg:h-[620px]">
            <Image
              src={activeScene.imageUrl}
              alt={activeScene.title}
              fill
              className="object-cover object-center filter brightness-95"
              sizes="100vw"
            />
            <div className="absolute inset-0 bg-black/15 pointer-events-none" />

            {/* Pulsing Hotspot Pins */}
            {activeScene.hotspots.map((pin) => {
              const isSelected = activePin?.id === pin.id;
              return (
                <div
                  key={pin.id}
                  style={{ left: `${pin.xPercent}%`, top: `${pin.yPercent}%` }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
                >
                  <button
                    type="button"
                    onClick={() => setActivePin(isSelected ? null : pin)}
                    className="relative group min-w-[44px] min-h-[44px] flex items-center justify-center focus:outline-none"
                    aria-label={`View ${pin.name}`}
                  >
                    {/* Pulsing Ring */}
                    <span className="absolute w-8 h-8 rounded-full bg-brand-gold/40 animate-ping" />
                    {/* Outer Core */}
                    <span className="relative w-7 h-7 rounded-full bg-brand-espresso text-brand-gold border-2 border-brand-gold flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:bg-brand-gold group-hover:text-white transition-all font-display text-xs font-bold">
                      {pin.productNumber}
                    </span>
                  </button>

                  {/* Hotspot Floating Tooltip (Desktop) */}
                  {isSelected && (
                    <div className="absolute left-1/2 bottom-full -translate-x-1/2 mb-3 w-64 sm:w-72 bg-white rounded-card shadow-2xl border border-brand-gold/30 p-3.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                      <div className="flex items-start justify-between gap-2 pb-2 border-b border-brand-gold/15">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-brand-gold">
                          {pin.categoryName}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActivePin(null);
                          }}
                          className="text-brand-charcoal hover:text-brand-burgundy p-1 min-w-[24px] min-h-[24px] flex items-center justify-center"
                          aria-label="Close details"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-3 pt-2.5">
                        <div className="relative w-12 h-12 rounded-soft overflow-hidden shrink-0 border border-brand-gold/20">
                          <Image
                            src={pin.swatchUrl}
                            alt={pin.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display font-semibold text-xs sm:text-sm text-brand-espresso truncate">
                            {pin.name}
                          </h4>
                          <p className="text-xs font-bold text-brand-gold-dark mt-0.5">
                            {formatINR(pin.pricePaise, true)}
                            <span className="text-[10px] font-normal text-brand-charcoal/70">
                              {' '}
                              / {pin.unit}
                            </span>
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 pt-2 border-t border-brand-gold/15">
                        <Link
                          href={pin.productUrl}
                          className="w-full btn-gradient-cta py-1.5 px-3 rounded-soft text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs"
                        >
                          <span>Explore Product</span>
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Bottom Bar Info on Room */}
          <div className="p-4 sm:p-6 bg-brand-espresso text-brand-pearl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-display font-bold text-lg sm:text-xl text-white">
                {activeScene.title}
              </h3>
              <p className="text-xs sm:text-sm text-brand-pearl/80 mt-1 max-w-2xl leading-relaxed">
                {activeScene.description}
              </p>
            </div>
            <Link
              href="/products"
              className="btn-gradient-cta px-5 py-2.5 rounded-soft text-xs sm:text-sm font-semibold shrink-0 self-start sm:self-auto flex items-center gap-2 min-h-[44px]"
            >
              <span>View All Showroom Fabrics</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Product Cards Strip for the Selected Room (Mobile & Tablet Friendly) */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {activeScene.hotspots.map((pin) => (
            <div
              key={pin.id}
              onClick={() => setActivePin(pin)}
              className={`p-3.5 rounded-card bg-white border transition-all cursor-pointer flex items-center gap-3.5 ${
                activePin?.id === pin.id
                  ? 'border-brand-gold ring-1 ring-brand-gold shadow-md'
                  : 'border-brand-gold/20 hover:border-brand-gold/60 shadow-xs'
              }`}
            >
              <div className="w-6 h-6 rounded-full bg-brand-gold text-white font-display font-bold text-xs flex items-center justify-center shrink-0">
                {pin.productNumber}
              </div>
              <div className="relative w-12 h-12 rounded-soft overflow-hidden shrink-0 border border-brand-gold/20">
                <Image src={pin.swatchUrl} alt={pin.name} fill className="object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[10px] text-brand-burgundy font-semibold block uppercase">
                  {pin.categoryName}
                </span>
                <h4 className="font-display font-medium text-xs sm:text-sm text-brand-espresso truncate">
                  {pin.name}
                </h4>
                <p className="text-xs font-bold text-brand-gold-dark mt-0.5">
                  {formatINR(pin.pricePaise, true)}{' '}
                  <span className="text-[10px] font-normal text-brand-charcoal/70">
                    / {pin.unit}
                  </span>
                </p>
              </div>
              <Link
                href={pin.productUrl}
                className="p-2 rounded-soft text-brand-gold hover:text-brand-burgundy transition min-w-[44px] min-h-[44px] flex items-center justify-center"
                title="View product"
              >
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default ShopTheRoom;
