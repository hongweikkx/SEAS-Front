# AI 智能分析功能设计文档

## 1. 背景与目标

在 SEAS 智能学业分析系统中，为每个详细分析视图增加 AI 智能分析能力。用户在查看考试成绩数据时，可以点击"智能分析"按钮获取 AI 生成的分析文本，文本中包含可点击的关键词，点击后自动跳转到对应的分析视图并设置好相关参数。

## 2. 需求摘要

- 每个分析视图（共 8 个）在标题栏右侧提供"智能分析"按钮
- 点击后生成 AI 分析文本，显示在视图内容下方
- 分析文本中的关键词支持点击，点击后跳转到对应分析视图
- 跳转时自动携带相关参数（学科、班级、题目等）
- AI 分析结果持久化，切换视图或刷新页面后保留
- 当前阶段使用 Mock 数据，未来可平滑接入真实 AI API

## 3. 数据模型

### 3.1 可点击词跳转协议

```typescript
interface AILink {
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
```

### 3.2 AI 分析结果

```typescript
interface AIAnalysisResult {
  segments: Array<
    | { type: 'text'; content: string }
    | { type: 'link'; content: string; link: AILink }
  >
  /** 生成时间戳 */
  generatedAt: number
}
```

## 4. Store 扩展

在 `analysisStore` 中新增以下状态和 actions：

```typescript
interface AnalysisState {
  // ... 现有字段

  /** AI 分析结果映射，key 为视图名称 */
  aiAnalysisResults: Record<AnalysisView, AIAnalysisResult | null>

  // 新增 actions
  generateAIAnalysis: (view: AnalysisView, examId: string, params: DrillDownParams) => Promise<void>
  clearAIAnalysis: (view: AnalysisView) => void
  executeAILink: (link: AILink) => void
}
```

### 4.1 generateAIAnalysis

异步生成指定视图的 AI 分析结果：

1. 调用 mock 数据生成器（根据视图返回对应的分析文本和 links）
2. 模拟网络延迟 500ms
3. 将结果写入 `aiAnalysisResults[view]`
4. 记录 `generatedAt` 时间戳

### 4.2 executeAILink

执行可点击词的跳转逻辑：

1. 根据 `targetView` 调用 `setCurrentView`
2. 根据 `params` 调用 `setDrillDownParam` 设置参数
3. 如涉及单科视图，自动调用 `setSelectedScope('single_subject')` 和 `setSelectedSubjectId`
4. 通过 `pushDrillDown` 更新面包屑路径

## 5. UI 组件设计

### 5.1 AIAnalysisTrigger — 智能分析按钮

**位置：** 每个视图标题栏右侧

**状态：**
- 未生成：`[✨ 智能分析]` 按钮，点击触发分析
- 加载中：按钮 disabled，显示 spinner +「分析中...」
- 已生成：按钮变为「🔄 重新分析」，点击可刷新

### 5.2 AIAnalysisPanel — AI 分析结果面板

**位置：** 视图内容区域底部

**样式：**
- 浅蓝色背景卡片（与学术风格一致）
- 标题：「📊 AI 智能分析」
- 内容区域：解析 `segments`，纯文本直接渲染，链接渲染为可点击元素
- 可点击词：普通文本样式，hover 时变色（如变为主题色）
- Tooltip：鼠标悬停可点击词时显示浮标，提示跳转目标（如"查看数学学科详情"）
- 底部：「清除分析」按钮，点击后移除当前视图的分析结果
- 支持折叠/展开（默认展开）

## 6. 视图集成方式

每个视图组件需要引入 `AIAnalysisTrigger` 和 `AIAnalysisPanel`：

```tsx
<div className="space-y-4">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-2">
      <div className="h-5 w-1 rounded-full bg-primary" />
      <h2 className="text-lg font-semibold text-foreground">班级情况汇总</h2>
    </div>
    <AIAnalysisTrigger view="class-summary" examId={examId} />
  </div>

  {/* ... 原有表格/图表内容 ... */}

  <AIAnalysisPanel view="class-summary" />
</div>
```

为减少重复代码，可新增 `AIAnalysisSection` 组件，封装 trigger + panel 的渲染逻辑。

### 6.1 需修改的视图组件

1. `ClassSummary.tsx` — class-summary
2. `SubjectSummary.tsx` — subject-summary
3. `RatingChart.tsx` — rating-analysis
4. `ClassSubjectSummary.tsx` — class-subject-summary
5. `SingleClassSummary.tsx` — single-class-summary
6. `SingleClassQuestion.tsx` — single-class-question
7. `SingleQuestionSummary.tsx` — single-question-summary
8. `SingleQuestionDetail.tsx` — single-question-detail

