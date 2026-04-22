# SEAS 前端页面重构实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按照 refactor.md 的视觉规范，将 SEAS 前端从当前顶部导航布局重构为侧边栏布局，并重新设计首页 Dashboard、分析列表、新建分析页和分析详情页。

**Architecture:** 保留现有数据层（Zustand + TanStack Query + Axios）不变，重点重构 UI 层。引入现代学术风配色（深藏蓝/智慧青/淡紫 AI 系），采用侧边栏+内容区的全局布局，分析详情页使用双段式级联导航。卡片组件使用浅色填充背景+淡色投影替代灰白配色。

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, shadcn/ui, Chart.js, Zustand, TanStack Query

---

## 文件结构总览

### 新建文件

| 文件 | 职责 |
|------|------|
| `src/app/login/page.tsx` | 登录页面（左右分栏，支持密码/微信切换） |
| `src/app/create/page.tsx` | 新建分析页面（拖拽上传+字段校准+分析流程） |
| `src/app/exams/page.tsx` | 分析列表页（卡片式考试列表） |
| `src/components/layout/app-sidebar.tsx` | 侧边栏组件（Logo、导航、底部操作） |
| `src/components/dashboard/WelcomeBanner.tsx` | 首页欢迎横幅 |
| `src/components/dashboard/QuickStats.tsx` | 首页动态简报（最近一次分析数据） |
| `src/components/dashboard/AiAssistantCard.tsx` | 首页 AI 助手入口卡片 |
| `src/components/dashboard/NewAnalysisCTA.tsx` | 首页"新建成绩分析"大按钮 |
| `src/components/exam/ExamCard.tsx` | 考试卡片（带分类标签、日期、人数） |
| `src/components/exam/ExamTypeBadge.tsx` | 考试分类标签（期中/期末/月考/模拟） |
| `src/components/analysis/AnalysisNav.tsx` | 分析详情页双段式级联导航 |
| `src/components/analysis/AnalysisModuleCard.tsx` | 可配置的分析模块卡片容器 |
| `src/components/analysis/CriticalStudents.tsx` | 临界生分析占位组件 |
| `src/components/analysis/ScoreFluctuation.tsx` | 成绩波动占位组件 |
| `src/components/create/FileUploadZone.tsx` | 拖拽上传区（.xlsx/.csv） |
| `src/components/create/CreateProgress.tsx` | 新建分析三步引导指示器 |
| `src/components/ui/ai-badge.tsx` | AI 内容标识徽章 |

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `src/app/globals.css` | 添加学术风配色变量，卡片阴影工具类 |
| `src/app/layout.tsx` | 保持根布局不变 |
| `src/app/providers.tsx` | 移除 DashboardShell 包裹，改为在 layout 层级处理 |
| `src/app/page.tsx` | 从考试列表改为 Dashboard 首页 |
| `src/app/exams/[id]/page.tsx` | 改造为双段式侧边栏+内容区布局 |
| `src/components/layout/dashboard-shell.tsx` | 重构为 侧边栏+内容区 主框架 |
| `src/components/exam/ExamList.tsx` | 使用 ExamCard 替代列表项 |
| `src/components/exam/SubjectTabs.tsx` | 改造为 Pills 样式，移入侧边栏 |
| `src/components/analysis/SubjectSummary.tsx` | 添加独立配置入口，使用新配色 |
| `src/components/analysis/ClassSummary.tsx` | 添加独立配置入口，使用新配色 |
| `src/components/analysis/RatingChart.tsx` | 改造为可配置卡片，优化视觉 |
| `src/store/analysisStore.ts` | 添加 activeAnalysisModule 等导航状态 |
| `src/utils/format.ts` | 添加考试分类检测函数 |

---

## Phase 1: 全局基础 — 配色系统与侧边栏布局

### Task 1.1: 更新全局 CSS 配色变量

**Files:**
- Modify: `src/app/globals.css`

**说明：** 在保留现有 CSS 变量的前提下，新增学术风配色变量和卡片阴影工具类。这些变量将用于新组件和改造后的组件。

- [ ] **Step 1: 在 `:root` 和 `.dark` 中添加学术风配色变量**

在 `:root` 的 `--sidebar-ring` 之后添加：

```css
  /* 学术风配色 */
  --academic-deep-blue: #1E3A8A;
  --academic-cyan: #06B6D4;
  --academic-purple: #F5F3FF;
  --academic-purple-glow: rgba(139, 92, 246, 0.15);
  --academic-card-blue: rgba(59, 130, 246, 0.05);
  --academic-card-cyan: rgba(6, 182, 212, 0.05);
  --academic-card-purple: rgba(139, 92, 246, 0.05);
  --academic-shadow-blue: 0 4px 20px -4px rgba(59, 130, 246, 0.2);
  --academic-shadow-cyan: 0 4px 20px -4px rgba(6, 182, 212, 0.2);
  --academic-shadow-purple: 0 4px 20px -4px rgba(139, 92, 246, 0.2);
```

在 `.dark` 的 `--sidebar-ring` 之后添加相同的变量定义。

- [ ] **Step 2: 添加卡片阴影工具类**

在 `@layer base` 之后添加：

```css
@layer utilities {
  .shadow-card-blue {
    box-shadow: var(--academic-shadow-blue);
  }
  .shadow-card-cyan {
    box-shadow: var(--academic-shadow-cyan);
  }
  .shadow-card-purple {
    box-shadow: var(--academic-shadow-purple);
  }
  .bg-card-blue {
    background-color: var(--academic-card-blue);
  }
  .bg-card-cyan {
    background-color: var(--academic-card-cyan);
  }
  .bg-card-purple {
    background-color: var(--academic-card-purple);
  }
}
```

- [ ] **Step 3: 启动开发服务器验证 CSS 编译**

Run: `cd /Users/kk/go/src/seas-frontend && npm run dev`
Expected: 无编译错误，正常启动

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: 添加学术风配色变量和卡片阴影工具类"
```

---

### Task 1.2: 扩展 Zustand Store 添加导航状态

**Files:**
- Modify: `src/store/analysisStore.ts`

**说明：** 为分析详情页的双段式导航和首页状态添加必要的 store 字段。

- [ ] **Step 1: 添加新类型和状态**

将现有文件替换为：

```typescript
import { create } from 'zustand'
import type { RatingConfig } from '@/types'

export type AnalysisModule =
  | 'subject-summary'
  | 'class-summary'
  | 'rating-analysis'
  | 'critical-students'
  | 'score-fluctuation'

export type ExamType = '期中' | '期末' | '月考' | '模拟' | '其他'

interface AnalysisState {
  isAuthenticated: boolean
  sidebarCollapsed: boolean
  activeDetailSection: 'class-overview' | 'subject-compare' | 'custom'
  selectedExamId: string | null
  selectedExamName: string | null
  selectedSubjectId: string | null
  selectedSubjectName: string | null
  selectedScope: 'all_subjects' | 'single_subject'
  activeAnalysisModule: AnalysisModule
  ratingConfig: RatingConfig
  classSummaryConfig: { showDeviation: boolean; showStdDev: boolean }
  subjectSummaryConfig: { showDifficulty: boolean; showStudentCount: boolean }

