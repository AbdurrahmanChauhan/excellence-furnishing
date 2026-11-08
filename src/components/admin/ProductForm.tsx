'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  ArrowLeft,
  Save,
  Package,
  Sparkles,
  Image as ImageIcon,
  Check,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { productFormSchema, ProductFormData } from '@/lib/validators/schemas';
import { Product, MainCategory, SubCategory, PatternType } from '@/types/product';
import { saveProduct, modifyProduct } from '@/lib/firebase/firestore';
import { toPaise, toRupees } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface ProductFormProps {
  initialProduct?: Product;
  isEdit?: boolean;
}

const CATEGORY_OPTIONS: Array<{ value: MainCategory; label: string }> = [
  { value: 'curtains_window_treatments', label: 'Curtains & Window Treatments' },
  { value: 'sofa_upholstery_fabrics', label: 'Sofa Upholstery Fabrics' },
  { value: 'wallpapers', label: 'Wallpapers & Murals' },
  { value: 'mattresses_sleep_solutions', label: 'Mattresses & Sleep Solutions' },
  { value: 'bedding_accessories', label: 'Bedding & Accessories' },
  { value: 'home_decor', label: 'Home Decor & Carpets' },
];

const SUBCATEGORY_OPTIONS: Record<MainCategory, Array<{ value: SubCategory; label: string }>> = {
  curtains_window_treatments: [
    { value: 'sheer_curtains', label: 'Sheer Curtains (Voile, Organza)' },
    { value: 'heavy_drapes', label: 'Heavy Drapes (Velvet, Jacquard)' },
    { value: 'blackout_curtains', label: 'Blackout Curtains (Coated)' },
    { value: 'printed_curtains', label: 'Printed Curtains (Floral, Geometric)' },
    { value: 'roman_blinds', label: 'Roman Blinds' },
    { value: 'roller_blinds', label: 'Roller Blinds' },
    { value: 'vertical_blinds', label: 'Vertical Blinds' },
  ],
  sofa_upholstery_fabrics: [
    { value: 'pu_leather_rexine', label: 'PU Leather / Rexine' },
    { value: 'velvet_upholstery', label: 'Velvet Upholstery (Plain & Crushed)' },
    { value: 'jacquard_weaves', label: 'Jacquard Weaves' },
    { value: 'suede_microfiber', label: 'Suede & Microfiber' },
    { value: 'cotton_linen_blends', label: 'Cotton & Linen Blends' },
    { value: 'commercial_heavy_duty', label: 'Commercial Heavy-Duty' },
  ],
  wallpapers: [
    { value: 'pvc_vinyl', label: 'PVC / Vinyl Wallpaper' },
    { value: 'non_woven', label: 'Non-Woven Wallpaper' },
    { value: 'textured_metallic', label: 'Textured & Metallic Foil' },
    { value: '3d_wallpaper', label: '3D Wallpaper' },
    { value: 'custom_murals', label: 'Custom Murals (Per sq.ft)' },
  ],
  mattresses_sleep_solutions: [
    { value: 'orthopedic_mattress', label: 'Orthopedic Mattress (Dr. Ortho / Refresh)' },
    { value: 'latex_mattress', label: '100% Natural Latex Mattress' },
    { value: 'memory_foam_mattress', label: 'Memory Foam Mattress' },
    { value: 'pocket_spring_mattress', label: 'Pocket Spring Mattress' },
    { value: 'coir_mattress', label: 'Natural Rubberised Coir' },
    { value: 'sofa_cum_bed_mattress', label: 'Sofa-Cum-Bed Mattress' },
  ],
  bedding_accessories: [
    { value: 'bedsheet_sets', label: 'Bedsheets & Pillow Cases' },
    { value: 'pillow_cushion_covers', label: 'Designer Cushion Covers' },
    { value: 'quilts_comforters', label: 'Duvets & Comforters' },
    { value: 'mattress_protectors', label: 'Waterproof Mattress Protectors' },
  ],
  home_decor: [
    { value: 'carpets_rugs', label: 'Handcrafted Carpets & Rugs' },
    { value: 'custom_headboards', label: 'Custom Tufted Headboards' },
    { value: 'mosquito_nets', label: 'Custom-Fitted Mosquito Nets' },
    { value: 'artificial_turf', label: 'High Density Artificial Turf' },
  ],
};

