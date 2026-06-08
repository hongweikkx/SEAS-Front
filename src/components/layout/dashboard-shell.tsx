'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { GraduationCap, LogIn, LogOut, User } from 'lucide-react'
import { useState, useEffect } from 'react'

import { useExams } from '@/hooks/useAnalysis'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { isLoggedIn, logout } from '@/services/auth'
import { Button } from '@/components/ui/button'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isExamsList = pathname === '/exams'
  const isCreate = pathname === '/create'
  const examMatch = pathname.match(/^\/exams\/([^/]+)$/)
  const examId = examMatch?.[1]
  const { data: examsData } = useExams(1, 200)

  const examName = examId
    ? examsData?.exams?.find((exam) => String(exam.id) === examId)?.name ?? ''
    : ''

  const getPageTitle = () => {
    if (isHome) return '首页'
    if (isExamsList) return '分析列表'
    if (isCreate) return '新建分析'
    if (examId) return examName || '考试详情'
    return ''
  }

  return (
    <div className="relative min-h-svh bg-background">
      <AppSidebar />

      <div className="flex min-h-svh flex-col ml-[160px]">
        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-3">
            <div>
              {isHome ? (
                <span className="text-sm font-semibold text-foreground">智能学业分析系统</span>
              ) : (
                <Breadcrumb className="text-sm">
                  <BreadcrumbList>
                    <BreadcrumbItem>
                      <BreadcrumbLink asChild>
                        <Link href="/">首页</Link>
                      </BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator />
                    {!examId && (
                      <BreadcrumbItem>
                        <BreadcrumbPage>{getPageTitle()}</BreadcrumbPage>
                      </BreadcrumbItem>
                    )}
                    {examId && (
                      <>
                        <BreadcrumbItem>
                          <BreadcrumbLink asChild>
                            <Link href="/exams">分析列表</Link>
                          </BreadcrumbLink>
                        </BreadcrumbItem>
                        <BreadcrumbSeparator />
                        <BreadcrumbItem>
                          <BreadcrumbPage>{examName || '考试'}</BreadcrumbPage>
                        </BreadcrumbItem>
                      </>
                    )}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>
            <UserAuthSection />
          </div>
        </header>

        <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">
          {children}
        </main>

        <footer className="border-t border-border/40 py-4">
          <div className="mx-auto flex h-full items-center justify-center max-w-7xl px-6 text-xs text-muted-foreground">
            <span>© 2026 SEAS 智能学业分析系统</span>
            <span className="mx-2 opacity-40">|</span>
            <a
              href="https://beian.miit.gov.cn/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground transition-colors"
            >
              晋ICP备2026006377号
            </a>
          </div>
        </footer>
      </div>
    </div>
  )
}

function UserAuthSection() {
  const [loggedIn, setLoggedIn] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setLoggedIn(isLoggedIn())
  }, [])

  const handleLogout = async () => {
    await logout()
    setLoggedIn(false)
    window.location.reload()
  }

  if (!loggedIn) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 gap-1.5 rounded-lg text-xs"
        onClick={() => router.push('/login')}
      >
        <LogIn className="h-3.5 w-3.5" />
        登录
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1.5 rounded-lg text-xs text-muted-foreground hover:text-foreground"
      onClick={handleLogout}
    >
      <User className="h-3.5 w-3.5" />
      退出
    </Button>
  )
}
