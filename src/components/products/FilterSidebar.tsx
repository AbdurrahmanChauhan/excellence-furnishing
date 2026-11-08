'use client';

import React from 'react';
import { RotateCcw, Check, Sparkles } from 'lucide-react';
import { PRODUCT_CATEGORIES } from '@/config/site';

export interface FilterState {
  category: string;
  colors: string[];
  patterns: string[];
  materials: string[];
  minPrice: number;
  maxPrice: number;
}

export const COLOR_OPTIONS = [
  { name: 'Gold', hex: '#B8860B', border: 'border-yellow-600' },
  { name: 'Burgundy', hex: '#722F37', border: 'border-red-900' },
  { name: 'Ivory', hex: '#FAF3E0', border: 'border-amber-200' },
  { name: 'Espresso', hex: '#2C1810', border: 'border-stone-800' },
  { name: 'Navy', hex: '#1E3A8A', border: 'border-blue-900' },
  { name: 'Charcoal', hex: '#333333', border: 'border-neutral-800' },
  { name: 'Emerald', hex: '#047857', border: 'border-emerald-800' },
  { name: 'Beige', hex: '#E5D3B3', border: 'border-amber-300' },
];

export const PATTERN_OPTIONS = [
  { label: 'Solid / Plain', value: 'plain' },
  { label: 'Floral', value: 'floral' },
  { label: 'Damask', value: 'damask' },
  { label: 'Geometric', value: 'geometric' },
  { label: 'Textured', value: 'textured' },
  { label: 'Abstract', value: 'abstract' },
];

export const MATERIAL_OPTIONS = [
  'Velvet',
  'Linen',
  'PU Leather',
  'Jacquard',
  'Cotton',
  'Polyester Blend',
  'Latex',
  'Memory Foam',
  'Silk Blend',
];

export const MAX_PRICE_LIMIT = 40000;

