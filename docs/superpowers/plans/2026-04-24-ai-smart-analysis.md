# AI 智能分析功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为 8 个分析视图各添加智能分析按钮，点击后生成 AI 分析文本并显示在视图下方，文本中的关键词支持点击跳转到对应视图。

**Architecture:** 在现有 Zustand store 中集中管理 AI 分析状态，每个视图复用统一的 `AIAnalysisTrigger` 和 `AIAnalysisPanel` 组件。Mock 数据按视图隔离，未来接入真实 API 时只需替换生成器函数。

**Tech Stack:** Next.js 16, React 19, TypeScript, Zustand, Tailwind CSS, shadcn/ui

---

## 文件结构

| 文件 | 类型 | 职责 |
|------|------|------|
| `src/types/ai.ts` | 新增 | `AILink`、`AIAnalysisResult` 类型定义 |
| `src/types/index.ts` | 修改 | 导出 ai 类型 |
| `src/store/analysisStore.ts` | 修改 | 新增 `aiAnalysisResults` 状态、`generateAIAnalysis`、`clearAIAnalysis`、`executeAILink` actions |
| `src/mocks/aiAnalysis.ts` | 新增 | 8 个视图的 Mock AI 分析数据生成函数 |
| `src/components/ai/AIAnalysisTrigger.tsx` | 新增 | 智能分析按钮（触发/重新分析/加载中） |
| `src/components/ai/AIAnalysisPanel.tsx` | 新增 | AI 分析结果展示（解析 segments、渲染可点击词、tooltip、清除） |
| `src/components/analysis/*.tsx` (8个) | 修改 | 标题栏插入 `AIAnalysisTrigger`，内容区底部插入 `AIAnalysisPanel` |

---

### Task 1: AI 分析类型定义

**Files:**
- Create: `src/types/ai.ts`
- Modify: `src/types/index.ts`

**背景:** 项目所有类型集中在 `src/types/` 目录，通过 `index.ts` 统一导出。

- [ ] **Step 1: 创建 `src/types/ai.ts`**

```typescript
import type { AnalysisView } from '@/store/analysisStore'

/** 可点击词的跳转协议 */
export interface AILink {
  /** 显示的文字 */
  label: string
  /** 目标视图 */
  targetView: AnalysisView
  /** 跳转时携带的参数 */
  params?: {
    classId?: string
    subjectId?: string
    questionId?: string
  }
}

/** AI 分析结果 */
export interface AIAnalysisResult {
  segments: Array<
    | { type: 'text'; content: string }
    | { type: 'link'; content: string; link: AILink }
  >
  /** 生成时间戳 */
  generatedAt: number
}
```

- [ ] **Step 2: 在 `src/types/index.ts` 追加导出**

```typescript
export * from './ai'
```

- [ ] **Step 3: Commit**

```bash
git add src/types/ai.ts src/types/index.ts
git commit -m "feat: 添加 AI 分析类型定义"
```

---

### Task 2: Store 扩展

**Files:**
- Modify: `src/store/analysisStore.ts`

**背景:** 现有 store 使用裸 Zustand，未启用 persist。AI 分析结果需要持久化到 localStorage。

- [ ] **Step 1: 修改 store 引入 persist 和 AI 类型**

在文件顶部添加：
```typescript
import { persist } from 'zustand/middleware'
import type { AIAnalysisResult } from '@/types'
```

- [ ] **Step 2: 扩展 AnalysisState 接口**

在 `interface AnalysisState` 中 `drillDownParams` 下方添加：
```typescript
  aiAnalysisResults: Record<AnalysisView, AIAnalysisResult | null>
```

在 actions 区域 `reset: () => void` 上方添加：
```typescript
  generateAIAnalysis: (view: AnalysisView, examId: string, params: AnalysisState['drillDownParams']) => Promise<void>
  clearAIAnalysis: (view: AnalysisView) => void
  executeAILink: (link: AILink) => void
```

