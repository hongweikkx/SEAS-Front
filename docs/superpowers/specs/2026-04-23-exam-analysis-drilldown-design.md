# 考试分析详情页 — 多维度下钻数据分析设计文档

## 1. 概述

在现有考试分析详情页（`/exams/[id]`）的基础上，增加 7 个维度的下钻数据分析能力。用户通过点击表格中的具体项（班级、学科、题目）逐层深入，从宏观的全年级概览下钻到特定班级、特定学科、甚至特定题目的学生得分详情。

## 2. 设计目标

- **全维度覆盖**：实现用户提供的下钻结构图中的全部 7 个分析视图
- **统一交互**：所有下钻通过点击表格项触发，面包屑导航返回，交互心智模型一致
- **渐进实现**：先定义接口类型 + mock 数据，后端接口就绪后无缝对接
- **兼容现有**：复用现有的 `AnalysisModuleCard`、侧边栏导航、学科标签等基础设施

## 3. 页面布局

### 3.1 整体结构

```
┌─────────────────────────────────────────────┐
│  SEAS / 分析列表 / 期中考试                    │
│  期中考试 — 成绩分析           [PDF] [共享报告] │
├─────────────────────────────────────────────┤
│  全科分析 / 班级情况汇总 / 高二(1)班            │  ← 面包屑导航（新增）
├──────────┬──────────────────────────────────┤
│          │  [全科] [语文] [数学] [英语] ...   │  ← 学科标签（现有）
│  分析维度  │                                  │
│          │  ┌─────────────────────────────┐  │
│  📊 班级   │  │ 高二(1)班 — 学科情况汇总      │  │  ← 内容卡片
│  情况汇总  │  │ 该班级各学科成绩与全年级对比    │  │
│          │  │                              │  │
│  📚 学科   │  │      [表格内容区域]           │  │
│  情况汇总  │  │                              │  │
│          │  └─────────────────────────────┘  │
│  🏫 班级   │                                  │
│  学科汇总  │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

### 3.2 侧边栏维度分组规则

侧边栏根据当前学科标签（全科/单科）动态过滤显示：

**全科模式下显示：**
- 📊 班级情况汇总（`class-summary`）
- 📚 学科情况汇总（`subject-summary`）
- 🏫 班级学科汇总（`class-subject-summary`）

**单科模式下显示：**
- 📊 单科班级汇总（`single-class-summary`）
- 📝 单科班级题目（`single-class-question`）
- 📋 单科题目汇总（`single-question-summary`）
- 🔍 单科班级题目详情（`single-question-detail`）

切换全科/单科时，面包屑重置到对应模式的顶层。

## 4. 7 个分析视图详细定义

### 4.1 视图总览

| # | 视图名称 | 内部标识 | 所属模式 | 入口来源 | 下钻去向 |
|---|---------|---------|---------|---------|---------|
| 1 | 班级情况汇总 | `class-summary` | 全科 | 顶层入口 | 点击班级 → 视图3 |
| 2 | 学科情况汇总 | `subject-summary` | 全科 | 顶层入口 | 无 |
| 3 | 班级学科汇总 | `class-subject-summary` | 全科 | 视图1点击班级 | 点击学科 → 视图5（自动切单科） |
| 4 | 单科班级汇总 | `single-class-summary` | 单科 | 顶层入口 | 点击班级 → 视图5 |
| 5 | 单科班级题目 | `single-class-question` | 单科 | 视图4点击班级 | 点击题号 → 视图7 |
| 6 | 单科题目汇总 | `single-question-summary` | 单科 | 顶层入口 | 点击题号 → 视图7 |
| 7 | 单科班级题目详情 | `single-question-detail` | 单科 | 视图3/5/6 | 无（最深层） |

### 4.2 视图 1：班级情况汇总

**副标题：** 各班级 + 全年级总成绩对比

**表格字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| 班级 | string | 全年级 + 各班级名称，班级名可点击下钻 |
| 人数 | number | 参考人数 |
| 平均分 | number | 班级/年级平均分 |
| 最高分 | number | 班级/年级最高分 |
| 最低分 | number | 班级/年级最低分 |
| 离均差 | number | 班级平均分 - 年级平均分，带正负号 |
| 标准差 | number | 成绩离散程度 |

**下钻：** 点击班级名称 → 视图 3（班级学科汇总）

### 4.3 视图 2：学科情况汇总

**副标题：** 各学科 + 全科成绩对比

**表格字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| 学科 | string | 全科 + 各学科名称 |
| 满分 | number | 学科满分 |
| 平均分 | number | 学科平均分 |
| 最高分 | number | 学科最高分 |
| 最低分 | number | 学科最低分 |
| 难度系数 | number | 0~1，平均分/满分 |
| 参考人数 | number | 参考人数 |
| 表现 | string | 领先/稳步/持平/预警（标签） |

**下钻：** 无

### 4.4 视图 3：班级学科汇总

**副标题：** {班级名} 各学科成绩与全年级对比

**表格字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| 学科 | string | 全科 + 各学科，学科名可点击下钻 |
| 班级均分 | number | 该班级该学科平均分 |
| 年级均分 | number | 全年级该学科平均分 |
| 分差 | number | 班级均分 - 年级均分 |
| 班级最高 | number | 该班级该学科最高分 |
| 班级最低 | number | 该班级该学科最低分 |
| 班级排名 | string | 该班级在全年级中的排名，如 2/10 |

**下钻：** 点击学科名称 → 自动切换到对应单科模式，进入视图 5（单科班级题目）

### 4.5 视图 4：单科班级汇总

**副标题：** {学科名} 各班级成绩对比

**表格字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| 班级 | string | 全年级 + 各班级，班级名可点击下钻 |
| 人数 | number | 参考人数 |
| 该科均分 | number | 班级该学科平均分 |
| 年级均分 | number | 全年级该学科平均分 |
| 分差 | number | 班级 - 年级 |
| 班级排名 | string | 班级排名 |
| 及格率 | number | 及格人数占比 |
| 优秀率 | number | 优秀人数占比 |

**下钻：** 点击班级名称 → 视图 5（单科班级题目）

### 4.6 视图 5：单科班级题目

**副标题：** {班级名} {学科名} 各题目得分分析

**表格字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| 题号 | string | 如 Q1、Q2，可点击下钻 |
| 题型 | string | 选择/填空/解答等 |
| 分值 | number | 题目满分 |
| 班级均分 | number | 该班级该题平均分 |
| 得分率 | number | 班级均分/分值 |
| 年级均分 | number | 全年级该题平均分 |
| 难度 | string | 易/中/难标签 |

**下钻：** 点击题号 → 视图 7（单科班级题目详情）

### 4.7 视图 6：单科题目汇总

**副标题：** {学科名} 各题目班级得分对比

**入口：** 单科模式下的顶层入口（侧边栏直接切换）

**表格字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| 题号 | string | 可点击下钻 |
| 题型 | string | 选择/填空/解答等 |
| 分值 | number | 题目满分 |
| 年级均分 | number | 全年级该题平均分 |
| 各班级均分 | number[] | 各班该题平均分对比 |
| 得分率 | number | 年级均分/分值 |
| 难度 | string | 易/中/难标签 |

**下钻：** 点击题号 → 视图 7（单科班级题目详情）

### 4.8 视图 7：单科班级题目详情

**副标题：** {班级名} {学科名} 第 {题号} 题学生得分详情

**表格字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| 学生姓名 | string | 学生姓名 |
| 得分 | number | 该生该题得分 |
| 满分 | number | 题目满分 |
| 得分率 | number | 得分/满分 |
| 班级排名 | number | 该题班级排名 |
| 年级排名 | number | 该题年级排名 |
| 作答内容 | string | 学生作答内容摘要（可选） |

**下钻：** 无，最深层级

## 5. 数据接口定义（TypeScript）

### 5.1 新增接口类型

```typescript
// === 视图3：班级学科汇总 ===
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
  overall: ClassSubjectItem  // 全科行
  subjects: ClassSubjectItem[]
}

