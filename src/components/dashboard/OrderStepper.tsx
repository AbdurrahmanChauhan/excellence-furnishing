import * as React from 'react';
import { CheckCircle2, Clock, Scissors, Truck, Home } from 'lucide-react';
import { OrderStatus } from '@/types/order';
import { cn } from '@/lib/utils';

export interface MilestoneStage {
  id: number;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const MILESTONE_STAGES: readonly MilestoneStage[] = [
  {
    id: 1,
    label: 'Order Confirmed',
    description: 'Advance received & verified',
    icon: CheckCircle2,
  },
  {
    id: 2,
    label: 'Fabric Procured',
    description: 'Yardage inspected & cut',
    icon: Clock,
  },
  {
    id: 3,
    label: 'Custom Stitching',
    description: 'Master artisan pleating',
    icon: Scissors,
  },
  {
    id: 4,
    label: 'Out for Delivery',
    description: 'QC passed & in transit',
    icon: Truck,
  },
  {
    id: 5,
    label: 'Delivered & Installed',
    description: 'Track fitted & hung',
    icon: Home,
  },
];

/**
 * Resolves current milestone step index (1-based, 1 to 5) from OrderStatus.
 */
export function getMilestoneStep(status: OrderStatus): number {
  switch (status) {
    case 'draft':
      return 0;
    case 'confirmed':
      return 1;
    case 'in_production':
      return 3; // Custom Stitching is actively underway
    case 'ready':
      return 4; // Out for Delivery
    case 'delivered':
      return 5; // Delivered & Installed
    case 'cancelled':
      return 0;
    default:
      return 1;
  }
}

export interface OrderStepperProps {
  status: OrderStatus;
  createdAt?: string;
  estimatedDeliveryDate?: string;
  className?: string;
}

export function OrderStepper({
  status,
  createdAt,
  estimatedDeliveryDate,
  className,
}: OrderStepperProps) {
  const currentStep = getMilestoneStep(status);
  const isCancelled = status === 'cancelled';

  if (isCancelled) {
    return (
      <div className={cn('p-4 rounded-card bg-red-50 border border-red-200 text-center', className)}>
        <p className="text-sm font-semibold text-red-700">This order has been cancelled.</p>
        <p className="text-xs text-red-600 mt-1">Please contact the showroom for refund or re-order queries.</p>
      </div>
    );
  }

  return (
    <div className={cn('w-full py-4', className)}>
      <div className="relative">
        {/* Progress Bar background track */}
        <div className="absolute top-5 left-6 right-6 h-1 bg-brand-gold/20 -z-0 hidden md:block" />

        {/* Active progress fill */}
        <div
          className="absolute top-5 left-6 h-1 bg-brand-gold transition-all duration-500 -z-0 hidden md:block"
          style={{
            width: `${Math.max(0, Math.min(100, ((currentStep - 1) / (MILESTONE_STAGES.length - 1)) * 100))}%`,
          }}
        />

        {/* Stepper items */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative z-10">
          {MILESTONE_STAGES.map((stage) => {
            const isCompleted = stage.id < currentStep || (stage.id === 5 && currentStep === 5);
            const isCurrent = stage.id === currentStep && currentStep < 5;
            const isPending = stage.id > currentStep;
            const Icon = stage.icon;

            return (
              <div
                key={stage.id}
                className={cn(
                  'flex md:flex-col items-center md:items-center gap-3 md:gap-2 text-left md:text-center p-3 md:p-1 rounded-card md:rounded-none transition-colors',
                  isCurrent && 'bg-brand-ivory/60 md:bg-transparent border md:border-none border-brand-gold/40'
                )}
              >
                {/* Step Circle Badge */}
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all shadow-sm',
                    isCompleted && 'bg-brand-gold border-brand-gold text-white',
                    isCurrent && 'bg-brand-ivory border-brand-gold text-brand-gold-dark animate-pulse',
                    isPending && 'bg-white border-brand-gold/30 text-brand-charcoal/40'
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Step Information */}
                <div className="flex-1 md:flex-initial">
                  <div className="flex items-center gap-1.5 md:justify-center">
                    <span className="text-[10px] uppercase font-bold text-brand-gold-dark tracking-wider md:hidden">
                      Step {stage.id}:
                    </span>
                    <h4
                      className={cn(
                        'text-xs sm:text-sm font-semibold tracking-tight',
                        (isCompleted || isCurrent) ? 'text-brand-espresso' : 'text-brand-charcoal/50'
                      )}
                    >
                      {stage.label}
                    </h4>
                  </div>
                  <p className="text-[11px] text-brand-charcoal/70 line-clamp-1">
                    {stage.description}
                  </p>
                  {isCurrent && (
                    <span className="inline-block mt-0.5 text-[10px] font-bold text-brand-burgundy uppercase tracking-wider">
                      ● Current Stage
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
