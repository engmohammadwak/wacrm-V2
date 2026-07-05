import type { Metadata, Viewport } from 'next'
import { Inter, Cairo } from 'next/font/google'
import Script from 'next/script'
import '../globals.css'
import { ThemeProvider } from '@/hooks/use-theme'
import { ThemedToaster } from '@/components/themed-toaster'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { routing } from '@/i18n/routing'
import {
  DEFAULT_MODE,
  DEFAULT_THEME,
  MODE_STORAGE_KEY,
  MODES,
  STORAGE_KEY,
  THEME_IDS,
} from '@/lib/themes'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

const cairo = Cairo({
  variable: '--font-arabic',
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: { default: 'wacrm', template: '%s — wacrm' },
  description: 'Self-hostable CRM template for WhatsApp.',
  robots: { index: false, follow: false },
  icons: { icon: [{ url: '/icon' }] },
  formatDetection: { email: false, address: false, telephone: false },
}

export const viewport: Viewport = {
  themeColor: '#020617',
  colorScheme: 'dark light',
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

const THEME_BOOT_SCRIPT = `
(function(){
  var d = document.documentElement;
  try {
    var THEME_KEY = ${JSON.stringify(STORAGE_KEY)};
    var THEME_DEFAULT = ${JSON.stringify(DEFAULT_THEME)};
    var THEMES = ${JSON.stringify(THEME_IDS)};
    var savedTheme = localStorage.getItem(THEME_KEY);
    d.dataset.theme = THEMES.indexOf(savedTheme) !== -1 ? savedTheme : THEME_DEFAULT;
    var MODE_KEY = ${JSON.stringify(MODE_STORAGE_KEY)};
    var MODE_DEFAULT = ${JSON.stringify(DEFAULT_MODE)};
    var MODES_LIST = ${JSON.stringify(MODES)};
    var savedMode = localStorage.getItem(MODE_KEY);
    d.dataset.mode = MODES_LIST.indexOf(savedMode) !== -1 ? savedMode : MODE_DEFAULT;
  } catch (_e) {
    d.dataset.theme = ${JSON.stringify(DEFAULT_THEME)};
    d.dataset.mode = ${JSON.stringify(DEFAULT_MODE)};
  }
})();
`

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const messages = await getMessages()
  const isRTL = locale === 'ar'

  return (
    <html
      lang={locale}
      dir={isRTL ? 'rtl' : 'ltr'}
      data-theme={DEFAULT_THEME}
      data-mode={DEFAULT_MODE}
      className={`${isRTL ? cairo.variable : inter.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script
          id="theme-boot"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }}
        />
      </head>
      <body className={`min-h-full bg-background text-foreground ${isRTL ? 'font-arabic' : 'font-sans'}`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider>
            {children}
            <ThemedToaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
