# 一分四率功能设计文档

## 背景

当前系统已有"四率分析"功能，但使用"分数线"（绝对分数）作为阈值，且仅支持 4 个等级（优秀/良好/合格/低分）。该视图不在侧边栏导航中，用户无法通过正常导航进入，属于事实上的死代码。

本设计将四率分析替换为"一分四率"，使用"得分率"（百分比）作为阈值，支持 5 个等级（优秀/良好/中等/及格/低分），并修复导航缺失的问题。

## 目标

1. 替换现有四率分析为"一分四率"，前后端同步修改
2. 修复侧边栏导航缺失，让全科和单科都能看到"一分四率"入口
3. 清理遗留的四率分析死代码

## 核心概念：一分四率

"一分四率"是一种累积达标率统计系统：

- **统计基准**：得分率 = 总分 / 满分 × 100%
- **分类方式**：累积达标（一个学生可同时属于多个等级）
- **等级数**：5 个（优秀/良好/中等/及格/低分）
- **阈值方向**：优秀/良好/中等/及格为"≥"，低分为"<"

示例：得分率 88% 的学生同时计入"及格"（≥60%）、"中等"（≥68%）、"良好"（≥76%），但不计入"优秀"（<85%）。

各等级人数是递减的：优秀人数 ≤ 良好人数 ≤ 中等人数 ≤ 及格人数。低分人数独立统计。

## 数据模型

### Proto 变更（`api/seas/v1/analysis.proto`）

```protobuf
message RatingConfig {
  double excellent_threshold = 1;  // 优秀得分率%，默认85
  double good_threshold = 2;       // 良好得分率%，默认76
  double medium_threshold = 3;     // 中等得分率%，默认68
  double pass_threshold = 4;       // 及格得分率%，默认60
  double low_score_threshold = 5;  // 低分得分率%，默认40
}

message GetRatingDistributionRequest {
  string exam_id = 1;
  string scope = 2;
  string subject_id = 3;
  double excellent_threshold = 4;
  double good_threshold = 5;
  double medium_threshold = 6;
  double pass_threshold = 7;
  double low_score_threshold = 8;
}

message ClassRatingDistribution {
  int32 class_id = 1;
  string class_name = 2;
  int32 total_students = 3;
  double avg_score = 4;
  RatingItem excellent = 5;
  RatingItem good = 6;
  RatingItem medium = 7;
  RatingItem pass = 8;
  RatingItem low_score = 9;
}
```

### TypeScript 类型（`src/types/analysis.ts`）

```typescript
export interface RatingConfig {
  excellent_threshold: number  // 默认85
  good_threshold: number       // 默认76
  medium_threshold: number     // 默认68
  pass_threshold: number       // 默认60
  low_score_threshold: number  // 默认40
}

export interface ClassRatingDistribution {
  classId: number
  className: string
  totalStudents: number
  avgScore: number
  excellent: RatingItem
  good: RatingItem
  medium: RatingItem
  pass: RatingItem
  lowScore: RatingItem
}
```

## API 设计

### 接口路径

保持现有路径不变：`GET /seas/api/v1/exams/{exam_id}/analysis/rating-distribution`

### 请求参数

| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| scope | string | all_subjects 或 single_subject | - |
| subject_id | string | scope=single_subject 时必传 | - |
| excellent_threshold | number | 优秀得分率% | 85 |
| good_threshold | number | 良好得分率% | 76 |
| medium_threshold | number | 中等得分率% | 68 |
| pass_threshold | number | 及格得分率% | 60 |
| low_score_threshold | number | 低分得分率% | 40 |

### 响应结构

```json
{
  "examId": "1",
  "examName": "期中考试",
  "scope": "all_subjects",
  "totalParticipants": 446,
  "config": {
    "excellent_threshold": 85,
    "good_threshold": 76,
    "medium_threshold": 68,
    "pass_threshold": 60,
    "low_score_threshold": 40
  },
  "overallGrade": {
    "classId": 0,
    "className": "全年级",
    "totalStudents": 446,
    "avgScore": 669.50,
    "excellent": { "count": 2, "percentage": 0.45 },
    "good": { "count": 35, "percentage": 7.85 },
    "medium": { "count": 138, "percentage": 30.94 },
    "pass": { "count": 306, "percentage": 68.61 },
    "lowScore": { "count": 0, "percentage": 0.00 }
  },
  "classDetails": [...]
}
```

