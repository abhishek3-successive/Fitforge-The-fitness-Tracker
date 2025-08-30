import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define paths that require authentication
const protectedPaths = ['/dashboard', '/exercises', '/workouts', '/workout-plans', '/schedule', '/progress', '/challenges', '/profile'];

// Define paths that should redirect authenticated users
const authPaths = ['/auth/login', '/auth/register'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get token from cookies or headers
  const token = request.cookies.get('accessToken')?.value || 
                request.headers.get('authorization')?.replace('Bearer ', '');

  const isAuthenticated = !!token;

  // Handle protected paths
  if (protectedPaths.some(path => pathname.startsWith(path))) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Handle auth paths (redirect if already authenticated)
  if (authPaths.some(path => pathname.startsWith(path))) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // Handle root path
  if (pathname === '/') {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

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
