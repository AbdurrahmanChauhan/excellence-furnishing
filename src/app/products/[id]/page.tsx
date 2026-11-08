'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams, useRouter } from 'next/navigation';
import {
  Sparkles,
  ShoppingBag,
  MessageCircle,
  Eye,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Truck,
  RotateCcw,
  ArrowLeft,
  Share2,
} from 'lucide-react';
import { fetchProductById, fetchProducts } from '@/lib/firebase/firestore';
import { Product } from '@/types/product';
import { formatINR } from '@/lib/utils';
import { SITE_CONFIG } from '@/config/site';
import { useCartStore } from '@/store/cart-store';
import ProductCard from '@/components/products/ProductCard';

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Gallery and Variant State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Accordion State
  const [specsOpen, setSpecsOpen] = useState(true);
  const [careOpen, setCareOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  // Cart notification state
  const [addedToast, setAddedToast] = useState(false);

  const addItemToCart = useCartStore((s) => s.addItem);

  useEffect(() => {
    let isMounted = true;
    async function loadProduct() {
      if (!productId) return;
      setIsLoading(true);
      try {
        const found = await fetchProductById(productId);
        if (isMounted && found) {
          setProduct(found);
          setSelectedColor(found.colors[0] || '');

          // Fetch related products from same category
          const allInCategory = await fetchProducts({ category: found.category });
          if (isMounted) {
            setRelatedProducts(
              allInCategory.filter((p) => p.id !== found.id).slice(0, 3)
            );
          }
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadProduct();
    return () => {
      isMounted = false;
    };
  }, [productId]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  const handleAddToCart = () => {
    if (!product) return;
    addItemToCart({
      productId: product.id,
      name: product.name,
      pricePerUnitPaise: product.pricePerUnitPaise,
      unit: product.unit,
      image: product.images[0] || product.swatchImage,
      selectedColor,
      quantity: 1,
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  if (isLoading) {
    return (
      <div className="py-24 max-w-7xl mx-auto px-4 text-center">
        <div className="w-12 h-12 rounded-full border-2 border-brand-gold border-t-transparent animate-spin mx-auto mb-4" />
        <h2 className="font-display font-semibold text-lg text-brand-espresso">
          Loading Fabric Details...
        </h2>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-24 max-w-xl mx-auto px-4 text-center">
        <h2 className="font-display font-bold text-2xl text-brand-espresso">
          Product Not Found
        </h2>
        <p className="text-xs sm:text-sm text-brand-charcoal/70 mt-2">
          The requested soft furnishing product does not exist or has been archived.
        </p>
        <Link
          href="/products"
          className="mt-6 inline-flex items-center gap-2 btn-gradient-cta px-6 py-2.5 rounded-soft text-xs font-semibold shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Catalog</span>
        </Link>
      </div>
    );
  }

  const images = product.images.length > 0 ? product.images : [product.swatchImage];
  const activeImage = images[activeImageIndex] || product.swatchImage;

  // WhatsApp Inquiry URL
  const whatsappText = encodeURIComponent(
    `Hello Excellence Furnishing, I am interested in inquiring about:\n\n*${product.name}*\nPrice: ${formatINR(
      product.pricePerUnitPaise,
      true
    )} / ${product.unit}\nColor: ${selectedColor || 'Default'}\nHSN: ${product.hsnCode}\n\nPlease share availability and tailoring options.`
  );
  const whatsappUrl = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${whatsappText}`;

  return (
    <div className="py-8 sm:py-12 bg-brand-pearl min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-brand-charcoal/70 mb-6">
          <Link href="/" className="hover:text-brand-gold">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-brand-gold">
            Catalog
          </Link>
          <span>/</span>
          <Link
            href={`/products?category=${product.category}`}
            className="capitalize hover:text-brand-gold"
          >
            {product.category.replace(/_/g, ' ')}
          </Link>
          <span>/</span>
          <span className="text-brand-gold font-semibold truncate max-w-xs">{product.name}</span>
        </div>

        {/* Main Product Showcase Grid: Left = Gallery, Right = Product Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-white p-6 sm:p-10 rounded-card border border-brand-gold/20 shadow-card">
          {/* Left Column: Multi-Image Zoom Gallery */}
          <div className="lg:col-span-6 space-y-4">
            {/* Main Interactive Zoom Canvas */}
            <div
              className="relative aspect-square w-full rounded-card overflow-hidden bg-brand-pearl border border-brand-gold/25 shadow-xs cursor-crosshair group"
              onMouseEnter={() => setIsZoomed(true)}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
            >
              <Image
                src={activeImage}
                alt={product.name}
                fill
                priority
                className={`object-cover object-center transition-transform duration-200 ease-out ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
                style={
                  isZoomed
                    ? {
                        transformOrigin: `${mousePos.x}% ${mousePos.y}%`,
                      }
                    : undefined
                }
                sizes="(max-width: 1024px) 100vw, 50vw"
              />

              {/* Badges on main preview */}
              <div className="absolute top-4 left-4 flex flex-col gap-2 pointer-events-none">
                {product.isBestSeller && (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-brand-gold text-white text-xs font-bold shadow">
                    <Sparkles className="w-3 h-3" />
                    <span>Best Seller</span>
                  </span>
                )}
                <span className="px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm text-brand-espresso text-xs font-semibold border border-brand-gold/30">
                  {product.brand}
                </span>
              </div>

              {/* Hover indicator hint */}
              <div className="absolute bottom-3 right-3 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-white text-[10px] opacity-75 group-hover:opacity-0 transition-opacity pointer-events-none">
                Hover to Zoom Fabric
              </div>
            </div>

            {/* Thumbnail Navigation Strip */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 rounded-soft overflow-hidden border-2 shrink-0 transition-all ${
                    activeImageIndex === idx
                      ? 'border-brand-gold ring-2 ring-brand-gold/40 scale-105'
                      : 'border-brand-gold/20 hover:border-brand-gold/60 opacity-80'
                  }`}
                >
                  <Image src={img} alt={`Thumbnail ${idx + 1}`} fill className="object-cover" />
                </button>
              ))}

              {product.swatchImage && !images.includes(product.swatchImage) && (
                <button
                  type="button"
                  onClick={() => setActiveImageIndex(images.length)}
                  className="relative w-20 h-20 rounded-soft overflow-hidden border-2 border-brand-gold/20 shrink-0 opacity-80"
                >
                  <Image
                    src={product.swatchImage}
                    alt="Swatch Preview"
                    fill
                    className="object-cover"
                  />
                  <span className="absolute inset-0 bg-black/40 text-white text-[9px] flex items-center justify-center font-bold">
                    Swatch
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Product Info, Variants, Pricing & Actions */}
          <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
            <div>
              {/* Category & Status */}
              <div className="flex items-center justify-between text-xs text-brand-charcoal/70 mb-2">
                <span className="uppercase tracking-wider font-semibold text-brand-burgundy">
                  {product.category.replace(/_/g, ' ')}
                </span>
                <span className="flex items-center gap-1.5 text-brand-forest font-semibold">
                  <span className="w-2 h-2 rounded-full bg-brand-forest" />
                  <span>{product.stockQuantity > 0 ? 'In Stock (Atelier)' : 'Custom Order'}</span>
                </span>
              </div>

              {/* Title & Tagline */}
              <h1 className="font-display font-bold text-2xl sm:text-3xl lg:text-4xl text-brand-espresso leading-tight">
                {product.name}
              </h1>
              <p className="font-accent italic text-brand-gold-dark text-base sm:text-lg mt-1">
                {product.shortDescription || product.description}
              </p>

              {/* Pricing Breakdown with GST & HSN */}
              <div className="mt-5 p-4 rounded-card bg-brand-pearl/70 border border-brand-gold/25">
                <div className="flex items-baseline gap-3">
                  <span className="font-display font-bold text-3xl text-brand-espresso">
                    {formatINR(product.pricePerUnitPaise, true)}
                  </span>
                  <span className="text-sm text-brand-charcoal font-medium">
                    per {product.unit}
                  </span>
                  {product.mrpPaise && product.mrpPaise > product.pricePerUnitPaise && (
                    <span className="text-xs text-brand-charcoal/60 line-through">
                      MRP {formatINR(product.mrpPaise, true)}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-brand-charcoal/80 pt-2 border-t border-brand-gold/15">
                  <span>
                    HSN Code: <strong className="text-brand-espresso">{product.hsnCode}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    GST: <strong className="text-brand-forest">{product.gstRatePercent}% Included</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Unit: <strong className="capitalize">{product.unit}</strong>
                  </span>
                </div>
              </div>

              {/* Swatch Variant Selector */}
              {product.colors.length > 0 && (
                <div className="mt-6 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-display font-semibold text-xs uppercase tracking-wider text-brand-espresso">
                      Select Color Swatch:
                    </label>
                    <span className="text-xs font-bold text-brand-gold-dark">
                      {selectedColor || product.colors[0]}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {product.colors.map((colorName, idx) => {
                      const hex = product.colorHexes[idx] || '#B8860B';
                      const isSelected = selectedColor === colorName;
                      return (
                        <button
                          key={colorName}
                          type="button"
                          onClick={() => setSelectedColor(colorName)}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition min-h-[36px] ${
                            isSelected
                              ? 'border-brand-gold ring-2 ring-brand-gold bg-brand-ivory text-brand-espresso shadow-xs'
                              : 'border-brand-gold/30 hover:border-brand-gold/70 bg-white text-brand-charcoal'
                          }`}
                        >
                          <span
                            style={{ backgroundColor: hex }}
                            className="w-3.5 h-3.5 rounded-full border border-black/20 shadow-xs"
                          />
                          <span>{colorName}</span>
                          {isSelected && <Check className="w-3 h-3 text-brand-gold" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons: WhatsApp / Cart / AI Visualizer */}
              <div className="mt-8 space-y-3 pt-4 border-t border-brand-gold/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* WhatsApp Inquire */}
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3 px-4 rounded-soft bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-sm shadow flex items-center justify-center gap-2 min-h-[44px] transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Inquire on WhatsApp</span>
                  </a>

                  {/* Add to Inquiry / Cart */}
                  <button
                    type="button"
                    onClick={handleAddToCart}
                    className="w-full btn-gradient-cta py-3 px-4 rounded-soft font-semibold text-sm shadow flex items-center justify-center gap-2 min-h-[44px] transition"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Inquiries / Cart</span>
                  </button>
                </div>

                {/* AI Room Visualizer Link */}
                <Link
                  href={`/dashboard/visualizer?fabric=${encodeURIComponent(product.id)}`}
                  className="w-full py-3 px-4 rounded-soft bg-brand-ivory hover:bg-brand-gold/15 border border-brand-gold/40 text-brand-espresso font-semibold text-sm shadow-xs flex items-center justify-center gap-2 min-h-[44px] transition group"
                >
                  <Eye className="w-4 h-4 text-brand-gold group-hover:scale-110 transition-transform" />
                  <span>Visualize in Your Room with AI</span>
                </Link>

                {/* Toast feedback */}
                {addedToast && (
                  <div className="p-2.5 rounded-soft bg-brand-forest/15 border border-brand-forest/30 text-brand-forest text-xs font-semibold text-center animate-in fade-in duration-200">
                    ✓ Added &ldquo;{product.name}&rdquo; to your inquiries!
                  </div>
                )}
              </div>

              {/* Technical Specifications Accordion */}
              <div className="mt-8 pt-4 border-t border-brand-gold/20 space-y-3">
                {/* Accordion 1: Technical Specifications */}
                <div className="border border-brand-gold/20 rounded-card overflow-hidden bg-brand-pearl/30">
                  <button
                    type="button"
                    onClick={() => setSpecsOpen(!specsOpen)}
                    className="w-full p-3.5 text-left font-display font-semibold text-xs uppercase tracking-wider text-brand-espresso flex items-center justify-between hover:bg-brand-gold/10 transition"
                  >
                    <span>Technical Fabric Specifications</span>
                    {specsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {specsOpen && (
                    <div className="p-4 pt-1 text-xs text-brand-charcoal space-y-2 border-t border-brand-gold/15 bg-white">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-brand-charcoal/60 block">Bolt Width:</span>
                          <span className="font-semibold text-brand-espresso">
                            {product.metadata.fabricWidthCm ? `${product.metadata.fabricWidthCm} cm` : 'Standard 140 cm / 280 cm'}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-charcoal/60 block">Composition:</span>
                          <span className="font-semibold text-brand-espresso">
                            {product.metadata.composition || 'Premium Furnishing Blend'}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-charcoal/60 block">Pattern Repeat:</span>
                          <span className="font-semibold text-brand-espresso">
                            {product.metadata.patternRepeatCm ? `${product.metadata.patternRepeatCm} cm` : 'Seamless / Plain'}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-charcoal/60 block">Weight / Density:</span>
                          <span className="font-semibold text-brand-espresso">
                            {product.metadata.weightGsm ? `${product.metadata.weightGsm} GSM` : 'Commercial Grade'}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-charcoal/60 block">Origin:</span>
                          <span className="font-semibold text-brand-espresso">
                            {product.metadata.originCountry || 'India / Imported'}
                          </span>
                        </div>
                        <div>
                          <span className="text-brand-charcoal/60 block">Materials:</span>
                          <span className="font-semibold text-brand-espresso">
                            {product.materials.join(', ')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Accordion 2: Care & Maintenance Instructions */}
                <div className="border border-brand-gold/20 rounded-card overflow-hidden bg-brand-pearl/30">
                  <button
                    type="button"
                    onClick={() => setCareOpen(!careOpen)}
                    className="w-full p-3.5 text-left font-display font-semibold text-xs uppercase tracking-wider text-brand-espresso flex items-center justify-between hover:bg-brand-gold/10 transition"
                  >
                    <span>Wash & Maintenance Care</span>
                    {careOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {careOpen && (
                    <div className="p-4 pt-1 text-xs text-brand-charcoal border-t border-brand-gold/15 bg-white space-y-1.5">
                      {product.metadata.careInstructions && product.metadata.careInstructions.length > 0 ? (
                        product.metadata.careInstructions.map((inst, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-brand-gold font-bold">•</span>
                            <span>{inst}</span>
                          </div>
                        ))
                      ) : (
                        <p>Dry clean recommended for velvet and jacquard fabrics. Vacuum gently with brush attachment.</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Accordion 3: Tailoring & Showroom Delivery */}
                <div className="border border-brand-gold/20 rounded-card overflow-hidden bg-brand-pearl/30">
                  <button
                    type="button"
                    onClick={() => setDeliveryOpen(!deliveryOpen)}
                    className="w-full p-3.5 text-left font-display font-semibold text-xs uppercase tracking-wider text-brand-espresso flex items-center justify-between hover:bg-brand-gold/10 transition"
                  >
                    <span>Tailoring & Delivery In Mumbai</span>
                    {deliveryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>

                  {deliveryOpen && (
                    <div className="p-4 pt-1 text-xs text-brand-charcoal border-t border-brand-gold/15 bg-white space-y-2">
                      <div className="flex items-start gap-2">
                        <Truck className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                        <span>Same-day dispatch available in Andheri West, Juhu, Bandra, and Western Suburbs for in-stock rolls.</span>
                      </div>
                      <div className="flex items-start gap-2">
                        <ShieldCheck className="w-4 h-4 text-brand-gold shrink-0 mt-0.5" />
                        <span>Custom stitched pleats (Eyelet, Pinch, Wave) crafted in our in-house atelier within 3-5 working days.</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Showcase */}
        {relatedProducts.length > 0 && (
          <div className="mt-16 sm:mt-24">
            <div className="text-center max-w-xl mx-auto mb-10">
              <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold bg-brand-ivory border border-brand-gold/30 px-3 py-1 rounded-full">
                Complementary Styles
              </span>
              <h2 className="font-display font-bold text-2xl sm:text-3xl text-brand-espresso mt-3">
                You May Also Admire
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
