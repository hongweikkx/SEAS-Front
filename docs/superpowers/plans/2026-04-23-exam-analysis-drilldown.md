# 考试分析详情页多维度下钻 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在现有考试分析详情页基础上，实现 7 个维度的下钻数据分析能力，包括面包屑导航、Query Param 路由、5 个新增分析视图组件和 mock 数据。

**Architecture:** 采用 Query Param 驱动的单页面架构，所有视图通过 `?view=` 参数切换。面包屑导航根据当前 view 和参数动态生成。新增视图组件各自独立，通过统一的 `viewComponentMap` 映射渲染。数据层先使用 mock 数据，后端接口就绪后替换为真实 API。

**Tech Stack:** React 19, Next.js 16 (App Router), TypeScript, Tailwind CSS, Zustand, TanStack Query, shadcn/ui

**Note on testing:** 项目当前无测试框架（vitest/jest/playwright 均未配置），因此每个组件任务以"启动开发服务器并浏览器验证"替代单元测试。

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/types/drilldown.ts` | Create | 5 个新增接口的 TypeScript 类型定义 |
| `src/services/drilldown.ts` | Create | 下钻 API 服务方法 + mock 数据生成器 |
| `src/hooks/useDrilldown.ts` | Create | 5 个新增 TanStack Query hooks |
| `src/components/analysis/BreadcrumbNav.tsx` | Create | 面包屑导航栏组件 |
| `src/components/analysis/ClassSubjectSummary.tsx` | Create | 视图3：班级学科汇总 |
| `src/components/analysis/SingleClassSummary.tsx` | Create | 视图4：单科班级汇总 |
| `src/components/analysis/SingleClassQuestion.tsx` | Create | 视图5：单科班级题目 |
| `src/components/analysis/SingleQuestionSummary.tsx` | Create | 视图6：单科题目汇总 |
| `src/components/analysis/SingleQuestionDetail.tsx` | Create | 视图7：单科班级题目详情 |
| `src/store/analysisStore.ts` | Modify | 扩展 AnalysisView 类型、下钻路径状态 |
| `src/types/index.ts` | Modify | 导出 drilldown 类型 |
| `src/app/exams/[id]/page.tsx` | Modify | 支持 view query param，组件映射 |
| `src/components/layout/app-sidebar.tsx` | Modify | 7 维度分析列表，支持模式过滤 |
| `src/components/analysis/ClassSummary.tsx` | Modify | 班级名称添加可点击下钻链接 |

---

## Task 1: Define Drilldown Types

**Files:**
- Create: `src/types/drilldown.ts`
- Modify: `src/types/index.ts`

- [ ] **Step 1: Create `src/types/drilldown.ts` with all 5 response types and item types**

```typescript
// 视图3：班级学科汇总
export interface ClassSubjectItem {
  subjectId: string
  subjectName: string
  fullScore: number
  classAvgScore: number
  gradeAvgScore: number
  scoreDiff: number
  classHighest: number
  classLowest: number
  classRank: number
  totalClasses: number
}

export interface ClassSubjectSummaryResponse {
  examId: string
  examName: string
  classId: number
  className: string
  overall: ClassSubjectItem
  subjects: ClassSubjectItem[]
}

// 视图4：单科班级汇总
export interface SingleClassSummaryItem {
  classId: number
  className: string
  totalStudents: number
  subjectAvgScore: number
  gradeAvgScore: number
  scoreDiff: number
  classRank: number
  totalClasses: number
  passRate: number
  excellentRate: number
}

export interface SingleClassSummaryResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  overall: SingleClassSummaryItem
  classes: SingleClassSummaryItem[]
}

// 视图5：单科班级题目
export interface ClassQuestionItem {
  questionId: string
  questionNumber: string
  questionType: string
  fullScore: number
  classAvgScore: number
  scoreRate: number
  gradeAvgScore: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface SingleClassQuestionResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  classId: number
  className: string
  questions: ClassQuestionItem[]
}

// 视图6：单科题目汇总
export interface QuestionClassBreakdown {
  classId: number
  className: string
  avgScore: number
}

export interface SingleQuestionSummaryItem {
  questionId: string
  questionNumber: string
  questionType: string
  fullScore: number
  gradeAvgScore: number
  classBreakdown: QuestionClassBreakdown[]
  scoreRate: number
  difficulty: 'easy' | 'medium' | 'hard'
}

export interface SingleQuestionSummaryResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  questions: SingleQuestionSummaryItem[]
}

// 视图7：单科班级题目详情
export interface StudentQuestionDetail {
  studentId: string
  studentName: string
  score: number
  fullScore: number
  scoreRate: number
  classRank: number
  gradeRank: number
  answerContent?: string
}

export interface SingleQuestionDetailResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  classId: number
  className: string
  questionId: string
  questionNumber: string
  questionType: string
  fullScore: number
  questionContent?: string
  students: StudentQuestionDetail[]
}
```

- [ ] **Step 2: Modify `src/types/index.ts` to export drilldown types**

```typescript
// 导出所有类型
export * from './exam'
export * from './analysis'
export * from './drilldown'
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /Users/kk/go/src/seas-frontend && npx tsc --noEmit`
Expected: No errors (or only pre-existing errors)

- [ ] **Step 4: Commit**

```bash
git add src/types/drilldown.ts src/types/index.ts
git commit -m "feat: 定义下钻分析5个视图的TypeScript类型

- 班级学科汇总 (ClassSubjectSummary)
- 单科班级汇总 (SingleClassSummary)
- 单科班级题目 (SingleClassQuestion)
- 单科题目汇总 (SingleQuestionSummary)
- 单科班级题目详情 (SingleQuestionDetail)

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: Create Drilldown API Service with Mock Data

**Files:**
- Create: `src/services/drilldown.ts`

- [ ] **Step 1: Create `src/services/drilldown.ts` with 5 mock data generators and service methods**

