'use client'

import { useLocale } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { routing } from '@/i18n/routing'

export function LanguageSwitcher() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()

  const switchLocale = (nextLocale: string) => {
    // Replace current locale prefix in the path
    const locales = routing.locales as readonly string[]
    const currentPrefix = `/${locale}`
    const nextPath = locales.some(l => pathname.startsWith(`/${l}`))
      ? pathname.replace(currentPrefix, `/${nextLocale}`)
      : `/${nextLocale}${pathname}`

    router.push(nextPath)
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
