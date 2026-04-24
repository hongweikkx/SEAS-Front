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
  Search,
  FileText,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalysisStore } from '@/store/analysisStore'
import type { AnalysisView } from '@/types'

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

// 所有7个分析维度
const allAnalysisDimensions: Array<{
  key: AnalysisView
  label: string
  icon: React.ReactNode
  scope: 'all' | 'single'
}> = [
  { key: 'class-summary', label: '班级情况汇总', icon: <Users className="h-[15px] w-[15px]" />, scope: 'all' },
  { key: 'subject-summary', label: '学科情况汇总', icon: <LayoutList className="h-[15px] w-[15px]" />, scope: 'all' },
  { key: 'class-subject-summary', label: '班级学科汇总', icon: <BarChart3 className="h-[15px] w-[15px]" />, scope: 'all' },
  { key: 'single-class-summary', label: '单科班级汇总', icon: <Users className="h-[15px] w-[15px]" />, scope: 'single' },
  { key: 'single-class-question', label: '单科班级题目', icon: <FileText className="h-[15px] w-[15px]" />, scope: 'single' },
  { key: 'single-question-summary', label: '单科题目汇总', icon: <ClipboardList className="h-[15px] w-[15px]" />, scope: 'single' },
  { key: 'single-question-detail', label: '单科班级题目详情', icon: <Search className="h-[15px] w-[15px]" />, scope: 'single' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const examMatch = pathname.match(/^\/exams\/([^/]+)$/)
  const examId = examMatch?.[1]

  const {
    currentView,
    setCurrentView,
    selectedScope,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
    resetDrillDown,
    setDrillDownParam,
  } = useAnalysisStore()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  const isExamDetail = !!examId

  // 根据当前模式过滤维度
  const availableDimensions = allAnalysisDimensions.filter((d) =>
    selectedScope === 'all_subjects' ? d.scope === 'all' : d.scope === 'single'
  )

  const handleDimensionClick = (dimension: (typeof allAnalysisDimensions)[0]) => {
    if (dimension.scope === 'all' && selectedScope !== 'all_subjects') {
      setSelectedScope('all_subjects')
      setSelectedSubjectId(null)
      setSelectedSubjectName(null)
    } else if (dimension.scope === 'single' && selectedScope !== 'single_subject') {
      setSelectedScope('single_subject')
    }

    setCurrentView(dimension.key)
    resetDrillDown()

    if (dimension.key === 'class-summary' || dimension.key === 'subject-summary') {
      setDrillDownParam('classId', undefined)
    }
    if (dimension.key === 'single-class-summary') {
      setDrillDownParam('classId', undefined)
      setDrillDownParam('questionId', undefined)
    }
  }

  return (
    <aside
      className="fixed left-0 top-0 z-30 flex h-svh w-[160px] flex-col border-r border-border/40 bg-sidebar"
    >
      <div className="px-2 py-3.5 border-b border-border/30">
        <div className="flex items-center gap-2.5 px-2.5">
          <GraduationCap className="h-5 w-5 shrink-0 text-primary" />
          <span className="text-base font-bold tracking-tight text-sidebar-foreground">SEAS</span>
        </div>
      </div>

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

        {isExamDetail && (
          <div className="mt-5">
            <div className="mb-1.5 px-2.5 text-[11px] font-medium tracking-wide text-muted-foreground/70">
              分析维度
            </div>
            <div className="flex flex-col gap-0.5">
              {availableDimensions.map((dimension) => (
                <button
                  key={dimension.key}
                  onClick={() => handleDimensionClick(dimension)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                    currentView === dimension.key
                      ? 'bg-primary/[0.08] text-primary'
                      : 'text-sidebar-foreground/65 hover:bg-accent hover:text-sidebar-foreground'
                  )}
                >
                  {dimension.icon}
                  <span className="truncate">{dimension.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </nav>
    </aside>
  )
}