// === 视图4：单科班级汇总 ===
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
  overall: SingleClassSummaryItem  // 全年级行
  classes: SingleClassSummaryItem[]
}

// === 视图5：单科班级题目 ===
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

// === 视图6：单科题目汇总 ===
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

// === 视图7：单科班级题目详情 ===
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

### 5.2 新增 API 服务方法

```typescript
export const analysisService = {
  // 现有接口保持不变...

  // 视图3：班级学科汇总
  getClassSubjectSummary: (
    examId: string,
    classId: number
  ): Promise<ClassSubjectSummaryResponse> =>
    apiClient.get(`/exams/${examId}/analysis/class-subject-summary`, {
      params: { class_id: classId },
    }),

  // 视图4：单科班级汇总
  getSingleClassSummary: (
    examId: string,
    subjectId: string
  ): Promise<SingleClassSummaryResponse> =>
    apiClient.get(`/exams/${examId}/analysis/single-class-summary`, {
      params: { subject_id: subjectId },
    }),

  // 视图5：单科班级题目
  getSingleClassQuestion: (
    examId: string,
    subjectId: string,
    classId: number
  ): Promise<SingleClassQuestionResponse> =>
    apiClient.get(`/exams/${examId}/analysis/single-class-question`, {
      params: { subject_id: subjectId, class_id: classId },
    }),

  // 视图6：单科题目汇总
  getSingleQuestionSummary: (
    examId: string,
    subjectId: string
  ): Promise<SingleQuestionSummaryResponse> =>
    apiClient.get(`/exams/${examId}/analysis/single-question-summary`, {
      params: { subject_id: subjectId },
    }),

  // 视图7：单科班级题目详情
  getSingleQuestionDetail: (
    examId: string,
    subjectId: string,
    classId: number,
    questionId: string
  ): Promise<SingleQuestionDetailResponse> =>
    apiClient.get(`/exams/${examId}/analysis/single-question-detail`, {
      params: { subject_id: subjectId, class_id: classId, question_id: questionId },
    }),
}
```