## 后端实现

### Biz 层（`internal/biz/exam_analysis.go`）

- `GetRatingDistribution` 方法签名扩展：增加 `mediumThreshold` 和 `lowScoreThreshold` 参数
- `calculateRatingPercentages` 增加 medium 和 lowScore 的百分比计算

### Data 层（`internal/data/score.go`）

核心改动：从基于 total_score 的互斥分类，改为基于得分率的累积达标率统计。

**单科模式 SQL**：

```sql
SELECT
  c.id as class_id,
  c.name as class_name,
  COUNT(sc.student_id) as total_students,
  ROUND(AVG(sc.total_score), 2) as avg_score,
  SUM(CASE WHEN sc.total_score / sub.full_score * 100 >= ? THEN 1 ELSE 0 END) as excellent,
  SUM(CASE WHEN sc.total_score / sub.full_score * 100 >= ? THEN 1 ELSE 0 END) as good,
  SUM(CASE WHEN sc.total_score / sub.full_score * 100 >= ? THEN 1 ELSE 0 END) as medium,
  SUM(CASE WHEN sc.total_score / sub.full_score * 100 >= ? THEN 1 ELSE 0 END) as pass,
  SUM(CASE WHEN sc.total_score / sub.full_score * 100 < ? THEN 1 ELSE 0 END) as low_score
FROM classes c
LEFT JOIN students st ON st.class_id = c.id
LEFT JOIN scores sc ON sc.student_id = st.id AND sc.exam_id = ? AND sc.subject_id = ?
LEFT JOIN subjects sub ON sub.id = sc.subject_id
GROUP BY c.id, c.name
HAVING COUNT(sc.student_id) > 0
ORDER BY c.id
```

**全科模式 SQL**：使用 CTE 先计算每个学生的加权平均得分率（各科得分率 = total_score / 该科满分 × 100，然后按满分加权平均），再按班级分组统计达标人数。SQL 结构如下：

```sql
WITH student_score_rates AS (
  SELECT
    st.id as student_id,
    st.class_id,
    SUM(sc.total_score / sub.full_score * 100 * sub.full_score) / SUM(sub.full_score) as weighted_score_rate
  FROM students st
  JOIN scores sc ON sc.student_id = st.id AND sc.exam_id = ?
  JOIN subjects sub ON sub.id = sc.subject_id
  GROUP BY st.id, st.class_id
)
SELECT
  c.id as class_id,
  c.name as class_name,
  COUNT(ssr.student_id) as total_students,
  ROUND(AVG(ssr.weighted_score_rate), 2) as avg_score,
  SUM(CASE WHEN ssr.weighted_score_rate >= ? THEN 1 ELSE 0 END) as excellent,
  SUM(CASE WHEN ssr.weighted_score_rate >= ? THEN 1 ELSE 0 END) as good,
  SUM(CASE WHEN ssr.weighted_score_rate >= ? THEN 1 ELSE 0 END) as medium,
  SUM(CASE WHEN ssr.weighted_score_rate >= ? THEN 1 ELSE 0 END) as pass,
  SUM(CASE WHEN ssr.weighted_score_rate < ? THEN 1 ELSE 0 END) as low_score
FROM classes c
LEFT JOIN student_score_rates ssr ON ssr.class_id = c.id
GROUP BY c.id, c.name
HAVING COUNT(ssr.student_id) > 0
ORDER BY c.id
```

### Service 层（`internal/service/analysis.go`）

- `GetRatingDistribution` handler 扩展参数提取和响应构建
- 默认值更新：excellent=85, good=76, medium=68, pass=60, low_score=40

## 前端实现

### 侧边栏导航（`app-sidebar.tsx`）

在 `allAnalysisDimensions` 中新增：

```typescript
{ key: 'rating-analysis', label: '一分四率', icon: <TrendingUp className="h-[15px] w-[15px]" />, scope: 'all' },
{ key: 'rating-analysis', label: '一分四率', icon: <TrendingUp className="h-[15px] w-[15px]" />, scope: 'single' },
```

需要从 `lucide-react` 导入 `TrendingUp` icon（如项目中未导入，则使用已有 icon 如 `BarChart3` 替代）。

同一个 `rating-analysis` 视图 key 同时出现在全科和单科模式下，由 `selectedScope` 自动过滤显示。

