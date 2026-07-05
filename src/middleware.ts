import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from './i18n/routing'

const intlMiddleware = createIntlMiddleware(routing)

const locales = routing.locales as readonly string[]

function stripLocale(pathname: string) {
  return (
    locales.reduce(
      (p, locale) => p.replace(new RegExp(`^/${locale}(?=/|$)`), '') || '/',
      pathname
    )
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isApiRoute = pathname.startsWith('/api/')
  const isStaticFile = /\.(.+)$/.test(pathname)

  // ── 1. i18n middleware (skip API & static files) ─────────────────────
  let intlResponse: NextResponse | null = null
  if (!isApiRoute && !isStaticFile) {
    intlResponse = intlMiddleware(request) as NextResponse
    // If intl wants to redirect (e.g. / → /en) honour it immediately
    if (intlResponse.status !== 200) return intlResponse
  }

  // ── 2. Supabase auth ───────────────────────────────────────────────
  // Start from intlResponse so its cookies/headers are preserved
  let supabaseResponse = intlResponse
    ? NextResponse.next({ request, headers: intlResponse.headers })
    : NextResponse.next({ request })

  // Copy cookies set by intl (NEXT_LOCALE etc.) into supabaseResponse
  if (intlResponse) {
    intlResponse.cookies.getAll().forEach((c) =>
      supabaseResponse.cookies.set(c)
    )
  }

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
          const next = intlResponse
            ? NextResponse.next({ request, headers: intlResponse.headers })
            : NextResponse.next({ request })
          if (intlResponse) {
            intlResponse.cookies.getAll().forEach((c) => next.cookies.set(c))
          }
          cookiesToSet.forEach(({ name, value, options }) =>
            next.cookies.set(name, value, options)
          )
          supabaseResponse = next
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

  const pathnameWithoutLocale = stripLocale(pathname)
  const currentLocale = locales.includes(pathname.split('/')[1])
    ? pathname.split('/')[1]
    : routing.defaultLocale
  const localePrefix = `/${currentLocale}`

  // Auth pages — redirect to dashboard if already logged in
  const authPages = ['/login', '/signup', '/forgot-password']
  if (user && authPages.includes(pathnameWithoutLocale)) {
    const url = request.nextUrl.clone()
    const inviteToken = request.nextUrl.searchParams.get('invite')
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