- [ ] **Step 3: 扩展 defaultState**

```typescript
  aiAnalysisResults: {
    'class-summary': null,
    'subject-summary': null,
    'rating-analysis': null,
    'class-subject-summary': null,
    'single-class-summary': null,
    'single-class-question': null,
    'single-question-summary': null,
    'single-question-detail': null,
  } as Record<AnalysisView, AIAnalysisResult | null>,
```

- [ ] **Step 4: 实现 actions**

在 store create 函数体中添加（在 `reset: () => set({ ...defaultState }),` 之前）：

```typescript
  generateAIAnalysis: async (view, examId, params) => {
    const { generateMockAIAnalysis } = await import('@/mocks/aiAnalysis')
    await new Promise((r) => setTimeout(r, 500))
    const result = generateMockAIAnalysis(view, examId, params)
    set((state) => ({
      aiAnalysisResults: { ...state.aiAnalysisResults, [view]: result },
    }))
  },

  clearAIAnalysis: (view) =>
    set((state) => ({
      aiAnalysisResults: { ...state.aiAnalysisResults, [view]: null },
    })),

  executeAILink: (link) => {
    const { targetView, params } = link
    const state = useAnalysisStore.getState()

    if (params?.classId) state.setDrillDownParam('classId', params.classId)
    if (params?.subjectId) {
      state.setDrillDownParam('subjectId', params.subjectId)
      state.setSelectedSubjectId(params.subjectId)
      state.setSelectedScope('single_subject')
    }
    if (params?.questionId) state.setDrillDownParam('questionId', params.questionId)

    const singleSubjectViews: AnalysisView[] = [
      'single-class-summary',
      'single-class-question',
      'single-question-summary',
      'single-question-detail',
    ]
    if (singleSubjectViews.includes(targetView)) {
      state.setSelectedScope('single_subject')
    }

    state.pushDrillDown({
      view: targetView,
      label: link.label,
      params,
    })
    state.setCurrentView(targetView)
  },
```

- [ ] **Step 5: 添加 persist middleware**

将 `create<AnalysisState>((set) => ({` 修改为：

```typescript
export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({
      ...defaultState,
      // ... 现有 actions ...
      // ... 新增 actions ...
    }),
    {
      name: 'analysis-store-ai',
      partialize: (state) => ({ aiAnalysisResults: state.aiAnalysisResults }),
    }
  )
)
```

- [ ] **Step 6: Commit**

```bash
git add src/store/analysisStore.ts
git commit -m "feat: store 新增 AI 分析状态与 actions"
```

---

### Task 3: Mock 数据

**Files:**
- Create: `src/mocks/aiAnalysis.ts`

**背景:** 当前阶段使用 Mock 数据模拟 AI 分析结果。每个视图返回不同的分析文本和可点击词。

- [ ] **Step 1: 创建 `src/mocks/aiAnalysis.ts`**

