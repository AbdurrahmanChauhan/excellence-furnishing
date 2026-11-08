'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Package,
  PlusCircle,
  Search,
  SlidersHorizontal,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Layers,
  Sparkles,
  ArrowUpDown,
} from 'lucide-react';
import { fetchProducts, modifyProduct } from '@/lib/firebase/firestore';
import { Product, MainCategory } from '@/types/product';
import { formatINR } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const CATEGORY_TABS: Array<{ id: string; label: string; countKey?: string }> = [
  { id: 'all', label: 'All Categories' },
  { id: 'curtains_window_treatments', label: 'Curtains & Drapes' },
  { id: 'sofa_upholstery_fabrics', label: 'Upholstery' },
  { id: 'wallpapers', label: 'Wallpapers' },
  { id: 'mattresses_sleep_solutions', label: 'Mattresses' },
  { id: 'bedding_accessories', label: 'Bedding' },
  { id: 'home_decor', label: 'Home Decor' },
];

export default function AdminProductsPage() {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('all');
  const [stockFilter, setStockFilter] = React.useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [togglingId, setTogglingId] = React.useState<string | null>(null);

  const loadProducts = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchProducts();
      setProducts(data);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  // Toggle active/available status
  const handleToggleActive = async (product: Product) => {
    try {
      setTogglingId(product.id);
      const newStatus = !product.isAvailable;
      await modifyProduct(product.id, { isAvailable: newStatus });
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, isAvailable: newStatus } : p))
      );
    } catch (err) {
      console.error('Failed to update product visibility:', err);
    } finally {
      setTogglingId(null);
    }
  };

  // Filter products
  const filteredProducts = React.useMemo(() => {
    return products.filter((p) => {
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }

      // Stock status filter
      if (stockFilter === 'in_stock' && p.stockQuantity <= 10) return false;
      if (stockFilter === 'low_stock' && (p.stockQuantity <= 0 || p.stockQuantity > 10)) return false;
      if (stockFilter === 'out_of_stock' && p.stockQuantity > 0) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesBrand = p.brand.toLowerCase().includes(q);
        const matchesDescription = p.description.toLowerCase().includes(q);
        const matchesHsn = p.hsnCode?.toLowerCase().includes(q);
        const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q));
        const matchesMaterial = p.materials?.some((m) => m.toLowerCase().includes(q));
        if (!matchesName && !matchesBrand && !matchesDescription && !matchesHsn && !matchesTags && !matchesMaterial) {
          return false;
        }
      }

      return true;
    });
  }, [products, selectedCategory, stockFilter, searchQuery]);

  // Quick stats
  const totalCount = products.length;
  const activeCount = products.filter((p) => p.isAvailable).length;
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity <= 10).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity === 0).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-espresso">
            Product Catalog & Inventory
          </h2>
          <p className="text-xs text-brand-charcoal/70">
            Manage fabrics, wallpapers, mattresses, and luxury upholstery collections.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/admin/products/new">
            <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold gap-1.5 shadow-sm text-xs sm:text-sm">
              <PlusCircle className="w-4 h-4" />
              <span>Add New Product</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Total Products</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-brand-espresso mt-0.5">
                {totalCount}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-card bg-brand-gold/15 flex items-center justify-center text-brand-gold-dark">
              <Package className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Active on Store</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-emerald-700 mt-0.5">
                {activeCount}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-card bg-emerald-50 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Low Stock Alert</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-amber-600 mt-0.5">
                {lowStockCount}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-card bg-amber-50 flex items-center justify-center text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-brand-gold/20 shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase text-brand-charcoal/70">Out of Stock</p>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-red-600 mt-0.5">
                {outOfStockCount}
              </h3>
            </div>
            <div className="w-9 h-9 rounded-card bg-red-50 flex items-center justify-center text-red-600">
              <XCircle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white rounded-card border border-brand-gold/20 p-4 shadow-xs space-y-4">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORY_TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id)}
              className={`px-3 py-1.5 rounded-pill text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === tab.id
                  ? 'bg-brand-espresso text-brand-gold font-semibold shadow-xs'
                  : 'bg-brand-pearl hover:bg-brand-ivory text-brand-charcoal'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Stock Filter Dropdown */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 border-t border-brand-gold/15">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-brand-charcoal/40 absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              type="text"
              placeholder="Search by name, brand, HSN, tag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 text-xs h-9 bg-brand-pearl/50 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <select
              aria-label="Filter by Stock Level"
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="text-xs h-9 px-3 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
            >
              <option value="all">All Stock Levels</option>
              <option value="in_stock">In Stock (&gt;10)</option>
              <option value="low_stock">Low Stock (1–10)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>

            <span className="text-xs text-brand-charcoal/60">
              Showing <strong>{filteredProducts.length}</strong> of {totalCount}
            </span>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-card border border-brand-gold/20 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-sm text-brand-charcoal/60">
            <Package className="w-8 h-8 text-brand-gold/40 animate-bounce mx-auto mb-2" />
            Loading product inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 text-brand-gold/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-brand-espresso">No products found</p>
            <p className="text-xs text-brand-charcoal/60 mt-1">
              Try adjusting your category filter, stock level, or search keywords.
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('all');
                  setStockFilter('all');
                }}
                className="text-xs border-brand-gold/40 text-brand-gold-dark"
              >
                Reset All Filters
              </Button>
              <Link href="/admin/products/new">
                <Button size="sm" className="bg-brand-gold text-brand-espresso text-xs font-semibold">
                  + Add Product
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-brand-pearl/70 border-b border-brand-gold/15 text-brand-espresso font-semibold">
                <tr>
                  <th className="py-3 px-4">Item & Swatch</th>
                  <th className="py-3 px-4">Category & Brand</th>
                  <th className="py-3 px-4 text-right">Rate / Unit (₹)</th>
                  <th className="py-3 px-4 text-center">Stock Level</th>
                  <th className="py-3 px-4 text-center">Store Visibility</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-gold/10">
                {filteredProducts.map((product) => {
                  const isLow = product.stockQuantity > 0 && product.stockQuantity <= 10;
                  const isOut = product.stockQuantity === 0;

                  return (
                    <tr key={product.id} className="hover:bg-brand-ivory/20 transition-colors">
                      {/* Product Thumbnail + Title */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-soft overflow-hidden border border-brand-gold/30 shrink-0 bg-brand-pearl">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={product.swatchImage || product.images?.[0] || '/images/placeholder.jpg'}
                              alt={product.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-brand-espresso text-sm block truncate max-w-xs sm:max-w-md">
                              {product.name}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-brand-charcoal/60 mt-0.5">
                              <span>HSN: {product.hsnCode || '5407'}</span>
                              <span>·</span>
                              <span>GST: {product.gstRatePercent}%</span>
                              {product.isFeatured && (
                                <span className="bg-brand-gold/15 text-brand-gold-dark font-semibold px-1.5 py-0.2 rounded text-[10px]">
                                  Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Brand */}
                      <td className="py-3 px-4">
                        <span className="font-medium text-brand-espresso capitalize block">
                          {product.category.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[11px] text-brand-charcoal/60 block">
                          {product.brand} · {product.subcategory.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Price / Unit */}
                      <td className="py-3 px-4 text-right">
                        <div className="font-bold text-brand-gold-dark text-sm">
                          {formatINR(product.pricePerUnitPaise, true)}
                        </div>
                        <span className="text-[11px] text-brand-charcoal/60 capitalize">
                          per {product.unit}
                        </span>
                      </td>

                      {/* Stock Status Indicator */}
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                            isOut
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : isLow
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isOut ? 'bg-red-600' : isLow ? 'bg-amber-600' : 'bg-emerald-600'
                            }`}
                          />
                          <span>
                            {isOut ? 'Out of Stock' : `${product.stockQuantity} ${product.unit}s`}
                          </span>
                        </span>
                      </td>

                      {/* Store Visibility Toggle Switch */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(product)}
                          disabled={togglingId === product.id}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold/50 ${
                            product.isAvailable ? 'bg-brand-gold' : 'bg-brand-charcoal/30'
                          }`}
                          title={product.isAvailable ? 'Click to hide from store' : 'Click to publish on store'}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              product.isAvailable ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                        <span className="block text-[10px] text-brand-charcoal/60 mt-0.5">
                          {product.isAvailable ? 'Published' : 'Hidden'}
                        </span>
                      </td>

                      {/* Action Links */}
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link href={`/products/${product.id}`} target="_blank">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 w-8 p-0 text-brand-charcoal hover:text-brand-espresso"
                              title="View on Public Store"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Button>
                          </Link>

                          <Link href={`/admin/products/${product.id}/edit`}>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs border-brand-gold/40 text-brand-espresso hover:bg-brand-gold hover:text-brand-espresso px-2.5 gap-1"
                            >
                              <Edit className="w-3 h-3" />
                              <span>Edit</span>
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