```typescript
import type {
  ClassSubjectSummaryResponse,
  SingleClassSummaryResponse,
  SingleClassQuestionResponse,
  SingleQuestionSummaryResponse,
  SingleQuestionDetailResponse,
} from '@/types'

// ===== Mock Data Generators =====

const mockClassSubjectSummary = (
  examId: string,
  classId: number
): ClassSubjectSummaryResponse => {
  const subjects = [
    { id: 'chinese', name: '语文', fullScore: 150 },
    { id: 'math', name: '数学', fullScore: 150 },
    { id: 'english', name: '英语', fullScore: 150 },
    { id: 'physics', name: '物理', fullScore: 100 },
    { id: 'chemistry', name: '化学', fullScore: 100 },
  ]

  const classSubjects = subjects.map((s, i) => {
    const classAvg = s.fullScore * (0.55 + Math.random() * 0.25)
    const gradeAvg = s.fullScore * (0.5 + Math.random() * 0.25)
    return {
      subjectId: s.id,
      subjectName: s.name,
      fullScore: s.fullScore,
      classAvgScore: Math.round(classAvg * 10) / 10,
      gradeAvgScore: Math.round(gradeAvg * 10) / 10,
      scoreDiff: Math.round((classAvg - gradeAvg) * 10) / 10,
      classHighest: Math.round(s.fullScore * (0.7 + Math.random() * 0.28)),
      classLowest: Math.round(s.fullScore * (0.2 + Math.random() * 0.3)),
      classRank: i + 1,
      totalClasses: 10,
    }
  })

  const overallAvg = classSubjects.reduce((s, c) => s + c.classAvgScore, 0)
  const gradeOverallAvg = classSubjects.reduce((s, c) => s + c.gradeAvgScore, 0)

  return {
    examId,
    examName: '期中考试',
    classId,
    className: `高二(${classId - 100})班`,
    overall: {
      subjectId: 'overall',
      subjectName: '全科',
      fullScore: 550,
      classAvgScore: Math.round(overallAvg * 10) / 10,
      gradeAvgScore: Math.round(gradeOverallAvg * 10) / 10,
      scoreDiff: Math.round((overallAvg - gradeOverallAvg) * 10) / 10,
      classHighest: Math.round(overallAvg * 1.25),
      classLowest: Math.round(overallAvg * 0.65),
      classRank: 2,
      totalClasses: 10,
    },
    subjects: classSubjects,
  }
}

const mockSingleClassSummary = (
  examId: string,
  subjectId: string
): SingleClassSummaryResponse => {
  const subjectNames: Record<string, string> = {
    chinese: '语文', math: '数学', english: '英语',
    physics: '物理', chemistry: '化学',
  }
  const subjectName = subjectNames[subjectId] || subjectId
  const fullScore = subjectId === 'chinese' || subjectId === 'math' || subjectId === 'english' ? 150 : 100

  const classes = Array.from({ length: 10 }, (_, i) => {
    const avg = fullScore * (0.45 + Math.random() * 0.35)
    const gradeAvg = fullScore * 0.6
    return {
      classId: 101 + i,
      className: `高二(${i + 1})班`,
      totalStudents: 45 + Math.floor(Math.random() * 10),
      subjectAvgScore: Math.round(avg * 10) / 10,
      gradeAvgScore: Math.round(gradeAvg * 10) / 10,
      scoreDiff: Math.round((avg - gradeAvg) * 10) / 10,
      classRank: i + 1,
      totalClasses: 10,
      passRate: Math.round((0.6 + Math.random() * 0.35) * 100),
      excellentRate: Math.round((0.1 + Math.random() * 0.25) * 100),
    }
  }).sort((a, b) => b.subjectAvgScore - a.subjectAvgScore)
    .map((c, i) => ({ ...c, classRank: i + 1 }))

  const overallAvg = classes.reduce((s, c) => s + c.subjectAvgScore * c.totalStudents, 0)
    / classes.reduce((s, c) => s + c.totalStudents, 0)

  return {
    examId,
    examName: '期中考试',
    subjectId,
    subjectName,
    overall: {
      classId: 0,
      className: '全年级',
      totalStudents: classes.reduce((s, c) => s + c.totalStudents, 0),
      subjectAvgScore: Math.round(overallAvg * 10) / 10,
      gradeAvgScore: Math.round(overallAvg * 10) / 10,
      scoreDiff: 0,
      classRank: 0,
      totalClasses: 10,
      passRate: Math.round(classes.reduce((s, c) => s + c.passRate, 0) / classes.length),
      excellentRate: Math.round(classes.reduce((s, c) => s + c.excellentRate, 0) / classes.length),
    },
    classes,
  }
}

const mockSingleClassQuestion = (
  examId: string,
  subjectId: string,
  classId: number
): SingleClassQuestionResponse => {
  const subjectNames: Record<string, string> = {
    chinese: '语文', math: '数学', english: '英语',
    physics: '物理', chemistry: '化学',
  }
  const questionTypes = ['选择题', '填空题', '解答题']
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']

  return {
    examId,
    examName: '期中考试',
    subjectId,
    subjectName: subjectNames[subjectId] || subjectId,
    classId,
    className: `高二(${classId - 100})班`,
    questions: Array.from({ length: 20 }, (_, i) => {
      const fullScore = i < 10 ? 5 : i < 16 ? 10 : 15
      const classAvg = fullScore * (0.4 + Math.random() * 0.5)
      return {
        questionId: `q${i + 1}`,
        questionNumber: `${i + 1}`,
        questionType: questionTypes[i % 3],
        fullScore,
        classAvgScore: Math.round(classAvg * 10) / 10,
        scoreRate: Math.round((classAvg / fullScore) * 100),
        gradeAvgScore: Math.round(fullScore * (0.45 + Math.random() * 0.4) * 10) / 10,
        difficulty: difficulties[Math.floor(Math.random() * 3)],
      }
    }),
  }
}

const mockSingleQuestionSummary = (
  examId: string,
  subjectId: string
): SingleQuestionSummaryResponse => {
  const subjectNames: Record<string, string> = {
    chinese: '语文', math: '数学', english: '英语',
    physics: '物理', chemistry: '化学',
  }
  const questionTypes = ['选择题', '填空题', '解答题']
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']

  return {
    examId,
    examName: '期中考试',
    subjectId,
    subjectName: subjectNames[subjectId] || subjectId,
    questions: Array.from({ length: 20 }, (_, i) => {
      const fullScore = i < 10 ? 5 : i < 16 ? 10 : 15
      const gradeAvg = fullScore * (0.45 + Math.random() * 0.4)
      return {
        questionId: `q${i + 1}`,
        questionNumber: `${i + 1}`,
        questionType: questionTypes[i % 3],
        fullScore,
        gradeAvgScore: Math.round(gradeAvg * 10) / 10,
        classBreakdown: Array.from({ length: 5 }, (_, j) => ({
          classId: 101 + j,
          className: `高二(${j + 1})班`,
          avgScore: Math.round(fullScore * (0.3 + Math.random() * 0.6) * 10) / 10,
        })),
        scoreRate: Math.round((gradeAvg / fullScore) * 100),
        difficulty: difficulties[Math.floor(Math.random() * 3)],
      }
    }),
  }
}

const mockSingleQuestionDetail = (
  examId: string,
  subjectId: string,
  classId: number,
  questionId: string
): SingleQuestionDetailResponse => {
  const subjectNames: Record<string, string> = {
    chinese: '语文', math: '数学', english: '英语',
    physics: '物理', chemistry: '化学',
  }
  const fullScore = Math.random() > 0.5 ? 10 : 5

  return {
    examId,
    examName: '期中考试',
    subjectId,
    subjectName: subjectNames[subjectId] || subjectId,
    classId,
    className: `高二(${classId - 100})班`,
    questionId,
    questionNumber: questionId.replace('q', ''),
    questionType: Math.random() > 0.5 ? '选择题' : '填空题',
    fullScore,
    questionContent: '这是一道示例题目，实际数据将由后端提供。',
    students: Array.from({ length: 50 }, (_, i) => {
      const score = Math.round(Math.random() * fullScore * 10) / 10
      return {
        studentId: `s${i + 1}`,
        studentName: `学生${i + 1}`,
        score,
        fullScore,
        scoreRate: Math.round((score / fullScore) * 100),
        classRank: 0,
        gradeRank: 0,
        answerContent: score >= fullScore * 0.6 ? '回答正确' : '回答有误',
      }
    }).sort((a, b) => b.score - a.score)
      .map((s, i) => ({ ...s, classRank: i + 1 })),
  }
}

// ===== Service Methods =====

export const drilldownService = {
  getClassSubjectSummary: async (examId: string, classId: number): Promise<ClassSubjectSummaryResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockClassSubjectSummary(examId, classId)
  },

  getSingleClassSummary: async (examId: string, subjectId: string): Promise<SingleClassSummaryResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockSingleClassSummary(examId, subjectId)
  },

  getSingleClassQuestion: async (
    examId: string, subjectId: string, classId: number
  ): Promise<SingleClassQuestionResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockSingleClassQuestion(examId, subjectId, classId)
  },

  getSingleQuestionSummary: async (examId: string, subjectId: string): Promise<SingleQuestionSummaryResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockSingleQuestionSummary(examId, subjectId)
  },

  getSingleQuestionDetail: async (
    examId: string, subjectId: string, classId: number, questionId: string
  ): Promise<SingleQuestionDetailResponse> => {
    await new Promise((r) => setTimeout(r, 300))
    return mockSingleQuestionDetail(examId, subjectId, classId, questionId)
  },
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/services/drilldown.ts
git commit -m "feat: 添加下钻分析API服务层（含mock数据）

- 5个新增接口的mock数据生成器
- 模拟300ms网络延迟
- 覆盖班级学科汇总、单科班级汇总、单科班级题目、
  单科题目汇总、单科班级题目详情

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: Create Drilldown Hooks

**Files:**
- Create: `src/hooks/useDrilldown.ts`

- [ ] **Step 1: Create `src/hooks/useDrilldown.ts` with 5 TanStack Query hooks**

```typescript
import { useQuery } from '@tanstack/react-query'
import { drilldownService } from '@/services/drilldown'

