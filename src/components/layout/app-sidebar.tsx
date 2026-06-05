'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart3,
  BookOpen,
  GitCompare,
  GraduationCap,
  Home,
  LayoutList,
  PlusCircle,
  Users,
  ClipboardList,
  TrendingUp,
  ListOrdered,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalysisStore } from '@/store/analysisStore'
import { isLoggedIn } from '@/services/auth'
import type { AnalysisView } from '@/types'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const mainNavItems: NavItem[] = [
  { label: '首页', href: '/', icon: <Home className="h-[18px] w-[18px]" /> },
  { label: '分析列表', href: '/exams', icon: <BookOpen className="h-[18px] w-[18px]" /> },
  { label: '新建分析', href: '/create', icon: <PlusCircle className="h-[18px] w-[18px]" /> },
]

// 侧边栏直接可进入的顶层分析维度（下钻视图需从上层表格点击进入）
const allAnalysisDimensions: Array<{
  key: AnalysisView
  label: string
  icon: React.ReactNode
  scope: 'all' | 'single'
}> = [
  { key: 'class-summary', label: '班级情况汇总', icon: <Users className="h-[15px] w-[15px]" />, scope: 'all' },
  { key: 'subject-summary', label: '学科情况汇总', icon: <LayoutList className="h-[15px] w-[15px]" />, scope: 'all' },
  { key: 'rating-analysis', label: '一分四率', icon: <TrendingUp className="h-[15px] w-[15px]" />, scope: 'all' },
  { key: 'score-segment', label: '分数段分析', icon: <BarChart3 className="h-[15px] w-[15px]" />, scope: 'all' },
  { key: 'rank-segment', label: '名次段分析', icon: <ListOrdered className="h-[15px] w-[15px]" />, scope: 'all' },
  { key: 'single-class-summary', label: '班级情况汇总', icon: <Users className="h-[15px] w-[15px]" />, scope: 'single' },
  { key: 'rating-analysis', label: '一分四率', icon: <TrendingUp className="h-[15px] w-[15px]" />, scope: 'single' },
  { key: 'score-segment', label: '分数段分析', icon: <BarChart3 className="h-[15px] w-[15px]" />, scope: 'single' },
  { key: 'rank-segment', label: '名次段分析', icon: <ListOrdered className="h-[15px] w-[15px]" />, scope: 'single' },
  { key: 'single-question-summary', label: '试题分析', icon: <ClipboardList className="h-[15px] w-[15px]" />, scope: 'single' },
  { key: 'single-question-class-compare', label: '试题班级对比', icon: <GitCompare className="h-[15px] w-[15px]" />, scope: 'single' },
  { key: 'single-question-detail', label: '学生得分详情', icon: <Users className="h-[15px] w-[15px]" />, scope: 'single' },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const examMatch = pathname.match(/^\/exams\/([^/]+)$/)
  const examId = examMatch?.[1]
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

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

  const handleCreateClick = () => {
    if (!isLoggedIn()) {
      setLoginDialogOpen(true)
      return
    }
    router.push('/create')
  }

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
    if (dimension.key === 'single-question-class-compare') {
      setDrillDownParam('classId', undefined)
      setDrillDownParam('questionId', undefined)
    }
    if (dimension.key === 'single-question-detail') {
      setDrillDownParam('classId', 'all')
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
            // 新建分析：未登录时弹出登录提示
            if (item.href === '/create') {
              return (
                <button
                  key={item.href}
                  onClick={handleCreateClick}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                    active
                      ? 'bg-primary/[0.08] text-primary'
                      : 'text-sidebar-foreground/65 hover:bg-accent hover:text-sidebar-foreground'
                  )}
                >
                  {item.icon}
                  <span className="truncate">{item.label}</span>
                </button>
              )
            }
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
                  key={`${dimension.key}-${dimension.scope}`}
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

      {/* 未登录提示对话框 */}
      <AlertDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>需要登录</AlertDialogTitle>
            <AlertDialogDescription>
              创建新的成绩分析需要先登录。登录后即可上传成绩文件并生成分析报告。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/login?redirect=/create')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              去登录
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </aside>
  )
}
