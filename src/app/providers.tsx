'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { ReactNode, useState } from 'react'
import { usePathname } from 'next/navigation'

import { DashboardShell } from '@/components/layout/dashboard-shell'
import { TooltipProvider } from '@/components/ui/tooltip'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            retry: 1,
          },
        },
      })
  )
  const pathname = usePathname()
  const isLogin = pathname === '/login'

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          {isLogin ? children : <DashboardShell>{children}</DashboardShell>}
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
