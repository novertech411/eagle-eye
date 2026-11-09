import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/dashboard', '/examination', '/results', '/history', '/settings']

function isProtected(pathname: string) {
  return PROTECTED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request })
  // Supabase only passes these on the first cookie write, so keep them for any later rebuild.
  let cacheHeaders: Record<string, string> = {}

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cacheHeaders = { ...cacheHeaders, ...headers }
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
          Object.entries(cacheHeaders).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    },
  )

  // getUser() verifies the session with Supabase and refreshes it if it has expired.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl
  // A signed-in user has no reason to see the login page.
  const target = !user && isProtected(pathname) ? '/login' : user && pathname === '/login' ? '/dashboard' : null

  if (target) {
    const redirect = NextResponse.redirect(new URL(target, request.url))
    // Keep any cookie changes, such as clearing a session that is no longer valid.
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    Object.entries(cacheHeaders).forEach(([key, value]) => redirect.headers.set(key, value))
    return redirect
  }

  return response
}

export const config = {
  // Skip Next.js build assets and static images.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
