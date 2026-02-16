import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimiter, RATE_LIMIT_CONFIGS } from './lib/security/rate-limiter';
import { analyzeRequest } from './lib/security/bot-detection';

/**
 * Security headers to protect against common attacks
 */
const SECURITY_HEADERS = {
  // Prevent clickjacking
  'X-Frame-Options': 'SAMEORIGIN',
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  // XSS protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Permissions policy (disable unused APIs)
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
  // Content Security Policy - restrictive but allows app functionality
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js requires these
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://img.youtube.com https://i.ytimg.com https://*.googleusercontent.com",
    "media-src 'self' https://www.youtube.com",
    "frame-src 'self' https://www.youtube.com",
    "connect-src 'self' https://www.youtube.com https://noembed.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ].join('; '),
};

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(request: NextRequest): string {
  // Try to get real IP from various headers (in order of priority)
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  const cfConnectingIP = request.headers.get('cf-connecting-ip');

  // Use first IP from x-forwarded-for if available
  if (forwardedFor) {
    const ips = forwardedFor.split(',').map((ip) => ip.trim());
    return ips[0];
  }

  // Fallback to other headers or a default
  return cfConnectingIP || realIP || 'unknown';
}

/**
 * Determine rate limit config based on request
 */
function getRateLimitConfig(pathname: string, method: string) {
  // Search endpoints - most strict
  if (pathname.includes('/youtube/search')) {
    return RATE_LIMIT_CONFIGS.search;
  }

  // Write operations - stricter
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    return RATE_LIMIT_CONFIGS.write;
  }

  // Default API rate limit
  return RATE_LIMIT_CONFIGS.api;
}

/**
 * Create a blocked response with proper headers
 */
function createBlockedResponse(
  message: string,
  status: number,
  headers?: Record<string, string>
): NextResponse {
  const response = NextResponse.json(
    { error: message },
    { status }
  );

  // Add security headers
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  // Add custom headers
  if (headers) {
    Object.entries(headers).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
  }

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const method = request.method;
  const userAgent = request.headers.get('user-agent');
  const clientIP = getClientIdentifier(request);

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') && !pathname.startsWith('/api')
  ) {
    return NextResponse.next();
  }

  // === BOT DETECTION ===
  const botAnalysis = analyzeRequest(
    userAgent,
    pathname,
    search.slice(1), // Remove leading '?'
    method
  );

  // Block highly suspicious requests
  if (botAnalysis.isMalicious) {
    console.warn(`[SECURITY] Blocked malicious request from ${clientIP}: ${botAnalysis.reason}`);
    return createBlockedResponse('Forbidden', 403);
  }

  // === RATE LIMITING (API only) ===
  if (pathname.startsWith('/api')) {
    const config = getRateLimitConfig(pathname, method);
    const rateLimitKey = `${clientIP}:${method}:${pathname.split('/').slice(0, 4).join('/')}`;
    const result = rateLimiter.check(rateLimitKey, config);

    if (!result.allowed) {
      console.warn(`[SECURITY] Rate limited ${clientIP} on ${pathname}`);
      return createBlockedResponse(
        result.blocked
          ? 'Too many requests. Please try again later.'
          : 'Rate limit exceeded',
        429,
        {
          'Retry-After': Math.ceil(result.resetIn / 1000).toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(Date.now() / 1000 + result.resetIn / 1000).toString(),
        }
      );
    }

    // Add rate limit headers to response
    const response = NextResponse.next();

    // Add security headers
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    // Add rate limit info headers
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
    response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + result.resetIn / 1000).toString());

    return response;
  }

  // === SECURITY HEADERS for non-API requests ===
  const response = NextResponse.next();

  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

// Configure which paths the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
