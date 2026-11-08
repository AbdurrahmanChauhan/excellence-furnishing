import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-pill px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-brand-gold/15 text-brand-gold-dark border border-brand-gold/30',
        gold: 'bg-brand-gold text-brand-ivory shadow-xs',
        burgundy: 'bg-brand-burgundy/15 text-brand-burgundy border border-brand-burgundy/30',
        espresso: 'bg-brand-espresso text-brand-ivory',
        ivory: 'bg-brand-ivory text-brand-espresso border border-brand-gold/20',
        forest: 'bg-green-100 text-green-800 border border-green-300',
        blue: 'bg-blue-100 text-blue-800 border border-blue-300',
        outline: 'border border-brand-gold/40 text-brand-espresso',
        draft: 'bg-gray-100 text-gray-700 border border-gray-300',
        confirmed: 'bg-amber-100 text-amber-900 border border-amber-300',
        in_production: 'bg-blue-100 text-blue-900 border border-blue-300',
        ready: 'bg-purple-100 text-purple-900 border border-purple-300',
        delivered: 'bg-emerald-100 text-emerald-900 border border-emerald-300',
        cancelled: 'bg-red-100 text-red-900 border border-red-300',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
