'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, User, Mail, Phone, MapPin, Lock, ArrowRight, Home } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const registerSchema = z
  .object({
    name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
    phone: z
      .string()
      .min(10, 'Phone must be at least 10 digits')
      .regex(/^[0-9+\s-]{10,15}$/, 'Please enter a valid phone number'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    street: z.string().min(3, 'Address / Street is required'),
    landmark: z.string().optional(),
    city: z.string().min(2, 'City is required').default('Mumbai'),
    pincode: z
      .string()
      .regex(/^[1-9][0-9]{5}$/, 'Please enter a valid 6-digit Indian PIN code')
      .default('400058'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerAuth, error: authError, clearError, isLoading, user } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // If already authenticated, redirect to dashboard or admin
  React.useEffect(() => {
    if (user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      street: '',
      landmark: '',
      city: 'Mumbai',
      pincode: '400058',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setErrorMessage(null);
    clearError();
    setSubmitting(true);
    try {
      await registerAuth(
        data.name,
        data.email,
        data.password,
        data.phone,
        {
          street: data.street,
          landmark: data.landmark || undefined,
          city: data.city,
          state: 'Maharashtra',
          pincode: data.pincode,
          country: 'India',
        }
      );
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-fabric-pattern flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-lg text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-brand-gold hover:text-brand-gold-dark transition-colors mb-3"
        >
          <Home className="w-3.5 h-3.5" /> Return to Showroom Storefront
        </Link>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-0.5 w-8 bg-brand-gold/60" />
          <span className="font-accent italic text-brand-gold text-lg">Bespoke Furnishings</span>
          <div className="h-0.5 w-8 bg-brand-gold/60" />
        </div>
        <h1 className="font-display text-3xl font-bold text-brand-espresso tracking-tight">
          Create Client Account
        </h1>
        <p className="font-accent italic text-sm text-brand-espresso/80 mt-1">
          Track tailored orders, schedule home measurements, and download GST invoices
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Card className="border border-brand-gold/30 shadow-elevated bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-brand-espresso">Client Registration</CardTitle>
            <CardDescription className="text-brand-charcoal/70">
              Personalized customer portal for Mumbai residences and corporate spaces
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Error Message */}
            {(errorMessage || authError) && (
              <div
                role="alert"
                className="rounded-soft bg-red-50 border border-red-300 p-3.5 text-xs text-red-800 flex items-start gap-2.5 animate-in fade-in"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-red-600 mt-1.5 shrink-0" />
                <span className="font-medium">{errorMessage || authError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <Label htmlFor="name" required>
                  Full Name
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gold/70">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="name"
                    placeholder="e.g. Mrs. Sunita Mehta"
                    className="pl-9"
                    error={Boolean(errors.name)}
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-xs text-red-600 font-medium">{errors.name.message}</p>
                )}
              </div>

              {/* Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="email" required>
                    Email Address
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gold/70">
                      <Mail className="h-4 w-4" />
                    </div>
                    <Input
                      id="email"
                      type="email"
                      placeholder="client@example.com"
                      className="pl-9"
                      error={Boolean(errors.email)}
                      {...register('email')}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" required>
                    Phone / Mobile
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gold/70">
                      <Phone className="h-4 w-4" />
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="98200 12345"
                      className="pl-9"
                      error={Boolean(errors.phone)}
                      {...register('phone')}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-600 font-medium">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label htmlFor="password" required>
                    Password
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gold/70">
                      <Lock className="h-4 w-4" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Min 6 characters"
                      className="pl-9 pr-9"
                      error={Boolean(errors.password)}
                      {...register('password')}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-charcoal/50 hover:text-brand-espresso"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword" required>
                    Confirm Password
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Re-enter password"
                    error={Boolean(errors.confirmPassword)}
                    {...register('confirmPassword')}
                  />
                  {errors.confirmPassword && (
                    <p className="text-xs text-red-600 font-medium">{errors.confirmPassword.message}</p>
                  )}
                </div>
              </div>

              {/* Delivery Address Section */}
              <div className="pt-2 border-t border-brand-gold/20">
                <div className="flex items-center gap-2 mb-2 text-xs font-semibold text-brand-gold uppercase tracking-wider">
                  <MapPin className="w-3.5 h-3.5" /> Mumbai Delivery & Installation Address
                </div>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="street" required>
                      Flat / Building & Street
                    </Label>
                    <Input
                      id="street"
                      placeholder="e.g. Flat 1204, Sea Green Apartments, Lokhandwala"
                      error={Boolean(errors.street)}
                      {...register('street')}
                    />
                    {errors.street && (
                      <p className="text-xs text-red-600 font-medium">{errors.street.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <Label htmlFor="landmark">Landmark (Optional)</Label>
                      <Input
                        id="landmark"
                        placeholder="Near Cafe Arfa"
                        {...register('landmark')}
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="city" required>
                        City
                      </Label>
                      <Input
                        id="city"
                        defaultValue="Mumbai"
                        error={Boolean(errors.city)}
                        {...register('city')}
                      />
                      {errors.city && (
                        <p className="text-xs text-red-600 font-medium">{errors.city.message}</p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="pincode" required>
                        PIN Code
                      </Label>
                      <Input
                        id="pincode"
                        placeholder="400058"
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

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full h-11 text-base mt-3 shadow-md hover:shadow-gold"
              >
                {submitting || isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-brand-ivory border-t-transparent rounded-full animate-spin" />
                    Creating Your Account...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 font-medium">
                    Register Client Account <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>

          <CardFooter className="flex flex-col space-y-2 bg-brand-pearl/50 py-4 text-center rounded-b-card">
            <p className="text-xs text-brand-charcoal">
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-semibold text-brand-gold hover:text-brand-gold-dark hover:underline"
              >
                Sign In
              </Link>
            </p>
            <p className="text-[11px] text-brand-charcoal/60">
              By registering, you agree to receive order status updates and consultation reminders.
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
