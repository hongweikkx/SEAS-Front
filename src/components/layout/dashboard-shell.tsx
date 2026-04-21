'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { usePathname } from 'next/navigation'
import { MessageSquareDashed } from 'lucide-react'

import ChatPanel from '@/components/chat/ChatPanel'
import { useExams } from '@/hooks/useAnalysis'
import { ModeToggle } from '@/components/layout/mode-toggle'
import { useAnalysisStore } from '@/store/analysisStore'
import { AppSidebar } from '@/components/layout/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === '/'
  const isExamsList = pathname === '/exams'
  const isCreate = pathname === '/create'
  const examMatch = pathname.match(/^\/exams\/([^/]+)$/)
  const examId = examMatch?.[1]
  const { data: examsData } = useExams(1, 200)
  const {
    sidebarCollapsed,
    setSelectedExamId,
    setSelectedExamName,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
  } = useAnalysisStore()

  const [drawerWidth, setDrawerWidth] = useState(() => {
    if (typeof window === 'undefined') return 0
    const savedWidth = window.localStorage.getItem('seas-analysis-drawer-width')
    const parsedWidth = savedWidth ? Number(savedWidth) : NaN
    if (Number.isFinite(parsedWidth) && parsedWidth > 0) return parsedWidth
    return Math.round(window.innerWidth * 0.72)
  })
  const isDraggingRef = useRef(false)
  const examName = examId
    ? examsData?.exams.find((exam) => String(exam.id) === examId)?.name ?? ''
    : ''

  useEffect(() => {
    if (!examId || !examName) return
    setSelectedExamId(examId)
    setSelectedExamName(examName)
    setSelectedScope('all_subjects')
    setSelectedSubjectId(null)
    setSelectedSubjectName(null)
  }, [examId, examName, setSelectedExamId, setSelectedExamName, setSelectedScope, setSelectedSubjectId, setSelectedSubjectName])

  useEffect(() => {
    if (drawerWidth <= 0) return
    window.localStorage.setItem('seas-analysis-drawer-width', String(drawerWidth))
  }, [drawerWidth])

  useEffect(() => {
    const minWidth = 480
    const clampWidth = (value: number) => {
      const maxWidth = Math.max(minWidth, Math.round(window.innerWidth * 0.9))
      return Math.min(Math.max(value, minWidth), maxWidth)
    }
    const handlePointerMove = (event: PointerEvent) => {
      if (!isDraggingRef.current) return
      setDrawerWidth(clampWidth(window.innerWidth - event.clientX))
    }
    const handlePointerUp = () => {
      isDraggingRef.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    window.addEventListener('pointercancel', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
      window.removeEventListener('pointercancel', handlePointerUp)
    }
  }, [])

  function startDrawerResize(event: ReactPointerEvent<HTMLDivElement>) {
    event.preventDefault()
    isDraggingRef.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
  }

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

      <div
        className={cn(
          'flex min-h-svh flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-[3.5rem]' : 'ml-[15rem]'
        )}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.96_0.03_260),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.22_0.05_265),transparent_45%)]" />

        <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-6">
            <div>
              {isHome ? (
                <>
                  <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-2xl">
                    SEAS 学生成绩分析系统
                  </h1>
                  <p className="text-sm text-muted-foreground md:text-base">
                    基于 Agent 架构的"诊断-检索-干预"自动化教学中枢
                  </p>
                </>
              ) : (
                <Breadcrumb className="text-sm md:text-base">
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
            <div className="flex items-center gap-2">
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" className="rounded-full bg-background/80">
                    <MessageSquareDashed className="h-4 w-4" />
                    分析助手
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  showCloseButton={false}
                  className="w-full gap-0 overflow-hidden border-l border-border/70 p-0 !max-w-none"
                  style={{
                    width: drawerWidth > 0 ? `${drawerWidth}px` : '72vw',
                    maxWidth: drawerWidth > 0 ? `${drawerWidth}px` : '72vw',
                  }}
                >
                  <SheetHeader className="sr-only">
                    <SheetTitle>分析助手</SheetTitle>
                  </SheetHeader>
                  <div className="relative min-h-0 flex-1 overflow-hidden">
                    <div
                      aria-hidden="true"
                      onPointerDown={startDrawerResize}
                      className="absolute left-0 top-0 z-20 h-full w-2 cursor-col-resize touch-none bg-transparent transition-colors hover:bg-primary/10"
                    >
                      <div className="absolute left-1/2 top-1/2 h-12 w-px -translate-x-1/2 -translate-y-1/2 rounded-full bg-border/80" />
                    </div>
                    <div className="min-h-0 h-full overflow-hidden pl-2 p-3 sm:p-4">
                      <ChatPanel className="min-h-0 h-full rounded-2xl border-border/60 shadow-none" />
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <ModeToggle />
            </div>
          </div>
        </header>

        <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
          {children}
        </main>
      </div>
    </div>
  )
}
