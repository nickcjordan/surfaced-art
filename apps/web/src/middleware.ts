import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Middleware to protect /dashboard routes.
 * Checks for a cognito-id-token cookie — if missing, redirects to /sign-in.
 *
 * Note: This is a client-side guard only. The actual JWT validation happens
 * on the API side via the auth middleware. This prevents unauthenticated
 * users from seeing the dashboard skeleton before the API rejects them.
 */
export function middleware(request: NextRequest) {
  const token = request.cookies.get('cognito-id-token')

  if (!token) {
    const signInUrl = new URL('/sign-in', request.url)
    signInUrl.searchParams.set('redirect', request.nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
