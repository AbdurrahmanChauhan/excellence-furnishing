'use client';

import * as React from 'react';
import { ProductForm } from '@/components/admin/ProductForm';

export default function AdminNewProductPage() {
  return (
    <div className="space-y-6">
      <div className="border-b border-brand-gold/20 pb-4">
        <h2 className="text-xl sm:text-2xl font-bold font-display text-brand-espresso">
          Add New Product
        </h2>
        <p className="text-xs text-brand-charcoal/70 mt-1">
          Create a new catalog item with swatch imagery, dimensions, Mumbai retail rates, and GST classification.
        </p>
      </div>

      <ProductForm isEdit={false} />
    </div>
  );
}
