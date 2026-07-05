'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { usePathname } from 'next/navigation'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname() // returns /ar/dashboard

  const switchLocale = (nextLocale: string) => {
    if (nextLocale === locale) return

    // Strip current locale prefix → /dashboard
    const locales = routing.locales as readonly string[]
    let strippedPath = pathname
    for (const l of locales) {
      if (strippedPath.startsWith(`/${l}/`)) {
        strippedPath = strippedPath.slice(`/${l}`.length)
        break
      } else if (strippedPath === `/${l}`) {
        strippedPath = '/'
        break
      }
    }

    // Build new path with next locale prefix
    router.push(`/${nextLocale}${strippedPath}`)
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-1">
      {(routing.locales as readonly string[]).map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`rounded px-2 py-0.5 text-sm font-medium transition-colors ${
            locale === loc
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label={loc === 'ar' ? 'Switch to Arabic' : 'Switch to English'}
        >
          {loc === 'ar' ? 'ع' : 'EN'}
        </button>
      ))}
    </div>
  )
}
