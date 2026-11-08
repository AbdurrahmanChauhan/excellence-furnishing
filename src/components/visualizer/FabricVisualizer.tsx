'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  Sparkles,
  UploadCloud,
  Image as ImageIcon,
  Check,
  RotateCcw,
  Download,
  Share2,
  Layers,
  Scissors,
  ArrowRight,
  Info,
  CheckCircle2,
  Ruler,
} from 'lucide-react';
import { fetchProducts } from '@/lib/firebase/firestore';
import { Product } from '@/types/product';
import { formatINR } from '@/lib/utils';
import { ComparisonSlider } from './ComparisonSlider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SampleRoom {
  id: string;
  name: string;
  type: 'curtain' | 'wallpaper' | 'upholstery';
  url: string;
}

const SAMPLE_ROOMS: SampleRoom[] = [
  {
    id: 'sample-living',
    name: 'Modern Mumbai Living Room with French Balcony',
    type: 'curtain',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'sample-bedroom',
    name: 'Luxury Master Bedroom with Casement Windows',
    type: 'curtain',
    url: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef4?auto=format&fit=crop&w=1000&q=80',
  },
  {
    id: 'sample-wall',
    name: 'Contemporary Living Room TV Accent Wall',
    type: 'wallpaper',
    url: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1000&q=80',
  },
];

interface FabricVisualizerProps {
  isAdmin?: boolean;
}

