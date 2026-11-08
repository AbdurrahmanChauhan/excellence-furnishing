import { NextRequest, NextResponse } from 'next/server';

/**
 * Next.js Edge Middleware for Role-Based Access Control (RBAC).
 *
 * Rules:
 * 1. Static assets & Next internals bypass middleware.
 * 2. Public storefront pages (/, /products/*, /about, /contact, /gallery) are accessible without auth.
 * 3. /admin/* is strictly restricted to role === 'admin'.
 *    - Unauthenticated -> redirect to /login?redirect=...
 *    - Non-admin (role === 'user') -> redirect to /dashboard
 * 4. /dashboard/* requires any authenticated user.
 *    - Unauthenticated -> redirect to /login?redirect=...
 * 5. Visiting /login or /register while authenticated redirects:
 *    - admin -> /admin
 *    - user -> /dashboard
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, Next.js internals, and files with extensions
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    pathname === '/favicon.ico' ||
    /\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|txt|xml)$/i.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Session detection via cookies
  const sessionCookie =
    request.cookies.get('session')?.value || request.cookies.get('ef_session')?.value;
  const roleCookie =
    request.cookies.get('user_role')?.value || request.cookies.get('ef_role')?.value;

  const isAuthenticated = Boolean(sessionCookie);
  const isAdmin = isAuthenticated && roleCookie === 'admin';

  // 2. Auth routes: /login and /register
  const isAuthPage = pathname === '/login' || pathname === '/register';
  if (isAuthPage && isAuthenticated) {
    const targetUrl = isAdmin ? new URL('/admin', request.url) : new URL('/dashboard', request.url);
    return NextResponse.redirect(targetUrl);
  }

  // 3. Admin routes: /admin and /admin/*
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    if (!isAdmin) {
      // Non-admin authenticated user trying to access admin panel -> redirect to user portal
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
  }

  // 4. Dashboard routes: /dashboard and /dashboard/*
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // 5. All other routes are public
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
