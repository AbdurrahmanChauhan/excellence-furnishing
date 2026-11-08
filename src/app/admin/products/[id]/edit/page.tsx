'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Package, AlertCircle } from 'lucide-react';
import { fetchProductById } from '@/lib/firebase/firestore';
import { Product } from '@/types/product';
import { ProductForm } from '@/components/admin/ProductForm';
import { Button } from '@/components/ui/button';

export default function AdminEditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [product, setProduct] = React.useState<Product | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    async function loadProduct() {
      if (!productId) return;
      try {
        setLoading(true);
        const data = await fetchProductById(productId);
        setProduct(data);
      } catch (err) {
        console.error('Failed to load product for editing:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProduct();
  }, [productId]);

  if (loading) {
    return (
      <div className="space-y-4 max-w-5xl mx-auto py-12 text-center text-brand-charcoal/60">
        <Package className="w-8 h-8 text-brand-gold/40 animate-bounce mx-auto mb-2" />
        <p className="text-sm">Loading product details for #{productId}...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16 space-y-4">
        <AlertCircle className="w-12 h-12 text-brand-burgundy/60 mx-auto" />
        <h2 className="font-display text-2xl font-bold text-brand-espresso">Product Not Found</h2>
        <p className="text-sm text-brand-charcoal/70">
          The requested product ID &quot;{productId}&quot; was not found in the inventory database.
        </p>
        <Link href="/admin/products">
          <Button className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso text-xs font-semibold gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Products List
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="border-b border-brand-gold/20 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-espresso">
          Edit Product: {product.name}
        </h2>
        <p className="text-xs text-brand-charcoal/70 mt-1">
          Update pricing, stock availability, specifications, or imagery for SKU #{product.id}.
        </p>
      </div>

      <ProductForm initialProduct={product} isEdit={true} />
    </div>
  );
}
