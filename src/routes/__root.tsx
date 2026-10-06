import type { ReactNode } from 'react'
import { HeadContent, Outlet, Scripts, createRootRouteWithContext, useRouterState } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import appCss from '~/styles.css?url'
import { Header } from '~/components/layout/Header'
import { Footer } from '~/components/layout/Footer'
import { PageTransition } from '~/components/layout/PageTransition'
import { Nebula, Starfield } from '~/components/space/Starfield'
import { IntroOverlay, introSkipScript, useIntroReplayKey } from '~/components/space/IntroOverlay'
import { Toaster } from '~/components/ui/Toast'
import { pageHead } from '~/lib/seo'

const FAVICON =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 120 120'%3E%3Ccircle cx='60' cy='60' r='57' fill='%2302040b'/%3E%3Ccircle cx='60' cy='60' r='52' fill='none' stroke='%235aa9ff' stroke-width='5'/%3E%3Cpath d='M78 42A18 18 0 1 0 60 60A18 18 0 1 1 42 78' fill='none' stroke='%233fdcff' stroke-width='7' stroke-linecap='round'/%3E%3Ccircle cx='60' cy='60' r='5' fill='%23eef3ff'/%3E%3C/svg%3E"

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => {
    const base = pageHead(undefined, 'מסעות פרטיים אל הירח, מאדים ושבתאי. תכנון מדויק, אירוח יוצא דופן והוד שאין לו קצה.')
    return {
      meta: [
        { charSet: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        ...base.meta,
      ],
      links: [
        { rel: 'stylesheet', href: appCss },
        { rel: 'icon', href: FAVICON },
      ],
      scripts: [{ children: introSkipScript }],
    }
  },
  component: RootComponent,
})

function RootComponent() {
  const { queryClient } = Route.useRouteContext()
  return (
    <RootDocument>
      <QueryClientProvider client={queryClient}>
        <Shell />
      </QueryClientProvider>
    </RootDocument>
  )
}

function Shell() {
  const isHome = useRouterState({ select: (s) => s.location.pathname === '/' })
  const introKey = useIntroReplayKey()
  return (
    <>
      <Nebula />
      <Starfield />
      <a
        href="#main"
        className="fixed start-4 top-3 z-[70] -translate-y-24 rounded-full bg-primary px-5 py-3 font-medium text-primary-foreground transition focus:translate-y-0"
      >
        דילוג לתוכן הראשי
      </a>
      <Header />
      <main id="main" tabIndex={-1} className="overflow-x-clip outline-none">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>
      <Footer />
      <Toaster />
      {isHome && <IntroOverlay key={introKey} />}
    </>
  )
}

function RootDocument({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
