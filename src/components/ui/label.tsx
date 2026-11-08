import * as React from 'react';
import { cn } from '@/lib/utils';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-xs font-semibold tracking-wide uppercase text-brand-espresso select-none flex items-center gap-1',
          className
        )}
        {...props}
      >
        {children}
        {required && <span className="text-brand-burgundy font-bold">*</span>}
      </label>
    );
  }
);
Label.displayName = 'Label';
