'use client';

import React, { useState } from 'react';
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  Calendar,
  MessageCircle,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { SITE_CONFIG } from '@/config/site';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    roomType: 'living_room',
    service: 'curtains_window_treatments',
    date: '',
    address: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Simulate consultation booking confirmation
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 600);
  };

  const whatsappInquiryUrl = `https://wa.me/${SITE_CONFIG.whatsappNumber}?text=${encodeURIComponent(
    'Hello Excellence Furnishing, I would like to schedule a soft furnishing consultation for my home.'
  )}`;

  return (
    <div className="py-12 sm:py-16 bg-brand-pearl min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 sm:space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <span className="text-xs font-semibold uppercase tracking-widest text-brand-gold bg-brand-ivory border border-brand-gold/30 px-3.5 py-1 rounded-full">
            In-Home & Showroom Consultations
          </span>
          <h1 className="font-display font-bold text-3xl sm:text-5xl text-brand-espresso mt-4">
            Connect With Our Master Craftsmen
          </h1>
          <p className="font-accent italic text-lg sm:text-xl text-brand-burgundy mt-2">
            Schedule an in-home measurement visit with Mr. Altamash or Mr. Alim, or drop by our Andheri West gallery.
          </p>
          <div className="w-24 h-0.5 bg-brand-gold mx-auto mt-4" />
        </div>

        {/* 2-Column Grid: Form (Left) + Contact Details & Map (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left: Consultation Booking Form */}
          <div className="lg:col-span-7 bg-white p-6 sm:p-10 rounded-modal border border-brand-gold/25 shadow-card">
            <div className="mb-6">
              <h2 className="font-display font-bold text-2xl text-brand-espresso">
                Book a Free Soft Furnishing Consultation
              </h2>
              <p className="text-xs sm:text-sm text-brand-charcoal/75 mt-1">
                Our advisors will bring physical fabric swatch decks and take laser precision measurements.
              </p>
            </div>

            {submitted ? (
              <div className="py-12 px-6 rounded-card bg-brand-forest/10 border border-brand-forest/30 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-brand-forest mx-auto" />
                <h3 className="font-display font-bold text-2xl text-brand-espresso">
                  Consultation Request Received!
                </h3>
                <p className="text-xs sm:text-sm text-brand-charcoal max-w-md mx-auto leading-relaxed">
                  Thank you, <strong>{formData.name || 'Valued Customer'}</strong>. Mr. Altamash or Mr. Alim will call you at <strong>{formData.phone}</strong> shortly to confirm your consultation timing and review fabric preferences.
                </p>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setFormData({
                        name: '',
                        phone: '',
                        email: '',
                        roomType: 'living_room',
                        service: 'curtains_window_treatments',
                        date: '',
                        address: '',
                        notes: '',
                      });
                    }}
                    className="btn-gradient-cta px-6 py-2.5 rounded-soft text-xs font-semibold shadow"
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-espresso uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Priya Sharma"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-soft border border-brand-gold/30 text-sm text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-espresso uppercase tracking-wider mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 98200 12345"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-soft border border-brand-gold/30 text-sm text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Email & Preferred Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-espresso uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. priya@gmail.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-soft border border-brand-gold/30 text-sm text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none min-h-[44px]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-espresso uppercase tracking-wider mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-soft border border-brand-gold/30 text-sm text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none min-h-[44px]"
                    />
                  </div>
                </div>

                {/* Service & Room Type */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-espresso uppercase tracking-wider mb-1">
                      Service Required *
                    </label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-soft border border-brand-gold/30 text-sm text-brand-espresso bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none min-h-[44px] cursor-pointer"
                    >
                      <option value="curtains_window_treatments">Curtains & Motorized Drapes</option>
                      <option value="sofa_upholstery_fabrics">Sofa Reupholstery & Foams</option>
                      <option value="wallpapers">Wallpapers & Custom Murals</option>
                      <option value="mattresses_sleep_solutions">Refresh Mattresses & Sleep Beds</option>
                      <option value="full_home">Full Home Soft Furnishing</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-brand-espresso uppercase tracking-wider mb-1">
                      Room Type
                    </label>
                    <select
                      value={formData.roomType}
                      onChange={(e) => setFormData({ ...formData, roomType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-soft border border-brand-gold/30 text-sm text-brand-espresso bg-white focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none min-h-[44px] cursor-pointer"
                    >
                      <option value="living_room">Living Room Salon</option>
                      <option value="master_bedroom">Master Bedroom Suite</option>
                      <option value="dining_room">Dining & Entertainment Area</option>
                      <option value="office">Commercial Office / Studio</option>
                      <option value="full_bungalow">Complete Bungalow / Penthouse</option>
                    </select>
                  </div>
                </div>

                {/* Location / Address */}
                <div>
                  <label className="block text-xs font-semibold text-brand-espresso uppercase tracking-wider mb-1">
                    Your Mumbai Location / Neighborhood
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Lokhandwala, Andheri West / Juhu / Bandra"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-soft border border-brand-gold/30 text-sm text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none min-h-[44px]"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-brand-espresso uppercase tracking-wider mb-1">
                    Project Notes & Dimensions (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Tell us about window heights, fabric colors you love, or preferred brands..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-soft border border-brand-gold/30 text-sm text-brand-espresso focus:border-brand-gold focus:ring-1 focus:ring-brand-gold outline-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full btn-gradient-cta py-3 px-6 rounded-soft font-semibold text-sm shadow hover:shadow-lg transition flex items-center justify-center gap-2 min-h-[44px] disabled:opacity-70"
                  >
                    <Send className="w-4 h-4" />
                    <span>{isSubmitting ? 'Confirming Appointment...' : 'Schedule Free In-Home Consultation'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Right: Showroom Details & Embed */}
          <div className="lg:col-span-5 space-y-6">
            {/* Quick Contact Card */}
            <div className="p-6 sm:p-8 rounded-modal bg-brand-espresso text-brand-pearl border border-brand-gold/30 shadow-card space-y-5">
              <h3 className="font-display font-bold text-2xl text-white">
                Showroom Coordinates
              </h3>

              <div className="space-y-4 text-xs sm:text-sm text-brand-pearl/85">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-brand-gold shrink-0 mt-1" />
                  <div>
                    <strong className="text-white block font-medium">Showroom Location:</strong>
                    <span>{SITE_CONFIG.address.shop}</span>
                    <span className="block">{SITE_CONFIG.address.street}</span>
                    <span className="block">{SITE_CONFIG.address.area}, {SITE_CONFIG.address.city} — {SITE_CONFIG.address.pincode}</span>
                    <span className="text-brand-gold text-xs block mt-1 font-medium">
                      Landmark: {SITE_CONFIG.address.landmark}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-brand-gold shrink-0 mt-1" />
                  <div>
                    <strong className="text-white block font-medium">Showroom Hours:</strong>
                    <span>{SITE_CONFIG.hours}</span>
                    <span className="block text-brand-pearl/70 text-xs">
                      Open all 7 days for customer visits
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone className="w-4 h-4 text-brand-gold shrink-0 mt-1" />
                  <div>
                    <strong className="text-white block font-medium">Direct Telephone:</strong>
                    <a href={`tel:${SITE_CONFIG.phone}`} className="text-brand-gold hover:underline">
                      {SITE_CONFIG.phoneDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail className="w-4 h-4 text-brand-gold shrink-0 mt-1" />
                  <div>
                    <strong className="text-white block font-medium">Email Desk:</strong>
                    <a href={`mailto:${SITE_CONFIG.email}`} className="text-brand-gold hover:underline">
                      {SITE_CONFIG.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp CTA */}
              <div className="pt-2">
                <a
                  href={whatsappInquiryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-soft bg-[#25D366] hover:bg-[#20ba5a] text-white font-semibold text-xs sm:text-sm shadow flex items-center justify-center gap-2 min-h-[44px] transition"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Chat with Mr. Altamash on WhatsApp</span>
                </a>
              </div>
            </div>

            {/* Google Map Card */}
            <div className="rounded-modal overflow-hidden border border-brand-gold/30 shadow-card bg-white p-2">
              <div className="w-full h-64 sm:h-72 rounded-card overflow-hidden">
                <iframe
                  title="Showroom Location Map"
                  src={SITE_CONFIG.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              <div className="p-3 text-center">
                <a
                  href={SITE_CONFIG.mapDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gold hover:text-brand-burgundy transition"
                >
                  <span>Open in Google Maps App for Driving Route</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