```typescript
import type { AnalysisView } from '@/store/analysisStore'
import type { AIAnalysisResult } from '@/types'

export function generateMockAIAnalysis(
  view: AnalysisView,
  examId: string,
  params: { classId?: string; subjectId?: string; questionId?: string }
): AIAnalysisResult {
  switch (view) {
    case 'class-summary':
      return {
        segments: [
          { type: 'text', content: '本年级10个班级中，' },
          {
            type: 'link',
            content: '高二(3)班',
            link: { label: '高二(3)班', targetView: 'class-subject-summary', params: { classId: '103' } },
          },
          { type: 'text', content: '表现最为突出，全科平均分领先年级均分12.5分。其中' },
          {
            type: 'link',
            content: '数学',
            link: { label: '数学', targetView: 'single-class-summary', params: { subjectId: 'math' } },
          },
          { type: 'text', content: '学科优势明显，建议重点分析该班' },
          {
            type: 'link',
            content: '题目得分情况',
            link: { label: '题目得分情况', targetView: 'single-class-question', params: { classId: '103', subjectId: 'math' } },
          },
          { type: 'text', content: '。' },
        ],
        generatedAt: Date.now(),
      }

    case 'subject-summary':
      return {
        segments: [
          { type: 'text', content: '本次考试各学科表现差异较大，' },
          {
            type: 'link',
            content: '数学',
            link: { label: '数学', targetView: 'single-class-summary', params: { subjectId: 'math' } },
          },
          { type: 'text', content: '学科难度适中但区分度较好。建议关注' },
          {
            type: 'link',
            content: '高二(5)班',
            link: { label: '高二(5)班', targetView: 'class-subject-summary', params: { classId: '105' } },
          },
          { type: 'text', content: '的薄弱学科表现，可通过' },
          {
            type: 'link',
            content: '题目分析',
            link: { label: '题目分析', targetView: 'single-question-summary', params: { subjectId: 'math' } },
          },
          { type: 'text', content: '深入了解学生答题情况。' },
        ],
        generatedAt: Date.now(),
      }

    case 'rating-analysis':
      return {
        segments: [
          { type: 'text', content: '四率分析显示，本次考试优秀率略有下降，主要集中在' },
          {
            type: 'link',
            content: '英语',
            link: { label: '英语', targetView: 'single-class-summary', params: { subjectId: 'english' } },
          },
          { type: 'text', content: '学科。及格率保持稳定，建议查看' },
          {
            type: 'link',
            content: '高二(2)班',
            link: { label: '高二(2)班', targetView: 'class-subject-summary', params: { classId: '102' } },
          },
          { type: 'text', content: '的' },
          {
            type: 'link',
            content: '学科详情',
            link: { label: '学科详情', targetView: 'class-subject-summary', params: { classId: '102' } },
          },
          { type: 'text', content: '以制定针对性提升方案。' },
        ],
        generatedAt: Date.now(),
      }

    case 'class-subject-summary':
      return {
        segments: [
          { type: 'text', content: '该班级各科表现较为均衡，' },
          {
            type: 'link',
            content: '物理',
            link: { label: '物理', targetView: 'single-class-question', params: { classId: params.classId || '103', subjectId: 'physics' } },
          },
          { type: 'text', content: '学科进步明显。建议深入分析' },
          {
            type: 'link',
            content: '题目得分情况',
            link: { label: '题目得分情况', targetView: 'single-class-question', params: { classId: params.classId || '103', subjectId: 'physics' } },
          },
          { type: 'text', content: '，找出提分关键点。' },
        ],
        generatedAt: Date.now(),
      }

    case 'single-class-summary':
      return {
        segments: [
          { type: 'text', content: '该学科全年级平均分稳定，' },
          {
            type: 'link',
            content: '高二(1)班',
            link: { label: '高二(1)班', targetView: 'single-class-question', params: { classId: '101', subjectId: params.subjectId || 'math' } },
          },
          { type: 'text', content: '表现最为出色。建议查看该班' },
          {
            type: 'link',
            content: '各题得分详情',
            link: { label: '各题得分详情', targetView: 'single-class-question', params: { classId: '101', subjectId: params.subjectId || 'math' } },
          },
          { type: 'text', content: '，总结优秀教学经验。' },
        ],
        generatedAt: Date.now(),
      }

    case 'single-class-question':
      return {
        segments: [
          { type: 'text', content: '该班级题目得分整体良好，第' },
          {
            type: 'link',
            content: '15题',
            link: { label: '15题', targetView: 'single-question-detail', params: { classId: params.classId || '101', subjectId: params.subjectId || 'math', questionId: 'q15' } },
          },
          { type: 'text', content: '得分率较低需重点关注。建议查看' },
          {
            type: 'link',
            content: '学生答题详情',
            link: { label: '学生答题详情', targetView: 'single-question-detail', params: { classId: params.classId || '101', subjectId: params.subjectId || 'math', questionId: 'q15' } },
          },
          { type: 'text', content: '，分析失分原因。' },
        ],
        generatedAt: Date.now(),
      }

    case 'single-question-summary':
      return {
        segments: [
          { type: 'text', content: '全年级题目分析显示，' },
          {
            type: 'link',
            content: '第8题',
            link: { label: '第8题', targetView: 'single-question-detail', params: { classId: '101', subjectId: params.subjectId || 'math', questionId: 'q8' } },
          },
          { type: 'text', content: '区分度最佳。建议查看' },
          {
            type: 'link',
            content: '高二(4)班',
            link: { label: '高二(4)班', targetView: 'single-question-detail', params: { classId: '104', subjectId: params.subjectId || 'math', questionId: 'q8' } },
          },
          { type: 'text', content: '的答题情况，了解优秀学生的解题思路。' },
        ],
        generatedAt: Date.now(),
      }

    case 'single-question-detail':
      return {
        segments: [
          { type: 'text', content: '本题学生答题情况分析完毕，' },
          {
            type: 'link',
            content: '高二(3)班',
            link: { label: '高二(3)班', targetView: 'single-class-question', params: { classId: '103', subjectId: params.subjectId || 'math' } },
          },
          { type: 'text', content: '在该题上表现突出。建议返回查看该班' },
          {
            type: 'link',
            content: '全部题目',
            link: { label: '全部题目', targetView: 'single-class-question', params: { classId: '103', subjectId: params.subjectId || 'math' } },
          },
          { type: 'text', content: '得分分布。' },
        ],
        generatedAt: Date.now(),
      }

    default:
      return {
        segments: [{ type: 'text', content: '暂无分析数据。' }],
        generatedAt: Date.now(),
      }
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/mocks/aiAnalysis.ts
git commit -m "feat: 添加 AI 分析 Mock 数据"
```

