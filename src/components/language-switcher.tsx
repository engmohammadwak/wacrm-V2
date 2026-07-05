'use client'

import { useLocale } from 'next-intl'
import { routing } from '@/i18n/routing'

const locales = routing.locales as readonly string[]

export function LanguageSwitcher() {
  const locale = useLocale()

  const switchLocale = (nextLocale: string) => {
    if (nextLocale === locale) return

    // Get current path from browser, strip the locale prefix, attach new one
    const path = window.location.pathname
    let stripped = path
    for (const l of locales) {
      if (path.startsWith(`/${l}/`)) {
        stripped = path.slice(`/${l}`.length)
        break
      } else if (path === `/${l}`) {
        stripped = '/'
        break
      }
    }

    window.location.href = `/${nextLocale}${stripped}${window.location.search}`
  }

  return (
    <div className="flex items-center gap-1 rounded-md border border-border p-1">
      {locales.map((loc) => (
        <button
          key={loc}
          onClick={() => switchLocale(loc)}
          className={`rounded px-2 py-0.5 text-sm font-medium transition-colors ${
            locale === loc
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground'
          }`}
          aria-label={loc === 'ar' ? 'تحويل إلى العربية' : 'Switch to English'}
        >
          {loc === 'ar' ? 'ع' : 'EN'}
        </button>
      ))}
    </div>
  )
}
