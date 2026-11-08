'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Sparkles, SlidersHorizontal, RotateCcw } from 'lucide-react';
import { fetchProducts } from '@/lib/firebase/firestore';
import { Product } from '@/types/product';
import ProductCard from '@/components/products/ProductCard';
import FilterSidebar, { FilterState, MAX_PRICE_LIMIT } from '@/components/products/FilterSidebar';
import SortBar, { SortOption } from '@/components/products/SortBar';
import MobileFilterDrawer from '@/components/products/MobileFilterDrawer';

function ProductCatalogContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);

  // Read initial query params from URL
  const initialCategory = searchParams.get('category') || 'all';
  const initialSearch = searchParams.get('search') || '';

  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [sortOption, setSortOption] = useState<SortOption>('featured');

  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    colors: [],
    patterns: [],
    materials: [],
    minPrice: 0,
    maxPrice: MAX_PRICE_LIMIT,
  });

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // Sync category param if URL changes
  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat && cat !== filters.category) {
      setFilters((prev) => ({ ...prev, category: cat }));
    }
    const q = searchParams.get('search');
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
      setDebouncedSearch(q);
    }
  }, [searchParams]);

  // Load products on mount
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setIsLoading(true);
      try {
        const data = await fetchProducts();
        if (isMounted) {
          setAllProducts(data);
        }
      } catch (err) {
        console.error('Failed to load products:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter and Sort logic
  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    // 1. Category Filter
    if (filters.category && filters.category !== 'all') {
      result = result.filter((p) => p.category === filters.category);
    }

    // 2. Debounced Search Filter
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.materials.some((m) => m.toLowerCase().includes(q)) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          (p.subcategory && p.subcategory.toLowerCase().includes(q))
      );
    }

    // 3. Color Family Filter
    if (filters.colors.length > 0) {
      result = result.filter((p) =>
        filters.colors.some((fc) =>
          p.colors.some((pc) => pc.toLowerCase().includes(fc.toLowerCase()))
        )
      );
    }

    // 4. Pattern Filter
    if (filters.patterns.length > 0) {
      result = result.filter((p) =>
        filters.patterns.some((fp) =>
          p.patterns.some((pp) => pp.toLowerCase() === fp.toLowerCase())
        )
      );
    }

    // 5. Material Filter
    if (filters.materials.length > 0) {
      result = result.filter((p) =>
        filters.materials.some((fm) =>
          p.materials.some((pm) => pm.toLowerCase().includes(fm.toLowerCase()))
        )
      );
    }

    // 6. Price Range Filter (converting Rupees in filter state to Paise)
    const minPaise = filters.minPrice * 100;
    const maxPaise = filters.maxPrice * 100;
    result = result.filter(
      (p) => p.pricePerUnitPaise >= minPaise && p.pricePerUnitPaise <= maxPaise
    );

    // 7. Sorting
    result.sort((a, b) => {
      if (sortOption === 'price_asc') {
        return a.pricePerUnitPaise - b.pricePerUnitPaise;
      }
      if (sortOption === 'price_desc') {
        return b.pricePerUnitPaise - a.pricePerUnitPaise;
      }
      if (sortOption === 'name_asc') {
        return a.name.localeCompare(b.name);
      }
      if (sortOption === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
      // 'featured' default: Best sellers and featured items first
      if (a.isBestSeller && !b.isBestSeller) return -1;
      if (!a.isBestSeller && b.isBestSeller) return 1;
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });

    return result;
  }, [allProducts, filters, debouncedSearch, sortOption]);

  const handleResetFilters = () => {
    setFilters({
      category: 'all',
      colors: [],
      patterns: [],
      materials: [],
      minPrice: 0,
      maxPrice: MAX_PRICE_LIMIT,
    });
    setSearchQuery('');
    setDebouncedSearch('');
    router.push('/products');
  };

  const handleRemoveFilter = (key: keyof FilterState, val?: string) => {
    if (key === 'category') {
      setFilters((prev) => ({ ...prev, category: 'all' }));
    } else if (key === 'minPrice' || key === 'maxPrice') {
      setFilters((prev) => ({ ...prev, minPrice: 0, maxPrice: MAX_PRICE_LIMIT }));
    } else if (val) {
      const arr = filters[key] as string[];
      setFilters((prev) => ({
        ...prev,
        [key]: arr.filter((item) => item !== val),
      }));
    }
  };

  return (
    <div className="py-8 sm:py-12 bg-brand-pearl min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb & Header Banner */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs text-brand-charcoal/70 mb-2">
            <span>Home</span>
            <span>/</span>
            <span className="text-brand-gold font-semibold">Catalog</span>
            {filters.category !== 'all' && (
              <>
                <span>/</span>
                <span className="capitalize">{filters.category.replace(/_/g, ' ')}</span>
              </>
            )}
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display font-bold text-3xl sm:text-4xl text-brand-espresso">
                The Furnishing Gallery Catalog
              </h1>
              <p className="font-accent italic text-base sm:text-lg text-brand-burgundy mt-1">
                Explore 32+ luxury drapes, upholstery velvets, Nilaya wallpapers, and Refresh mattresses.
              </p>
            </div>
          </div>
        </div>

        {/* 2-Column Layout: Sidebar Filters (Left) + Product Grid (Right) */}
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Desktop Filter Sidebar */}
          <div className="hidden lg:block w-72 shrink-0 p-6 rounded-card bg-white border border-brand-gold/20 shadow-card sticky top-24">
            <FilterSidebar
              filters={filters}
              onFilterChange={setFilters}
              onReset={handleResetFilters}
              totalResults={filteredProducts.length}
            />
          </div>

          {/* Main Catalog Content */}
          <div className="flex-1 w-full space-y-6">
            {/* Sort Bar */}
            <SortBar
              totalCount={filteredProducts.length}
              sortOption={sortOption}
              onSortChange={setSortOption}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              filters={filters}
              onRemoveFilter={handleRemoveFilter}
              onOpenMobileFilters={() => setMobileDrawerOpen(true)}
            />

            {/* Product Grid / Loading / Empty State */}
            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="aspect-[3/4] rounded-card bg-white/60 animate-pulse border border-brand-gold/15"
                  />
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 px-4 rounded-card bg-white border border-brand-gold/20 shadow-card">
                <Sparkles className="w-10 h-10 text-brand-gold/40 mx-auto mb-3" />
                <h3 className="font-display font-bold text-xl text-brand-espresso">
                  No Products Match Your Criteria
                </h3>
                <p className="text-xs sm:text-sm text-brand-charcoal/75 mt-1 max-w-md mx-auto">
                  Try broadening your filters, choosing a different color or pattern, or resetting your search term.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="mt-6 inline-flex items-center gap-2 btn-gradient-cta px-5 py-2.5 rounded-soft text-xs font-semibold shadow min-h-[44px]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reset All Filters</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <MobileFilterDrawer
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
        totalResults={filteredProducts.length}
      />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center">
          <div className="w-10 h-10 rounded-full border-2 border-brand-gold border-t-transparent animate-spin mx-auto mb-4" />
          <p className="text-sm font-medium text-brand-espresso">Loading Furnishing Catalog...</p>
        </div>
      }
    >
      <ProductCatalogContent />
    </Suspense>
  );
}