### RatingChart 组件（`RatingChart.tsx`）

**配置面板**：5 个得分率输入 + 查询按钮，水平排列：

```
优秀：得分率 ≥ [85] %    良好：得分率 ≥ [76] %    中等：得分率 ≥ [68] %
及格：得分率 ≥ [60] %    低分：得分率 < [40] %    [查询]
```

**表格列**：

| 班级 | 总人数 | 均分 | 优秀人数 | 优秀占比 | 良好人数 | 良好占比 | 中等人数 | 中等占比 | 及格人数 | 及格占比 | 低分人数 | 低分占比 |

全年级行高亮（`bg-primary/5 font-semibold`），班级行 hover 效果（`hover:bg-muted/20`）。

### Store（`analysisStore.ts`）

默认配置更新为 5 个阈值：

```typescript
ratingConfig: {
  excellent_threshold: 85,
  good_threshold: 76,
  medium_threshold: 68,
  pass_threshold: 60,
  low_score_threshold: 40,
}
```

### 服务层（`src/services/analysis.ts`）

`getRatingDistribution` 参数映射增加 `medium_threshold` 和 `low_score_threshold`：

```typescript
getRatingDistribution: (
  examId: string,
  scope: 'all_subjects' | 'single_subject',
  config?: RatingConfig,
  subjectId?: string
) => apiClient.get(`/exams/${examId}/analysis/rating-distribution`, {
  params: {
    scope,
    ...(subjectId && { subject_id: subjectId }),
    ...(config && {
      excellent_threshold: config.excellent_threshold,
      good_threshold: config.good_threshold,
      medium_threshold: config.medium_threshold,
      pass_threshold: config.pass_threshold,
      low_score_threshold: config.low_score_threshold,
    }),
  },
})
```

### Hooks（`src/hooks/useAnalysis.ts`）

`ratingDistributionQueryKey` 扩展为包含 5 个阈值：

```typescript
export const ratingDistributionQueryKey = (
  examId: string,
  scope: 'all_subjects' | 'single_subject',
  config: RatingConfig | undefined,
  subjectId?: string
) => [
  'ratingDistribution',
  examId, scope,
  config?.excellent_threshold,
  config?.good_threshold,
  config?.medium_threshold,
  config?.pass_threshold,
  config?.low_score_threshold,
  subjectId,
]
```

## 清理清单

| 位置 | 内容 | 处理方式 |
|------|------|----------|
| `src/components/analysis/RatingChart.tsx` | 旧版四率组件 | 重写替换 |
| `src/types/analysis.ts` | 旧 RatingConfig / ClassRatingDistribution | 扩展字段 |
| `src/store/analysisStore.ts` | 默认 3 阈值配置 | 更新为 5 阈值 |
| `src/components/layout/app-sidebar.tsx` | 缺少 rating-analysis 入口 | 添加 |
| `src/services/analysis.ts` | 3 参数映射 | 扩展为 5 参数 |
| `src/hooks/useAnalysis.ts` | queryKey 和 hook | 扩展 queryKey |
| `src/utils/format.ts` | `ratingTierBadgeClass` 样式映射 | 检查是否需要扩展 |
| `api/seas/v1/analysis.proto` | 旧 proto 定义 | 扩展字段 |
| `internal/biz/exam_analysis.go` | 旧四率逻辑 | 重写 |
| `internal/biz/score.go` | 旧 biz 类型 | 扩展类型 |
| `internal/data/score.go` | 旧 SQL 查询 | 重写 |
| `internal/service/analysis.go` | handler 映射 | 扩展参数 |
| `internal/server/ai_analysis.go` | AI 分析系统可能通过 `view="rating-analysis"` 引用四率数据 | 检查 AI 提示词中是否引用了旧四率的字段名/等级结构，如有则同步更新 |

## 错误处理

- **无效阈值**：前端输入框限制 0-100，后端无需额外校验
- **无数据**：表格显示"暂无数据"空状态
- **SQL 执行错误**：后端返回 500，前端显示通用错误提示
- **全科模式满分缺失**：如果某科没有满分记录，fallback 为 100 分

## 未涉及范围（YAGNI）

- 阈值配置的持久化存储（每次查询都带参数，不保存到后端）
- 阈值配置的导入/导出
- 一分四率的图表可视化（仅表格）
- 打印/PDF 导出特殊样式
