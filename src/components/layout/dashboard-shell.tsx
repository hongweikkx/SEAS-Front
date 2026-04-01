"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { useExams } from "@/hooks/useAnalysis"
import { ModeToggle } from "@/components/layout/mode-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isHome = pathname === "/"
  const examMatch = pathname.match(/^\/exams\/([^/]+)$/)
  const examId = examMatch?.[1]
  const { data: examsData } = useExams(1, 200)
  const examName = examId
    ? examsData?.exams.find((exam) => String(exam.id) === examId)?.name ?? "考试"
    : ""

  return (
    <div className="relative min-h-svh bg-background">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.96_0.03_260),transparent_45%)] dark:bg-[radial-gradient(circle_at_top,oklch(0.22_0.05_265),transparent_45%)]" />
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-start justify-between gap-4 px-4 py-3 md:px-6">
          <div>
            {isHome ? (
              <>
                <h1 className="text-lg font-semibold tracking-tight text-foreground md:text-2xl">
                  🎓 SEAS: Smart-Edu Agentic System
                </h1>
                <p className="text-sm text-muted-foreground md:text-base">
                  基于 Agent 架构的“诊断-检索-干预”自动化教学中枢
                </p>
              </>
            ) : null}
            {!isHome ? (
              <Breadcrumb className="text-sm md:text-base">
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink asChild>
                      <Link href="/">首页</Link>
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{examName}</BreadcrumbPage>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            ) : null}
          </div>
          <ModeToggle />
        </div>
      </header>
      <main className="relative mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  )
}
