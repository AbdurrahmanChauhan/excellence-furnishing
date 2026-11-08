import * as React from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface OrderSummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  badge?: string;
  trend?: string;
  className?: string;
}

export function OrderSummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  badge,
  trend,
  className,
}: OrderSummaryCardProps) {
  return (
    <Card className={cn('border-brand-gold/20 hover:border-brand-gold/50 transition-all', className)}>
      <CardContent className="p-5 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-charcoal/70">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-2xl sm:text-3xl font-bold text-brand-espresso">
              {value}
            </span>
            {badge && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-pill bg-brand-gold/15 text-brand-gold-dark border border-brand-gold/30">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-brand-charcoal/60 line-clamp-1">{subtitle}</p>
          )}
          {trend && (
            <p className="text-[11px] text-green-700 font-medium flex items-center gap-1 mt-1">
              {trend}
            </p>
          )}
        </div>
        <div className="w-10 h-10 rounded-card bg-brand-ivory flex items-center justify-center text-brand-gold border border-brand-gold/20 shrink-0">
          <Icon className="w-5 h-5" />
        </div>
      </CardContent>
    </Card>
  );
}
