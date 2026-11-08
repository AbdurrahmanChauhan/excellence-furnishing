'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Users,
  ArrowLeft,
  Save,
  CheckCircle2,
  Building,
  MapPin,
  Phone,
  Mail,
  Tag,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { clientFormSchema, ClientFormData } from '@/lib/validators/schemas';
import { saveClient } from '@/lib/firebase/firestore';
import { Client } from '@/types/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const AVAILABLE_TAGS = ['VIP', 'Residential', 'Commercial', 'Architect', 'Urgent', 'Bulk'];

export default function NewClientPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [sameAsBilling, setSameAsBilling] = React.useState(true);
  const [selectedTags, setSelectedTags] = React.useState<string[]>(['Residential']);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      phone: '',
      alternatePhone: '',
      email: '',
      billingAddress: {
        street: '',
        landmark: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058',
        country: 'India',
      },
      siteAddress: {
        street: '',
        landmark: '',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400058',
        country: 'India',
      },
      tags: ['Residential'],
      notes: '',
      architectDesignerName: '',
      gstin: '',
    },
  });

  const billingValues = watch('billingAddress');

  // Handle "Same as billing address" synchronization
  React.useEffect(() => {
    if (sameAsBilling && billingValues) {
      setValue('siteAddress.street', billingValues.street || '');
      setValue('siteAddress.landmark', billingValues.landmark || '');
      setValue('siteAddress.city', billingValues.city || 'Mumbai');
      setValue('siteAddress.state', billingValues.state || 'Maharashtra');
      setValue('siteAddress.pincode', billingValues.pincode || '400058');
      setValue('siteAddress.country', billingValues.country || 'India');
    }
  }, [sameAsBilling, billingValues, setValue]);

  const toggleTag = (tag: string) => {
    const updated = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];
    setSelectedTags(updated);
    setValue('tags', updated);
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      setSubmitting(true);
      setErrorMessage(null);

      // Generate a clean slugified client ID
      const safeSlug = data.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const clientId = `client-${safeSlug}-${Date.now().toString().slice(-4)}`;
      const timestamp = new Date().toISOString();

      const newClient: Client = {
        id: clientId,
        name: data.name.trim(),
        phone: data.phone.trim(),
        alternatePhone: data.alternatePhone?.trim() || undefined,
        email: data.email.toLowerCase().trim(),
        billingAddress: {
          ...data.billingAddress,
          country: 'India',
        },
        siteAddress: sameAsBilling
          ? { ...data.billingAddress, country: 'India' }
          : { ...data.siteAddress, country: 'India' },
        tags: selectedTags,
        architectDesignerName: data.architectDesignerName?.trim() || undefined,
        gstin: data.gstin?.trim() || undefined,
        notes: data.notes?.trim() || undefined,
        totalOrdersCount: 0,
        totalSpentPaise: 0,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      await saveClient(newClient);
      // Redirect to the newly created client's detail hub
      router.push(`/admin/clients/${clientId}`);
    } catch (err: unknown) {
      console.error('Error creating client:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Failed to save client. Please check details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/clients"
          className="inline-flex items-center gap-1.5 text-xs text-brand-charcoal/70 hover:text-brand-gold transition-colors font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Clients CRM</span>
        </Link>
      </div>

      <div>
        <h2 className="text-2xl font-bold font-display text-brand-espresso">
          Onboard New Client
        </h2>
        <p className="text-xs text-brand-charcoal/70 mt-1">
          Register client profile, site installation address in Mumbai, contact info, and interior architect notes.
        </p>
      </div>

      {errorMessage && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-card flex items-center gap-2 text-red-700 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Section 1: Basic Information */}
        <Card className="border border-brand-gold/20 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-brand-gold/10">
            <CardTitle className="text-sm font-bold text-brand-espresso flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-gold" />
              <span>1. Contact & Identity Information</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Primary individual or firm identity and Mumbai contact numbers.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-brand-espresso">
                Full Name / Business Entity <span className="text-red-500">*</span>
              </label>
              <Input
                {...register('name')}
                placeholder="e.g. Mr. Rajesh Sharma or Studio Archline"
                className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
              />
              {errors.name && (
                <p className="text-[11px] text-red-600 font-medium">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-espresso">
                Mobile Number (10 digits) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-charcoal/50">
                  +91
                </span>
                <Input
                  {...register('phone')}
                  placeholder="9820012345"
                  className="pl-11 text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                  maxLength={10}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-red-600 font-medium">{errors.phone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-espresso">
                Alternate Phone / Landline (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-brand-charcoal/50">
                  +91
                </span>
                <Input
                  {...register('alternatePhone')}
                  placeholder="9820054321"
                  className="pl-11 text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                  maxLength={10}
                />
              </div>
              {errors.alternatePhone && (
                <p className="text-[11px] text-red-600 font-medium">{errors.alternatePhone.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-espresso">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                type="email"
                {...register('email')}
                placeholder="client@example.com"
                className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
              />
              {errors.email && (
                <p className="text-[11px] text-red-600 font-medium">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-espresso">
                Architect / Interior Designer (Optional)
              </label>
              <Input
                {...register('architectDesignerName')}
                placeholder="e.g. Zubin & Associates"
                className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-brand-espresso">
                GSTIN (Optional for B2B Invoices)
              </label>
              <Input
                {...register('gstin')}
                placeholder="27AABCE1234F1Z5"
                className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold uppercase"
                maxLength={15}
              />
              {errors.gstin && (
                <p className="text-[11px] text-red-600 font-medium">{errors.gstin.message}</p>
              )}
            </div>

            {/* Tags Selection */}
            <div className="space-y-1 sm:col-span-2">
              <label className="text-xs font-semibold text-brand-espresso flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-brand-gold" />
                <span>Client Classification Tags</span>
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {AVAILABLE_TAGS.map((tag) => {
                  const isSelected = selectedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-all ${
                        isSelected
                          ? 'bg-brand-gold text-brand-espresso font-bold ring-1 ring-brand-gold-dark'
                          : 'bg-brand-pearl text-brand-charcoal hover:bg-brand-ivory'
                      }`}
                    >
                      {tag} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Addresses */}
        <Card className="border border-brand-gold/20 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-brand-gold/10">
            <CardTitle className="text-sm font-bold text-brand-espresso flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-gold" />
              <span>2. Addresses (Billing & Project Site)</span>
            </CardTitle>
            <CardDescription className="text-xs">
              Site installation address in Mumbai where curtains/wallpapers will be hung.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4 space-y-5">
            {/* Billing Address Sub-section */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark">
                A. Billing Address
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-brand-espresso">
                    Street / Building / Flat Number <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('billingAddress.street')}
                    placeholder="e.g. Flat 1402, Oberoi Sky Heights, Lokhandwala"
                    className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                  />
                  {errors.billingAddress?.street && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {errors.billingAddress.street.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-espresso">
                    Landmark / Colony (Optional)
                  </label>
                  <Input
                    {...register('billingAddress.landmark')}
                    placeholder="Near Lokhandwala Complex Garden"
                    className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-espresso">
                    City <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('billingAddress.city')}
                    defaultValue="Mumbai"
                    className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-espresso">
                    State <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('billingAddress.state')}
                    defaultValue="Maharashtra"
                    className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-brand-espresso">
                    Pincode (6 digits) <span className="text-red-500">*</span>
                  </label>
                  <Input
                    {...register('billingAddress.pincode')}
                    placeholder="400058"
                    className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                    maxLength={6}
                  />
                  {errors.billingAddress?.pincode && (
                    <p className="text-[11px] text-red-600 font-medium">
                      {errors.billingAddress.pincode.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Checkbox: Same as Billing */}
            <div className="pt-2 border-t border-brand-gold/15">
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-brand-espresso cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={sameAsBilling}
                  onChange={(e) => setSameAsBilling(e.target.checked)}
                  className="rounded border-brand-gold/40 text-brand-gold focus:ring-brand-gold w-4 h-4"
                />
                <span>Project / Site Address is same as Billing Address</span>
              </label>
            </div>

            {/* Site Address Sub-section (if different) */}
            {!sameAsBilling && (
              <div className="space-y-3 pt-3 border-t border-brand-gold/15 animate-in fade-in duration-150">
                <h4 className="text-xs font-bold uppercase tracking-wider text-brand-gold-dark">
                  B. Project Installation Site Address (Mumbai)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-xs font-semibold text-brand-espresso">
                      Site Street / Building <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register('siteAddress.street')}
                      placeholder="Site building, wing, flat number"
                      className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                    />
                    {errors.siteAddress?.street && (
                      <p className="text-[11px] text-red-600 font-medium">
                        {errors.siteAddress.street.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-espresso">
                      Site Landmark
                    </label>
                    <Input
                      {...register('siteAddress.landmark')}
                      placeholder="e.g. Next to Cafe Arfa"
                      className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-espresso">
                      City <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register('siteAddress.city')}
                      defaultValue="Mumbai"
                      className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-espresso">
                      State <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register('siteAddress.state')}
                      defaultValue="Maharashtra"
                      className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-espresso">
                      Pincode <span className="text-red-500">*</span>
                    </label>
                    <Input
                      {...register('siteAddress.pincode')}
                      placeholder="400053"
                      className="text-xs h-9 bg-white border-brand-gold/30 focus:border-brand-gold"
                      maxLength={6}
                    />
                    {errors.siteAddress?.pincode && (
                      <p className="text-[11px] text-red-600 font-medium">
                        {errors.siteAddress.pincode.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 3: Project Notes */}
        <Card className="border border-brand-gold/20 shadow-xs bg-white">
          <CardHeader className="pb-3 border-b border-brand-gold/10">
            <CardTitle className="text-sm font-bold text-brand-espresso flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-gold" />
              <span>3. Project Preferences & Notes</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <textarea
              {...register('notes')}
              rows={3}
              placeholder="e.g. Client prefers Somfy motorized tracks for living room balcony and blackout linen lining in master bedroom..."
              className="w-full text-xs p-3 rounded-card bg-white border border-brand-gold/30 focus:border-brand-gold focus:outline-hidden"
            />
          </CardContent>
        </Card>

        {/* Submit Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/admin/clients">
            <Button variant="outline" type="button" className="text-xs border-brand-gold/30">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            disabled={submitting}
            className="bg-brand-gold hover:bg-brand-gold-dark text-brand-espresso font-semibold text-xs gap-1.5 shadow-sm px-6 h-10"
          >
            <Save className="w-4 h-4" />
            <span>{submitting ? 'Saving Client Profile...' : 'Save & Continue to Rooms'}</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