interface FilterSidebarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
  totalResults,
}: FilterSidebarProps) {
  const handleCategorySelect = (catId: string) => {
    onFilterChange({
      ...filters,
      category: filters.category === catId ? 'all' : catId,
    });
  };

  const handleColorToggle = (colorName: string) => {
    const exists = filters.colors.includes(colorName);
    const updated = exists
      ? filters.colors.filter((c) => c !== colorName)
      : [...filters.colors, colorName];
    onFilterChange({ ...filters, colors: updated });
  };

  const handlePatternToggle = (patternValue: string) => {
    const exists = filters.patterns.includes(patternValue);
    const updated = exists
      ? filters.patterns.filter((p) => p !== patternValue)
      : [...filters.patterns, patternValue];
    onFilterChange({ ...filters, patterns: updated });
  };

  const handleMaterialToggle = (materialName: string) => {
    const exists = filters.materials.includes(materialName);
    const updated = exists
      ? filters.materials.filter((m) => m !== materialName)
      : [...filters.materials, materialName];
    onFilterChange({ ...filters, materials: updated });
  };

  const handlePriceChange = (min: number, max: number) => {
    onFilterChange({
      ...filters,
      minPrice: Math.max(0, min),
      maxPrice: Math.min(MAX_PRICE_LIMIT, Math.max(min, max)),
    });
  };

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.colors.length > 0 ||
    filters.patterns.length > 0 ||
    filters.materials.length > 0 ||
    filters.minPrice > 0 ||
    filters.maxPrice < MAX_PRICE_LIMIT;

  return (
    <aside className="w-full space-y-6 text-brand-espresso" aria-label="Product Filters">
      {/* Header & Reset Button */}
      <div className="flex items-center justify-between pb-3 border-b border-brand-gold/25">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-gold" />
          <h2 className="font-display font-semibold text-lg text-brand-espresso">
            Filter Catalog
          </h2>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-xs text-brand-burgundy hover:text-brand-burgundy-light font-semibold min-h-[36px] px-2 py-1 rounded-soft hover:bg-brand-burgundy/10 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset All</span>
          </button>
        )}
      </div>

      {/* 1. Category Filter */}
      <div className="space-y-3">
        <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-brand-charcoal/80">
          Categories
        </h3>
        <div className="space-y-1.5">
          <button
            type="button"
            onClick={() => onFilterChange({ ...filters, category: 'all' })}
            className={`w-full text-left px-3 py-2 rounded-soft text-xs sm:text-sm font-medium transition flex items-center justify-between min-h-[36px] ${
              filters.category === 'all'
                ? 'bg-brand-gold text-white font-semibold shadow-xs'
                : 'text-brand-charcoal hover:bg-brand-pearl hover:text-brand-gold'
            }`}
          >
            <span>All Categories</span>
            {filters.category === 'all' && <Check className="w-4 h-4 text-white" />}
          </button>

          {PRODUCT_CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategorySelect(cat.id)}
                className={`w-full text-left px-3 py-2 rounded-soft text-xs sm:text-sm font-medium transition flex items-center justify-between min-h-[36px] ${
                  isSelected
                    ? 'bg-brand-ivory text-brand-gold-dark border border-brand-gold font-semibold shadow-xs'
                    : 'text-brand-charcoal hover:bg-brand-pearl hover:text-brand-gold'
                }`}
              >
                <span>{cat.shortName}</span>
                {isSelected && <Check className="w-4 h-4 text-brand-gold" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Color Swatches Filter */}
      <div className="space-y-3 pt-4 border-t border-brand-gold/15">
        <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-brand-charcoal/80">
          Color Family
        </h3>
        <div className="grid grid-cols-4 gap-2">
          {COLOR_OPTIONS.map((col) => {
            const isSelected = filters.colors.includes(col.name);
            return (
              <button
                key={col.name}
                type="button"
                onClick={() => handleColorToggle(col.name)}
                className={`flex flex-col items-center justify-center p-2 rounded-card border transition-all min-h-[44px] ${
                  isSelected
                    ? 'border-brand-gold ring-2 ring-brand-gold bg-brand-ivory/50 shadow-xs'
                    : 'border-brand-gold/20 hover:border-brand-gold/60 bg-white'
                }`}
                title={`Filter by ${col.name}`}
              >
                <span
                  style={{ backgroundColor: col.hex }}
                  className={`w-6 h-6 rounded-full border shadow-inner flex items-center justify-center relative ${col.border}`}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 stroke-[3] ${
                        col.name === 'Ivory' || col.name === 'Beige'
                          ? 'text-brand-espresso'
                          : 'text-white'
                      }`}
                    />
                  )}
                </span>
                <span className="text-[10px] text-brand-charcoal mt-1 font-medium truncate max-w-full">
                  {col.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Pattern Filter */}
      <div className="space-y-3 pt-4 border-t border-brand-gold/15">
        <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-brand-charcoal/80">
          Pattern & Texture
        </h3>
        <div className="space-y-1.5">
          {PATTERN_OPTIONS.map((pat) => {
            const isSelected = filters.patterns.includes(pat.value);
            return (
              <label
                key={pat.value}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-soft hover:bg-brand-pearl cursor-pointer min-h-[36px]"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handlePatternToggle(pat.value)}
                  className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold accent-brand-gold border-brand-gold/30 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-brand-charcoal font-medium">
                  {pat.label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 4. Material Filter */}
      <div className="space-y-3 pt-4 border-t border-brand-gold/15">
        <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-brand-charcoal/80">
          Material & Fabric
        </h3>
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {MATERIAL_OPTIONS.map((mat) => {
            const isSelected = filters.materials.includes(mat);
            return (
              <label
                key={mat}
                className="flex items-center gap-2.5 px-2 py-1.5 rounded-soft hover:bg-brand-pearl cursor-pointer min-h-[36px]"
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => handleMaterialToggle(mat)}
                  className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold accent-brand-gold border-brand-gold/30 cursor-pointer"
                />
                <span className="text-xs sm:text-sm text-brand-charcoal font-medium">
                  {mat}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* 5. Dual Price Range in ₹ */}
      <div className="space-y-3 pt-4 border-t border-brand-gold/15">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-brand-charcoal/80">
            Price Range (₹)
          </h3>
          <span className="text-xs text-brand-gold-dark font-bold">
            ₹{filters.minPrice.toLocaleString('en-IN')} – ₹{filters.maxPrice.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Dual Input Controls */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div>
            <label className="text-[10px] text-brand-charcoal/70 block mb-1">Min Price (₹)</label>
            <input
              type="number"
              min={0}
              max={filters.maxPrice}
              step={100}
              value={filters.minPrice}
              onChange={(e) => handlePriceChange(Number(e.target.value) || 0, filters.maxPrice)}
              className="w-full px-2.5 py-1.5 rounded-soft border border-brand-gold/30 text-xs text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] text-brand-charcoal/70 block mb-1">Max Price (₹)</label>
            <input
              type="number"
              min={filters.minPrice}
              max={MAX_PRICE_LIMIT}
              step={500}
              value={filters.maxPrice}
              onChange={(e) => handlePriceChange(filters.minPrice, Number(e.target.value) || MAX_PRICE_LIMIT)}
              className="w-full px-2.5 py-1.5 rounded-soft border border-brand-gold/30 text-xs text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none"
            />
          </div>
        </div>

        {/* Fast Price Range Shortcuts */}
        <div className="flex flex-wrap gap-1.5 pt-2">
          <button
            type="button"
            onClick={() => handlePriceChange(0, 1000)}
            className="text-[11px] px-2 py-1 rounded-soft bg-brand-pearl hover:bg-brand-ivory border border-brand-gold/20 text-brand-charcoal"
          >
            Under ₹1k
          </button>
          <button
            type="button"
            onClick={() => handlePriceChange(1000, 3000)}
            className="text-[11px] px-2 py-1 rounded-soft bg-brand-pearl hover:bg-brand-ivory border border-brand-gold/20 text-brand-charcoal"
          >
            ₹1k – ₹3k
          </button>
          <button
            type="button"
            onClick={() => handlePriceChange(3000, 10000)}
            className="text-[11px] px-2 py-1 rounded-soft bg-brand-pearl hover:bg-brand-ivory border border-brand-gold/20 text-brand-charcoal"
          >
            ₹3k – ₹10k
          </button>
          <button
            type="button"
            onClick={() => handlePriceChange(10000, MAX_PRICE_LIMIT)}
            className="text-[11px] px-2 py-1 rounded-soft bg-brand-pearl hover:bg-brand-ivory border border-brand-gold/20 text-brand-charcoal"
          >
            ₹10k+
          </button>
        </div>
      </div>
    </aside>
  );
}

export default FilterSidebar;
