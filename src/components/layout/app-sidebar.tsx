'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  GraduationCap,
  Home,
  LayoutList,
  PlusCircle,
  Users,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalysisStore } from '@/store/analysisStore'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const mainNavItems: NavItem[] = [
  { label: '主页', href: '/', icon: <Home className="h-[18px] w-[18px]" /> },
  { label: '分析列表', href: '/exams', icon: <BookOpen className="h-[18px] w-[18px]" /> },
  { label: '新建分析', href: '/create', icon: <PlusCircle className="h-[18px] w-[18px]" /> },
]

const analysisModules = [
  { key: 'subject-summary' as const, label: '学科情况汇总', icon: <LayoutList className="h-[15px] w-[15px]" /> },
  { key: 'class-summary' as const, label: '班级情况汇总', icon: <Users className="h-[15px] w-[15px]" /> },
  { key: 'rating-analysis' as const, label: '四率分析', icon: <BarChart3 className="h-[15px] w-[15px]" /> },
]

export function AppSidebar() {
  const pathname = usePathname()
  const examMatch = pathname.match(/^\/exams\/([^/]+)$/)
  const examId = examMatch?.[1]

  const {
    activeAnalysisModule,
    setActiveAnalysisModule,
    selectedScope,
  } = useAnalysisStore()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const isExamDetail = !!examId

  const availableModules = selectedScope === 'single_subject'
    ? analysisModules.filter((m) => m.key !== 'subject-summary')
    : analysisModules

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-svh w-[160px] flex-col border-r border-border/40 bg-sidebar"
    >
      {/* 品牌区 */}
      <div className="px-2 py-3.5 border-b border-border/30">
        <div className="flex items-center gap-2.5 px-2.5">
          <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
          <span className="text-base font-bold tracking-tight text-sidebar-foreground">SEAS</span>
        </div>
      </div>

      {/* 主导航 */}
      <nav className="flex-1 px-2 py-2">
        <div className="flex flex-col gap-0.5">
          {mainNavItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                  active
                    ? 'bg-primary/[0.08] text-primary'
                    : 'text-sidebar-foreground/65 hover:bg-accent hover:text-sidebar-foreground'
                )}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* 分析维度子导航 */}
        {isExamDetail && (
          <div className="mt-5">
            <div className="mb-1.5 px-2.5 text-[11px] font-medium tracking-wide text-muted-foreground/70">
              分析维度
            </div>
            <div className="flex flex-col gap-0.5">
              {availableModules.map((module) => (
                <button
                  key={module.key}
                  onClick={() => setActiveAnalysisModule(module.key)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                    activeAnalysisModule === module.key
                      ? 'bg-primary/[0.08] text-primary'
                      : 'text-sidebar-foreground/65 hover:bg-accent hover:text-sidebar-foreground'
                  )}
                >
                  {module.icon}
                  <span className="truncate">{module.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}
