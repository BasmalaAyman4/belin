// middleware.js
import { NextResponse } from 'next/server';
import { withAuth } from "next-auth/middleware";
import { match } from '@formatjs/intl-localematcher';
import Negotiator from 'negotiator';
import { SECURITY_HEADERS } from '@/config/api.config';

// Configuration
const LOCALES = ['en', 'ar'];
const DEFAULT_LOCALE = 'en';

// Protected route patterns (require authentication)
const PROTECTED_PATTERNS = [
  /^\/[a-z]{2}\/checkout/,
  /^\/[a-z]{2}\/profile/,
  /^\/[a-z]{2}\/orders/,
  /^\/[a-z]{2}\/settings/,
  /^\/[a-z]{2}\/dashboard/,
];

// Public route patterns (no authentication required)
const PUBLIC_PATTERNS = [
  /^\/[a-z]{2}\/$/,
  /^\/[a-z]{2}\/about$/,
  /^\/[a-z]{2}\/contact$/,
  /^\/[a-z]{2}\/products/,
  /^\/[a-z]{2}\/categories/,
  /^\/[a-z]{2}\/search/,
  /^\/[a-z]{2}\/signin$/,
  /^\/api\/auth\//,
];

/**
 * Detect user's preferred locale from headers
 */
function getLocale(request) {
  const negotiatorHeaders = {};
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value));

  const languages = new Negotiator({ headers: negotiatorHeaders }).languages();
  return match(languages, LOCALES, DEFAULT_LOCALE);
}

/**
 * Check if path matches protected patterns
 */
function isProtectedPath(pathname) {
  return PROTECTED_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Check if path matches public patterns
 */
function isPublicPath(pathname) {
  return PUBLIC_PATTERNS.some(pattern => pattern.test(pathname));
}

/**
 * Extract locale from pathname
 */
function getLocaleFromPathname(pathname) {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  return match ? match[1] : null;
}

/**
 * Create localized URL
 */
function createLocalizedUrl(pathname, locale, baseUrl) {
  const cleanPath = pathname.startsWith(`/${locale}`)
    ? pathname
    : `/${locale}${pathname}`;
  return new URL(cleanPath, baseUrl);
}

/**
 * Add security headers to response
 */
function addSecurityHeaders(response) {
  const headers = process.env.NODE_ENV === 'production'
    ? SECURITY_HEADERS.PRODUCTION
    : SECURITY_HEADERS.DEVELOPMENT;

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

/**
 * Check if request is for static files
 */
function isStaticFile(pathname) {
  return (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  );
}

/**
 * Main middleware function
 */
export default withAuth(
  function middleware(request) {
    const { pathname, searchParams } = request.nextUrl;

    // Skip static files and Next.js internals
    if (isStaticFile(pathname)) {
      return NextResponse.next();
    }

    // Always allow NextAuth API routes
    if (pathname.startsWith('/api/auth/')) {
      return NextResponse.next();
    }

    // Handle i18n routing
    const pathnameHasLocale = LOCALES.some(
      (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
    );

    // Redirect to localized URL if needed
    if (!pathnameHasLocale) {
      const locale = getLocale(request);
      const redirectUrl = createLocalizedUrl(pathname, locale, request.url);

      if (searchParams.toString()) {
        redirectUrl.search = searchParams.toString();
      }

      const response = NextResponse.redirect(redirectUrl);
      return addSecurityHeaders(response);
    }

    const currentLocale = getLocaleFromPathname(pathname);

    // Check authentication status
    const sessionToken = request.cookies.get('next-auth.session-token') ||
      request.cookies.get('__Secure-next-auth.session-token');
    const isAuthenticated = !!sessionToken;

    // Redirect unauthenticated users from protected routes
    if (isProtectedPath(pathname) && !isAuthenticated) {
      const signinUrl = createLocalizedUrl('/signin', currentLocale, request.url);
      signinUrl.searchParams.set('callbackUrl', pathname);

      const response = NextResponse.redirect(signinUrl);
      return addSecurityHeaders(response);
    }

    // Redirect authenticated users away from signin page
    const isSigninPage = pathname.includes('/signin');
    if (isSigninPage && isAuthenticated) {
      const callbackUrl = searchParams.get('callbackUrl');
      const redirectUrl = callbackUrl
        ? createLocalizedUrl(callbackUrl, currentLocale, request.url)
        : createLocalizedUrl('/', currentLocale, request.url);

      const response = NextResponse.redirect(redirectUrl);
      return addSecurityHeaders(response);
    }

    // Continue with security headers
    const response = NextResponse.next();
    return addSecurityHeaders(response);
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Always allow public routes and auth routes
        if (isPublicPath(pathname) || pathname.startsWith('/api/auth/')) {
          return true;
        }

        // Require token for protected API routes
        if (pathname.startsWith('/api/protected/')) {
          return !!token;
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.json|.*\\..*).*)',
  ]
};