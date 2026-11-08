import React from 'react';
import HeroCarousel from '@/components/home/HeroCarousel';
import TrustMetrics from '@/components/home/TrustMetrics';
import CategoryGrid from '@/components/home/CategoryGrid';
import ShopTheRoom from '@/components/home/ShopTheRoom';
import Testimonials from '@/components/home/Testimonials';
import ShowroomInvite from '@/components/home/ShowroomInvite';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* 1. Hero Carousel */}
      <HeroCarousel />

      {/* 2. Trust Metrics Banner */}
      <TrustMetrics />

      {/* 3. Featured Categories Grid */}
      <CategoryGrid />

      {/* 4. Interactive "Shop the Room" Component */}
      <ShopTheRoom />

      {/* 5. Verified Customer Testimonials */}
      <Testimonials />

      {/* 6. Showroom Visit Invitation with Map */}
      <ShowroomInvite />
    </div>
  );
}
