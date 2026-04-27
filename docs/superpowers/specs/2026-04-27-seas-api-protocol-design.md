# SEAS 分析视图 API 协议设计文档

> 日期：2026-04-27
> 范围：前后端 API 字段对齐，支持 4 个核心分析视图

---

## 设计原则

1. **后端返回原始数值，前端负责展示逻辑**
   - 所有指标（难度、区分度等）后端统一返回数值
   - 前端根据业务规则自行决定展示格式（如保留小数位数、颜色标注、标签映射等）

2. **类型统一**
   - ID 字段统一为 `number`
   - 人数/计数字段统一为 `number`
   - 百分比/系数字段统一为 `number`（小数形式，如 0.75 表示 75%）

---

## 视图1：全科班级情况汇总

**接口**：`GET /seas/api/v1/exams/{examId}/analysis/class-summary`

**查询参数**：

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `scope` | `'all_subjects' \| 'single_subject'` | 是 | 分析范围 |
| `subjectId` | `string` | 否 | 单科分析时必填 |

**响应**：

```typescript
interface ClassSummaryResponse {
  examId: string
  examName: string
  scope: 'all_subjects' | 'single_subject'
  totalParticipants: number
  overallGrade: ClassSummary      // 年级总体行
  classDetails: ClassSummary[]    // 各班明细
}

interface ClassSummary {
  classId: number
  className: string
  totalStudents: number     // 参考人数
  fullScore: number         // 考试满分
  avgScore: number          // 平均分
  highestScore: number      // 最高分
  lowestScore: number       // 最低分
  scoreDeviation: number    // 离均差 = 班级平均分 - 年级平均分
  difficulty: number        // 难度系数（0~1 小数）
  stdDev: number            // 标准差
  discrimination: number    // 区分度（基于全科总分计算，见下文）
}
```

**变更说明**：
- 新增 `fullScore`（满分）
- 新增 `discrimination`（区分度）
- `classId`、`totalStudents`、`totalParticipants` 统一为 `number`

---

## 视图2：全科学科情况汇总

**接口**：`GET /seas/api/v1/exams/{examId}/analysis/subject-summary`

**查询参数**：同视图1

**响应**：

```typescript
interface SubjectSummaryResponse {
  examId: string
  examName: string
  scope: 'all_subjects' | 'single_subject'
  totalParticipants: number
  subjectsInvolved: number  // 涉及学科数
  classesInvolved: number   // 涉及班级数
  overall: SubjectSummary   // 全年级总体（新增）
  subjects: SubjectSummary[]
}

interface SubjectSummary {
  id: string
  name: string              // 学科名称
  fullScore: number         // 学科满分
  avgScore: number          // 平均分
  highestScore: number      // 最高分
  lowestScore: number       // 最低分
  scoreDeviation: number    // 离均差 = 学科平均分 - 全科总平均分
  difficulty: number        // 难度系数
  stdDev: number            // 标准差
  discrimination: number    // 区分度（基于该学科总分计算）
  studentCount: number      // 参考人数
}
```

**变更说明**：
- 新增 `overall` 汇总行（全年级总体学科数据）
- 新增 `scoreDeviation`（离均差）
- 新增 `stdDev`（标准差）
- 新增 `discrimination`（区分度）
- `totalParticipants`、`studentCount` 统一为 `number`

---

## 视图3：单科班级情况汇总

**接口**：`GET /seas/api/v1/exams/{examId}/subjects/{subjectId}/classes`

**响应**：

```typescript
interface SingleClassSummaryResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  overall: ClassSummary     // 全年级总体行
  classes: ClassSummary[]   // 各班明细
}

// 复用视图1的 ClassSummary 结构，数据维度为单科
interface ClassSummary {
  classId: number
  className: string
  totalStudents: number
  fullScore: number         // 该学科满分
  avgScore: number          // 该学科平均分
  highestScore: number
  lowestScore: number
  scoreDeviation: number    // 离均差 = 班级平均分 - 年级平均分
  difficulty: number
  stdDev: number
  discrimination: number    // 区分度（基于该学科总分计算）
}
```

**变更说明**：
- `SingleClassSummaryItem` 结构**完全重写**，与 `ClassSummary` 同构
- 移除原字段：`subjectAvgScore`、`gradeAvgScore`、`scoreDiff`、`classRank`、`totalClasses`、`passRate`、`excellentRate`

---

## 视图4：单科题目汇总

**接口**：`GET /seas/api/v1/exams/{examId}/subjects/{subjectId}/questions`

**响应**：

```typescript
interface SingleQuestionSummaryResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  questions: SingleQuestionSummaryItem[]
}

interface SingleQuestionSummaryItem {
  questionId: string
  questionNumber: string
  questionType: string
  fullScore: number
  gradeAvgScore: number
  classBreakdown: QuestionClassBreakdown[]
  scoreRate: number
  difficulty: number        // 难度系数（数值，非枚举）
}

interface QuestionClassBreakdown {
  classId: number
  className: string
  avgScore: number
}
```

**变更说明**：
- `difficulty` 由字符串枚举改为 `number` 类型
- `classBreakdown.classId` 统一为 `number`

---

## 区分度计算说明

区分度采用教育测量学标准定义：**高低分组得分率之差**。

计算方式：
1. 将学生的对应总分（全科总分 / 学科总分）视为"一道题"的得分
2. 按总分高低排序，取前 27% 为高分组，后 27% 为低分组
3. 区分度 = 高分组平均得分率 - 低分组平均得分率

适用场景：
- **班级情况汇总**：基于该班学生的全科总分（或单科总分）计算
- **学科情况汇总**：基于全年级学生该学科总分计算

---

## 后端修改清单

| 优先级 | 接口 | 修改项 |
|--------|------|--------|
| P0 | 班级汇总 `ClassSummaryItem` | 增加 `fullScore`、`discrimination` |
| P0 | 班级汇总 | `classId`、`totalStudents` 改为 `number` |
| P0 | 班级汇总 `GetClassSummaryReply` | `totalParticipants` 改为 `number` |
| P0 | 学科汇总 `SubjectSummaryItem` | 增加 `scoreDeviation`、`stdDev`、`discrimination` |
| P0 | 学科汇总 `GetSubjectSummaryReply` | 增加 `overall` 汇总行；`totalParticipants`、`studentCount` 改为 `number` |
| P0 | 单科班级汇总 `SingleClassSummaryItem` | 结构重写为 `ClassSummary` 同构 |
| P1 | 题目汇总 `ClassQuestionItem` / `SingleQuestionSummaryItem` | `difficulty` 改为 `number` |
| P1 | 题目汇总 `QuestionClassBreakdown` | `classId` 改为 `number` |