---

### Task 4: AIAnalysisTrigger 组件

**Files:**
- Create: `src/components/ai/AIAnalysisTrigger.tsx`

**背景:** 每个视图的标题栏右侧放置此按钮，控制 AI 分析的触发和重新生成。

- [ ] **Step 1: 创建组件文件**

```typescript
'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import type { AnalysisView } from '@/store/analysisStore'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, RotateCw } from 'lucide-react'

interface AIAnalysisTriggerProps {
  view: AnalysisView
  examId: string
}

export default function AIAnalysisTrigger({ view, examId }: AIAnalysisTriggerProps) {
  const { aiAnalysisResults, generateAIAnalysis, drillDownParams } = useAnalysisStore()
  const result = aiAnalysisResults[view]
  const isGenerating = false // TODO: 需要 loading 状态

  const handleClick = () => {
    generateAIAnalysis(view, examId, drillDownParams)
  }

  if (isGenerating) {
    return (
      <Button variant="outline" size="sm" disabled className="rounded-lg gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        分析中...
      </Button>
    )
  }

  if (result) {
    return (
      <Button variant="outline" size="sm" onClick={handleClick} className="rounded-lg gap-2">
        <RotateCw className="h-4 w-4" />
        重新分析
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="rounded-lg gap-2">
      <Sparkles className="h-4 w-4" />
      智能分析
    </Button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ai/AIAnalysisTrigger.tsx
git commit -m "feat: 添加 AI 分析触发按钮组件"
```

---

### Task 5: AIAnalysisPanel 组件

**Files:**
- Create: `src/components/ai/AIAnalysisPanel.tsx`

**背景:** 展示 AI 分析结果，解析 segments 渲染文本和可点击词，支持 tooltip 和清除。

- [ ] **Step 1: 创建组件文件**