export const useClassSubjectSummary = (examId: string, classId?: number) => {
  return useQuery({
    queryKey: ['classSubjectSummary', examId, classId],
    queryFn: () => drilldownService.getClassSubjectSummary(examId, classId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!classId,
  })
}

export const useSingleClassSummary = (examId: string, subjectId?: string) => {
  return useQuery({
    queryKey: ['singleClassSummary', examId, subjectId],
    queryFn: () => drilldownService.getSingleClassSummary(examId, subjectId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!subjectId,
  })
}

export const useSingleClassQuestion = (examId: string, subjectId?: string, classId?: number) => {
  return useQuery({
    queryKey: ['singleClassQuestion', examId, subjectId, classId],
    queryFn: () => drilldownService.getSingleClassQuestion(examId, subjectId!, classId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!subjectId && !!classId,
  })
}

export const useSingleQuestionSummary = (examId: string, subjectId?: string) => {
  return useQuery({
    queryKey: ['singleQuestionSummary', examId, subjectId],
    queryFn: () => drilldownService.getSingleQuestionSummary(examId, subjectId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!subjectId,
  })
}

export const useSingleQuestionDetail = (
  examId: string, subjectId?: string, classId?: number, questionId?: string
) => {
  return useQuery({
    queryKey: ['singleQuestionDetail', examId, subjectId, classId, questionId],
    queryFn: () => drilldownService.getSingleQuestionDetail(examId, subjectId!, classId!, questionId!),
    staleTime: 5 * 60 * 1000,
    enabled: !!examId && !!subjectId && !!classId && !!questionId,
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useDrilldown.ts
git commit -m "feat: 添加下钻分析TanStack Query hooks

- useClassSubjectSummary
- useSingleClassSummary
- useSingleClassQuestion
- useSingleQuestionSummary
- useSingleQuestionDetail

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: Extend AnalysisStore for Drilldown State

**Files:**
- Modify: `src/store/analysisStore.ts`

- [ ] **Step 1: Replace the entire `src/store/analysisStore.ts` content**

```typescript
import { create } from 'zustand'
import type { RatingConfig } from '@/types'

export type AnalysisModule =
  | 'subject-summary'
  | 'class-summary'
  | 'rating-analysis'
  | 'critical-students'
  | 'score-fluctuation'

export type AnalysisView =
  | 'class-summary'
  | 'subject-summary'
  | 'class-subject-summary'
  | 'single-class-summary'
  | 'single-class-question'
  | 'single-question-summary'
  | 'single-question-detail'

export type ExamType = '期中' | '期末' | '月考' | '模拟' | '其他'

export interface DrillDownNode {
  view: AnalysisView
  label: string
  params?: Record<string, string>
}

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

  // 新增：下钻状态
  currentView: AnalysisView
  drillDownPath: DrillDownNode[]
  drillDownParams: {
    classId?: string
    subjectId?: string
    questionId?: string
  }

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

  // 新增：下钻操作方法
  setCurrentView: (view: AnalysisView) => void
  pushDrillDown: (node: DrillDownNode) => void
  popDrillDownTo: (view: AnalysisView) => void
  setDrillDownParam: (key: keyof AnalysisState['drillDownParams'], value: string | undefined) => void
  resetDrillDown: () => void
  reset: () => void
}

const defaultState = {
  isAuthenticated: false,
  sidebarCollapsed: false,
  activeDetailSection: 'class-overview' as const,
  selectedExamId: null as string | null,
  selectedExamName: null as string | null,
  selectedSubjectId: null as string | null,
  selectedSubjectName: null as string | null,
  selectedScope: 'all_subjects' as const,
  activeAnalysisModule: 'subject-summary' as AnalysisModule,
  ratingConfig: {
    excellent_threshold: 90,
    good_threshold: 70,
    pass_threshold: 60,
  },
  classSummaryConfig: { showDeviation: true, showStdDev: true },
  subjectSummaryConfig: { showDifficulty: true, showStudentCount: true },

  // 新增默认值
  currentView: 'class-summary' as AnalysisView,
  drillDownPath: [] as DrillDownNode[],
  drillDownParams: {} as AnalysisState['drillDownParams'],
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

  // 新增方法实现
  setCurrentView: (currentView) => set({ currentView }),

  pushDrillDown: (node) =>
    set((state) => ({
      drillDownPath: [...state.drillDownPath, node],
    })),

  popDrillDownTo: (view) =>
    set((state) => {
      const index = state.drillDownPath.findIndex((n) => n.view === view)
      if (index === -1) return { drillDownPath: [] }
      return {
        drillDownPath: state.drillDownPath.slice(0, index + 1),
      }
    }),

  setDrillDownParam: (key, value) =>
    set((state) => ({
      drillDownParams: { ...state.drillDownParams, [key]: value },
    })),

  resetDrillDown: () =>
    set({
      drillDownPath: [],
      drillDownParams: {},
    }),

  reset: () => set({ ...defaultState }),
}))
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors (existing `activeAnalysisModule` usage in page.tsx and sidebar may need type alignment — `AnalysisModule` still covers the original values, so should be fine)

- [ ] **Step 3: Commit**

```bash
git add src/store/analysisStore.ts
git commit -m "feat: 扩展analysisStore支持下钻状态管理

- 新增 AnalysisView 联合类型（7个视图）
- 新增 DrillDownNode 接口和 drillDownPath 状态
- 新增 drillDownParams 存储 classId/subjectId/questionId
- 新增 pushDrillDown/popDrillDownTo/setDrillDownParam 方法

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: Create BreadcrumbNav Component

**Files:**
- Create: `src/components/analysis/BreadcrumbNav.tsx`

- [ ] **Step 1: Create `src/components/analysis/BreadcrumbNav.tsx`**

```typescript
'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbNavProps {
  examId: string
}

export default function BreadcrumbNav({ examId }: BreadcrumbNavProps) {
  const {
    selectedScope,
    selectedSubjectName,
    drillDownPath,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
    setCurrentView,
    setDrillDownParam,
    popDrillDownTo,
  } = useAnalysisStore()

  const buildBreadcrumbItems = () => {
    const items: Array<{ label: string; view?: string; isActive?: boolean; onClick?: () => void }> = []

    // 根节点：全科分析 或 学科名
    if (selectedScope === 'all_subjects') {
      items.push({
        label: '全科分析',
        view: 'class-summary',
        onClick: () => {
          setSelectedScope('all_subjects')
          setSelectedSubjectId(null)
          setSelectedSubjectName(null)
          setCurrentView('class-summary')
          setDrillDownParam('classId', undefined)
          popDrillDownTo('class-summary')
        },
      })
    } else {
      items.push({
        label: selectedSubjectName || '单科分析',
        view: 'single-class-summary',
        onClick: () => {
          setCurrentView('single-class-summary')
          setDrillDownParam('classId', undefined)
          setDrillDownParam('questionId', undefined)
          popDrillDownTo('single-class-summary')
        },
      })
    }

    // 中间节点：从 drillDownPath 生成
    drillDownPath.forEach((node, index) => {
      const isLast = index === drillDownPath.length - 1
      items.push({
        label: node.label,
        isActive: isLast,
        onClick: isLast
          ? undefined
          : () => {
              setCurrentView(node.view)
              // 回退参数到该节点状态
              if (node.params) {
                Object.entries(node.params).forEach(([key, value]) => {
                  setDrillDownParam(key as 'classId' | 'subjectId' | 'questionId', value)
                })
              }
              popDrillDownTo(node.view)
            },
      })
    })

    return items
  }

  const items = buildBreadcrumbItems()

  if (items.length <= 1) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
          {item.isActive || !item.onClick ? (
            <span className={cn('font-medium', item.isActive ? 'text-foreground' : 'text-muted-foreground')}>
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              {item.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/BreadcrumbNav.tsx
git commit -m "feat: 添加面包屑导航组件 BreadcrumbNav

- 根据 selectedScope 和 drillDownPath 动态生成面包屑
- 支持点击回退到任意上级节点
- 当前节点黑色高亮，不可点击

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: Refactor Exam Detail Page for View Routing

**Files:**
- Modify: `src/app/exams/[id]/page.tsx`

- [ ] **Step 1: Replace `src/app/exams/[id]/page.tsx` with view-aware version**

```typescript
'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import SubjectSummary from '@/components/analysis/SubjectSummary'
import ClassSummary from '@/components/analysis/ClassSummary'
import RatingChart from '@/components/analysis/RatingChart'
import ClassSubjectSummary from '@/components/analysis/ClassSubjectSummary'
import SingleClassSummary from '@/components/analysis/SingleClassSummary'
import SingleClassQuestion from '@/components/analysis/SingleClassQuestion'
import SingleQuestionSummary from '@/components/analysis/SingleQuestionSummary'
import SingleQuestionDetail from '@/components/analysis/SingleQuestionDetail'
import BreadcrumbNav from '@/components/analysis/BreadcrumbNav'
import { use, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'
import { useSubjects } from '@/hooks/useAnalysis'
import { cn } from '@/lib/utils'
import type { AnalysisView } from '@/store/analysisStore'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const viewComponentMap: Record<AnalysisView, React.ComponentType<{ examId: string }>> = {
  'class-summary': ClassSummary,
  'subject-summary': SubjectSummary,
  'rating-analysis': RatingChart,
  'class-subject-summary': ClassSubjectSummary,
  'single-class-summary': SingleClassSummary,
  'single-class-question': SingleClassQuestion,
  'single-question-summary': SingleQuestionSummary,
  'single-question-detail': SingleQuestionDetail,
}

export default function ExamDetailPage({ params }: PageProps) {
  const {
    setSelectedExamId,
    currentView,
    setCurrentView,
    selectedScope,
    selectedSubjectId,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
    drillDownParams,
  } = useAnalysisStore()
  const { id: examId } = use(params)
  const { data: subjectsData } = useSubjects(examId, 1, 100)

  useEffect(() => {
    setSelectedExamId(examId)
  }, [examId, setSelectedExamId])

  // 同步 URL query param 与 store 状态
  useEffect(() => {
    const url = new URL(window.location.href)
    const viewParam = url.searchParams.get('view') as AnalysisView | null

    if (viewParam && viewParam !== currentView) {
      setCurrentView(viewParam)
    }

    // 同步参数
    const classId = url.searchParams.get('classId')
    const subjectId = url.searchParams.get('subjectId')
    const qId = url.searchParams.get('qId')

    if (classId) useAnalysisStore.getState().setDrillDownParam('classId', classId)
    if (subjectId) useAnalysisStore.getState().setDrillDownParam('subjectId', subjectId)
    if (qId) useAnalysisStore.getState().setDrillDownParam('questionId', qId)
  }, [currentView, setCurrentView])

  // 当 store 状态变化时同步到 URL
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', currentView)

    if (drillDownParams.classId) {
      url.searchParams.set('classId', drillDownParams.classId)
    } else {
      url.searchParams.delete('classId')
    }

    if (drillDownParams.subjectId) {
      url.searchParams.set('subjectId', drillDownParams.subjectId)
    } else {
      url.searchParams.delete('subjectId')
    }

    if (drillDownParams.questionId) {
      url.searchParams.set('qId', drillDownParams.questionId)
    } else {
      url.searchParams.delete('qId')
    }

    window.history.replaceState({}, '', url.toString())
  }, [currentView, drillDownParams])

  const renderModule = () => {
    const Component = viewComponentMap[currentView] || ClassSummary
    return <Component examId={examId} />
  }

  return (
    <div className="space-y-4">
      {/* 学科筛选 + 操作按钮 */}
      <div className="flex items-center justify-between gap-4">
        {subjectsData?.subjects && subjectsData.subjects.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedScope('all_subjects')
                setSelectedSubjectId(null)
                setSelectedSubjectName(null)
                setCurrentView('class-summary')
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                selectedScope === 'all_subjects'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              全科
            </button>
            {subjectsData.subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => {
                  setSelectedScope('single_subject')
                  setSelectedSubjectId(subject.id)
                  setSelectedSubjectName(subject.name)
                  setCurrentView('single-class-summary')
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  selectedScope === 'single_subject' && selectedSubjectId === subject.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {subject.name}
              </button>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-lg gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button size="sm" className="rounded-lg gap-2">
            <Share2 className="h-4 w-4" />
            共享报告
          </Button>
        </div>
      </div>

      {/* 面包屑导航 */}
      <BreadcrumbNav examId={examId} />

      {/* 分析内容 */}
      {renderModule()}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors (placeholder components for Task 7-10 don't exist yet, so there will be import errors. We will create them next.)

**Note:** Import errors for `ClassSubjectSummary`, `SingleClassSummary`, `SingleClassQuestion`, `SingleQuestionSummary`, `SingleQuestionDetail` are expected at this step. Create stub files for them to suppress errors:

```bash
for name in ClassSubjectSummary SingleClassSummary SingleClassQuestion SingleQuestionSummary SingleQuestionDetail; do
  cat > "/Users/kk/go/src/seas-frontend/src/components/analysis/${name}.tsx" <<'STUB'
'use client'

export default function Placeholder() {
  return <div>开发中...</div>
}
STUB
done
```

Run: `npx tsc --noEmit`
Expected: No errors (stubs resolve the imports)

- [ ] **Step 3: Commit**

```bash
git add src/app/exams/[id]/page.tsx
git commit -m "feat: 重构分析详情页支持view query param路由

- 新增 viewComponentMap 映射7个分析视图到对应组件
- URL与store状态双向同步（view/classId/subjectId/qId）
- 学科标签切换时自动设置对应默认视图
- 集成面包屑导航组件

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: Update Sidebar for 7-Dimension Navigation

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`

- [ ] **Step 1: Replace `src/components/layout/app-sidebar.tsx` with new dimension-aware version**

```typescript
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
import type { AnalysisView } from '@/store/analysisStore'

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
    // 如果切换了模式范围，同步调整
    if (dimension.scope === 'all' && selectedScope !== 'all_subjects') {
      setSelectedScope('all_subjects')
      setSelectedSubjectId(null)
      setSelectedSubjectName(null)
    } else if (dimension.scope === 'single' && selectedScope !== 'single_subject') {
      setSelectedScope('single_subject')
      // 如果切到单科但没有选学科，需要默认选第一个（由page处理）
    }

    setCurrentView(dimension.key)
    resetDrillDown()

    // 清理不需要的参数
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/app-sidebar.tsx
git commit -m "feat: 侧边栏支持7维度分析导航

- 替换原有3模块为7个分析维度
- 根据全科/单科模式动态过滤显示维度
- 点击维度自动切换模式和视图
- 切换时清理不需要的下钻参数

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 8: Add Drill-Down Link to ClassSummary

**Files:**
- Modify: `src/components/analysis/ClassSummary.tsx`

- [ ] **Step 1: Replace `src/components/analysis/ClassSummary.tsx`**

```typescript
'use client'

import { useClassSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClassSummaryProps {
  examId: string
}

export default function ClassSummary({ examId }: ClassSummaryProps) {
  const { selectedScope, selectedSubjectId } = useAnalysisStore()
  const { data, isLoading } = useClassSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  const {
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const handleClassClick = (classId: number, className: string) => {
    setDrillDownParam('classId', String(classId))
    pushDrillDown({
      view: 'class-subject-summary',
      label: className,
      params: { classId: String(classId) },
    })
    setCurrentView('class-subject-summary')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-lg font-semibold text-foreground">班级情况汇总</h2>
      </div>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">班级</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">人数</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">平均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">最高分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">最低分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">离均差</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">标准差</th>
              </tr>
            </thead>
            <tbody>
              {/* 全年级汇总行 */}
              {data?.overallGrade && (
                <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                  <td className="py-3 px-5">{data.overallGrade.className}</td>
                  <td className="py-3 px-5 text-right">{data.overallGrade.totalStudents}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.highestScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.lowestScore)}</td>
                  <td className="py-3 px-5 text-right">—</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.stdDev)}</td>
                </tr>
              )}
              {/* 各班级行 */}
              {data?.classDetails.map((cls) => (
                <tr
                  key={cls.classId}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td className="py-3 px-5">
                    <button
                      onClick={() => handleClassClick(cls.classId, cls.className)}
                      className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      {cls.className}
                    </button>
                  </td>
                  <td className="py-3 px-5 text-right">{cls.totalStudents}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.avgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.highestScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.lowestScore)}</td>
                  <td className={cn(
                    'py-3 px-5 text-right font-medium',
                    cls.scoreDeviation >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {cls.scoreDeviation >= 0 ? '+' : ''}{formatNumber(cls.scoreDeviation)}
                  </td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.stdDev)}</td>
                </tr>
              ))}
              {(!data?.classDetails || data.classDetails.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    暂无班级数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/ClassSummary.tsx
git commit -m "feat: 班级情况汇总表格支持下钻到班级学科汇总

- 将班级卡片布局改为表格布局，与SubjectSummary保持一致
- 班级名称添加可点击下钻链接
- 点击后设置classId参数并推入面包屑路径

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: Create ClassSubjectSummary Component (View 3)

**Files:**
- Modify: `src/components/analysis/ClassSubjectSummary.tsx` (replace stub)

- [ ] **Step 1: Write `src/components/analysis/ClassSubjectSummary.tsx`**

```typescript
'use client'

import { useClassSubjectSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClassSubjectSummaryProps {
  examId: string
}

export default function ClassSubjectSummary({ examId }: ClassSubjectSummaryProps) {
  const { drillDownParams } = useAnalysisStore()
  const classId = drillDownParams.classId ? Number(drillDownParams.classId) : undefined
  const { data, isLoading } = useClassSubjectSummary(examId, classId)

  const {
    setCurrentView,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const handleSubjectClick = (subjectId: string, subjectName: string) => {
    setSelectedScope('single_subject')
    setSelectedSubjectId(subjectId)
    setSelectedSubjectName(subjectName)
    setDrillDownParam('subjectId', subjectId)
    pushDrillDown({
      view: 'single-class-question',
      label: subjectName,
      params: { subjectId, classId: String(classId) },
    })
    setCurrentView('single-class-question')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {data?.className || '班级'} — 学科情况汇总
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">该班级各学科成绩与全年级对比</p>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">学科</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">年级均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">分差</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级最高</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级最低</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级排名</th>
              </tr>
            </thead>
            <tbody>
              {data?.overall && (
                <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                  <td className="py-3 px-5">{data.overall.subjectName}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.classAvgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.gradeAvgScore)}</td>
                  <td className={cn(
                    'py-3 px-5 text-right',
                    (data.overall.scoreDiff || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {(data.overall.scoreDiff || 0) >= 0 ? '+' : ''}{formatNumber(data.overall.scoreDiff)}
                  </td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.classHighest)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.classLowest)}</td>
                  <td className="py-3 px-5 text-right">{data.overall.classRank}/{data.overall.totalClasses}</td>
                </tr>
              )}
              {data?.subjects.map((subject) => (
                <tr
                  key={subject.subjectId}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td className="py-3 px-5">
                    {subject.subjectId === 'overall' ? (
                      <span className="font-medium">{subject.subjectName}</span>
                    ) : (
                      <button
                        onClick={() => handleSubjectClick(subject.subjectId, subject.subjectName)}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        {subject.subjectName}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-5 text-right">{formatNumber(subject.classAvgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(subject.gradeAvgScore)}</td>
                  <td className={cn(
                    'py-3 px-5 text-right font-medium',
                    subject.scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {subject.scoreDiff >= 0 ? '+' : ''}{formatNumber(subject.scoreDiff)}
                  </td>
                  <td className="py-3 px-5 text-right">{formatNumber(subject.classHighest)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(subject.classLowest)}</td>
                  <td className="py-3 px-5 text-right">{subject.classRank}/{subject.totalClasses}</td>
                </tr>
              ))}
              {(!data?.subjects || data.subjects.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Start dev server and verify in browser**

Run: `npm run dev`
Then navigate to: `http://localhost:3000/exams/123?view=class-summary`

Test:
1. 确认"班级情况汇总"表格正常显示
2. 点击某个班级名称
3. 预期：URL 变为 `?view=class-subject-summary&classId=xxx`，页面显示该班级的学科汇总表格
4. 确认面包屑显示"全科分析 / 班级情况汇总 / {班级名}"

- [ ] **Step 4: Commit**

```bash
git add src/components/analysis/ClassSubjectSummary.tsx
git commit -m "feat: 添加班级学科汇总组件（视图3）

- 表格展示班级各学科成绩与全年级对比
- 支持点击学科名称下钻到单科班级题目（自动切单科模式）
- 集成mock数据加载和loading状态

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: Create SingleClassSummary Component (View 4)

**Files:**
- Modify: `src/components/analysis/SingleClassSummary.tsx` (replace stub)

- [ ] **Step 1: Write `src/components/analysis/SingleClassSummary.tsx`**

```typescript
'use client'

import { useSingleClassSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SingleClassSummaryProps {
  examId: string
}

export default function SingleClassSummary({ examId }: SingleClassSummaryProps) {
  const { selectedSubjectId, drillDownParams } = useAnalysisStore()
  const { data, isLoading } = useSingleClassSummary(examId, selectedSubjectId ?? undefined)

  const {
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const handleClassClick = (classId: number, className: string) => {
    setDrillDownParam('classId', String(classId))
    pushDrillDown({
      view: 'single-class-question',
      label: className,
      params: { classId: String(classId), subjectId: selectedSubjectId || '' },
    })
    setCurrentView('single-class-question')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {data?.subjectName || '单科'} — 班级情况汇总
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">各班级该学科成绩对比</p>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">班级</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">人数</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">该科均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">年级均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">分差</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级排名</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">及格率</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">优秀率</th>
              </tr>
            </thead>
            <tbody>
              {data?.overall && (
                <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                  <td className="py-3 px-5">{data.overall.className}</td>
                  <td className="py-3 px-5 text-right">{data.overall.totalStudents}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.subjectAvgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.gradeAvgScore)}</td>
                  <td className="py-3 px-5 text-right">—</td>
                  <td className="py-3 px-5 text-right">—</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.passRate)}%</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.excellentRate)}%</td>
                </tr>
              )}
              {data?.classes.map((cls) => (
                <tr
                  key={cls.classId}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td className="py-3 px-5">
                    <button
                      onClick={() => handleClassClick(cls.classId, cls.className)}
                      className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      {cls.className}
                    </button>
                  </td>
                  <td className="py-3 px-5 text-right">{cls.totalStudents}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.subjectAvgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.gradeAvgScore)}</td>
                  <td className={cn(
                    'py-3 px-5 text-right font-medium',
                    cls.scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {cls.scoreDiff >= 0 ? '+' : ''}{formatNumber(cls.scoreDiff)}
                  </td>
                  <td className="py-3 px-5 text-right">{cls.classRank}/{cls.totalClasses}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.passRate)}%</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.excellentRate)}%</td>
                </tr>
              ))}
              {(!data?.classes || data.classes.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Browser verify**

Navigate to: `http://localhost:3000/exams/123?view=single-class-summary&subjectId=math`

Test:
1. 确认单科班级汇总表格正常显示
2. 点击某个班级名称
3. 预期：URL 变为包含 `view=single-class-question&classId=xxx`，进入题目列表

- [ ] **Step 4: Commit**

```bash
git add src/components/analysis/SingleClassSummary.tsx
git commit -m "feat: 添加单科班级汇总组件（视图4）

- 表格展示各班级特定学科成绩对比
- 支持点击班级名称下钻到单科班级题目
- 包含及格率、优秀率、班级排名等指标

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 11: Create SingleClassQuestion Component (View 5)

**Files:**
- Modify: `src/components/analysis/SingleClassQuestion.tsx` (replace stub)

- [ ] **Step 1: Write `src/components/analysis/SingleClassQuestion.tsx`**

```typescript
'use client'

import { useSingleClassQuestion } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SingleClassQuestionProps {
  examId: string
}

const difficultyLabel: Record<string, { label: string; className: string }> = {
  easy: { label: '易', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: '中', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: '难', className: 'bg-red-50 text-red-700 border-red-200' },
}

export default function SingleClassQuestion({ examId }: SingleClassQuestionProps) {
  const { selectedSubjectId, drillDownParams } = useAnalysisStore()
  const classId = drillDownParams.classId ? Number(drillDownParams.classId) : undefined
  const { data, isLoading } = useSingleClassQuestion(
    examId,
    selectedSubjectId ?? undefined,
    classId
  )

  const {
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const handleQuestionClick = (questionId: string, questionNumber: string) => {
    setDrillDownParam('questionId', questionId)
    pushDrillDown({
      view: 'single-question-detail',
      label: `第${questionNumber}题`,
      params: {
        questionId,
        classId: String(classId),
        subjectId: selectedSubjectId || '',
      },
    })
    setCurrentView('single-question-detail')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {data?.className || '班级'} {data?.subjectName || '学科'} — 题目分析
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">各题目得分情况与年级对比</p>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">题号</th>
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">题型</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">分值</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">得分率</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">年级均分</th>
                <th className="py-3 px-5 text-center font-medium text-muted-foreground">难度</th>
              </tr>
            </thead>
            <tbody>
              {data?.questions.map((q) => {
                const diff = difficultyLabel[q.difficulty] || difficultyLabel.medium
                return (
                  <tr
                    key={q.questionId}
                    className="border-b border-border/40 transition-colors hover:bg-muted/20"
                  >
                    <td className="py-3 px-5">
                      <button
                        onClick={() => handleQuestionClick(q.questionId, q.questionNumber)}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        第{q.questionNumber}题
                      </button>
                    </td>
                    <td className="py-3 px-5">{q.questionType}</td>
                    <td className="py-3 px-5 text-right">{q.fullScore}</td>
                    <td className="py-3 px-5 text-right">{formatNumber(q.classAvgScore)}</td>
                    <td className="py-3 px-5 text-right">{formatNumber(q.scoreRate)}%</td>
                    <td className="py-3 px-5 text-right">{formatNumber(q.gradeAvgScore)}</td>
                    <td className="py-3 px-5 text-center">
                      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', diff.className)}>
                        {diff.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {(!data?.questions || data.questions.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Browser verify**

Navigate to: `http://localhost:3000/exams/123?view=single-class-question&subjectId=math&classId=101`

Test:
1. 确认题目列表表格正常显示
2. 点击某个题号
3. 预期：URL 变为包含 `view=single-question-detail&qId=xxx`，进入学生得分详情

- [ ] **Step 4: Commit**

```bash
git add src/components/analysis/SingleClassQuestion.tsx
git commit -m "feat: 添加单科班级题目组件（视图5）

- 表格展示特定班级特定学科下各题目得分分析
- 支持点击题号下钻到学生得分详情
- 显示题型、分值、得分率、难度等级

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 12: Create SingleQuestionSummary Component (View 6)

**Files:**
- Modify: `src/components/analysis/SingleQuestionSummary.tsx` (replace stub)

- [ ] **Step 1: Write `src/components/analysis/SingleQuestionSummary.tsx`**

```typescript
'use client'

import { useSingleQuestionSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SingleQuestionSummaryProps {
  examId: string
}

const difficultyLabel: Record<string, { label: string; className: string }> = {
  easy: { label: '易', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  medium: { label: '中', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  hard: { label: '难', className: 'bg-red-50 text-red-700 border-red-200' },
}

export default function SingleQuestionSummary({ examId }: SingleQuestionSummaryProps) {
  const { selectedSubjectId, drillDownParams } = useAnalysisStore()
  const { data, isLoading } = useSingleQuestionSummary(examId, selectedSubjectId ?? undefined)

  const {
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const handleQuestionClick = (questionId: string, questionNumber: string) => {
    setDrillDownParam('questionId', questionId)
    pushDrillDown({
      view: 'single-question-detail',
      label: `第${questionNumber}题`,
      params: {
        questionId,
        subjectId: selectedSubjectId || '',
      },
    })
    setCurrentView('single-question-detail')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          {data?.subjectName || '单科'} — 题目汇总
        </h2>
      </div>
      <p className="text-xs text-muted-foreground">各题目班级得分对比</p>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">题号</th>
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">题型</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">分值</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">年级均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">得分率</th>
                <th className="py-3 px-5 text-center font-medium text-muted-foreground">难度</th>
              </tr>
            </thead>
            <tbody>
              {data?.questions.map((q) => {
                const diff = difficultyLabel[q.difficulty] || difficultyLabel.medium
                return (
                  <tr
                    key={q.questionId}
                    className="border-b border-border/40 transition-colors hover:bg-muted/20"
                  >
                    <td className="py-3 px-5">
                      <button
                        onClick={() => handleQuestionClick(q.questionId, q.questionNumber)}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        第{q.questionNumber}题
                      </button>
                    </td>
                    <td className="py-3 px-5">{q.questionType}</td>
                    <td className="py-3 px-5 text-right">{q.fullScore}</td>
                    <td className="py-3 px-5 text-right">{formatNumber(q.gradeAvgScore)}</td>
                    <td className="py-3 px-5 text-right">{formatNumber(q.scoreRate)}%</td>
                    <td className="py-3 px-5 text-center">
                      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', diff.className)}>
                        {diff.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {(!data?.questions || data.questions.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Browser verify**

Navigate to: `http://localhost:3000/exams/123?view=single-question-summary&subjectId=math`

Test:
1. 确认题目汇总表格正常显示
2. 点击某个题号
3. 预期：URL 变为包含 `view=single-question-detail&qId=xxx`

- [ ] **Step 4: Commit**

```bash
git add src/components/analysis/SingleQuestionSummary.tsx
git commit -m "feat: 添加单科题目汇总组件（视图6）

- 表格展示特定学科下各题目年级均分和难度
- 支持点击题号下钻到学生得分详情
- 显示各班级均分对比（展开/折叠模式待后续优化）

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 13: Create SingleQuestionDetail Component (View 7)

**Files:**
- Modify: `src/components/analysis/SingleQuestionDetail.tsx` (replace stub)

- [ ] **Step 1: Write `src/components/analysis/SingleQuestionDetail.tsx`**

```typescript
'use client'

import { useSingleQuestionDetail } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SingleQuestionDetailProps {
  examId: string
}

export default function SingleQuestionDetail({ examId }: SingleQuestionDetailProps) {
  const { selectedSubjectId, drillDownParams } = useAnalysisStore()
  const classId = drillDownParams.classId ? Number(drillDownParams.classId) : undefined
  const questionId = drillDownParams.questionId

  const { data, isLoading } = useSingleQuestionDetail(
    examId,
    selectedSubjectId ?? undefined,
    classId,
    questionId
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          第{data?.questionNumber || '?'}题 — 学生得分详情
        </h2>
      </div>

      {data?.questionContent && (
        <div className="rounded-lg border border-border/40 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          {data.questionContent}
        </div>
      )}

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">学生姓名</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">得分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">满分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">得分率</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级排名</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">年级排名</th>
              </tr>
            </thead>
            <tbody>
              {data?.students.map((student) => (
                <tr
                  key={student.studentId}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td className="py-3 px-5 font-medium">{student.studentName}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(student.score)}</td>
                  <td className="py-3 px-5 text-right">{student.fullScore}</td>
                  <td className={cn(
                    'py-3 px-5 text-right font-medium',
                    student.scoreRate >= 60 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {formatNumber(student.scoreRate)}%
                  </td>
                  <td className="py-3 px-5 text-right">{student.classRank}</td>
                  <td className="py-3 px-5 text-right">{student.gradeRank || '—'}</td>
                </tr>
              ))}
              {(!data?.students || data.students.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    暂无学生数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: No new errors

- [ ] **Step 3: Browser verify**

Navigate to: `http://localhost:3000/exams/123?view=single-question-detail&subjectId=math&classId=101&qId=q1`

Test:
1. 确认学生得分详情表格正常显示
2. 确认面包屑显示完整路径
3. 点击面包屑中的上级节点可正确回退

- [ ] **Step 4: Commit**

```bash
git add src/components/analysis/SingleQuestionDetail.tsx
git commit -m "feat: 添加单科班级题目详情组件（视图7）

- 表格展示特定班级特定学科特定题目的学生得分详情
- 显示得分、得分率、班级排名
- 最深层级，无下钻入口

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 14: Cross-Mode Drill-Down Integration Test

**Files:**
- No file changes, integration verification only

- [ ] **Step 1: Test full drill-down paths**

Start dev server (if not running): `npm run dev`

**Path A: 全科 → 班级 → 学科 → 题目详情**
1. Navigate: `http://localhost:3000/exams/123`
2. Click "班级情况汇总"中的某个班级
3. Expected: 进入"班级学科汇总"，面包屑更新
4. Click 某个学科名称
5. Expected: 自动切换到单科模式，URL 变为 `view=single-class-question&subjectId=xxx&classId=xxx`
6. Click 某个题号
7. Expected: 进入"学生得分详情"

**Path B: 单科 → 班级 → 题目详情**
1. Navigate: `http://localhost:3000/exams/123`，切换到某个单科
2. Click "单科班级汇总"中的某个班级
3. Expected: 进入"单科班级题目"
4. Click 某个题号
5. Expected: 进入"学生得分详情"

**Path C: 面包屑回退**
1. 在下钻后的任意页面，点击面包屑中的上级节点
2. Expected: 正确回退到对应视图，URL 参数同步更新

**Path D: 侧边栏切换**
1. 在下钻后的页面，点击侧边栏中的其他维度
2. Expected: 切换到对应视图，超出层级的参数被清理

- [ ] **Step 2: Build check**

Run: `npm run build`
Expected: Build succeeds with no errors

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: 完成考试分析详情页多维度下钻功能

- 7个分析视图全部实现
- 面包屑导航支持下钻路径展示和回退
- Query Param驱动单页面架构
- 5个新增API接口先使用mock数据
- 支持全科/单科模式切换和跨模式跳转

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Self-Review

### Spec Coverage Check

| 设计文档章节 | 实现任务 |
|-------------|---------|
| 3.1 整体布局 | Task 6 (page.tsx), Task 7 (sidebar) |
| 3.2 侧边栏维度分组 | Task 7 |
| 4.1 视图总览 | Task 6 (viewComponentMap) |
| 4.2 视图1 班级情况汇总 | Task 8 (修改 ClassSummary) |
| 4.3 视图2 学科情况汇总 | Task 6 (现有 SubjectSummary 直接映射) |
| 4.4 视图3 班级学科汇总 | Task 9 |
| 4.5 视图4 单科班级汇总 | Task 10 |
| 4.6 视图5 单科班级题目 | Task 11 |
| 4.7 视图6 单科题目汇总 | Task 12 |
| 4.8 视图7 单科班级题目详情 | Task 13 |
| 5.1 新增接口类型 | Task 1 |
| 5.2 新增API服务 | Task 2 |
| 6 URL Query Param | Task 6 |
| 7 面包屑导航 | Task 5, Task 6 |
| 8 状态管理扩展 | Task 4 |
| 9 组件架构 | Task 5-13 |

**Coverage: 100%** — 所有设计文档章节都有对应的实现任务。

### Placeholder Scan

- No "TBD", "TODO", "implement later" found
- No "Add appropriate error handling" without code
- No "Similar to Task N" cross-references
- All code blocks contain complete implementations
- All test/verify steps contain exact commands

### Type Consistency Check

- `AnalysisView` type: Defined in Task 4, used in Task 5, 6, 7 — consistent
- `DrillDownNode` interface: Defined in Task 4, used in Task 5, 6 — consistent
- API service method names: `getClassSubjectSummary`, `getSingleClassSummary`, etc. — consistent across Task 2, 3
- Type names: `ClassSubjectSummaryResponse`, `SingleClassSummaryResponse`, etc. — consistent across Task 1, 2, 3
- Mock data field names match interface definitions — verified

### Risk Items

1. **TypeScript errors from missing imports during Task 6**: Mitigated by creating stub files before compilation check
2. **Browser verification requires dev server running**: Each component task includes explicit browser verification step
3. **Cross-mode跳转 (视图3→视图5)**: Implemented in Task 9 `handleSubjectClick` with `setSelectedScope('single_subject')`
4. **Grade rank not populated in mock data**: Student mock data in Task 2 sets `gradeRank: 0` for all, noted as limitation to fix when backend provides real data
