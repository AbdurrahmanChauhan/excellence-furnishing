'use client';

import React from 'react';
import { SlidersHorizontal, ArrowUpDown, X, Search } from 'lucide-react';
import { FilterState } from './FilterSidebar';

export type SortOption = 'featured' | 'price_asc' | 'price_desc' | 'name_asc' | 'newest';

interface SortBarProps {
  totalCount: number;
  sortOption: SortOption;
  onSortChange: (sort: SortOption) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filters: FilterState;
  onRemoveFilter: (key: keyof FilterState, value?: string) => void;
  onOpenMobileFilters: () => void;
}

export function SortBar({
  totalCount,
  sortOption,
  onSortChange,
  searchQuery,
  onSearchChange,
  filters,
  onRemoveFilter,
  onOpenMobileFilters,
}: SortBarProps) {
  // Count active filters
  const activeCount =
    (filters.category !== 'all' ? 1 : 0) +
    filters.colors.length +
    filters.patterns.length +
    filters.materials.length +
    (filters.minPrice > 0 || filters.maxPrice < 40000 ? 1 : 0);

  return (
    <div className="space-y-4">
      {/* Top Action Row */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-card bg-white border border-brand-gold/20 shadow-xs">
        {/* Left: Total Results and Mobile Filter Trigger */}
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <button
            type="button"
            onClick={onOpenMobileFilters}
            className="lg:hidden flex items-center gap-2 px-3.5 py-2 rounded-soft bg-brand-ivory text-brand-espresso border border-brand-gold/40 text-xs font-semibold shadow-xs min-h-[44px]"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-gold" />
            <span>Filters</span>
            {activeCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-brand-burgundy text-white text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>

          <span className="text-xs sm:text-sm font-medium text-brand-charcoal">
            Showing <strong className="text-brand-espresso font-bold">{totalCount}</strong> Luxury Products
          </span>
        </div>

        {/* Right: Search Box & Sort Dropdown */}
        <div className="flex items-center gap-3">
          {/* Search Input in SortBar */}
          <div className="relative flex-1 sm:w-60">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-brand-charcoal/50" />
            <input
              type="text"
              placeholder="Search in catalog..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-7 py-1.5 rounded-soft border border-brand-gold/30 text-xs text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none min-h-[38px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-brand-charcoal/50 hover:text-brand-burgundy"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 shrink-0">
            <ArrowUpDown className="w-3.5 h-3.5 text-brand-gold hidden sm:inline" />
            <select
              value={sortOption}
              onChange={(e) => onSortChange(e.target.value as SortOption)}
              className="px-3 py-1.5 rounded-soft border border-brand-gold/30 bg-white text-xs font-medium text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none min-h-[38px] cursor-pointer"
              aria-label="Sort products"
            >
              <option value="featured">Featured / Best Sellers</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
              <option value="newest">Newest Arrivals</option>
            </select>
          </div>
        </div>
      </div>

      {/* Active Filter Pills Strip */}
      {activeCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-[11px] font-semibold text-brand-charcoal/70 uppercase tracking-wide">
            Active:
          </span>

          {filters.category !== 'all' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-ivory border border-brand-gold/40 text-brand-espresso font-medium">
              <span>Category: {filters.category.replace(/_/g, ' ')}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter('category')}
                className="hover:text-brand-burgundy"
                aria-label="Remove category filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {filters.colors.map((c) => (
            <span
              key={c}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-ivory border border-brand-gold/40 text-brand-espresso font-medium"
            >
              <span>Color: {c}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter('colors', c)}
                className="hover:text-brand-burgundy"
                aria-label={`Remove color ${c}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.patterns.map((p) => (
            <span
              key={p}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-ivory border border-brand-gold/40 text-brand-espresso font-medium"
            >
              <span>Pattern: {p}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter('patterns', p)}
                className="hover:text-brand-burgundy"
                aria-label={`Remove pattern ${p}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {filters.materials.map((m) => (
            <span
              key={m}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-ivory border border-brand-gold/40 text-brand-espresso font-medium"
            >
              <span>Material: {m}</span>
              <button
                type="button"
                onClick={() => onRemoveFilter('materials', m)}
                className="hover:text-brand-burgundy"
                aria-label={`Remove material ${m}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}

          {(filters.minPrice > 0 || filters.maxPrice < 40000) && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-ivory border border-brand-gold/40 text-brand-espresso font-medium">
              <span>
                ₹{filters.minPrice.toLocaleString('en-IN')} – ₹{filters.maxPrice.toLocaleString('en-IN')}
              </span>
              <button
                type="button"
                onClick={() => onRemoveFilter('minPrice')}
                className="hover:text-brand-burgundy"
                aria-label="Remove price filter"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default SortBar;