## 7. Mock 数据策略

为每个视图预设一段分析文本和 links，确保可点击词覆盖所有视图之间的跳转场景。

**示例：class-summary（班级情况汇总）**

```typescript
{
  segments: [
    { type: 'text', content: '本年级10个班级中，' },
    {
      type: 'link',
      content: '高二(3)班',
      link: { label: '高二(3)班', targetView: 'class-subject-summary', params: { classId: '103' } }
    },
    { type: 'text', content: '表现最为突出，全科平均分领先年级均分12.5分。其中' },
    {
      type: 'link',
      content: '数学',
      link: { label: '数学', targetView: 'single-class-summary', params: { subjectId: 'math' } }
    },
    { type: 'text', content: '学科优势明显，建议重点分析该班' },
    {
      type: 'link',
      content: '题目得分情况',
      link: { label: '题目得分情况', targetView: 'single-class-question', params: { classId: '103', subjectId: 'math' } }
    },
    { type: 'text', content: '。' },
  ]
}
```

每个视图的 mock 数据放置于 `src/mocks/aiAnalysis.ts` 中，通过函数按视图返回。

## 8. 持久化策略

通过 Zustand 的 `persist` middleware 将 `aiAnalysisResults` 保存到 localStorage：

```typescript
import { persist } from 'zustand/middleware'

export const useAnalysisStore = create<AnalysisState>()(
  persist(
    (set) => ({ ... }),
    {
      name: 'analysis-store',
      partialize: (state) => ({ aiAnalysisResults: state.aiAnalysisResults }),
    }
  )
)
```

刷新页面后已生成的分析结果会自动恢复。

## 9. 错误处理

- **生成失败：** 在 `AIAnalysisPanel` 中显示错误提示卡片（红色背景），包含「重试」按钮
- **网络超时：** 模拟延迟设置 10 秒超时，超时后显示错误提示
- **无效跳转：** `executeAILink` 中对参数进行校验，无效参数给出 toast 提示

## 10. 文件变更清单

| 文件 | 变更类型 | 说明 |
|------|---------|------|
| `src/store/analysisStore.ts` | 修改 | 新增 `aiAnalysisResults` 状态和 `generateAIAnalysis`、`clearAIAnalysis`、`executeAILink` actions |
| `src/types/ai.ts` | 新增 | `AILink`、`AIAnalysisResult` 类型定义 |
| `src/mocks/aiAnalysis.ts` | 新增 | 8 个视图的 Mock AI 分析数据 |
| `src/components/ai/AIAnalysisTrigger.tsx` | 新增 | 智能分析按钮组件 |
| `src/components/ai/AIAnalysisPanel.tsx` | 新增 | AI 分析结果展示组件 |
| `src/components/ai/AIAnalysisSection.tsx` | 新增 | 封装 trigger + panel 的高阶组件 |
| `src/components/analysis/ClassSummary.tsx` | 修改 | 集成 AI 分析按钮和面板 |
| `src/components/analysis/SubjectSummary.tsx` | 修改 | 集成 AI 分析按钮和面板 |
| `src/components/analysis/RatingChart.tsx` | 修改 | 集成 AI 分析按钮和面板 |
| `src/components/analysis/ClassSubjectSummary.tsx` | 修改 | 集成 AI 分析按钮和面板 |
| `src/components/analysis/SingleClassSummary.tsx` | 修改 | 集成 AI 分析按钮和面板 |
| `src/components/analysis/SingleClassQuestion.tsx` | 修改 | 集成 AI 分析按钮和面板 |
| `src/components/analysis/SingleQuestionSummary.tsx` | 修改 | 集成 AI 分析按钮和面板 |
| `src/components/analysis/SingleQuestionDetail.tsx` | 修改 | 集成 AI 分析按钮和面板 |

## 11. 可点击词跳转协议

| 当前视图 | 可点击词示例 | 目标视图 | 携带参数 |
|---------|------------|---------|---------|
| class-summary | 高二(3)班 | class-subject-summary | classId |
| class-summary | 数学 | single-class-summary | subjectId |
| subject-summary | 高二(3)班 | class-subject-summary | classId |
| subject-summary | 第5题 | single-question-summary | subjectId |
| rating-analysis | 数学 | single-class-summary | subjectId |
| class-subject-summary | 数学 | single-class-question | classId, subjectId |
| single-class-summary | 高二(3)班 | single-class-question | classId, subjectId |
| single-class-question | 第5题 | single-question-detail | classId, subjectId, questionId |
| single-question-summary | 高二(3)班 | single-question-detail | classId, subjectId, questionId |
