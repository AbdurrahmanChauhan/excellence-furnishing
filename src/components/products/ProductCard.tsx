'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Eye, Sparkles } from 'lucide-react';
import { Product } from '@/types/product';
import { formatINR } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const mainImage = product.images[0] || 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800';
  const swatchImg = product.swatchImage || mainImage;

  return (
    <div className="group relative rounded-card bg-white border border-brand-gold/20 shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col overflow-hidden">
      {/* Media Container with Fabric Drape Hover Effect */}
      <div className="relative aspect-square w-full overflow-hidden bg-brand-pearl">
        <Image
          src={mainImage}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out"
        />

        {/* Hover quick overlay */}
        <div className="absolute inset-0 bg-brand-espresso/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Category & Tag Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
          {product.isBestSeller && (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-gold text-white text-[10px] font-bold uppercase tracking-wider shadow-xs">
              <Sparkles className="w-2.5 h-2.5" />
              <span>Best Seller</span>
            </span>
          )}
          {product.brand && product.brand !== 'Excellence In-House' && (
            <span className="px-2 py-0.5 rounded-full bg-white/90 backdrop-blur-sm text-brand-espresso text-[10px] font-semibold border border-brand-gold/30">
              {product.brand}
            </span>
          )}
        </div>

        {/* Swatch Thumbnail Preview on Card */}
        <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 p-1 rounded-full bg-white/90 backdrop-blur-sm border border-brand-gold/30 shadow-xs">
          <div className="relative w-5 h-5 rounded-full overflow-hidden border border-brand-gold/40">
            <Image src={swatchImg} alt={`${product.name} Swatch`} fill className="object-cover" />
          </div>
          {product.colors.slice(0, 2).map((col, idx) => (
            <span key={idx} className="text-[10px] font-medium text-brand-charcoal pr-1 hidden sm:inline">
              {col}
            </span>
          ))}
          {product.colors.length > 2 && (
            <span className="text-[9px] text-brand-gold font-bold pr-1">
              +{product.colors.length - 2}
            </span>
          )}
        </div>

        {/* Quick View Button on Hover */}
        <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Link
            href={`/products/${product.id}`}
            className="p-2 rounded-full bg-brand-gold text-white hover:bg-brand-gold-dark shadow-md flex items-center justify-center min-w-[36px] min-h-[36px]"
            title="View Product Details"
          >
            <Eye className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Subcategory & Stock */}
          <div className="flex items-center justify-between text-[11px] text-brand-charcoal/70 mb-1">
            <span className="capitalize font-medium text-brand-burgundy">
              {product.subcategory ? product.subcategory.replace(/_/g, ' ') : product.category.replace(/_/g, ' ')}
            </span>
            <span className={product.stockQuantity > 0 ? 'text-brand-forest font-semibold' : 'text-red-600'}>
              {product.stockQuantity > 0 ? 'In Stock' : 'Pre-Order'}
            </span>
          </div>

          {/* Title */}
          <Link href={`/products/${product.id}`}>
            <h3 className="font-display font-semibold text-base text-brand-espresso line-clamp-1 group-hover:text-brand-gold transition-colors">
              {product.name}
            </h3>
          </Link>

          {/* Short Description */}
          <p className="text-xs text-brand-charcoal/75 mt-1 line-clamp-2 leading-relaxed">
            {product.shortDescription || product.description}
          </p>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-4 pt-3 border-t border-brand-gold/15 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="font-display font-bold text-base sm:text-lg text-brand-espresso">
                {formatINR(product.pricePerUnitPaise, true)}
              </span>
              <span className="text-xs text-brand-charcoal/60">
                / {product.unit}
              </span>
            </div>
            {product.mrpPaise && product.mrpPaise > product.pricePerUnitPaise && (
              <span className="text-[10px] text-brand-charcoal/50 line-through">
                MRP {formatINR(product.mrpPaise, true)}
              </span>
            )}
          </div>

          <Link
            href={`/products/${product.id}`}
            className="px-3 py-1.5 rounded-soft text-xs font-semibold bg-brand-ivory text-brand-espresso hover:bg-brand-gold hover:text-white border border-brand-gold/30 transition min-h-[36px] flex items-center justify-center"
          >
            Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default ProductCard;
