import type { Metadata, Viewport } from 'next'
import { Inter, Cairo } from 'next/font/google'
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

// Runs before React hydrates — reads localStorage and sets data-theme/data-mode
// on <html> so there's no flash of wrong theme.
const themeScript = `(function(){
  var d=document.documentElement;
  try{
    var t=localStorage.getItem(${JSON.stringify(STORAGE_KEY)});
    var themes=${JSON.stringify(THEME_IDS)};
    d.dataset.theme=themes.indexOf(t)!==-1?t:${JSON.stringify(DEFAULT_THEME)};
    var m=localStorage.getItem(${JSON.stringify(MODE_STORAGE_KEY)});
    var modes=${JSON.stringify(MODES)};
    d.dataset.mode=modes.indexOf(m)!==-1?m:${JSON.stringify(DEFAULT_MODE)};
  }catch(_){
    d.dataset.theme=${JSON.stringify(DEFAULT_THEME)};
    d.dataset.mode=${JSON.stringify(DEFAULT_MODE)};
  }
})();`

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
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
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
