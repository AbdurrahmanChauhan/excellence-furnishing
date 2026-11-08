'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ShieldCheck, Sparkles, User, Lock, ArrowRight, Home } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  const { login, error: authError, clearError, isLoading, user } = useAuthStore();
  const [showPassword, setShowPassword] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // If already authenticated, redirect
  React.useEffect(() => {
    if (user) {
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    }
  }, [user, redirectUrl, router]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    clearError();
    setSubmitting(true);
    try {
      const authUser = await login(data.email, data.password);
      if (redirectUrl) {
        router.push(redirectUrl);
      } else if (authUser.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Invalid credentials. Please try again.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = (email: string, pass: string) => {
    setValue('email', email, { shouldValidate: true });
    setValue('password', pass, { shouldValidate: true });
    setErrorMessage(null);
    clearError();
    // Auto-submit after small tick
    setTimeout(() => {
      onSubmit({ email, password: pass });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-fabric-pattern flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-brand-gold hover:text-brand-gold-dark transition-colors mb-3"
        >
          <Home className="w-3.5 h-3.5" /> Return to Showroom Storefront
        </Link>
        <div className="flex items-center justify-center gap-2 mb-2">
          <div className="h-0.5 w-8 bg-brand-gold/60" />
          <span className="font-accent italic text-brand-gold text-lg">Est. 2003 · Andheri West</span>
          <div className="h-0.5 w-8 bg-brand-gold/60" />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-espresso tracking-tight">
          Excellence
        </h1>
        <p className="font-accent italic text-base text-brand-espresso/80 mt-1">
          The Furnishing Gallery
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card className="border border-brand-gold/30 shadow-elevated bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl text-brand-espresso">Sign In to Your Account</CardTitle>
            <CardDescription className="text-brand-charcoal/70">
              Access your bespoke orders, milestone progress, and tax invoices
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
              {/* Email */}
              <div className="space-y-1.5">
                <Label htmlFor="email" required>
                  Email Address
                </Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gold/70">
                    <User className="h-4 w-4" />
                  </div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    className="pl-9"
                    error={Boolean(errors.email)}
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 font-medium">{errors.email.message}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" required>
                    Password
                  </Label>
                  <span className="text-[11px] text-brand-charcoal/60">
                    Case sensitive
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gold/70">
                    <Lock className="h-4 w-4" />
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="pl-9 pr-10"
                    error={Boolean(errors.password)}
                    {...register('password')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-brand-charcoal/50 hover:text-brand-espresso"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-600 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                disabled={submitting || isLoading}
                className="w-full h-11 text-base mt-2 shadow-md hover:shadow-gold"
              >
                {submitting || isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-brand-ivory border-t-transparent rounded-full animate-spin" />
                    Signing In...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2 font-medium">
                    Sign In <ArrowRight className="w-4 h-4" />
                  </span>
                )}
              </Button>
            </form>

            {/* Quick Demo Logins for Evaluation */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-brand-gold/20" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-brand-charcoal/60 font-medium">
                  Instant Demo Access
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('admin@excellencefurnishing.com', 'Admin@123')}
                disabled={submitting || isLoading}
                className="flex items-center justify-center gap-2 border-brand-gold/40 hover:bg-brand-gold/10 text-xs py-2 h-auto"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-brand-gold" />
                <div className="text-left">
                  <div className="font-semibold text-brand-espresso">Demo Admin</div>
                  <div className="text-[10px] text-brand-charcoal/60">Mr. Altaf Chauhan</div>
                </div>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleDemoLogin('customer@excellencefurnishing.com', 'Customer@123')}
                disabled={submitting || isLoading}
                className="flex items-center justify-center gap-2 border-brand-gold/40 hover:bg-brand-gold/10 text-xs py-2 h-auto"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-burgundy" />
                <div className="text-left">
                  <div className="font-semibold text-brand-espresso">Demo Customer</div>
                  <div className="text-[10px] text-brand-charcoal/60">Priya Sharma</div>
                </div>
              </Button>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-3 bg-brand-pearl/50 py-4 text-center rounded-b-card">
            <p className="text-xs text-brand-charcoal">
              New client to Excellence Furnishing?{' '}
              <Link
                href="/register"
                className="font-semibold text-brand-gold hover:text-brand-gold-dark hover:underline"
              >
                Create an account
              </Link>
            </p>
            <p className="text-[11px] text-brand-charcoal/60">
              Need assistance? Call our Andheri West gallery at +91 98200 XXXXX
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-fabric-pattern flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </React.Suspense>
  );
}
