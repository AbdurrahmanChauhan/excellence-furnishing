'use client';

import * as React from 'react';
import { Sparkles, ChevronsLeftRight, Eye } from 'lucide-react';

interface ComparisonSliderProps {
  originalImage: string;
  visualizedImage: string;
  originalLabel?: string;
  visualizedLabel?: string;
  className?: string;
  heightClass?: string;
}

export function ComparisonSlider({
  originalImage,
  visualizedImage,
  originalLabel = 'Original Space',
  visualizedLabel = 'With Excellence Furnishing',
  className = '',
  heightClass = 'h-[360px] sm:h-[480px]',
}: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = React.useState(50);
  const [isDragging, setIsDragging] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const handleMove = React.useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const width = rect.width;
      const position = Math.max(0, Math.min(100, (x / width) * 100));
      setSliderPosition(position);
    },
    []
  );

  const handleTouchMove = React.useCallback(
    (e: TouchEvent) => {
      if (!isDragging) return;
      handleMove(e.touches[0].clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseMove = React.useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      handleMove(e.clientX);
    },
    [isDragging, handleMove]
  );

  const handleMouseUp = React.useCallback(() => {
    setIsDragging(false);
  }, []);

  React.useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove]);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      setSliderPosition((prev) => Math.max(0, prev - 5));
    } else if (e.key === 'ArrowRight') {
      setSliderPosition((prev) => Math.min(100, prev + 5));
    }
  };

  return (
    <div
      ref={containerRef}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-label="Before and after visualization slider"
      aria-valuenow={Math.round(sliderPosition)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={`relative select-none overflow-hidden rounded-card border-2 border-brand-gold/40 shadow-card bg-brand-pearl ${heightClass} ${className} cursor-ew-resize focus:outline-none focus:ring-2 focus:ring-brand-gold`}
      onMouseDown={(e) => {
        setIsDragging(true);
        handleMove(e.clientX);
      }}
      onTouchStart={(e) => {
        setIsDragging(true);
        handleMove(e.touches[0].clientX);
      }}
    >
      {/* Visualized Image (Full width background layer) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={visualizedImage}
        alt="After: Excellence Furnishing visualized space"
        className="absolute inset-0 w-full h-full object-cover pointer-events-none"
      />

      {/* Visualized Label (Right) */}
      <div className="absolute top-4 right-4 z-20 pointer-events-none">
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-espresso/80 backdrop-blur-md text-brand-gold font-bold text-xs shadow-md border border-brand-gold/30">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{visualizedLabel}</span>
        </span>
      </div>

      {/* Original Image (Clipped layer on the left) */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ width: `${sliderPosition}%` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={originalImage}
          alt="Before: Original room space"
          style={{ width: containerRef.current ? `${containerRef.current.clientWidth}px` : '100%' }}
          className="absolute inset-0 max-w-none h-full object-cover"
        />

        {/* Original Label (Left) */}
        <div className="absolute top-4 left-4 z-20 pointer-events-none">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-md text-white font-semibold text-xs shadow-md border border-white/20">
            <Eye className="w-3.5 h-3.5" />
            <span>{originalLabel}</span>
          </span>
        </div>
      </div>

      {/* Vertical Split Line & Handle */}
      <div
        className="absolute top-0 bottom-0 z-30 pointer-events-none"
        style={{ left: `${sliderPosition}%` }}
      >
        {/* Glowing Divider Line */}
        <div className="absolute top-0 bottom-0 -left-[1.5px] w-[3px] bg-brand-gold shadow-[0_0_10px_rgba(184,134,11,0.8)]" />

        {/* Center Circular Grabber Handle */}
        <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-brand-gold text-brand-espresso border-2 border-white shadow-xl flex items-center justify-center transition-transform hover:scale-110 active:scale-95">
          <ChevronsLeftRight className="w-5 h-5 text-brand-espresso stroke-[2.5]" />
        </div>
      </div>

      {/* Subtle Hint Bar at Bottom */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 pointer-events-none bg-black/60 backdrop-blur-sm px-3 py-1 rounded-pill text-[11px] text-white/90 font-medium">
        Drag slider left or right to compare
      </div>
    </div>
  );
}
