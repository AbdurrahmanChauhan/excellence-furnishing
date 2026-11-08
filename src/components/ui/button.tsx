import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-soft text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold disabled:pointer-events-none disabled:opacity-50 select-none cursor-pointer',
  {
    variants: {
      variant: {
        default:
          'bg-gradient-cta text-brand-ivory hover:bg-gradient-cta-hover shadow-md hover:shadow-gold',
        gold:
          'bg-brand-gold text-brand-ivory hover:bg-brand-gold-light active:bg-brand-gold-dark shadow-sm',
        espresso:
          'bg-brand-espresso text-brand-ivory hover:bg-brand-espresso-light active:bg-brand-espresso-dark',
        outline:
          'border border-brand-gold/40 bg-transparent text-brand-espresso hover:bg-brand-ivory hover:border-brand-gold',
        secondary:
          'bg-brand-ivory text-brand-espresso hover:bg-brand-ivory-dark border border-brand-gold/20',
        ghost:
          'hover:bg-brand-ivory/60 text-brand-espresso hover:text-brand-gold-dark',
        destructive:
          'bg-red-600 text-white hover:bg-red-700 shadow-sm',
        link:
          'text-brand-gold underline-offset-4 hover:underline p-0 h-auto',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-soft px-3 text-xs',
        lg: 'h-12 rounded-card px-8 text-base font-semibold',
        icon: 'h-10 w-10 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
