'use client';

import React from 'react';
import { X } from 'lucide-react';
import FilterSidebar, { FilterState } from './FilterSidebar';

interface MobileFilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onReset: () => void;
  totalResults: number;
}

export function MobileFilterDrawer({
  isOpen,
  onClose,
  filters,
  onFilterChange,
  onReset,
  totalResults,
}: MobileFilterDrawerProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm lg:hidden flex justify-end animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-brand-gold/20">
            <div>
              <h2 className="font-display font-bold text-lg text-brand-espresso">
                Faceted Filters
              </h2>
              <span className="text-xs text-brand-charcoal/70">
                {totalResults} items matching criteria
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-soft text-brand-espresso hover:text-brand-burgundy min-w-[44px] min-h-[44px] flex items-center justify-center"
              aria-label="Close filters"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <FilterSidebar
            filters={filters}
            onFilterChange={onFilterChange}
            onReset={onReset}
            totalResults={totalResults}
          />
        </div>

        <div className="pt-6 border-t border-brand-gold/20 mt-6 sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="w-full btn-gradient-cta py-3 px-4 rounded-soft text-sm font-semibold shadow min-h-[44px]"
          >
            Show {totalResults} Products
          </button>
        </div>
      </div>
    </div>
  );
}

export default MobileFilterDrawer;
