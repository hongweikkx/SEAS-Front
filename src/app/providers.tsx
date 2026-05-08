'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { ReactNode, useState, useEffect } from 'react'
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

  // 登录态检查：非登录页且无 token 则重定向到登录页
  useEffect(() => {
    if (isLogin) return
    if (typeof window === 'undefined') return

    const token = localStorage.getItem('token')
    if (!token) {
      window.location.href = '/login'
    }
  }, [isLogin])

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