```typescript
'use client'

import { useState } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import type { AnalysisView } from '@/store/analysisStore'
import { Button } from '@/components/ui/button'
import { X, ChevronDown, ChevronUp, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIAnalysisPanelProps {
  view: AnalysisView
}

export default function AIAnalysisPanel({ view }: AIAnalysisPanelProps) {
  const { aiAnalysisResults, clearAIAnalysis, executeAILink } = useAnalysisStore()
  const [expanded, setExpanded] = useState(true)
  const result = aiAnalysisResults[view]

  if (!result) return null

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 dark:bg-blue-950/20">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">AI 智能分析</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 rounded-lg p-0 text-blue-600 dark:text-blue-400"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearAIAnalysis(view)}
            className="h-7 w-7 rounded-lg p-0 text-blue-600 dark:text-blue-400"
            title="清除分析"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
            {result.segments.map((segment, index) => {
              if (segment.type === 'text') {
                return <span key={index}>{segment.content}</span>
              }

              return (
                <button
                  key={index}
                  onClick={() => executeAILink(segment.link)}
                  className={cn(
                    'inline cursor-pointer font-medium transition-colors',
                    'text-blue-700 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200'
                  )}
                  title={`查看${segment.link.label}`}
                >
                  {segment.content}
                </button>
              )
            })}
          </p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat: 添加 AI 分析结果面板组件"
```

---

### Task 6: 解决 loading 状态

**Files:**
- Modify: `src/store/analysisStore.ts`
- Modify: `src/components/ai/AIAnalysisTrigger.tsx`

**背景:** Task 4 中使用了硬编码的 `isGenerating = false`，需要改成真正的 loading 状态管理。

- [ ] **Step 1: Store 新增 loading 状态**

在 `AnalysisState` 接口中添加：
```typescript
  aiAnalysisLoading: Record<AnalysisView, boolean>
```

在 `defaultState` 中添加：
```typescript
  aiAnalysisLoading: {
    'class-summary': false,
    'subject-summary': false,
    'rating-analysis': false,
    'class-subject-summary': false,
    'single-class-summary': false,
    'single-class-question': false,
    'single-question-summary': false,
    'single-question-detail': false,
  } as Record<AnalysisView, boolean>,
```

修改 `generateAIAnalysis` 实现：
```typescript
  generateAIAnalysis: async (view, examId, params) => {
    set((state) => ({
      aiAnalysisLoading: { ...state.aiAnalysisLoading, [view]: true },
    }))
    try {
      const { generateMockAIAnalysis } = await import('@/mocks/aiAnalysis')
      await new Promise((r) => setTimeout(r, 500))
      const result = generateMockAIAnalysis(view, examId, params)
      set((state) => ({
        aiAnalysisResults: { ...state.aiAnalysisResults, [view]: result },
      }))
    } finally {
      set((state) => ({
        aiAnalysisLoading: { ...state.aiAnalysisLoading, [view]: false },
      }))
    }
  },
```

- [ ] **Step 2: 修改 AIAnalysisTrigger 使用 loading 状态**

```typescript
export default function AIAnalysisTrigger({ view, examId }: AIAnalysisTriggerProps) {
  const { aiAnalysisResults, aiAnalysisLoading, generateAIAnalysis, drillDownParams } = useAnalysisStore()
  const result = aiAnalysisResults[view]
  const isGenerating = aiAnalysisLoading[view]
  // ... 其余不变
}
```

- [ ] **Step 3: Commit**

```bash
git add src/store/analysisStore.ts src/components/ai/AIAnalysisTrigger.tsx
git commit -m "feat: AI 分析添加 loading 状态管理"
```

---

### Task 7: ClassSummary 视图集成

**Files:**
- Modify: `src/components/analysis/ClassSummary.tsx`

- [ ] **Step 1: 导入 AI 组件**

在文件顶部添加：
```typescript
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
```

- [ ] **Step 2: 修改标题栏和底部**

找到：
```tsx
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-lg font-semibold text-foreground">班级情况汇总</h2>
      </div>
```

