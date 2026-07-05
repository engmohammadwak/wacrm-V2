import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

export async function middleware(request: NextRequest) {
  // ── 1. i18n: detect locale and redirect if needed ──────────────────
  // Skip i18n for API routes and static files
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')
  const isStaticFile = /\.(.+)$/.test(pathname)

  if (!isApiRoute && !isStaticFile) {
    const intlResponse = intlMiddleware(request)
    // If intl wants to redirect (e.g. /dashboard → /en/dashboard), honour it
    if (intlResponse.status !== 200) return intlResponse
  }

  // ── 2. Supabase auth ───────────────────────────────────────────────
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const withRefreshedCookies = <T extends NextResponse>(response: T): T => {
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      response.cookies.set(cookie)
    })
    return response
  }

  // Helper: strip locale prefix to get the clean pathname
  // e.g. /ar/dashboard → /dashboard
  const locales = routing.locales as readonly string[]
  const pathnameWithoutLocale = locales.reduce(
    (p, locale) => p.replace(new RegExp(`^/${locale}`), '') || '/',
    pathname
  )

  // Auth pages — redirect to dashboard if already logged in
  const authPages = ['/login', '/signup', '/forgot-password']
  if (user && authPages.includes(pathnameWithoutLocale)) {
    const url = request.nextUrl.clone()
    const inviteToken = request.nextUrl.searchParams.get('invite')
    const locale = pathname.split('/')[1]
    const localePrefix = locales.includes(locale) ? `/${locale}` : ''
    if (inviteToken && ['/login', '/signup'].includes(pathnameWithoutLocale)) {
      url.pathname = `${localePrefix}/join/${encodeURIComponent(inviteToken)}`
      url.search = ''
    } else {
      url.pathname = `${localePrefix}/dashboard`
      url.search = ''
    }
    return withRefreshedCookies(NextResponse.redirect(url))
  }

  // Protected pages — redirect to login if not authenticated
  const protectedPaths = ['/dashboard', '/inbox', '/contacts', '/pipelines', '/broadcasts', '/automations', '/settings']
  if (!user && protectedPaths.some(p => pathnameWithoutLocale.startsWith(p))) {
    const url = request.nextUrl.clone()
    const locale = pathname.split('/')[1]
    const localePrefix = locales.includes(locale) ? `/${locale}` : ''
    url.pathname = `${localePrefix}/login`
    return withRefreshedCookies(NextResponse.redirect(url))
  }

  // API routes that need auth (not webhooks)
  if (!user && pathname.startsWith('/api/whatsapp/') &&
      !pathname.includes('/webhook')) {
    return withRefreshedCookies(
      NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    )
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