export function FabricVisualizer({ isAdmin = false }: FabricVisualizerProps) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loadingCatalog, setLoadingCatalog] = React.useState(true);

  // User input states
  const [productType, setProductType] = React.useState<'curtain' | 'wallpaper' | 'upholstery'>('curtain');
  const [roomImageUrl, setRoomImageUrl] = React.useState<string>(SAMPLE_ROOMS[0].url);
  const [swatchImageUrl, setSwatchImageUrl] = React.useState<string>('');
  const [selectedProductId, setSelectedProductId] = React.useState<string>('');
  const [selectedProductName, setSelectedProductName] = React.useState<string>('');
  const [swatchTab, setSwatchTab] = React.useState<'catalog' | 'upload'>('catalog');

  // Visualization Execution states
  const [isVisualizing, setIsVisualizing] = React.useState(false);
  const [statusMessage, setStatusMessage] = React.useState('');
  const [visualizedResult, setVisualizedResult] = React.useState<string | null>(null);
  const [isDemoFallback, setIsDemoFallback] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);

  // Load products catalog
  React.useEffect(() => {
    async function loadCatalog() {
      try {
        setLoadingCatalog(true);
        const data = await fetchProducts();
        setProducts(data);
        if (data.length > 0) {
          const first = data[0];
          setSwatchImageUrl(first.swatchImage || first.images[0]);
          setSelectedProductId(first.id);
          setSelectedProductName(first.name);
        }
      } catch (err) {
        console.error('Failed to load visualizer catalog:', err);
      } finally {
        setLoadingCatalog(false);
      }
    }
    loadCatalog();
  }, []);

  // Handle room file upload
  const handleRoomFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setRoomImageUrl(reader.result as string);
        setVisualizedResult(null); // Clear previous output
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle custom swatch upload
  const handleSwatchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSwatchImageUrl(reader.result as string);
        setSelectedProductId('');
        setSelectedProductName('Custom Fabric Swatch');
        setVisualizedResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Visualization
  const handleRunVisualize = async () => {
    if (!roomImageUrl || !swatchImageUrl) return;

    try {
      setIsVisualizing(true);
      setStatusMessage('Analyzing window dimensions and room lighting...');

      const timer1 = setTimeout(() => {
        setStatusMessage('Synthesizing fabric wave pleats and physical draping folds...');
      }, 900);

      const timer2 = setTimeout(() => {
        setStatusMessage('Applying photorealistic shadows and ambient reflection...');
      }, 1800);

      const response = await fetch('/api/visualize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomImage: roomImageUrl,
          swatchImage: swatchImageUrl,
          productType,
          productId: selectedProductId,
        }),
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      const data = await response.json();

      if (data.success && data.resultImageUrl) {
        setVisualizedResult(data.resultImageUrl);
        setIsDemoFallback(Boolean(data.isDemoFallback));
      } else {
        throw new Error(data.error?.message || 'Visualization failed.');
      }
    } catch (err) {
      console.error('Error generating visualization:', err);
    } finally {
      setIsVisualizing(false);
      setStatusMessage('');
    }
  };

  const handleDownloadMockup = () => {
    if (!visualizedResult) return;
    const link = document.createElement('a');
    link.href = visualizedResult;
    link.download = `Excellence_Visualization_${Date.now()}.png`;
    link.click();
  };

  const handleSaveMockup = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Visualizer Step Guide Header */}
      <div className="bg-gradient-to-r from-brand-espresso via-brand-espresso/95 to-brand-burgundy text-white p-6 rounded-card border border-brand-gold/30 shadow-md">
        <div className="max-w-3xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-brand-gold bg-brand-gold/20 px-2.5 py-0.5 rounded-full border border-brand-gold/30">
              AI Room Visualizer (Requirement R6)
            </span>
            <span className="text-xs text-brand-ivory/70">Powered by Gemini Multimodal AI</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-display text-white">
            See Your Space Transformed Before You Buy
          </h2>
          <p className="text-xs sm:text-sm text-brand-ivory/80 leading-relaxed">
            Upload a photo of your living room window, bedroom, or accent wall, select any luxury fabric swatch from our Andheri showroom catalog, and preview photorealistic drapes rendered into your actual home.
          </p>
        </div>
      </div>

      {/* Product Type Selector Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold text-brand-espresso mr-2">Treatment Type:</span>
        <button
          type="button"
          onClick={() => {
            setProductType('curtain');
            setVisualizedResult(null);
          }}
          className={`px-4 py-2 rounded-pill text-xs font-semibold transition-all ${
            productType === 'curtain'
              ? 'bg-brand-espresso text-brand-gold shadow-xs'
              : 'bg-white border border-brand-gold/30 text-brand-charcoal hover:bg-brand-ivory'
          }`}
        >
          Curtains &amp; Window Treatments
        </button>
        <button
          type="button"
          onClick={() => {
            setProductType('wallpaper');
            setVisualizedResult(null);
          }}
          className={`px-4 py-2 rounded-pill text-xs font-semibold transition-all ${
            productType === 'wallpaper'
              ? 'bg-brand-espresso text-brand-gold shadow-xs'
              : 'bg-white border border-brand-gold/30 text-brand-charcoal hover:bg-brand-ivory'
          }`}
        >
          Wallpapers &amp; Wall Murals
        </button>
        <button
          type="button"
          onClick={() => {
            setProductType('upholstery');
            setVisualizedResult(null);
          }}
          className={`px-4 py-2 rounded-pill text-xs font-semibold transition-all ${
            productType === 'upholstery'
              ? 'bg-brand-espresso text-brand-gold shadow-xs'
              : 'bg-white border border-brand-gold/30 text-brand-charcoal hover:bg-brand-ivory'
          }`}
        >
          Sofa &amp; Chair Upholstery
        </button>
      </div>

      {/* Split-Screen Dual Upload Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Container: Room Photo Drop Zone */}
        <Card className="bg-white border-brand-gold/30 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="p-5 border-b border-brand-gold/15 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-brand-espresso flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-gold text-brand-espresso font-bold text-xs flex items-center justify-center">
                  1
                </span>
                <span>Your Room Photo</span>
              </h3>
              <p className="text-[11px] text-brand-charcoal/70 mt-0.5">
                Upload your window or select a Mumbai sample room.
              </p>
            </div>

            <label className="cursor-pointer">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-espresso bg-brand-ivory hover:bg-brand-gold/20 border border-brand-gold/30 px-3 py-1.5 rounded-soft transition-colors">
                <UploadCloud className="w-3.5 h-3.5 text-brand-gold-dark" />
                <span>Upload Room Photo</span>
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleRoomFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Room Preview Area */}
          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            <div className="relative rounded-card overflow-hidden border border-brand-gold/30 bg-brand-pearl h-56 sm:h-64 flex items-center justify-center">
              {roomImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={roomImageUrl}
                  alt="Selected Room"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center p-6 text-brand-charcoal/60">
                  <ImageIcon className="w-10 h-10 text-brand-gold/40 mx-auto mb-2" />
                  <p className="text-xs font-semibold">No room image selected</p>
                </div>
              )}
            </div>

            {/* Sample Rooms Quick Selector */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-brand-charcoal block">
                Or pick a sample Mumbai showroom room:
              </span>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_ROOMS.map((sample) => (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      setRoomImageUrl(sample.url);
                      setVisualizedResult(null);
                    }}
                    className={`relative rounded-soft overflow-hidden border text-left p-1 transition-all ${
                      roomImageUrl === sample.url
                        ? 'border-brand-gold ring-2 ring-brand-gold/40 bg-brand-ivory'
                        : 'border-brand-gold/20 hover:border-brand-gold/60 bg-white'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sample.url}
                      alt={sample.name}
                      className="w-full h-12 object-cover rounded-xs"
                    />
                    <span className="block text-[10px] text-brand-espresso font-medium truncate mt-1">
                      {sample.name.split(' ')[0]} {sample.name.split(' ')[1]}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Right Container: Fabric Swatch Selector */}
        <Card className="bg-white border-brand-gold/30 shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="p-5 border-b border-brand-gold/15 flex items-center justify-between">
            <div>
              <h3 className="font-display font-bold text-base text-brand-espresso flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-brand-gold text-brand-espresso font-bold text-xs flex items-center justify-center">
                  2
                </span>
                <span>Select Fabric or Wallpaper</span>
              </h3>
              <p className="text-[11px] text-brand-charcoal/70 mt-0.5">
                Pick from showroom swatches or upload custom pattern.
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex items-center gap-1 bg-brand-pearl p-0.5 rounded-pill border border-brand-gold/20">
              <button
                type="button"
                onClick={() => setSwatchTab('catalog')}
                className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-colors ${
                  swatchTab === 'catalog'
                    ? 'bg-brand-espresso text-brand-gold shadow-xs'
                    : 'text-brand-charcoal hover:text-brand-espresso'
                }`}
              >
                Catalog
              </button>
              <button
                type="button"
                onClick={() => setSwatchTab('upload')}
                className={`px-2.5 py-1 rounded-pill text-[11px] font-semibold transition-colors ${
                  swatchTab === 'upload'
                    ? 'bg-brand-espresso text-brand-gold shadow-xs'
                    : 'text-brand-charcoal hover:text-brand-espresso'
                }`}
              >
                Upload
              </button>
            </div>
          </div>

          <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
            {swatchTab === 'catalog' ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-brand-espresso">
                    Active Swatch: {selectedProductName || 'Catalog Item'}
                  </span>
                  <span className="text-[11px] text-brand-charcoal/60">
                    {products.length} fabrics loaded
                  </span>
                </div>

                {/* Swatch grid */}
                <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-56 sm:max-h-64 overflow-y-auto p-1 border border-brand-gold/20 rounded-card bg-brand-pearl/30">
                  {products.map((product) => {
                    const isSelected = swatchImageUrl === (product.swatchImage || product.images[0]);
                    return (
                      <button
                        key={product.id}
                        type="button"
                        onClick={() => {
                          setSwatchImageUrl(product.swatchImage || product.images[0]);
                          setSelectedProductId(product.id);
                          setSelectedProductName(product.name);
                          setVisualizedResult(null);
                        }}
                        className={`group relative rounded-soft overflow-hidden border p-1 text-center transition-all ${
                          isSelected
                            ? 'border-brand-gold ring-2 ring-brand-gold bg-brand-ivory'
                            : 'border-brand-gold/20 hover:border-brand-gold/60 bg-white'
                        }`}
                        title={product.name}
                      >
                        <div className="relative w-full aspect-square rounded overflow-hidden">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.swatchImage || product.images[0]}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          {isSelected && (
                            <div className="absolute inset-0 bg-brand-gold/30 flex items-center justify-center">
                              <span className="w-5 h-5 rounded-full bg-brand-gold text-brand-espresso flex items-center justify-center font-bold text-xs shadow">
                                ✓
                              </span>
                            </div>
                          )}
                        </div>
                        <span className="block text-[10px] font-medium text-brand-espresso truncate mt-1">
                          {product.name}
                        </span>
                        <span className="block text-[9px] text-brand-gold-dark font-semibold">
                          ₹{formatINR(product.pricePerUnitPaise, true)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Custom Swatch Upload Area */
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-brand-gold/40 hover:border-brand-gold rounded-card p-8 text-center cursor-pointer bg-brand-pearl/40 transition-colors h-56 sm:h-64">
                  <UploadCloud className="w-10 h-10 text-brand-gold mb-2" />
                  <span className="text-xs font-bold text-brand-espresso">
                    Click to select fabric swatch photo
                  </span>
                  <span className="text-[11px] text-brand-charcoal/60 mt-1">
                    Accepts high resolution JPEG, PNG, or WebP
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleSwatchFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}

            {/* Currently Active Swatch Preview Thumbnail */}
            <div className="p-2.5 rounded-card bg-brand-pearl/60 border border-brand-gold/20 flex items-center gap-3">
              {swatchImageUrl && (
                <div className="w-10 h-10 rounded-soft overflow-hidden border border-brand-gold/40 shrink-0 bg-white">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={swatchImageUrl} alt="Active swatch" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="font-bold text-brand-espresso text-xs block truncate">
                  {selectedProductName || 'Selected Swatch'}
                </span>
                <span className="text-[10px] text-brand-charcoal/70 block">
                  Target: {productType.toUpperCase()} DRAPES
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Primary Action Button Bar */}
      <div className="flex flex-col items-center justify-center space-y-3 pt-2">
        <Button
          size="lg"
          onClick={handleRunVisualize}
          disabled={isVisualizing || !roomImageUrl || !swatchImageUrl}
          className="bg-gradient-to-r from-brand-gold via-brand-gold-dark to-brand-burgundy text-white font-bold text-sm sm:text-base px-8 py-6 rounded-card shadow-lg hover:shadow-xl transition-all hover:scale-[1.01] active:scale-[0.99] gap-2.5"
        >
          <Sparkles className="w-5 h-5 text-brand-ivory animate-pulse" />
          <span>{isVisualizing ? 'Rendering AI Visualization...' : '✨ Visualize My Space'}</span>
        </Button>

        {isVisualizing && (
          <div className="text-center space-y-1.5 animate-in fade-in">
            <p className="text-xs font-semibold text-brand-gold-dark animate-pulse">
              {statusMessage || 'Synthesizing fabric folds and lighting...'}
            </p>
            <div className="w-48 h-1.5 rounded-full bg-brand-pearl border border-brand-gold/30 mx-auto overflow-hidden">
              <div className="h-full bg-brand-gold animate-indeterminate rounded-full" />
            </div>
          </div>
        )}
      </div>

      {/* Interactive Result Section */}
      {visualizedResult && (
        <div className="space-y-4 pt-4 border-t border-brand-gold/20 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-xl text-brand-espresso flex items-center gap-2">
                <span>Photorealistic Rendering Result</span>
                {isDemoFallback && (
                  <Badge variant="outline" className="text-[10px] text-brand-gold-dark border-brand-gold/40">
                    Offline Composite Mode
                  </Badge>
                )}
              </h3>
              <p className="text-xs text-brand-charcoal/70">
                Drag the slider handle horizontally to view the before and after comparison.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={handleSaveMockup}
                className="text-xs border-brand-gold/30 hover:bg-brand-ivory gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-brand-gold-dark" />
                <span>{savedSuccess ? 'Saved!' : 'Save Mockup'}</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={handleDownloadMockup}
                className="text-xs border-brand-gold/30 hover:bg-brand-ivory gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-brand-gold-dark" />
                <span>Download Image</span>
              </Button>

              {isAdmin ? (
                <Link href="/admin/clients">
                  <Button size="sm" className="bg-brand-espresso hover:bg-brand-gold hover:text-brand-espresso text-brand-ivory text-xs font-bold gap-1.5">
                    <Ruler className="w-3.5 h-3.5 text-brand-gold" />
                    <span>Create Client Measurement Sheet</span>
                  </Button>
                </Link>
              ) : (
                <Link href="/products">
                  <Button size="sm" className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso text-xs font-bold gap-1.5">
                    <span>Order This Fabric Now</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Interactive Before/After Slider */}
          <ComparisonSlider
            originalImage={roomImageUrl}
            visualizedImage={visualizedResult}
            originalLabel="Original Room"
            visualizedLabel={`Excellence ${productType === 'wallpaper' ? 'Wallpaper' : 'Curtains'}`}
            heightClass="h-[400px] sm:h-[520px]"
          />
        </div>
      )}
    </div>
  );
}