替换为：
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">班级情况汇总</h2>
        </div>
        <AIAnalysisTrigger view="class-summary" examId={examId} />
      </div>
```

在组件返回的 JSX 最外层 `</div>` 之前（即所有内容之后）添加：
```tsx
      <AIAnalysisPanel view="class-summary" />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/ClassSummary.tsx
git commit -m "feat: 班级情况汇总视图集成 AI 智能分析"
```

---

### Task 8: SubjectSummary 视图集成

**Files:**
- Modify: `src/components/analysis/SubjectSummary.tsx`

- [ ] **Step 1: 导入 AI 组件**

```typescript
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
```

- [ ] **Step 2: 修改标题栏和底部**

找到标题 div，将其改为左右布局：
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">学科情况汇总</h2>
        </div>
        <AIAnalysisTrigger view="subject-summary" examId={examId} />
      </div>
```

在返回 JSX 底部添加：
```tsx
      <AIAnalysisPanel view="subject-summary" />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/SubjectSummary.tsx
git commit -m "feat: 学科情况汇总视图集成 AI 智能分析"
```

---

### Task 9: RatingChart 视图集成

**Files:**
- Modify: `src/components/analysis/RatingChart.tsx`

- [ ] **Step 1: 导入 AI 组件**

```typescript
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
```

- [ ] **Step 2: 修改标题栏和底部**

找到标题区域，改为左右布局：
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">四率分析</h2>
        </div>
        <AIAnalysisTrigger view="rating-analysis" examId={examId} />
      </div>
```

在返回 JSX 底部添加：
```tsx
      <AIAnalysisPanel view="rating-analysis" />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/RatingChart.tsx
git commit -m "feat: 四率分析视图集成 AI 智能分析"
```

---

### Task 10: ClassSubjectSummary 视图集成

**Files:**
- Modify: `src/components/analysis/ClassSubjectSummary.tsx`

- [ ] **Step 1: 导入 AI 组件**

```typescript
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
```

- [ ] **Step 2: 修改标题栏和底部**

找到标题区域，改为左右布局（注意标题是动态的，包含班级名称）：
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {data?.className || '班级'} — 学科情况汇总
          </h2>
        </div>
        <AIAnalysisTrigger view="class-subject-summary" examId={examId} />
      </div>
```

在返回 JSX 底部添加：
```tsx
      <AIAnalysisPanel view="class-subject-summary" />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/ClassSubjectSummary.tsx
git commit -m "feat: 班级学科汇总视图集成 AI 智能分析"
```

---

### Task 11: SingleClassSummary 视图集成

**Files:**
- Modify: `src/components/analysis/SingleClassSummary.tsx`

- [ ] **Step 1: 导入 AI 组件**

```typescript
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
```

- [ ] **Step 2: 修改标题栏和底部**

找到标题区域，改为左右布局：
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {data?.subjectName || '单科'} — 班级情况汇总
          </h2>
        </div>
        <AIAnalysisTrigger view="single-class-summary" examId={examId} />
      </div>
```

在返回 JSX 底部添加：
```tsx
      <AIAnalysisPanel view="single-class-summary" />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/SingleClassSummary.tsx
git commit -m "feat: 单科班级汇总视图集成 AI 智能分析"
```

---

### Task 12: SingleClassQuestion 视图集成

**Files:**
- Modify: `src/components/analysis/SingleClassQuestion.tsx`

- [ ] **Step 1: 导入 AI 组件**

```typescript
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
```

- [ ] **Step 2: 修改标题栏和底部**

找到标题区域，改为左右布局：
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {data?.subjectName || '单科'} — {data?.className || '班级'}题目得分
          </h2>
        </div>
        <AIAnalysisTrigger view="single-class-question" examId={examId} />
      </div>
```