## 6. URL Query Param 设计

所有视图通过 `view` query param 控制，辅以必要的上下文参数：

| 视图 | URL 示例 |
|------|---------|
| 班级情况汇总 | `/exams/123?view=class-summary` |
| 学科情况汇总 | `/exams/123?view=subject-summary` |
| 班级学科汇总 | `/exams/123?view=class-subject-summary&classId=101` |
| 单科班级汇总 | `/exams/123?view=single-class-summary&subjectId=math` |
| 单科班级题目 | `/exams/123?view=single-class-question&subjectId=math&classId=101` |
| 单科题目汇总 | `/exams/123?view=single-question-summary&subjectId=math` |
| 单科班级题目详情 | `/exams/123?view=single-question-detail&subjectId=math&classId=101&qId=q5` |

### 参数规则

- `view`：必填，决定渲染哪个分析组件
- `classId`：视图 3/5/7 需要，标识当前选中的班级
- `subjectId`：视图 4/5/6/7 需要，标识当前选中的学科
- `qId`：视图 7 需要，标识当前选中的题目

## 7. 面包屑导航

### 7.1 面包屑生成规则

面包屑根据当前 `view` 和参数动态生成，每个节点包含：
- `label`：显示文本
- `view`：点击后跳转的视图
- `params`：该视图所需的参数

### 7.2 各视图的面包屑配置

| 当前 View | 面包屑 |
|-----------|--------|
| `class-summary` | 全科分析 / 班级情况汇总 |
| `subject-summary` | 全科分析 / 学科情况汇总 |
| `class-subject-summary` | 全科分析 / 班级情况汇总 / {班级名} |
| `single-class-summary` | {学科名} / 单科班级汇总 |
| `single-class-question` | {学科名} / 单科班级汇总 / {班级名} |
| `single-question-summary` | {学科名} / 单科题目汇总 |
| `single-question-detail` | {学科名} / ... / {班级名} / 第{题号}题 |

### 7.3 点击行为

- 点击面包屑中的任意节点，URL 参数回退到该节点对应的状态
- 点击"全科分析"或学科名节点，同时切换学科标签模式
- 当前节点（最后一项）不可点击，黑色高亮显示

## 8. 状态管理扩展

在现有 `analysisStore` 基础上扩展：

```typescript
interface DrillDownNode {
  view: AnalysisView
  label: string
  params?: Record<string, string>
}

type AnalysisView =
  | 'class-summary'
  | 'subject-summary'
  | 'class-subject-summary'
  | 'single-class-summary'
  | 'single-class-question'
  | 'single-question-summary'
  | 'single-question-detail'

interface AnalysisState {
  // 现有状态...
  selectedExamId: string | null
  selectedSubjectId: string | null
  selectedScope: 'all_subjects' | 'single_subject'

  // 新增状态
  currentView: AnalysisView
  drillDownPath: DrillDownNode[]  // 面包屑路径
  drillDownParams: {              // 当前下钻参数
    classId?: string
    subjectId?: string
    questionId?: string
  }
}
```

