'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Bell, GraduationCap } from 'lucide-react'

import { useExams } from '@/hooks/useAnalysis'
import { AppSidebar } from '@/components/layout/app-sidebar'
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
    ? examsData?.exams.find((exam) => String(exam.id) === examId)?.name ?? ''
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
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <GraduationCap className="h-[18px] w-[18px] text-primary" />
                  <span className="font-semibold text-foreground">SEAS</span>
                  <span className="text-border">|</span>
                  <span>智能学业分析系统</span>
                </div>
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
            <div className="flex items-center gap-3">
              <button className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
                <Bell className="h-5 w-5" />
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
              </button>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                智
              </div>
            </div>
          </div>
        </header>

        <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-6 py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