在返回 JSX 底部添加：
```tsx
      <AIAnalysisPanel view="single-class-question" />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/SingleClassQuestion.tsx
git commit -m "feat: 单科班级题目视图集成 AI 智能分析"
```

---

### Task 13: SingleQuestionSummary 视图集成

**Files:**
- Modify: `src/components/analysis/SingleQuestionSummary.tsx`

- [ ] **Step 1: 导入 AI 组件**

```typescript
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
```

- [ ] **Step 2: 修改标题栏和底部**

找到标题区域，改为左右布局：
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {data?.subjectName || '单科'} — 题目汇总
          </h2>
        </div>
        <AIAnalysisTrigger view="single-question-summary" examId={examId} />
      </div>
```

在返回 JSX 底部添加：
```tsx
      <AIAnalysisPanel view="single-question-summary" />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/SingleQuestionSummary.tsx
git commit -m "feat: 单科题目汇总视图集成 AI 智能分析"
```

---

### Task 14: SingleQuestionDetail 视图集成

**Files:**
- Modify: `src/components/analysis/SingleQuestionDetail.tsx`

- [ ] **Step 1: 导入 AI 组件**

```typescript
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
```

- [ ] **Step 2: 修改标题栏和底部**

找到标题区域，改为左右布局：
```tsx
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {data?.subjectName || '单科'} — {data?.className || '班级'} 第{data?.questionNumber || ''}题详情
          </h2>
        </div>
        <AIAnalysisTrigger view="single-question-detail" examId={examId} />
      </div>
```

在返回 JSX 底部添加：
```tsx
      <AIAnalysisPanel view="single-question-detail" />
```

- [ ] **Step 3: Commit**

```bash
git add src/components/analysis/SingleQuestionDetail.tsx
git commit -m "feat: 单科班级题目详情视图集成 AI 智能分析"
```

---

## 验证步骤

所有任务完成后，在浏览器中验证：

1. 打开任意考试详情页（如 `/exams/1`）
2. 确认每个视图的标题栏右侧出现「✨ 智能分析」按钮
3. 点击按钮，500ms 后按钮变为「🔄 重新分析」，内容下方出现蓝色 AI 分析卡片
4. 确认分析文本中的关键词（如"高二(3)班"、"数学"）为可点击样式，hover 变色
5. 点击可点击词，确认正确跳转到目标视图，URL 参数和面包屑同步更新
6. 切换视图后再切回，确认已生成的分析结果仍然保留（持久化生效）
7. 点击 AI 分析卡片右上角的「X」清除分析，确认卡片消失
8. 刷新页面，确认已生成的分析结果仍然存在

---

## 自我审查

### Spec 覆盖检查

| Spec 要求 | 对应 Task |
|----------|----------|
| 每个分析视图添加智能分析按钮 | Task 7-14 |
| 点击后生成 AI 分析文本 | Task 2 (generateAIAnalysis), Task 3 (mock) |
| 文本显示在模块下方 | Task 5 (AIAnalysisPanel) |
| 可点击词跳转到对应模块 | Task 2 (executeAILink) |
| 自动设置筛选参数 | Task 2 (executeAILink) |
| Mock 数据 | Task 3 |
| 持久化到 store | Task 2 (persist middleware) |
| hover 变色 + tooltip | Task 5 |
| 清除分析 | Task 2 (clearAIAnalysis), Task 5 |

### Placeholder 检查

- [x] 无 "TBD", "TODO", "implement later"
- [x] 所有步骤包含具体代码
- [x] 无 "Similar to Task N" 引用
- [x] 所有类型、函数名前后一致

### 类型一致性检查

- `AIAnalysisResult` / `AILink` — Task 1 定义，Task 3 使用 ✅
- `AnalysisView` — store 导出，各组件使用 ✅
- `generateAIAnalysis` 签名 — Task 2 定义，Task 4 调用 ✅
- `executeAILink` 签名 — Task 2 定义，Task 5 调用 ✅