### 状态更新规则

1. **切换 view**：推入面包屑路径，保留必要参数
2. **点击面包屑回退**：弹出路径到目标节点，参数同步回退
3. **切换学科标签**：重置 `currentView` 到该模式下的默认视图，清空下钻参数
4. **切换侧边栏维度**：直接切换 view，重置超出该视图层级的参数

## 9. 组件架构

### 9.1 新增组件

| 组件 | 职责 |
|------|------|
| `BreadcrumbNav` | 面包屑导航栏，根据当前 view 和参数动态生成 |
| `ClassSubjectSummary` | 视图3：班级学科汇总 |
| `SingleClassSummary` | 视图4：单科班级汇总 |
| `SingleClassQuestion` | 视图5：单科班级题目 |
| `SingleQuestionSummary` | 视图6：单科题目汇总 |
| `SingleQuestionDetail` | 视图7：单科班级题目详情 |

### 9.2 现有组件修改

| 组件 | 修改内容 |
|------|---------|
| `page.tsx` | 增加 view query param 解析，根据 view 渲染不同组件 |
| `app-sidebar.tsx` | 侧边栏根据全科/单科模式过滤显示的维度 |
| `analysisStore.ts` | 扩展下钻相关状态 |
| `ClassSummary` | 班级名称添加可点击下钻样式 |

### 9.3 组件渲染映射

```typescript
const viewComponentMap: Record<AnalysisView, React.ComponentType> = {
  'class-summary': ClassSummary,
  'subject-summary': SubjectSummary,
  'class-subject-summary': ClassSubjectSummary,
  'single-class-summary': SingleClassSummary,
  'single-class-question': SingleClassQuestion,
  'single-question-summary': SingleQuestionSummary,
  'single-question-detail': SingleQuestionDetail,
}
```

## 10. 分步实施计划

### Phase 1：基础设施（接口定义 + 状态管理）

1. 定义 5 个新增接口的 TypeScript 类型
2. 定义 `AnalysisView` 联合类型
3. 扩展 `analysisStore`，支持下钻路径和参数管理
4. 创建 `BreadcrumbNav` 组件框架
5. 修改 `page.tsx` 支持 `view` query param 解析和组件映射
6. 修改侧边栏，根据模式过滤维度

### Phase 2：Mock 数据 + 视图组件（全科部分）

7. 创建 `ClassSubjectSummary` 组件 + mock 数据
8. 修改 `ClassSummary`，班级名称添加下钻链接
9. 面包屑导航接入，支持全科路径
10. 联调：视图1 → 视图3 的下钻路径

### Phase 3：Mock 数据 + 视图组件（单科部分）

11. 创建 `SingleClassSummary` 组件 + mock 数据
12. 创建 `SingleClassQuestion` 组件 + mock 数据
13. 创建 `SingleQuestionSummary` 组件 + mock 数据
14. 创建 `SingleQuestionDetail` 组件 + mock 数据
15. 联调：视图4 → 视图5 → 视图7 的下钻路径
16. 联调：视图4 → 视图6 → 视图7 的下钻路径
17. 联调：视图3 → 视图7 的跨模式跳转（自动切单科）

### Phase 4：后端对接

18. 后端接口就绪后，将 mock 数据替换为真实 API 调用
19. 字段对齐和边界情况处理

## 11. 风险与注意事项

1. **视图3 → 视图7 跨模式跳转**：从全科下的"班级学科汇总"点击学科进入"单科班级题目详情"时，需要自动切换学科标签到对应单科，面包屑路径也要正确重建
2. **URL 参数校验**：进入页面时，如果 URL 中的 view 参数与当前学科模式不匹配（如单科模式下 view=class-summary），需要自动修正
3. **侧边栏激活态**：下钻后侧边栏应高亮当前视图对应的维度条目，而非停留在触发下钻的源视图
4. **面包屑数据依赖**：面包屑中的节点标签（如"高二(1)班"）需要异步加载，考虑使用占位文本或缓存策略