const COMMON_PATTERNS: PatternType[] = [
  'plain',
  'damask',
  'floral',
  'geometric',
  'abstract',
  'textured',
  'striped',
];

export function ProductForm({ initialProduct, isEdit = false }: ProductFormProps) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  const defaultValues: Partial<ProductFormData> = initialProduct
    ? {
        name: initialProduct.name,
        slug: initialProduct.slug,
        brand: initialProduct.brand,
        category: initialProduct.category,
        subcategory: initialProduct.subcategory,
        description: initialProduct.description,
        shortDescription: initialProduct.shortDescription || '',
        pricePerUnit: toRupees(initialProduct.pricePerUnitPaise),
        unit: initialProduct.unit,
        mrp: initialProduct.mrpPaise ? toRupees(initialProduct.mrpPaise) : undefined,
        stockQuantity: initialProduct.stockQuantity,
        isAvailable: initialProduct.isAvailable,
        isFeatured: initialProduct.isFeatured,
        isBestSeller: initialProduct.isBestSeller,
        hsnCode: initialProduct.hsnCode,
        gstRatePercent: initialProduct.gstRatePercent,
        swatchImage: initialProduct.swatchImage,
        images: [...initialProduct.images],
        colors: [...initialProduct.colors],
        colorHexes: [...initialProduct.colorHexes],
        patterns: [...initialProduct.patterns],
        materials: [...initialProduct.materials],
        tags: [...initialProduct.tags],
        fabricWidthCm: initialProduct.metadata?.fabricWidthCm,
        weightGsm: initialProduct.metadata?.weightGsm,
        composition: initialProduct.metadata?.composition,
      }
    : {
        name: '',
        slug: '',
        brand: 'In-House Excellence',
        category: 'curtains_window_treatments',
        subcategory: 'heavy_drapes',
        description: 'Exquisite premium furnishing fabric with rich tactile texture, designed for luxury residences in Mumbai.',
        shortDescription: 'High quality furnishing material.',
        pricePerUnit: 1200,
        unit: 'meter',
        stockQuantity: 100,
        isAvailable: true,
        isFeatured: false,
        isBestSeller: false,
        hsnCode: '5407',
        gstRatePercent: 18,
        swatchImage: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
        images: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80'],
        colors: ['Gold', 'Warm Ivory'],
        colorHexes: ['#B8860B', '#FAF3E0'],
        patterns: ['plain'],
        materials: ['Velvet'],
        tags: ['Luxury', 'Living Room', 'Bespoke'],
        fabricWidthCm: 140,
        weightGsm: 350,
        composition: '100% Polyester / Velvet Finish',
      };

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const selectedCategory = watch('category');
  const watchedSwatchUrl = watch('swatchImage');
  const watchedImages = watch('images') || [];
  const watchedPatterns = watch('patterns') || [];

  // Generate slug automatically from name
  const handleAutoSlug = () => {
    const name = watch('name');
    if (name) {
      const generated = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setValue('slug', generated, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    try {
      setSubmitting(true);
      setFormError(null);

      const timestamp = new Date().toISOString();
      const productId = initialProduct?.id || `prod-${Date.now().toString().slice(-6)}`;

      const productPayload: Product = {
        id: productId,
        slug: data.slug,
        name: data.name,
        brand: data.brand,
        category: data.category as MainCategory,
        subcategory: data.subcategory as SubCategory,
        description: data.description,
        shortDescription: data.shortDescription || data.description.substring(0, 120),
        pricePerUnitPaise: toPaise(data.pricePerUnit),
        unit: data.unit,
        mrpPaise: data.mrp ? toPaise(data.mrp) : undefined,
        images: data.images,
        swatchImage: data.swatchImage,
        hsnCode: data.hsnCode,
        gstRatePercent: data.gstRatePercent,
        colors: data.colors,
        colorHexes: data.colorHexes,
        patterns: data.patterns as PatternType[],
        materials: data.materials,
        tags: data.tags,
        stockQuantity: data.stockQuantity,
        isAvailable: data.isAvailable,
        isFeatured: data.isFeatured,
        isBestSeller: data.isBestSeller,
        metadata: {
          fabricWidthCm: data.fabricWidthCm,
          weightGsm: data.weightGsm,
          composition: data.composition,
        },
        createdAt: initialProduct?.createdAt || timestamp,
        updatedAt: timestamp,
      };

      if (isEdit && initialProduct) {
        await modifyProduct(initialProduct.id, productPayload);
      } else {
        await saveProduct(productPayload);
      }

      router.push('/admin/products');
    } catch (err: any) {
      console.error('Failed to save product:', err);
      setFormError(err.message || 'An error occurred while saving the product.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-5xl mx-auto">
      {/* Header and Back Link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-gold-dark"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Products List
        </Link>

        <div className="flex items-center gap-2">
          <Link href="/admin/products">
            <Button type="button" variant="ghost" size="sm" className="text-xs">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold gap-1.5 shadow-sm text-xs sm:text-sm"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Create Product'}</span>
          </Button>
        </div>
      </div>

      {formError && (
        <div className="p-4 rounded-card bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{formError}</span>
        </div>
      )}

      {/* Basic Identification Card */}
      <Card className="bg-white border-brand-gold/30 shadow-xs">
        <CardHeader className="pb-3 border-b border-brand-gold/15">
          <CardTitle className="text-lg font-bold font-display text-brand-espresso flex items-center gap-2">
            <Package className="w-5 h-5 text-brand-gold" />
            <span>Basic Details & Classification</span>
          </CardTitle>
          <CardDescription className="text-xs text-brand-charcoal/70">
            Primary naming, brand, category hierarchy, and unique URL slug.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Name */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-brand-espresso">
              Product Title <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('name')}
              placeholder="e.g. Royal Velvet Sheen Drapes (Gold)"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
            {errors.name && <p className="text-[11px] text-red-600">{errors.name.message}</p>}
          </div>

          {/* Slug */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-brand-espresso">
                URL Slug <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={handleAutoSlug}
                className="text-[11px] font-semibold text-brand-gold hover:underline"
              >
                Auto-generate from title
              </button>
            </div>
            <Input
              {...register('slug')}
              placeholder="royal-velvet-sheen-drapes-gold"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-mono"
            />
            {errors.slug && <p className="text-[11px] text-red-600">{errors.slug.message}</p>}
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Brand / Manufacturer <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('brand')}
              placeholder="e.g. Refresh Mattress, Dr. Ortho, Nilaya, or In-House Excellence"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
            {errors.brand && <p className="text-[11px] text-red-600">{errors.brand.message}</p>}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Main Category <span className="text-red-500">*</span>
            </label>
            <select
              {...register('category')}
              className="w-full text-xs h-9 px-3 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
            >
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          {/* Subcategory */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Subcategory <span className="text-red-500">*</span>
            </label>
            <select
              {...register('subcategory')}
              className="w-full text-xs h-9 px-3 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
            >
              {(SUBCATEGORY_OPTIONS[selectedCategory] || []).map((sub) => (
                <option key={sub.value} value={sub.value}>
                  {sub.label}
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-xs font-bold text-brand-espresso">
              Product Description <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register('description')}
              rows={3}
              placeholder="Describe fabric weave, hand-feel, recommended rooms, and care guidelines..."
              className="w-full text-xs p-2.5 rounded-card border border-brand-gold/30 bg-brand-pearl/40 text-brand-espresso focus:outline-none focus:border-brand-gold"
            />
            {errors.description && (
              <p className="text-[11px] text-red-600">{errors.description.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pricing, Tax & Inventory Card */}
      <Card className="bg-white border-brand-gold/30 shadow-xs">
        <CardHeader className="pb-3 border-b border-brand-gold/15">
          <CardTitle className="text-lg font-bold font-display text-brand-espresso">
            Pricing, Stock & Indian GST Compliance
          </CardTitle>
          <CardDescription className="text-xs text-brand-charcoal/70">
            Rates in Indian Rupees (₹), standard measurement unit, HSN classification, and warehouse stock.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Price Per Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Selling Price (₹) <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              step="any"
              {...register('pricePerUnit')}
              placeholder="e.g. 1200"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-semibold"
            />
            {errors.pricePerUnit && (
              <p className="text-[11px] text-red-600">{errors.pricePerUnit.message}</p>
            )}
          </div>

          {/* Unit */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Billing Unit <span className="text-red-500">*</span>
            </label>
            <select
              {...register('unit')}
              className="w-full text-xs h-9 px-3 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
            >
              <option value="meter">Meter (m) - Curtains/Fabrics</option>
              <option value="roll">Roll - Wallpapers</option>
              <option value="piece">Piece - Mattresses/Cushions</option>
              <option value="sq.ft">Square Feet (sq.ft) - Murals/Turf</option>
            </select>
          </div>

          {/* MRP */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">MRP / Original Rate (₹)</label>
            <Input
              type="number"
              step="any"
              {...register('mrp')}
              placeholder="e.g. 1500 (optional)"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          {/* Stock Quantity */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Stock Quantity <span className="text-red-500">*</span>
            </label>
            <Input
              type="number"
              {...register('stockQuantity')}
              placeholder="100"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-semibold"
            />
            {errors.stockQuantity && (
              <p className="text-[11px] text-red-600">{errors.stockQuantity.message}</p>
            )}
          </div>

          {/* HSN Code */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              HSN Code <span className="text-red-500">*</span>
            </label>
            <Input
              {...register('hsnCode')}
              placeholder="e.g. 5407, 4814, 9404"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-mono"
            />
            {errors.hsnCode && (
              <p className="text-[11px] text-red-600">{errors.hsnCode.message}</p>
            )}
          </div>

          {/* GST Rate */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              GST Rate (%) <span className="text-red-500">*</span>
            </label>
            <select
              {...register('gstRatePercent')}
              className="w-full text-xs h-9 px-3 rounded-card border border-brand-gold/30 bg-white text-brand-espresso focus:outline-none focus:border-brand-gold"
            >
              <option value={18}>18% (Standard Furnishing / Tailoring / Wallpaper)</option>
              <option value={12}>12% (Apparel / Select Made-ups)</option>
              <option value={5}>5% (Cotton Yarns & Low-cost textiles)</option>
              <option value={28}>28% (Luxury items)</option>
            </select>
          </div>

          {/* Toggles */}
          <div className="space-y-2 lg:col-span-2 pt-2">
            <span className="text-xs font-bold text-brand-espresso block">Display & Visibility Flags</span>
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isAvailable')}
                  className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold"
                />
                <span className="font-semibold text-brand-espresso">Published on Store</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isFeatured')}
                  className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold"
                />
                <span className="font-semibold text-brand-espresso">Featured Collection</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  {...register('isBestSeller')}
                  className="w-4 h-4 rounded text-brand-gold focus:ring-brand-gold"
                />
                <span className="font-semibold text-brand-espresso">Best Seller</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Swatch & Gallery Images Card */}
      <Card className="bg-white border-brand-gold/30 shadow-xs">
        <CardHeader className="pb-3 border-b border-brand-gold/15">
          <CardTitle className="text-lg font-bold font-display text-brand-espresso flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-brand-gold" />
            <span>Swatch & Lifestyle Imagery</span>
          </CardTitle>
          <CardDescription className="text-xs text-brand-charcoal/70">
            Fabric swatch for AI visualizer and lifestyle room images for showroom catalog.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 space-y-4">
          {/* Swatch Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Fabric Swatch Image URL <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <Input
                {...register('swatchImage')}
                placeholder="https://..."
                className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-mono"
              />
              {watchedSwatchUrl && (
                <div className="w-9 h-9 rounded-soft overflow-hidden border border-brand-gold/40 shrink-0 bg-brand-pearl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={watchedSwatchUrl} alt="Swatch preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            {errors.swatchImage && (
              <p className="text-[11px] text-red-600">{errors.swatchImage.message}</p>
            )}
          </div>

          {/* Primary Gallery Image */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Primary Gallery Image URL <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-3">
              <Input
                value={watchedImages[0] || ''}
                onChange={(e) => {
                  const val = e.target.value;
                  const newImages = [...watchedImages];
                  newImages[0] = val;
                  setValue('images', newImages, { shouldValidate: true });
                }}
                placeholder="https://..."
                className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-mono"
              />
              {watchedImages[0] && (
                <div className="w-9 h-9 rounded-soft overflow-hidden border border-brand-gold/40 shrink-0 bg-brand-pearl">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={watchedImages[0]} alt="Gallery preview" className="w-full h-full object-cover" />
                </div>
              )}
            </div>
            {errors.images && <p className="text-[11px] text-red-600">{errors.images.message}</p>}
          </div>

          {/* Additional Gallery Image 2 */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">
              Additional Gallery Image 2 (Optional)
            </label>
            <Input
              value={watchedImages[1] || ''}
              onChange={(e) => {
                const val = e.target.value;
                const newImages = [...watchedImages];
                if (val) {
                  newImages[1] = val;
                } else if (newImages.length > 1) {
                  newImages.splice(1, 1);
                }
                setValue('images', newImages, { shouldValidate: true });
              }}
              placeholder="https://..."
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold font-mono"
            />
          </div>
        </CardContent>
      </Card>

      {/* Technical Specifications & Attributes Card */}
      <Card className="bg-white border-brand-gold/30 shadow-xs">
        <CardHeader className="pb-3 border-b border-brand-gold/15">
          <CardTitle className="text-lg font-bold font-display text-brand-espresso">
            Specifications & Fabric Attributes
          </CardTitle>
          <CardDescription className="text-xs text-brand-charcoal/70">
            Material composition, width, pattern styles, and colors for faceted catalog filters.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">Fabric Width (cm)</label>
            <Input
              type="number"
              {...register('fabricWidthCm')}
              placeholder="140"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">Weight (GSM)</label>
            <Input
              type="number"
              {...register('weightGsm')}
              placeholder="350"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-espresso">Composition</label>
            <Input
              {...register('composition')}
              placeholder="e.g. 100% Velvet / Poly Blend"
              className="text-xs h-9 bg-brand-pearl/40 border-brand-gold/30 focus:border-brand-gold"
            />
          </div>

          {/* Pattern Multi-selector */}
          <div className="space-y-1.5 sm:col-span-3">
            <label className="text-xs font-bold text-brand-espresso">Pattern Style</label>
            <div className="flex flex-wrap gap-2">
              {COMMON_PATTERNS.map((p) => {
                const isSelected = watchedPatterns.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      const next = isSelected
                        ? watchedPatterns.filter((item) => item !== p)
                        : [...watchedPatterns, p];
                      setValue('patterns', next, { shouldValidate: true });
                    }}
                    className={`px-3 py-1 rounded-pill text-xs font-medium capitalize border transition-all ${
                      isSelected
                        ? 'bg-brand-gold text-brand-espresso font-semibold border-brand-gold'
                        : 'bg-brand-pearl text-brand-charcoal border-brand-gold/20 hover:bg-brand-ivory'
                    }`}
                  >
                    {p} {isSelected && '✓'}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Form Submission Bar */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-gold/20">
        <Link href="/admin/products">
          <Button type="button" variant="outline" className="border-brand-gold/40 text-xs">
            Cancel
          </Button>
        </Link>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-bold px-6 shadow-sm text-xs sm:text-sm gap-2"
        >
          <Save className="w-4 h-4" />
          <span>{submitting ? 'Saving...' : isEdit ? 'Update Product' : 'Save & Publish Product'}</span>
        </Button>
      </div>
    </form>
  );
}