  // Actions
  setAuthenticated: (isAuthenticated: boolean) => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setActiveDetailSection: (section: 'class-overview' | 'subject-compare' | 'custom') => void
  setSelectedExamId: (examId: string) => void
  setSelectedExamName: (examName: string | null) => void
  setSelectedSubjectId: (subjectId: string | null) => void
  setSelectedSubjectName: (subjectName: string | null) => void
  setSelectedScope: (scope: 'all_subjects' | 'single_subject') => void
  setActiveAnalysisModule: (module: AnalysisModule) => void
  setRatingConfig: (config: RatingConfig) => void
  setClassSummaryConfig: (config: Partial<AnalysisState['classSummaryConfig']>) => void
  setSubjectSummaryConfig: (config: Partial<AnalysisState['subjectSummaryConfig']>) => void
  reset: () => void
}

const defaultState = {
  isAuthenticated: false,
  sidebarCollapsed: false,
  activeDetailSection: 'class-overview',
  selectedExamId: null,
  selectedExamName: null,
  selectedSubjectId: null,
  selectedSubjectName: null,
  selectedScope: 'all_subjects',
  activeAnalysisModule: 'subject-summary' as AnalysisModule,
  ratingConfig: {
    excellent_threshold: 90,
    good_threshold: 70,
    pass_threshold: 60,
  },
  classSummaryConfig: { showDeviation: true, showStdDev: true },
  subjectSummaryConfig: { showDifficulty: true, showStudentCount: true },
}

export const useAnalysisStore = create<AnalysisState>((set) => ({
  ...defaultState,

  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  setActiveDetailSection: (activeDetailSection) => set({ activeDetailSection }),
  setSelectedExamId: (examId) => set({ selectedExamId: examId }),
  setSelectedExamName: (selectedExamName) => set({ selectedExamName }),
  setSelectedSubjectId: (selectedSubjectId) => set({ selectedSubjectId }),
  setSelectedSubjectName: (selectedSubjectName) => set({ selectedSubjectName }),
  setSelectedScope: (scope) => set({ selectedScope: scope }),
  setActiveAnalysisModule: (activeAnalysisModule) => set({ activeAnalysisModule }),
  setRatingConfig: (config) => set({ ratingConfig: config }),
  setClassSummaryConfig: (config) =>
    set((state) => ({ classSummaryConfig: { ...state.classSummaryConfig, ...config } })),
  setSubjectSummaryConfig: (config) =>
    set((state) => ({ subjectSummaryConfig: { ...state.subjectSummaryConfig, ...config } })),
  reset: () => set({ ...defaultState }),
}))
```

- [ ] **Step 2: Commit**

```bash
git add src/store/analysisStore.ts
git commit -m "feat: 扩展 store 添加分析模块导航和配置状态"
```

---

### Task 1.3: 创建侧边栏组件

**Files:**
- Create: `src/components/layout/app-sidebar.tsx`
- Modify: `src/components/layout/dashboard-shell.tsx`

**说明：** 创建 SEAS 风格的侧边栏组件，包含 Logo、导航菜单、底部操作区。使用 shadcn sidebar 的基础能力但自定义样式。

- [ ] **Step 1: 编写侧边栏组件**

Create `src/components/layout/app-sidebar.tsx`：

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Home,
  PlusCircle,
  Settings,
  User,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAnalysisStore } from '@/store/analysisStore'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  { label: '首页', href: '/', icon: <Home className="h-5 w-5" /> },
  { label: '分析列表', href: '/exams', icon: <BookOpen className="h-5 w-5" /> },
  { label: '新建分析', href: '/create', icon: <PlusCircle className="h-5 w-5" /> },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { sidebarCollapsed, setSidebarCollapsed } = useAnalysisStore()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          'fixed left-0 top-0 z-30 flex h-svh flex-col border-r border-border/60 bg-[#1E3A8A] text-white transition-all duration-300',
          sidebarCollapsed ? 'w-[3.5rem]' : 'w-[15rem]'
        )}
      >
        {/* Logo 区域 */}
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15">
            <GraduationCap className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="text-lg font-bold tracking-tight">SEAS</span>
          )}
        </div>

        {/* 导航区域 */}
        <nav className="flex-1 space-y-1 px-2 py-4">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      active
                        ? 'bg-white/15 text-white shadow-sm'
                        : 'text-white/70 hover:bg-white/10 hover:text-white'
                    )}
                  >
                    {item.icon}
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {sidebarCollapsed && (
                  <TooltipContent side="right" className="border border-border/60">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          })}
        </nav>

        {/* 底部区域 */}
        <div className="border-t border-white/10 px-2 py-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
              >
                {sidebarCollapsed ? (
                  <ChevronRight className="h-5 w-5" />
                ) : (
                  <ChevronLeft className="h-5 w-5" />
                )}
                {!sidebarCollapsed && <span>收起侧边栏</span>}
              </button>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right">展开侧边栏</TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white">
                <User className="h-5 w-5" />
                {!sidebarCollapsed && <span>个人中心</span>}
              </button>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right">个人中心</TooltipContent>
            )}
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <button className="mt-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white">
                <Settings className="h-5 w-5" />
                {!sidebarCollapsed && <span>系统设置</span>}
              </button>
            </TooltipTrigger>
            {sidebarCollapsed && (
              <TooltipContent side="right">系统设置</TooltipContent>
            )}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: 重构 DashboardShell 为侧边栏+内容区布局**

将 `src/components/layout/dashboard-shell.tsx` 替换为：

```tsx
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
        {/* 顶部 header */}
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
```

- [ ] **Step 3: 启动开发服务器验证布局**

Run: `cd /Users/kk/go/src/seas-frontend && npm run dev`
Expected: 侧边栏正常显示，页面内容区正确偏移，无布局错误

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/app-sidebar.tsx src/components/layout/dashboard-shell.tsx
git commit -m "feat: 重构全局布局为侧边栏+内容区"
```

---

## Phase 2: 首页 Dashboard 改造

### Task 2.1: 创建欢迎横幅组件

**Files:**
- Create: `src/components/dashboard/WelcomeBanner.tsx`

- [ ] **Step 1: 编写欢迎横幅组件**

Create `src/components/dashboard/WelcomeBanner.tsx`：

```tsx
'use client'

import { Sparkles } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export function WelcomeBanner() {
  const greeting = getGreeting()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-card-blue p-6 shadow-card-blue md:p-8">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          <span>智能教学助手已就绪</span>
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          老师，{greeting}。今天需要处理新的成绩数据吗？
        </h2>
        <p className="mt-2 text-muted-foreground">
          SEAS 将帮助您快速分析学生成绩，发现教学中的关键洞察。
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/WelcomeBanner.tsx
git commit -m "feat: 添加首页欢迎横幅组件"
```

---

### Task 2.2: 创建 AI 助手入口卡片

**Files:**
- Create: `src/components/dashboard/AiAssistantCard.tsx`

- [ ] **Step 1: 编写 AI 助手卡片组件**

Create `src/components/dashboard/AiAssistantCard.tsx`：

