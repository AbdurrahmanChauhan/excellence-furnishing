'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  CheckCircle2,
  Sparkles,
  Home,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

const profileSchema = z.object({
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email(),
  phoneNumber: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .regex(/^[0-9+\s-]{10,15}$/, 'Please enter a valid phone number'),
  street: z.string().min(3, 'Street address is required'),
  landmark: z.string().optional(),
  city: z.string().min(2, 'City is required').default('Mumbai'),
  state: z.string().default('Maharashtra'),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit Indian PIN code'),
  preferredStyle: z.string().optional(),
  consultationNotes: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

export default function CustomerProfilePage() {
  const { user, profile, updateProfileData } = useAuthStore();
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: profile?.displayName || user?.displayName || 'Priya Sharma',
      email: profile?.email || user?.email || 'customer@excellencefurnishing.com',
      phoneNumber: profile?.phoneNumber || '+91 98201 12345',
      street: profile?.address?.street || 'Flat 1402, Oberoi Sky Heights, Lokhandwala',
      landmark: profile?.address?.landmark || 'Near Lokhandwala Complex Garden',
      city: profile?.address?.city || 'Mumbai',
      state: profile?.address?.state || 'Maharashtra',
      pincode: profile?.address?.pincode || '400053',
      preferredStyle: 'Royal Classic Drapery & Velvet',
      consultationNotes: 'Prefers wave-pleated curtains and blackout linings for master bedroom.',
    },
  });

  // Re-sync default values when profile updates
  React.useEffect(() => {
    if (profile || user) {
      reset({
        displayName: profile?.displayName || user?.displayName || '',
        email: profile?.email || user?.email || '',
        phoneNumber: profile?.phoneNumber || '+91 98201 12345',
        street: profile?.address?.street || 'Flat 1402, Oberoi Sky Heights, Lokhandwala',
        landmark: profile?.address?.landmark || 'Near Lokhandwala Complex Garden',
        city: profile?.address?.city || 'Mumbai',
        state: profile?.address?.state || 'Maharashtra',
        pincode: profile?.address?.pincode || '400053',
        preferredStyle: 'Royal Classic Drapery & Velvet',
        consultationNotes: 'Prefers wave-pleated curtains and blackout linings for master bedroom.',
      });
    }
  }, [profile, user, reset]);

  const onSubmit = async (data: ProfileFormData) => {
    setSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateProfileData({
        displayName: data.displayName,
        phoneNumber: data.phoneNumber,
        address: {
          street: data.street,
          landmark: data.landmark,
          city: data.city,
          state: data.state,
          pincode: data.pincode,
          country: 'India',
        },
      });

      setSuccessMessage('Your profile and delivery details have been updated successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-brand-espresso">
          Client Profile & Address Book
        </h1>
        <p className="text-xs sm:text-sm text-brand-charcoal/70 mt-1">
          Manage your contact credentials and Mumbai installation site details
        </p>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div
          role="status"
          className="rounded-soft bg-emerald-50 border border-emerald-300 p-4 text-xs sm:text-sm text-emerald-800 flex items-center gap-2.5 shadow-sm animate-in fade-in"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Error Notification */}
      {errorMessage && (
        <div
          role="alert"
          className="rounded-soft bg-red-50 border border-red-300 p-4 text-xs sm:text-sm text-red-800 flex items-center gap-2.5 shadow-sm animate-in fade-in"
        >
          <div className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
          <span className="font-medium">{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <Card className="border-brand-gold/30 shadow-card bg-white">
          <CardHeader className="pb-4 border-b border-brand-gold/15">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl text-brand-espresso">Personal Information</CardTitle>
                <CardDescription className="text-xs text-brand-charcoal/70">
                  Primary client details for consultation bookings and invoice generation
                </CardDescription>
              </div>
              <div className="w-9 h-9 rounded-full bg-brand-ivory text-brand-gold-dark border border-brand-gold/30 flex items-center justify-center font-bold text-sm">
                <User className="w-4 h-4" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-6 space-y-6">
            {/* Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="displayName" required>
                  Full Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gold/70">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="displayName"
                    className="pl-9"
                    error={Boolean(errors.displayName)}
                    {...register('displayName')}
                  />
                </div>
                {errors.displayName && (
                  <p className="text-xs text-red-600 font-medium">{errors.displayName.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber" required>
                  Phone / Mobile
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gold/70">
                    <Phone className="h-4 w-4" />
                  </div>
                  <Input
                    id="phoneNumber"
                    className="pl-9"
                    error={Boolean(errors.phoneNumber)}
                    {...register('phoneNumber')}
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="text-xs text-red-600 font-medium">{errors.phoneNumber.message}</p>
                )}
              </div>
            </div>

            {/* Email (Readonly with verification indicator) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="email">Registered Email Address</Label>
                <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Verified Client ID
                </span>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-charcoal/50">
                  <Mail className="h-4 w-4" />
                </div>
                <Input
                  id="email"
                  type="email"
                  readOnly
                  disabled
                  className="pl-9 bg-gray-50 text-brand-charcoal/70 cursor-not-allowed"
                  {...register('email')}
                />
              </div>
              <p className="text-[11px] text-brand-charcoal/60">
                To update your registered email address, please contact our gallery administration.
              </p>
            </div>

            {/* Address Book */}
            <div className="pt-4 border-t border-brand-gold/15 space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-brand-gold" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-espresso">
                  Primary Delivery & On-Site Installation Address
                </h3>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="street" required>
                    Flat / Building / Street
                  </Label>
                  <Input
                    id="street"
                    error={Boolean(errors.street)}
                    {...register('street')}
                  />
                  {errors.street && (
                    <p className="text-xs text-red-600 font-medium">{errors.street.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="landmark">Landmark</Label>
                    <Input id="landmark" {...register('landmark')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="city" required>
                      City
                    </Label>
                    <Input id="city" error={Boolean(errors.city)} {...register('city')} />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="pincode" required>
                      PIN Code
                    </Label>
                    <Input
                      id="pincode"
                      maxLength={6}
                      error={Boolean(errors.pincode)}
                      {...register('pincode')}
                    />
                    {errors.pincode && (
                      <p className="text-xs text-red-600 font-medium">{errors.pincode.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Consultation Preferences */}
            <div className="pt-4 border-t border-brand-gold/15 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-brand-burgundy" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-espresso">
                  Design & Tailoring Preferences
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="preferredStyle">Preferred Aesthetics</Label>
                  <Input
                    id="preferredStyle"
                    placeholder="e.g. Royal Classic, Modern Minimalist"
                    {...register('preferredStyle')}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="consultationNotes">Measurement Notes</Label>
                  <Input
                    id="consultationNotes"
                    placeholder="Specific requests for tailors and fitters"
                    {...register('consultationNotes')}
                  />
                </div>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex items-center justify-between bg-brand-pearl/40 py-4 px-6 rounded-b-card border-t border-brand-gold/15">
            <span className="text-xs text-brand-charcoal/60">
              {isDirty ? 'Unsaved modifications detected' : 'Profile up to date'}
            </span>

            <Button
              type="submit"
              variant="gold"
              disabled={saving}
              className="gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