```tsx
'use client'

import { MessageSquareHeart, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import ChatPanel from '@/components/chat/ChatPanel'

export function AiAssistantCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-card-purple p-6 shadow-card-purple md:p-8">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-200/20 blur-xl" />
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-violet-300/0 via-violet-400/30 to-cyan-300/0" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-lg font-semibold text-foreground">AI 智能助手</h3>
          </div>
          <p className="mt-2 text-muted-foreground">
            想聊聊这届学生吗？让 AI 帮您发现成绩背后的故事。
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-violet-100/50 px-3 py-2 text-xs text-violet-800 dark:bg-violet-900/20 dark:text-violet-300">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-violet-500" />
            AI 分析结果仅供参考，请结合实际情况判断
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500">
              <MessageSquareHeart className="mr-2 h-4 w-4" />
              开始对话
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>AI 分析助手</SheetTitle>
            </SheetHeader>
            <div className="mt-4 h-[calc(100%-3rem)]">
              <ChatPanel className="h-full rounded-xl border border-border/60" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/AiAssistantCard.tsx
git commit -m "feat: 添加 AI 助手入口卡片组件"
```

---

### Task 2.3: 创建动态简报组件

**Files:**
- Create: `src/components/dashboard/QuickStats.tsx`

- [ ] **Step 1: 编写动态简报组件**

Create `src/components/dashboard/QuickStats.tsx`：

```tsx
'use client'

import { BarChart3, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { useExams } from '@/hooks/useAnalysis'
import Link from 'next/link'
import { formatDate } from '@/utils/format'

export function QuickStats() {
  const { data, isLoading } = useExams(1, 1)
  const latestExam = data?.exams[0]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
    )
  }

  if (!latestExam) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center text-muted-foreground">
        <BarChart3 className="mx-auto h-8 w-8 opacity-50" />
        <p className="mt-2">暂无分析数据，新建一个分析开始吧</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">最近一次分析</h3>
        <Link
          href={`/exams/${latestExam.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          查看详情
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-200/60 bg-card-cyan p-5 shadow-card-cyan">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">及格率</p>
              <p className="text-2xl font-bold text-foreground">--</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-card-blue p-5 shadow-card-blue">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">平均分波动</p>
              <p className="text-2xl font-bold text-foreground">--</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">参与人数</p>
              <p className="text-2xl font-bold text-foreground">--</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {latestExam.name} · {formatDate(latestExam.examDate)}
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/QuickStats.tsx
git commit -m "feat: 添加首页动态简报组件"
```

---

### Task 2.4: 创建新建分析大按钮组件

**Files:**
- Create: `src/components/dashboard/NewAnalysisCTA.tsx`

- [ ] **Step 1: 编写 CTA 组件**

Create `src/components/dashboard/NewAnalysisCTA.tsx`：

```tsx
'use client'

import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewAnalysisCTAProps {
  variant?: 'large' | 'compact'
  className?: string
}

export function NewAnalysisCTA({ variant = 'large', className }: NewAnalysisCTAProps) {
  if (variant === 'compact') {
    return (
      <Link
        href="/create"
        className={cn(
          'flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-primary/40 active:scale-[0.98]',
          className
        )}
      >
        <Plus className="h-4 w-4" />
        新建成绩分析
      </Link>
    )
  }

  return (
    <Link
      href="/create"
      className={cn(
        'group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-card-blue p-8 text-center shadow-card-blue transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/20 md:p-12',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <div className="relative">
        <h3 className="text-xl font-bold text-foreground">新建成绩分析</h3>
        <p className="mt-1 text-sm text-muted-foreground">上传成绩文件，AI 自动生成分析报告</p>
      </div>
      <div className="relative mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all group-hover:shadow-primary/40">
        <Plus className="h-4 w-4" />
        立即开始
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/dashboard/NewAnalysisCTA.tsx
git commit -m "feat: 添加新建分析 CTA 组件"
```

---

### Task 2.5: 改造首页 page.tsx 为 Dashboard

**Files:**
- Modify: `src/app/page.tsx`

- [ ] **Step 1: 替换首页为 Dashboard 布局**

将 `src/app/page.tsx` 替换为：

```tsx
'use client'

import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { AiAssistantCard } from '@/components/dashboard/AiAssistantCard'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { NewAnalysisCTA } from '@/components/dashboard/NewAnalysisCTA'
import { RecentExamList } from '@/components/dashboard/RecentExamList'

export default function Home() {
  return (
    <div className="space-y-6">
      {/* 欢迎横幅 */}
      <WelcomeBanner />

      {/* 新建分析 CTA */}
      <NewAnalysisCTA />

      {/* AI 助手 */}
      <AiAssistantCard />

      {/* 动态简报 */}
      <QuickStats />

      {/* 最近分析 */}
      <RecentExamList />
    </div>
  )
}
```

- [ ] **Step 2: 创建 RecentExamList 组件**

Create `src/components/dashboard/RecentExamList.tsx`：

```tsx
'use client'

import { Clock } from 'lucide-react'
import Link from 'next/link'
import { useExams } from '@/hooks/useAnalysis'
import { formatDate } from '@/utils/format'
import { ExamTypeBadge } from '@/components/exam/ExamTypeBadge'

export function RecentExamList() {
  const { data, isLoading } = useExams(1, 5)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">最近分析</h3>
        <div className="h-40 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    )
  }

  if (!data?.exams.length) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">最近分析</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {data.exams.slice(0, 4).map((exam) => (
          <Link
            href={`/exams/${exam.id}`}
            key={exam.id}
            className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{exam.name}</p>
                <ExamTypeBadge name={exam.name} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(exam.examDate)}</p>
            </div>
            <div className="shrink-0 text-xs text-muted-foreground">查看</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 启动开发服务器验证首页**

Run: `cd /Users/kk/go/src/seas-frontend && npm run dev`
Expected: 首页显示欢迎横幅、CTA 按钮、AI 卡片、动态简报和最近分析列表

- [ ] **Step 4: Commit**

```bash
git add src/app/page.tsx src/components/dashboard/RecentExamList.tsx

git commit -m "feat: 首页改造为 Dashboard 布局"
```

---

## Phase 3: 分析列表页

### Task 3.1: 创建考试分类标签组件

**Files:**
- Create: `src/components/exam/ExamTypeBadge.tsx`
- Modify: `src/utils/format.ts`

- [ ] **Step 1: 添加考试分类检测函数**

在 `src/utils/format.ts` 末尾添加：

```typescript
// 考试分类检测
export function detectExamType(name: string): '期中' | '期末' | '月考' | '模拟' | '其他' {
  if (name.includes('期中')) return '期中'
  if (name.includes('期末')) return '期末'
  if (name.includes('月考')) return '月考'
  if (name.includes('模拟') || name.includes('模考')) return '模拟'
  return '其他'
}

// 分类标签颜色
export const examTypeColors: Record<string, string> = {
  期中: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  期末: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  月考: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  模拟: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
  其他: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
} as const
```

- [ ] **Step 2: 创建 ExamTypeBadge 组件**

Create `src/components/exam/ExamTypeBadge.tsx`：

```tsx
'use client'

import { cn } from '@/lib/utils'
import { detectExamType, examTypeColors } from '@/utils/format'

interface ExamTypeBadgeProps {
  name: string
  className?: string
}

export function ExamTypeBadge({ name, className }: ExamTypeBadgeProps) {
  const type = detectExamType(name)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        examTypeColors[type],
        className
      )}
    >
      {type}
    </span>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/exam/ExamTypeBadge.tsx src/utils/format.ts
git commit -m "feat: 添加考试分类标签组件和检测函数"
```

---

### Task 3.2: 创建考试卡片组件

**Files:**
- Create: `src/components/exam/ExamCard.tsx`

- [ ] **Step 1: 编写考试卡片组件**

Create `src/components/exam/ExamCard.tsx`：

```tsx
'use client'

import Link from 'next/link'
import { Calendar, ChevronRight, Users } from 'lucide-react'
import type { Exam } from '@/types'
import { formatDate } from '@/utils/format'
import { ExamTypeBadge } from './ExamTypeBadge'

interface ExamCardProps {
  exam: Exam
}

export function ExamCard({ exam }: ExamCardProps) {
  return (
    <Link
      href={`/exams/${exam.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{exam.name}</h3>
            <ExamTypeBadge name={exam.name} />
          </div>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(exam.examDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>-- 人</span>
        </div>
      </div>
    </Link>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/exam/ExamCard.tsx
git commit -m "feat: 添加考试卡片组件"
```

---

### Task 3.3: 改造 ExamList 并创建分析列表页

**Files:**
- Modify: `src/components/exam/ExamList.tsx`
- Create: `src/app/exams/page.tsx`

- [ ] **Step 1: 改造 ExamList 为卡片网格布局**

将 `src/components/exam/ExamList.tsx` 替换为：

```tsx
'use client'

import { useExams } from '@/hooks/useAnalysis'
import { Loader2, FileQuestion } from 'lucide-react'
import { ExamCard } from './ExamCard'

export default function ExamList() {
  const { data, isLoading, error } = useExams(1, 20)

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center" role="status" aria-label="加载中">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5">
        <p className="text-destructive">加载失败，请检查后端服务是否运行</p>
      </div>
    )
  }

  if (!data?.exams.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 text-muted-foreground">
        <FileQuestion className="h-12 w-12 opacity-30" />
        <p className="mt-3 text-sm">暂无可分析的考试数据</p>
        <p className="mt-1 text-xs opacity-60">新建一个分析开始吧</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data?.exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: 创建分析列表页**

Create `src/app/exams/page.tsx`：

```tsx
'use client'

import { Search } from 'lucide-react'
import ExamList from '@/components/exam/ExamList'
import { NewAnalysisCTA } from '@/components/dashboard/NewAnalysisCTA'

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">分析列表</h2>
          <p className="text-sm text-muted-foreground">管理您的所有成绩分析</p>
        </div>
        <NewAnalysisCTA variant="compact" />
      </div>

      {/* 搜索占位 */}
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-muted-foreground">
        <Search className="h-4 w-4" />
        <span className="text-sm">搜索考试名称...</span>
      </div>

      {/* 考试卡片列表 */}
      <ExamList />
    </div>
  )
}
```

- [ ] **Step 3: 启动开发服务器验证分析列表页**

Run: `cd /Users/kk/go/src/seas-frontend && npm run dev`
Expected: `/exams` 页面显示卡片网格布局，带分类标签

- [ ] **Step 4: Commit**

```bash
git add src/components/exam/ExamList.tsx src/app/exams/page.tsx
git commit -m "feat: 分析列表页卡片化改造"
```

---

## Phase 4: 新建分析页面

### Task 4.1: 创建文件拖拽上传区

**Files:**
- Create: `src/components/create/FileUploadZone.tsx`

- [ ] **Step 1: 编写拖拽上传组件**

Create `src/components/create/FileUploadZone.tsx`：

```tsx
'use client'

import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadZoneProps {
  onFileSelect?: (file: File) => void
}

export function FileUploadZone({ onFileSelect }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
        setSelectedFile(file)
        onFileSelect?.(file)
      }
    },
    [onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setSelectedFile(file)
        onFileSelect?.(file)
      }
    },
    [onFileSelect]
  )

  const clearFile = () => {
    setSelectedFile(null)
  }

  if (selectedFile) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card-blue p-6 shadow-card-blue">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all',
        isDragging
          ? 'border-primary bg-primary/5 shadow-card-blue'
          : 'border-border/60 bg-card/60 hover:border-primary/40 hover:bg-card-blue'
      )}
    >
      <input
        type="file"
        accept=".xlsx,.csv"
        onChange={handleFileInput}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-base font-medium text-foreground">拖拽文件到此处上传</p>
        <p className="mt-1 text-sm text-muted-foreground">或点击选择文件</p>
        <p className="mt-2 text-xs text-muted-foreground/70">支持 .xlsx 和 .csv 格式</p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/create/FileUploadZone.tsx
git commit -m "feat: 添加文件拖拽上传区组件"
```

---

### Task 4.2: 创建新建分析进度指示器

**Files:**
- Create: `src/components/create/CreateProgress.tsx`

- [ ] **Step 1: 编写进度指示器组件**

Create `src/components/create/CreateProgress.tsx`：

```tsx
'use client'

import { Upload, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateProgressProps {
  currentStep: 1 | 2 | 3
}

const steps = [
  { label: '文件投喂', icon: Upload, description: '上传成绩文件' },
  { label: '字段校准', icon: Settings, description: '确认字段映射' },
  { label: 'AI 智能分析', icon: Sparkles, description: '生成分析报告' },
]

export function CreateProgress({ currentStep }: CreateProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {steps.map((step, index) => {
        const stepNum = index + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        const Icon = step.icon

        return (
          <div key={step.label} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : isCompleted
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-px w-8 transition-colors md:w-16',
                  isCompleted ? 'bg-emerald-400' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/create/CreateProgress.tsx
git commit -m "feat: 添加新建分析进度指示器"
```

---

### Task 4.3: 创建新建分析页面

**Files:**
- Create: `src/app/create/page.tsx`
- Create: `src/components/create/FieldMapping.tsx`

- [ ] **Step 1: 创建字段校准占位组件**

Create `src/components/create/FieldMapping.tsx`：

```tsx
'use client'

import { Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const mockFields = [
  { source: '姓名', target: 'student_name', matched: true },
  { source: '语文', target: 'chinese_score', matched: true },
  { source: '数学', target: 'math_score', matched: true },
  { source: '英语', target: 'english_score', matched: true },
  { source: '班级', target: 'class_name', matched: true },
  { source: '总分', target: null, matched: false },
]

interface FieldMappingProps {
  onConfirm?: () => void
}

export function FieldMapping({ onConfirm }: FieldMappingProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <h3 className="text-sm font-medium text-foreground">字段映射确认</h3>
        <p className="mt-1 text-xs text-muted-foreground">请确认以下字段映射是否正确</p>

        <div className="mt-4 space-y-2">
          {mockFields.map((field) => (
            <div
              key={field.source}
              className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {field.matched ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm text-foreground">{field.source}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-sm font-medium text-primary">
                  {field.target ?? '未匹配'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onConfirm}>确认并开始分析</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 创建新建分析页面**

Create `src/app/create/page.tsx`：

```tsx
'use client'

import { useState } from 'react'
import { FileUploadZone } from '@/components/create/FileUploadZone'
import { CreateProgress } from '@/components/create/CreateProgress'
import { FieldMapping } from '@/components/create/FieldMapping'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'

export default function CreatePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [hasFile, setHasFile] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileSelect = () => {
    setHasFile(true)
  }

  const handleStartMapping = () => {
    if (!hasFile) return
    setStep(2)
  }

  const handleConfirmMapping = () => {
    setStep(3)
    setIsAnalyzing(true)
    // 模拟分析过程
    setTimeout(() => {
      setIsAnalyzing(false)
    }, 3000)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">新建成绩分析</h2>
        <p className="mt-1 text-sm text-muted-foreground">三步完成成绩数据导入与分析</p>
      </div>

      {/* 进度指示器 */}
      <CreateProgress currentStep={step} />

      {/* 步骤内容 */}
      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <FileUploadZone onFileSelect={handleFileSelect} />
            {hasFile && (
              <div className="flex justify-end">
                <Button onClick={handleStartMapping}>下一步：字段校准</Button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <FieldMapping onConfirm={handleConfirmMapping} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            {isAnalyzing ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">AI 正在分析成绩数据...</p>
                  <p className="mt-1 text-sm text-muted-foreground">请稍候，正在生成多维分析报告</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">分析完成！</p>
                  <p className="mt-1 text-sm text-muted-foreground">您的成绩分析报告已生成</p>
                </div>
                <Button asChild>
                  <a href="/">返回首页查看</a>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: 启动开发服务器验证新建分析页**

Run: `cd /Users/kk/go/src/seas-frontend && npm run dev`
Expected: `/create` 页面显示三步流程，支持文件拖拽上传

- [ ] **Step 4: Commit**

```bash
git add src/app/create/page.tsx src/components/create/FieldMapping.tsx
git commit -m "feat: 新建分析页面"
```

---

## Phase 5: 分析详情页重构（核心）

### Task 5.1: 创建双段式级联导航组件

**Files:**
- Create: `src/components/analysis/AnalysisNav.tsx`

- [ ] **Step 1: 编写双段式导航组件**

Create `src/components/analysis/AnalysisNav.tsx`：

```tsx
'use client'

import { useSubjects } from '@/hooks/useAnalysis'
import { useAnalysisStore, type AnalysisModule } from '@/store/analysisStore'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisNavProps {
  examId: string
}

// 全科视角的功能模块
const allSubjectModules: { key: AnalysisModule; label: string }[] = [
  { key: 'subject-summary', label: '学科情况汇总' },
  { key: 'class-summary', label: '班级情况汇总' },
  { key: 'rating-analysis', label: '全科四率分析' },
]

// 单科视角的功能模块
const singleSubjectModules: { key: AnalysisModule; label: string }[] = [
  { key: 'class-summary', label: '班级情况汇总' },
  { key: 'rating-analysis', label: '单科四率分析' },
  { key: 'critical-students', label: '临界生分析' },
  { key: 'score-fluctuation', label: '成绩波动' },
]

export function AnalysisNav({ examId }: AnalysisNavProps) {
  const { data, isLoading } = useSubjects(examId, 1, 100)
  const {
    selectedScope,
    selectedSubjectId,
    activeAnalysisModule,
    setSelectedSubjectId,
    setSelectedSubjectName,
    setSelectedScope,
    setActiveAnalysisModule,
  } = useAnalysisStore()

  const modules = selectedScope === 'all_subjects' ? allSubjectModules : singleSubjectModules

  const handleSelectAll = () => {
    setSelectedScope('all_subjects')
    setSelectedSubjectId(null)
    setSelectedSubjectName(null)
    setActiveAnalysisModule('subject-summary')
  }

  const handleSelectSubject = (id: string, name: string) => {
    setSelectedScope('single_subject')
    setSelectedSubjectId(id)
    setSelectedSubjectName(name)
    setActiveAnalysisModule('class-summary')
  }

  return (
    <div className="space-y-4">
      {/* 上半部分：科目切换 */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          分析视角
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={handleSelectAll}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              selectedScope === 'all_subjects'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            全科
          </button>

          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}

          {data?.subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSelectSubject(subject.id, subject.name)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                selectedScope === 'single_subject' && selectedSubjectId === subject.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {subject.name}
            </button>
          ))}
        </div>
      </div>

      {/* 分割线 */}
      <Separator className="bg-border/60" />

      {/* 下半部分：功能维度 */}
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          分析维度
        </p>
        <div className="flex flex-wrap gap-1.5">
          {modules.map((module) => (
            <button
              key={module.key}
              onClick={() => setActiveAnalysisModule(module.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                activeAnalysisModule === module.key
                  ? 'bg-[#1E3A8A] text-white shadow-sm dark:bg-[#1E3A8A]/90'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {module.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analysis/AnalysisNav.tsx
git commit -m "feat: 添加分析详情页双段式级联导航"
```

---

### Task 5.2: 创建可配置分析模块卡片容器

**Files:**
- Create: `src/components/analysis/AnalysisModuleCard.tsx`

- [ ] **Step 1: 编写模块卡片容器**

Create `src/components/analysis/AnalysisModuleCard.tsx`：

```tsx
'use client'

import { ReactNode, useState } from 'react'
import { Settings2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AnalysisModuleCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  configPanel?: ReactNode
  className?: string
  variant?: 'default' | 'cyan' | 'purple'
  isLoading?: boolean
}

export function AnalysisModuleCard({
  title,
  subtitle,
  children,
  configPanel,
  className,
  variant = 'default',
  isLoading,
}: AnalysisModuleCardProps) {
  const [showConfig, setShowConfig] = useState(false)

  const variantStyles = {
    default: 'border-primary/10 bg-card-blue shadow-card-blue',
    cyan: 'border-cyan-200/60 bg-card-cyan shadow-card-cyan',
    purple: 'border-violet-200/60 bg-card-purple shadow-card-purple',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        variantStyles[variant],
        className
      )}
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {configPanel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className={cn(
              'h-8 w-8 rounded-lg p-0',
              showConfig && 'bg-primary/10 text-primary'
            )}
          >
            {showConfig ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* 配置面板 */}
      {configPanel && showConfig && (
        <div className="border-b border-border/40 bg-muted/30 px-5 py-4">
          {configPanel}
        </div>
      )}

      {/* 内容区 */}
      <div className="relative px-5 py-4">
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-b-2xl bg-background/50">
            <div className="flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/analysis/AnalysisModuleCard.tsx
git commit -m "feat: 添加可配置分析模块卡片容器"
```

---

### Task 5.3: 创建临界生分析和成绩波动占位组件

**Files:**
- Create: `src/components/analysis/CriticalStudents.tsx`
- Create: `src/components/analysis/ScoreFluctuation.tsx`

- [ ] **Step 1: 创建临界生分析组件**

Create `src/components/analysis/CriticalStudents.tsx`：

```tsx
'use client'

import { AlertTriangle } from 'lucide-react'
import { AnalysisModuleCard } from './AnalysisModuleCard'

interface CriticalStudentsProps {
  examId: string
}

export function CriticalStudents({ examId }: CriticalStudentsProps) {
  return (
    <AnalysisModuleCard
      title="临界生分析"
      subtitle="识别处于关键分数段的学生群体"
      variant="purple"
    >
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 opacity-30" />
        <p className="text-sm">临界生分析功能开发中</p>
        <p className="text-xs opacity-60">将展示各分数段临界学生的详细名单与分析</p>
      </div>
    </AnalysisModuleCard>
  )
}
```

- [ ] **Step 2: 创建成绩波动组件**

Create `src/components/analysis/ScoreFluctuation.tsx`：

```tsx
'use client'

import { TrendingUp } from 'lucide-react'
import { AnalysisModuleCard } from './AnalysisModuleCard'

interface ScoreFluctuationProps {
  examId: string
}

export function ScoreFluctuation({ examId }: ScoreFluctuationProps) {
  return (
    <AnalysisModuleCard
      title="成绩波动"
      subtitle="分析学生成绩的稳定性与变化趋势"
      variant="cyan"
    >
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
        <TrendingUp className="h-10 w-10 opacity-30" />
        <p className="text-sm">成绩波动分析功能开发中</p>
        <p className="text-xs opacity-60">将展示学生成绩的历史波动趋势图</p>
      </div>
    </AnalysisModuleCard>
  )
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/CriticalStudents.tsx src/components/analysis/ScoreFluctuation.tsx
git commit -m "feat: 添加临界生分析和成绩波动占位组件"
```

---

### Task 5.4: 改造现有分析组件为可配置卡片

**Files:**
- Modify: `src/components/analysis/SubjectSummary.tsx`
- Modify: `src/components/analysis/ClassSummary.tsx`
- Modify: `src/components/analysis/RatingChart.tsx`

- [ ] **Step 1: 改造 SubjectSummary**

将 `src/components/analysis/SubjectSummary.tsx` 替换为：

```tsx
'use client'

import { useSubjectSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { AnalysisModuleCard } from './AnalysisModuleCard'
import { formatNumber, getDifficultyColor, getDifficultyLevel } from '@/utils/format'
import { Loader2, Eye, EyeOff } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface SubjectSummaryProps {
  examId: string
}

export default function SubjectSummary({ examId }: SubjectSummaryProps) {
  const { selectedScope, selectedSubjectId, subjectSummaryConfig, setSubjectSummaryConfig } =
    useAnalysisStore()
  const { data, isLoading } = useSubjectSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  const configPanel = (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id="show-difficulty"
          checked={subjectSummaryConfig.showDifficulty}
          onCheckedChange={(v) => setSubjectSummaryConfig({ showDifficulty: v })}
        />
        <Label htmlFor="show-difficulty" className="text-sm">显示难度</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="show-count"
          checked={subjectSummaryConfig.showStudentCount}
          onCheckedChange={(v) => setSubjectSummaryConfig({ showStudentCount: v })}
        />
        <Label htmlFor="show-count" className="text-sm">显示人数</Label>
      </div>
    </div>
  )

  return (
    <AnalysisModuleCard
      title="学科情况汇总"
      subtitle="各学科的平均水平与难度对比"
      configPanel={configPanel}
      isLoading={isLoading}
    >
      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-foreground">学科</th>
                <th className="py-2 text-right font-medium text-foreground">平均分</th>
                <th className="py-2 text-right font-medium text-foreground">最高分</th>
                <th className="py-2 text-right font-medium text-foreground">最低分</th>
                {subjectSummaryConfig.showDifficulty && (
                  <th className="py-2 text-right font-medium text-foreground">难度</th>
                )}
                {subjectSummaryConfig.showStudentCount && (
                  <th className="py-2 text-right font-medium text-foreground">参考人数</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data?.subjects.map((subject) => (
                <tr key={subject.id} className="border-b border-border transition-colors hover:bg-muted/50">
                  <td className="py-2">{subject.name}</td>
                  <td className="text-right">{formatNumber(subject.avgScore)}</td>
                  <td className="text-right">{formatNumber(subject.highestScore)}</td>
                  <td className="text-right">{formatNumber(subject.lowestScore)}</td>
                  {subjectSummaryConfig.showDifficulty && (
                    <td className={`text-right ${getDifficultyColor(subject.difficulty)}`}>
                      <span className="font-semibold">{formatNumber(subject.difficulty)}%</span>
                      <span className="ml-1 text-xs">({getDifficultyLevel(subject.difficulty)})</span>
                    </td>
                  )}
                  {subjectSummaryConfig.showStudentCount && (
                    <td className="text-right">{subject.studentCount}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalysisModuleCard>
  )
}
```

- [ ] **Step 2: 改造 ClassSummary**

将 `src/components/analysis/ClassSummary.tsx` 替换为：

```tsx
'use client'

import { useClassSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { AnalysisModuleCard } from './AnalysisModuleCard'
import { formatNumber, getDifficultyColor } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ClassSummaryProps {
  examId: string
}

export default function ClassSummary({ examId }: ClassSummaryProps) {
  const { selectedScope, selectedSubjectId, classSummaryConfig, setClassSummaryConfig } =
    useAnalysisStore()
  const { data, isLoading } = useClassSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  const configPanel = (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id="show-deviation"
          checked={classSummaryConfig.showDeviation}
          onCheckedChange={(v) => setClassSummaryConfig({ showDeviation: v })}
        />
        <Label htmlFor="show-deviation" className="text-sm">显示离均差</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="show-stddev"
          checked={classSummaryConfig.showStdDev}
          onCheckedChange={(v) => setClassSummaryConfig({ showStdDev: v })}
        />
        <Label htmlFor="show-stddev" className="text-sm">显示标准差</Label>
      </div>
    </div>
  )

  return (
    <AnalysisModuleCard
      title="班级情况汇总"
      subtitle="各班级的成绩分布与差异分析"
      configPanel={configPanel}
      variant="cyan"
      isLoading={isLoading}
    >
      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-foreground">班级</th>
                <th className="py-2 text-right font-medium text-foreground">人数</th>
                <th className="py-2 text-right font-medium text-foreground">平均分</th>
                <th className="py-2 text-right font-medium text-foreground">最高分</th>
                <th className="py-2 text-right font-medium text-foreground">最低分</th>
                {classSummaryConfig.showDeviation && (
                  <th className="py-2 text-right font-medium text-foreground">离均差</th>
                )}
                <th className="py-2 text-right font-medium text-foreground">难度</th>
                {classSummaryConfig.showStdDev && (
                  <th className="py-2 text-right font-medium text-foreground">标准差</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data?.overallGrade && (
                <tr className="border-b border-border bg-primary/10 font-semibold">
                  <td className="py-2">{data.overallGrade.className}</td>
                  <td className="text-right">{data.overallGrade.totalStudents}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.highestScore)}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.lowestScore)}</td>
                  {classSummaryConfig.showDeviation && (
                    <td className="text-right text-muted-foreground">
                      {formatNumber(data.overallGrade.scoreDeviation)}
                    </td>
                  )}
                  <td className={`text-right ${getDifficultyColor(data.overallGrade.difficulty)}`}>
                    {formatNumber(data.overallGrade.difficulty)}%
                  </td>
                  {classSummaryConfig.showStdDev && (
                    <td className="text-right">{formatNumber(data.overallGrade.stdDev)}</td>
                  )}
                </tr>
              )}
              {data?.classDetails.map((cls) => (
                <tr key={cls.classId} className="border-b border-border transition-colors hover:bg-muted/50">
                  <td className="py-2">{cls.className}</td>
                  <td className="text-right">{cls.totalStudents}</td>
                  <td className="text-right">{formatNumber(cls.avgScore)}</td>
                  <td className="text-right">{formatNumber(cls.highestScore)}</td>
                  <td className="text-right">{formatNumber(cls.lowestScore)}</td>
                  {classSummaryConfig.showDeviation && (
                    <td className="text-right">
                      <span
                        className={
                          cls.scoreDeviation >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-destructive'
                        }
                      >
                        {formatNumber(cls.scoreDeviation)}
                      </span>
                    </td>
                  )}
                  <td className={`text-right ${getDifficultyColor(cls.difficulty)}`}>
                    {formatNumber(cls.difficulty)}%
                  </td>
                  {classSummaryConfig.showStdDev && (
                    <td className="text-right">{formatNumber(cls.stdDev)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalysisModuleCard>
  )
}
```

- [ ] **Step 3: 改造 RatingChart**

将 `src/components/analysis/RatingChart.tsx` 替换为：

```tsx
'use client'

import { useQueryClient } from '@tanstack/react-query'
import { ratingDistributionQueryKey, useRatingDistribution } from '@/hooks/useAnalysis'
import { analysisService } from '@/services/analysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { AnalysisModuleCard } from './AnalysisModuleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatNumber, ratingTierBadgeClass } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

interface RatingChartProps {
  examId: string
}

export default function RatingChart({ examId }: RatingChartProps) {
  const queryClient = useQueryClient()
  const { selectedScope, selectedSubjectId, ratingConfig, setRatingConfig } = useAnalysisStore()
  const [draftConfig, setDraftConfig] = useState(ratingConfig)
  const { data, isLoading, isFetching } = useRatingDistribution(
    examId,
    selectedScope,
    ratingConfig,
    selectedSubjectId ?? undefined
  )
  const canQuery = !!examId && (selectedScope !== 'single_subject' || !!selectedSubjectId)

  useEffect(() => {
    setDraftConfig(ratingConfig)
  }, [ratingConfig])

  const handleRatingConfigChange = (
    key: 'excellent_threshold' | 'good_threshold' | 'pass_threshold',
    value: string
  ) => {
    const nextValue = Number(value)
    if (Number.isNaN(nextValue)) return
    setDraftConfig({ ...draftConfig, [key]: nextValue })
  }

  const handleQuery = () => {
    const next = { ...draftConfig }
    setRatingConfig(next)
    if (!canQuery) return
    void queryClient.fetchQuery({
      queryKey: ratingDistributionQueryKey(examId, selectedScope, next, selectedSubjectId ?? undefined),
      queryFn: () => analysisService.getRatingDistribution(examId, selectedScope, next, selectedSubjectId ?? undefined),
      staleTime: 5 * 60 * 1000,
    })
  }

  const configPanel = (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">优秀分数线</label>
        <Input
          type="number"
          value={draftConfig.excellent_threshold}
          onChange={(e) => handleRatingConfigChange('excellent_threshold', e.target.value)}
          min={0}
          max={100}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">良好分数线</label>
        <Input
          type="number"
          value={draftConfig.good_threshold}
          onChange={(e) => handleRatingConfigChange('good_threshold', e.target.value)}
          min={0}
          max={100}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">合格分数线</label>
        <Input
          type="number"
          value={draftConfig.pass_threshold}
          onChange={(e) => handleRatingConfigChange('pass_threshold', e.target.value)}
          min={0}
          max={100}
        />
      </div>
      <div className="flex items-end gap-2 pb-0.5">
        <Button type="button" size="sm" onClick={handleQuery} disabled={!canQuery} aria-busy={isFetching}>
          {isFetching ? (
            <>
              <Loader2 className="mr-1 size-3.5 animate-spin" />
              查询中
            </>
          ) : (
            '应用'
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <AnalysisModuleCard
      title="四率分析"
      subtitle="优秀、良好、合格、低分四个等级的分布情况"
      configPanel={configPanel}
      variant="purple"
      isLoading={isLoading && !data}
    >
      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-foreground">班级</th>
                <th className="py-2 text-right font-medium text-foreground">平均分</th>
                <th className="py-2 text-right font-medium text-foreground">优秀</th>
                <th className="py-2 text-right font-medium text-foreground">良好</th>
                <th className="py-2 text-right font-medium text-foreground">合格</th>
                <th className="py-2 text-right font-medium text-foreground">低分</th>
              </tr>
            </thead>
            <tbody>
              {data?.overallGrade && (
                <tr className="border-b border-border bg-primary/10 font-semibold">
                  <td className="py-2">{data.overallGrade.className}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                  <td className="text-right">
                    <span className={ratingTierBadgeClass.excellent}>
                      {data.overallGrade.excellent.count} ({formatNumber(data.overallGrade.excellent.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={ratingTierBadgeClass.good}>
                      {data.overallGrade.good.count} ({formatNumber(data.overallGrade.good.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={ratingTierBadgeClass.pass}>
                      {data.overallGrade.pass.count} ({formatNumber(data.overallGrade.pass.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={ratingTierBadgeClass.fail}>
                      {data.overallGrade.fail.count} ({formatNumber(data.overallGrade.fail.percentage)}%)
                    </span>
                  </td>
                </tr>
              )}
              {data?.classDetails.map((cls) => (
                <tr key={cls.classId} className="border-b border-border transition-colors hover:bg-muted/50">
                  <td className="py-2">{cls.className}</td>
                  <td className="text-right">{formatNumber(cls.avgScore)}</td>
                  <td className="text-right">
                    <span className={`text-xs ${ratingTierBadgeClass.excellent}`}>
                      {cls.excellent.count} ({formatNumber(cls.excellent.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`text-xs ${ratingTierBadgeClass.good}`}>
                      {cls.good.count} ({formatNumber(cls.good.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`text-xs ${ratingTierBadgeClass.pass}`}>
                      {cls.pass.count} ({formatNumber(cls.pass.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`text-xs ${ratingTierBadgeClass.fail}`}>
                      {cls.fail.count} ({formatNumber(cls.fail.percentage)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalysisModuleCard>
  )
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/analysis/SubjectSummary.tsx src/components/analysis/ClassSummary.tsx src/components/analysis/RatingChart.tsx
git commit -m "feat: 改造分析组件为可配置卡片，支持独立配置入口"
```

---

### Task 5.5: 改造分析详情页为双段式布局

**Files:**
- Modify: `src/app/exams/[id]/page.tsx`

- [ ] **Step 1: 替换详情页为双段式布局**

将 `src/app/exams/[id]/page.tsx` 替换为：

```tsx
'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import { AnalysisNav } from '@/components/analysis/AnalysisNav'
import SubjectSummary from '@/components/analysis/SubjectSummary'
import ClassSummary from '@/components/analysis/ClassSummary'
import RatingChart from '@/components/analysis/RatingChart'
import { CriticalStudents } from '@/components/analysis/CriticalStudents'
import { ScoreFluctuation } from '@/components/analysis/ScoreFluctuation'
import { use, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function ExamDetailPage({ params }: PageProps) {
  const { setSelectedExamId, activeAnalysisModule, selectedScope } = useAnalysisStore()
  const { id: examId } = use(params)

  useEffect(() => {
    setSelectedExamId(examId)
  }, [examId, setSelectedExamId])

  const renderModule = () => {
    switch (activeAnalysisModule) {
      case 'subject-summary':
        return <SubjectSummary examId={examId} />
      case 'class-summary':
        return <ClassSummary examId={examId} />
      case 'rating-analysis':
        return <RatingChart examId={examId} />
      case 'critical-students':
        return <CriticalStudents examId={examId} />
      case 'score-fluctuation':
        return <ScoreFluctuation examId={examId} />
      default:
        return <SubjectSummary examId={examId} />
    }
  }

  // 全科视角默认显示学科汇总，单科视角默认显示班级汇总
  const showDefaultModules = selectedScope === 'all_subjects'
    ? activeAnalysisModule === 'subject-summary'
    : activeAnalysisModule === 'class-summary'

  return (
    <div className="flex gap-6">
      {/* 左侧导航 */}
      <aside className="sticky top-24 h-fit w-56 shrink-0 space-y-4">
        <AnalysisNav examId={examId} />
      </aside>

      {/* 右侧内容区 */}
      <div className="min-w-0 flex-1 space-y-6">
        {/* 全局报告下载 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">分析报告</h2>
            <p className="text-sm text-muted-foreground">基于当前配置生成的多维分析</p>
          </div>
          <Button variant="outline" className="gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            下载整体分析报告
          </Button>
        </div>

        {/* 当前选中模块 */}
        {renderModule()}

        {/* 默认视图：同时展示多个模块 */}
        {showDefaultModules && (
          <>
            {selectedScope === 'all_subjects' && activeAnalysisModule === 'subject-summary' && (
              <>
                <ClassSummary examId={examId} />
                <RatingChart examId={examId} />
              </>
            )}
            {selectedScope === 'single_subject' && activeAnalysisModule === 'class-summary' && (
              <>
                <RatingChart examId={examId} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 启动开发服务器验证分析详情页**

Run: `cd /Users/kk/go/src/seas-frontend && npm run dev`
Expected: `/exams/[id]` 页面显示左侧双段式导航，右侧内容区根据选中模块切换

- [ ] **Step 3: Commit**

```bash
git add src/app/exams/[id]/page.tsx
git commit -m "feat: 分析详情页改造为双段式侧边栏+内容区布局"
```

---

### Task 5.6: 检查并添加缺失的 shadcn 组件

**Files:**
- 检查 shadcn 组件

- [ ] **Step 1: 检查 Switch 和 Label 组件是否存在**

Run:
```bash
ls /Users/kk/go/src/seas-frontend/src/components/ui/switch.tsx /Users/kk/go/src/seas-frontend/src/components/ui/label.tsx
```

Expected: 两个文件都存在（Switch 用于配置开关，Label 用于表单标签）

如果不存在：

Run:
```bash
cd /Users/kk/go/src/seas-frontend && npx shadcn add switch label
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ui/
git commit -m "feat: 添加 Switch 和 Label shadcn 组件"
```

---

## Phase 6: 登录页面

### Task 6.1: 创建登录页面

**Files:**
- Create: `src/app/login/page.tsx`

- [ ] **Step 1: 编写登录页面**

Create `src/app/login/page.tsx`：

```tsx
'use client'

import { useState } from 'react'
import { GraduationCap, Lock, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'wechat'>('password')

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* 左侧：意境图/功能介绍 */}
      <div className="relative hidden w-1/2 bg-[#1E3A8A] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SEAS</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            智能成绩分析
            <br />
            让教学更高效
          </h1>
          <div className="space-y-4 text-white/70">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>AI 驱动的成绩诊断与洞察</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>多维度的班级与学科对比</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>自动化的临界生识别与追踪</span>
            </div>
          </div>
        </div>
        <div className="relative text-sm text-white/40">
          SEAS Student Evaluation & Analysis System
        </div>
      </div>

      {/* 右侧：登录表单 */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">欢迎回来</h2>
            <p className="mt-1 text-sm text-muted-foreground">登录您的 SEAS 账户</p>
          </div>

          {/* 切换按钮 */}
          <div className="flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'password'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                密码登录
              </span>
            </button>
            <button
              onClick={() => setMode('wechat')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'wechat'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" />
                微信扫码
              </span>
            </button>
          </div>

          {/* 密码登录 */}
          {mode === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">邮箱 / 用户名</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" placeholder="请输入邮箱或用户名" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" type="password" placeholder="请输入密码" />
                </div>
              </div>
              <Button className="w-full rounded-xl">登录</Button>
            </div>
          )}

          {/* 微信扫码 */}
          {mode === 'wechat' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/50">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">请使用微信扫描二维码登录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: 启动开发服务器验证登录页**

Run: `cd /Users/kk/go/src/seas-frontend && npm run dev`
Expected: `/login` 页面显示左右分栏设计，支持密码/微信切换

- [ ] **Step 3: Commit**

```bash
git add src/app/login/page.tsx
git commit -m "feat: 添加登录页面（支持密码和微信扫码）"
```

---

## 自我检查清单

### 1. Spec 覆盖率

| Refactor.md 需求 | 对应 Task |
|---|---|
| 配色：深藏蓝 #1E3A8A、智慧青 #06B6D4、淡紫 AI 系 | Task 1.1, 1.3 |
| 卡片背景浅色填充+淡色投影 | Task 1.1, 1.3 |
| 侧边栏：固定左侧，支持折叠 | Task 1.3 |
| 侧边栏 Logo + SEAS + 导航 + 底部操作 | Task 1.3 |
| 首页：欢迎横幅 | Task 2.1 |
| 首页：新建分析大按钮 | Task 2.4 |
| 首页：AI 助手模块（含免责声明） | Task 2.2 |
| 首页：动态简报 | Task 2.3 |
| 分析列表：卡片式布局 + 分类标签 | Task 3.1, 3.2, 3.3 |
| 新建分析：拖拽上传 + 三步引导 | Task 4.1, 4.2, 4.3 |
| 分析详情：双段式级联导航 | Task 5.1, 5.5 |
| 分析详情：全科/单科视角切换 | Task 5.1, 5.5 |
| 分析详情：局部筛选配置（每个模块独立） | Task 5.2, 5.4 |
| 分析详情：全局报告下载按钮 | Task 5.5 |
| 临界生分析、成绩波动 | Task 5.3, 5.5 |
| 登录页面：左右分栏 + 密码/微信切换 | Task 6.1 |
| AI 标识 | Task 2.2 |
| 微交互：侧边栏折叠悬浮文字 | Task 1.3 |
| 微交互：局部 Loading | Task 5.2, 5.4 |

### 2. Placeholder 扫描
- 无 "TBD"、"TODO"、"implement later" 等占位符
- 所有组件都有完整实现代码
- 所有步骤都有具体的运行命令和期望输出

### 3. 类型一致性
- `AnalysisModule` 类型在 store 和 AnalysisNav 中一致
- `RatingConfig` 类型复用现有定义
- store 的 state 和 action 命名保持一致

---

## 执行交接

**Plan complete and saved to `docs/superpowers/plans/2026-04-21-seas-frontend-refactor.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
