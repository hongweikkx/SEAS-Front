# 一分四率功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 替换现有四率分析为一分四率，前后端同步修改，修复侧边栏导航缺失，清理遗留死代码。

**Architecture:** 后端保持现有接口路径 `/rating-distribution`，将统计基准从"总分/分数线"改为"得分率/阈值"，从互斥分类改为累积达标率。前端直接重写 RatingChart 组件，扩展配置面板为5个得分率输入，表格增加"中等"和"低分"列。

**Tech Stack:** Next.js 16 + React 19 + TypeScript + TanStack Query + Zustand（前端）；Go + Kratos + GORM + Protobuf（后端）

---

## 文件结构

| 文件 | 职责 | 操作 |
|------|------|------|
| `api/seas/v1/analysis.proto` | Proto 定义，扩展 RatingConfig / ClassRatingDistribution | 修改 |
| `internal/biz/score.go` | Biz 层类型定义（RatingConfigStats / ClassRatingStats） | 修改 |
| `internal/biz/exam_analysis.go` | 四率业务逻辑，参数校验和百分比计算 | 修改 |
| `internal/data/score.go` | 数据访问层，四率 SQL 查询 | 修改 |
| `internal/service/analysis.go` | HTTP/gRPC handler，请求/响应映射 | 修改 |
| `src/types/analysis.ts` | TypeScript 类型定义 | 修改 |
| `src/store/analysisStore.ts` | Zustand store，默认阈值配置 | 修改 |
| `src/services/analysis.ts` | API 客户端，参数映射 | 修改 |
| `src/hooks/useAnalysis.ts` | TanStack Query hook 和 queryKey | 修改 |
| `src/components/layout/app-sidebar.tsx` | 侧边栏导航，添加一分四率入口 | 修改 |
| `src/components/analysis/RatingChart.tsx` | 一分四率展示组件（配置面板 + 表格） | 重写 |
| `src/utils/format.ts` | 工具函数，检查 ratingTierBadgeClass | 修改 |

---

### Task 1: 后端 Proto 定义扩展

**Files:**
- Modify: `api/seas/v1/analysis.proto`

- [ ] **Step 1: 扩展 RatingConfig 消息**

  在 `analysis.proto` 中，将 `RatingConfig` 改为：

  ```protobuf
  message RatingConfig {
    double excellent_threshold = 1;  // 优秀得分率%，默认85
    double good_threshold = 2;       // 良好得分率%，默认76
    double medium_threshold = 3;     // 中等得分率%，默认68
    double pass_threshold = 4;       // 及格得分率%，默认60
    double low_score_threshold = 5;  // 低分得分率%，默认40
  }
  ```

- [ ] **Step 2: 扩展 GetRatingDistributionRequest**

  将 `GetRatingDistributionRequest` 的 threshold 字段扩展为5个：

  ```protobuf
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
  ```

- [ ] **Step 3: 扩展 ClassRatingDistribution**

  将 `ClassRatingDistribution` 的 rating 字段扩展，把 `fail` 改为 `low_score` 并增加 `medium`：

  ```protobuf
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

- [ ] **Step 4: Commit**

  ```bash
  git add api/seas/v1/analysis.proto
  git commit -m "feat(proto): 扩展 RatingConfig 为一分四率5级阈值"
  ```

---

### Task 2: 后端 Biz 类型扩展

**Files:**
- Modify: `internal/biz/score.go`

- [ ] **Step 1: 扩展 RatingConfigStats 结构体**

  ```go
  // RatingConfigStats 四率配置
  type RatingConfigStats struct {
    ExcellentThreshold float64
    GoodThreshold      float64
    MediumThreshold    float64 // 新增
    PassThreshold      float64
    LowScoreThreshold  float64 // 新增
  }
  ```

- [ ] **Step 2: 扩展 ClassRatingStats 结构体**

  ```go
  // ClassRatingStats 班级的四率统计
  type ClassRatingStats struct {
    ClassID       int64
    ClassName     string
    TotalStudents int64
    AvgScore      float64
    Excellent     *RatingItemStats // 优秀
    Good          *RatingItemStats // 良好
    Medium        *RatingItemStats // 新增：中等
    Pass          *RatingItemStats // 及格
    LowScore      *RatingItemStats // 新增：低分（原 Fail）
  }
  ```

- [ ] **Step 3: 更新 ScoreRepo 接口签名**

  将 `ScoreRepo` 接口中的 `GetRatingDistribution` 方法签名扩展：

  ```go
  GetRatingDistribution(ctx context.Context, examID, subjectID int64, excellentThreshold, goodThreshold, mediumThreshold, passThreshold, lowScoreThreshold float64) (*RatingDistributionStats, error)
  ```

- [ ] **Step 4: Commit**

  ```bash
  git add internal/biz/score.go
  git commit -m "feat(biz): 扩展 RatingConfigStats 和 ClassRatingStats 为一分四率5级"
  ```

---

### Task 3: 后端 Data 层 SQL 重写

**Files:**
- Modify: `internal/data/score.go`

- [ ] **Step 1: 重写单科模式 SQL**

  替换 `GetRatingDistribution` 中单科模式的 SQL 为基于得分率的累积达标率统计：

  ```go
  err := r.data.db.WithContext(ctx).Raw(`
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
  `, excellentThreshold, goodThreshold, mediumThreshold, passThreshold, lowScoreThreshold, examID, subjectID).Scan(&ratingStats).Error
  ```

  注意：SQL 参数顺序与 `ratingStats` 结构体字段顺序一致。

- [ ] **Step 2: 重写全科模式 SQL**

  替换全科模式 SQL 为 CTE 形式，先计算每个学生的加权平均得分率：

  ```go
  err := r.data.db.WithContext(ctx).Raw(`
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
  `, examID, excellentThreshold, goodThreshold, mediumThreshold, passThreshold, lowScoreThreshold).Scan(&ratingStats).Error
  ```

- [ ] **Step 3: 更新 ratingStats 扫描结构体**

  将 `ratingStats` 结构体增加 `medium` 和 `low_score` 字段，删除旧的 `fail`：

  ```go
  var ratingStats []struct {
    ClassID       int64   `gorm:"column:class_id"`
    ClassName     string  `gorm:"column:class_name"`
    TotalStudents int64   `gorm:"column:total_students"`
    AvgScore      float64 `gorm:"column:avg_score"`
    Excellent     int64   `gorm:"column:excellent"`
    Good          int64   `gorm:"column:good"`
    Medium        int64   `gorm:"column:medium"`
    Pass          int64   `gorm:"column:pass"`
    LowScore      int64   `gorm:"column:low_score"`
  }
  ```

- [ ] **Step 4: 更新统计结果映射**

  在循环构建 `stats.ClassDetails` 时，增加 `Medium` 和 `LowScore` 的映射，删除 `Fail`：

  ```go
  stats.ClassDetails[i] = &biz.ClassRatingStats{
    ClassID:       stat.ClassID,
    ClassName:     stat.ClassName,
    TotalStudents: stat.TotalStudents,
    AvgScore:      stat.AvgScore,
    Excellent: &biz.RatingItemStats{Count: stat.Excellent},
    Good:      &biz.RatingItemStats{Count: stat.Good},
    Medium:    &biz.RatingItemStats{Count: stat.Medium},
    Pass:      &biz.RatingItemStats{Count: stat.Pass},
    LowScore:  &biz.RatingItemStats{Count: stat.LowScore},
  }
  ```

  同时更新全年级累加逻辑，增加 `overallMedium` 和 `overallLowScore`：

  ```go
  var overallExcellent, overallGood, overallMedium, overallPass, overallLowScore int64
  // ...
  overallExcellent += stat.Excellent
  overallGood += stat.Good
  overallMedium += stat.Medium
  overallPass += stat.Pass
  overallLowScore += stat.LowScore
  ```

  以及 `stats.OverallGrade` 的映射：

  ```go
  stats.OverallGrade = &biz.ClassRatingStats{
    ClassID:       0,
    ClassName:     "全年级",
    TotalStudents: totalParticipants,
    AvgScore:      math.Round(overallAvg*100) / 100,
    Excellent:     &biz.RatingItemStats{Count: overallExcellent},
    Good:          &biz.RatingItemStats{Count: overallGood},
    Medium:        &biz.RatingItemStats{Count: overallMedium},
    Pass:          &biz.RatingItemStats{Count: overallPass},
    LowScore:      &biz.RatingItemStats{Count: overallLowScore},
  }
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add internal/data/score.go
  git commit -m "feat(data): 一分四率 SQL 改为基于得分率的累积达标率统计"
  ```

---

### Task 4: 后端 Biz 层逻辑更新

**Files:**
- Modify: `internal/biz/exam_analysis.go`

- [ ] **Step 1: 扩展 GetRatingDistribution 方法签名**

  ```go
  func (uc *ExamAnalysisUseCase) GetRatingDistribution(ctx context.Context, examID, subjectID int64, excellentThreshold, goodThreshold, mediumThreshold, passThreshold, lowScoreThreshold float64) (*RatingDistributionStats, error) {
  ```

- [ ] **Step 2: 更新默认值逻辑**

  ```go
  if excellentThreshold == 0 {
    excellentThreshold = 85
  }
  if goodThreshold == 0 {
    goodThreshold = 76
  }
  if mediumThreshold == 0 {
    mediumThreshold = 68
  }
  if passThreshold == 0 {
    passThreshold = 60
  }
  if lowScoreThreshold == 0 {
    lowScoreThreshold = 40
  }
  ```

- [ ] **Step 3: 更新调用 scoreRepo 的参数**

  ```go
  stats, err := uc.scoreRepo.GetRatingDistribution(ctx, examID, subjectID, excellentThreshold, goodThreshold, mediumThreshold, passThreshold, lowScoreThreshold)
  ```

- [ ] **Step 4: 更新 Config 和 calculateRatingPercentages**

  Config 赋值：
  ```go
  stats.Config = &RatingConfigStats{
    ExcellentThreshold: excellentThreshold,
    GoodThreshold:      goodThreshold,
    MediumThreshold:    mediumThreshold,
    PassThreshold:      passThreshold,
    LowScoreThreshold:  lowScoreThreshold,
  }
  ```

  calculateRatingPercentages 增加 medium 和 lowScore：
  ```go
  func (uc *ExamAnalysisUseCase) calculateRatingPercentages(classRating *ClassRatingStats) {
    if classRating.TotalStudents == 0 {
      return
    }
    total := float64(classRating.TotalStudents)
    classRating.Excellent.Percentage = roundTo2Decimal(float64(classRating.Excellent.Count) / total * 100)
    classRating.Good.Percentage = roundTo2Decimal(float64(classRating.Good.Count) / total * 100)
    classRating.Medium.Percentage = roundTo2Decimal(float64(classRating.Medium.Count) / total * 100)
    classRating.Pass.Percentage = roundTo2Decimal(float64(classRating.Pass.Count) / total * 100)
    classRating.LowScore.Percentage = roundTo2Decimal(float64(classRating.LowScore.Count) / total * 100)
  }
  ```

- [ ] **Step 5: Commit**

  ```bash
  git add internal/biz/exam_analysis.go
  git commit -m "feat(biz): 更新 GetRatingDistribution 为一分四率5级阈值"
  ```

---

### Task 5: 后端 Service handler 更新

**Files:**
- Modify: `internal/service/analysis.go`

- [ ] **Step 1: 扩展 GetRatingDistribution handler 参数提取**

  ```go
  excellentThreshold := req.GetExcellentThreshold()
  goodThreshold := req.GetGoodThreshold()
  mediumThreshold := req.GetMediumThreshold()
  passThreshold := req.GetPassThreshold()
  lowScoreThreshold := req.GetLowScoreThreshold()

  if excellentThreshold == 0 {
    excellentThreshold = 85
  }
  if goodThreshold == 0 {
    goodThreshold = 76
  }
  if mediumThreshold == 0 {
    mediumThreshold = 68
  }
  if passThreshold == 0 {
    passThreshold = 60
  }
  if lowScoreThreshold == 0 {
    lowScoreThreshold = 40
  }
  ```

- [ ] **Step 2: 更新 usecase 调用和响应构建**

  调用 usecase：
  ```go
  stats, err := s.examAnalysisUC.GetRatingDistribution(ctx, parseInt64(req.GetExamId()), parseInt64(req.GetSubjectId()), excellentThreshold, goodThreshold, mediumThreshold, passThreshold, lowScoreThreshold)
  ```

  Config 响应：
  ```go
  Config: &pb.RatingConfig{
    ExcellentThreshold: excellentThreshold,
    GoodThreshold:      goodThreshold,
    MediumThreshold:    mediumThreshold,
    PassThreshold:      passThreshold,
    LowScoreThreshold:  lowScoreThreshold,
  },
  ```

  OverallGrade 和 ClassDetails 的映射增加 `Medium` 和 `LowScore`，删除 `Fail`：
  ```go
  Medium: &pb.RatingItem{
    Count:      stats.OverallGrade.Medium.Count,
    Percentage: stats.OverallGrade.Medium.Percentage,
  },
  Pass: &pb.RatingItem{
    Count:      stats.OverallGrade.Pass.Count,
    Percentage: stats.OverallGrade.Pass.Percentage,
  },
  LowScore: &pb.RatingItem{
    Count:      stats.OverallGrade.LowScore.Count,
    Percentage: stats.OverallGrade.LowScore.Percentage,
  },
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add internal/service/analysis.go
  git commit -m "feat(service): 更新 GetRatingDistribution handler 为一分四率5级"
  ```

---

### Task 6: 生成 Proto Go 代码

**Files:**
- Generated: `api/seas/v1/analysis.pb.go`, `api/seas/v1/analysis_grpc.pb.go`, `api/seas/v1/analysis_http.pb.go`

- [ ] **Step 1: 执行 proto 生成命令**

  在后端项目根目录执行：

  ```bash
  cd /Users/kk/go/src/SEAS
  make generate
  ```

  如果 `make generate` 不可用，检查 `Makefile` 中对应的 protoc 命令并执行。

- [ ] **Step 2: 验证生成的代码包含新字段**

  检查 `api/seas/v1/analysis.pb.go` 中是否包含 `MediumThreshold`、`LowScoreThreshold`、`Medium`、`LowScore` 等字段。

  ```bash
  grep -n "MediumThreshold\|LowScoreThreshold\|Medium\b\|LowScore" api/seas/v1/analysis.pb.go | head -20
  ```

  预期输出包含这些字段的 getter 方法。

- [ ] **Step 3: Commit**

  ```bash
  git add api/seas/v1/
  git commit -m "chore(proto): 重新生成一分四率 proto Go 代码"
  ```

---

### Task 7: 前端类型扩展

**Files:**
- Modify: `src/types/analysis.ts`

- [ ] **Step 1: 扩展 RatingConfig 接口**

  ```typescript
  export interface RatingConfig {
    excellent_threshold: number
    good_threshold: number
    medium_threshold: number  // 新增
    pass_threshold: number
    low_score_threshold: number  // 新增
  }
  ```

- [ ] **Step 2: 扩展 ClassRatingDistribution 接口**

  ```typescript
  export interface ClassRatingDistribution {
    classId: number
    className: string
    totalStudents: number
    avgScore: number
    excellent: RatingItem
    good: RatingItem
    medium: RatingItem      // 新增
    pass: RatingItem
    lowScore: RatingItem    // 新增，原 fail 改名
  }
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/types/analysis.ts
  git commit -m "feat(types): 扩展 RatingConfig 和 ClassRatingDistribution 为一分四率5级"
  ```

---

### Task 8: 前端 Store 配置更新

**Files:**
- Modify: `src/store/analysisStore.ts`

- [ ] **Step 1: 更新默认 ratingConfig**

  ```typescript
  ratingConfig: {
    excellent_threshold: 85,
    good_threshold: 76,
    medium_threshold: 68,
    pass_threshold: 60,
    low_score_threshold: 40,
  }
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/store/analysisStore.ts
  git commit -m "feat(store): 更新一分四率默认阈值为 85/76/68/60/40"
  ```

---

### Task 9: 前端服务层扩展

**Files:**
- Modify: `src/services/analysis.ts`

- [ ] **Step 1: 扩展 getRatingDistribution 参数映射**

  ```typescript
  getRatingDistribution: (
    examId: string,
    scope: 'all_subjects' | 'single_subject',
    config?: RatingConfig,
    subjectId?: string
  ): Promise<RatingDistributionResponse> =>
    apiClient.get(`/exams/${examId}/analysis/rating-distribution`, {
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
    }),
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/services/analysis.ts
  git commit -m "feat(service): 扩展 getRatingDistribution 参数映射为一分四率5级"
  ```

---

### Task 10: 前端 Hook 更新

**Files:**
- Modify: `src/hooks/useAnalysis.ts`

- [ ] **Step 1: 扩展 ratingDistributionQueryKey**

  ```typescript
  export const ratingDistributionQueryKey = (
    examId: string,
    scope: 'all_subjects' | 'single_subject',
    config: RatingConfig | undefined,
    subjectId?: string
  ) =>
    [
      'ratingDistribution',
      examId,
      scope,
      config?.excellent_threshold,
      config?.good_threshold,
      config?.medium_threshold,
      config?.pass_threshold,
      config?.low_score_threshold,
      subjectId,
    ] as const
  ```

- [ ] **Step 2: Commit**

  ```bash
  git add src/hooks/useAnalysis.ts
  git commit -m "feat(hooks): 扩展 ratingDistributionQueryKey 包含5个阈值"
  ```

---

### Task 11: 前端侧边栏导航

**Files:**
- Modify: `src/components/layout/app-sidebar.tsx`

- [ ] **Step 1: 导入 TrendingUp icon（或替代 icon）**

  在现有的 lucide-react 导入行中添加：

  ```typescript
  import {
    // ... existing imports
    TrendingUp,
  } from 'lucide-react'
  ```

  如果 `TrendingUp` 在当前版本中不可用，使用 `BarChart3` 替代。

- [ ] **Step 2: 在 allAnalysisDimensions 中添加一分四率入口**

  在数组中添加两个条目（全科和单科）：

  ```typescript
  const allAnalysisDimensions: Array<{
    key: AnalysisView
    label: string
    icon: React.ReactNode
    scope: 'all' | 'single'
  }> = [
    { key: 'class-summary', label: '班级情况汇总', icon: <Users className="h-[15px] w-[15px]" />, scope: 'all' },
    { key: 'subject-summary', label: '学科情况汇总', icon: <LayoutList className="h-[15px] w-[15px]" />, scope: 'all' },
    { key: 'rating-analysis', label: '一分四率', icon: <TrendingUp className="h-[15px] w-[15px]" />, scope: 'all' },
    { key: 'single-class-summary', label: '班级情况汇总', icon: <Users className="h-[15px] w-[15px]" />, scope: 'single' },
    { key: 'single-question-summary', label: '试题分析', icon: <ClipboardList className="h-[15px] w-[15px]" />, scope: 'single' },
    { key: 'rating-analysis', label: '一分四率', icon: <TrendingUp className="h-[15px] w-[15px]" />, scope: 'single' },
  ]
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/layout/app-sidebar.tsx
  git commit -m "feat(sidebar): 全科和单科侧边栏添加一分四率导航入口"
  ```

---

### Task 12: 前端 RatingChart 组件重写

**Files:**
- Modify: `src/components/analysis/RatingChart.tsx`

- [ ] **Step 1: 扩展 draftConfig 的状态类型和默认值**

  组件内 `draftConfig` 直接使用 store 的 `ratingConfig`（已更新为5字段），无需额外改动类型。

- [ ] **Step 2: 重写配置面板为5个得分率输入**

  将配置面板从 3 个"分数线"输入改为 5 个"得分率"输入 + 查询按钮：

  ```tsx
  <div className="border-b border-border/40 bg-muted/30 px-5 py-4">
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground whitespace-nowrap">优秀：得分率 ≥</span>
        <Input
          type="number"
          value={draftConfig.excellent_threshold}
          onChange={(e) => handleRatingConfigChange('excellent_threshold', e.target.value)}
          className="w-16 h-8 text-sm"
          min={0}
          max={100}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground whitespace-nowrap">良好：得分率 ≥</span>
        <Input
          type="number"
          value={draftConfig.good_threshold}
          onChange={(e) => handleRatingConfigChange('good_threshold', e.target.value)}
          className="w-16 h-8 text-sm"
          min={0}
          max={100}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground whitespace-nowrap">中等：得分率 ≥</span>
        <Input
          type="number"
          value={draftConfig.medium_threshold}
          onChange={(e) => handleRatingConfigChange('medium_threshold', e.target.value)}
          className="w-16 h-8 text-sm"
          min={0}
          max={100}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground whitespace-nowrap">及格：得分率 ≥</span>
        <Input
          type="number"
          value={draftConfig.pass_threshold}
          onChange={(e) => handleRatingConfigChange('pass_threshold', e.target.value)}
          className="w-16 h-8 text-sm"
          min={0}
          max={100}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-sm text-muted-foreground whitespace-nowrap">低分：得分率 &lt;</span>
        <Input
          type="number"
          value={draftConfig.low_score_threshold}
          onChange={(e) => handleRatingConfigChange('low_score_threshold', e.target.value)}
          className="w-16 h-8 text-sm"
          min={0}
          max={100}
        />
        <span className="text-sm text-muted-foreground">%</span>
      </div>
      <Button type="button" size="sm" onClick={handleQuery} disabled={!canQuery} aria-busy={isFetching}>
        {isFetching ? (
          <>
            <Loader2 className="mr-1 size-3.5 animate-spin" />
            查询中
          </>
        ) : (
          '查询'
        )}
      </Button>
    </div>
  </div>
  ```

- [ ] **Step 3: 扩展 handleRatingConfigChange 支持的 key**

  ```typescript
  const handleRatingConfigChange = (
    key: 'excellent_threshold' | 'good_threshold' | 'medium_threshold' | 'pass_threshold' | 'low_score_threshold',
    value: string
  ) => {
    const nextValue = Number(value)
    if (Number.isNaN(nextValue)) return
    setDraftConfig({ ...draftConfig, [key]: nextValue })
  }
  ```

- [ ] **Step 4: 重写表格为13列**

  表头增加"中等"和"低分"的"人数"和"占比"列：

  ```tsx
  <thead>
    <tr className="border-b border-border/60 bg-muted/30">
      <th className="py-3 px-5 text-left font-medium text-muted-foreground">班级</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">总人数</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">均分</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">优秀人数</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">优秀占比</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">良好人数</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">良好占比</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">中等人数</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">中等占比</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">及格人数</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">及格占比</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">低分人数</th>
      <th className="py-3 px-5 text-right font-medium text-muted-foreground">低分占比</th>
    </tr>
  </thead>
  ```

- [ ] **Step 5: 重写表格行数据渲染**

  全年级行和班级行的数据渲染扩展为5个等级。每个等级显示为 `人数 (占比%)` 格式。

  等级数据单元格（以全年级为例）：
  ```tsx
  <td className="py-3 px-5 text-right">{data.overallGrade.excellent.count} ({formatNumber(data.overallGrade.excellent.percentage)}%)</td>
  <td className="py-3 px-5 text-right">{data.overallGrade.good.count} ({formatNumber(data.overallGrade.good.percentage)}%)</td>
  <td className="py-3 px-5 text-right">{data.overallGrade.medium.count} ({formatNumber(data.overallGrade.medium.percentage)}%)</td>
  <td className="py-3 px-5 text-right">{data.overallGrade.pass.count} ({formatNumber(data.overallGrade.pass.percentage)}%)</td>
  <td className="py-3 px-5 text-right">{data.overallGrade.lowScore.count} ({formatNumber(data.overallGrade.lowScore.percentage)}%)</td>
  ```

  班级行同理，使用 `cls.` 前缀。

  空状态 `colSpan` 从 6 改为 13。

- [ ] **Step 6: Commit**

  ```bash
  git add src/components/analysis/RatingChart.tsx
  git commit -m "feat(rating-chart): 重写为一分四率，5级得分率配置+13列表格"
  ```

---

### Task 13: 前端 format 工具检查

**Files:**
- Modify: `src/utils/format.ts`

- [ ] **Step 1: 检查 ratingTierBadgeClass 是否需要扩展**

  读取 `src/utils/format.ts`，查找 `ratingTierBadgeClass` 定义：

  ```bash
  grep -n "ratingTierBadgeClass" /Users/kk/go/src/seas-frontend/src/utils/format.ts
  ```

  如果定义如下：
  ```typescript
  export const ratingTierBadgeClass = {
    excellent: '...',
    good: '...',
    pass: '...',
    fail: '...',
  }
  ```

  则扩展为：
  ```typescript
  export const ratingTierBadgeClass = {
    excellent: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    good: 'bg-blue-50 text-blue-700 border-blue-200',
    medium: 'bg-amber-50 text-amber-700 border-amber-200',
    pass: 'bg-gray-50 text-gray-700 border-gray-200',
    lowScore: 'bg-red-50 text-red-700 border-red-200',
  }
  ```

  如果 RatingChart 不再使用 badge 样式（改为纯文本表格），则直接删除 `ratingTierBadgeClass`。

- [ ] **Step 2: Commit**

  ```bash
  git add src/utils/format.ts
  git commit -m "feat(format): 更新 ratingTierBadgeClass 为一分四率5级样式"
  ```

---

### Task 14: 验证与清理

- [ ] **Step 1: 启动前端开发服务器验证界面**

  ```bash
  cd /Users/kk/go/src/seas-frontend
  npm run dev
  ```

  在浏览器中访问 `http://localhost:3000/exams/{某个考试id}`，确认：
  1. 侧边栏全科和单科模式都有"一分四率"入口
  2. 点击后显示配置面板（5个得分率输入 + 查询按钮）
  3. 查询后显示13列表格（班级、总人数、均分、5个等级的 人数+占比）
  4. 全年级行和班级行数据正常显示
  5. 修改阈值后点击查询，数据更新

- [ ] **Step 2: 启动后端服务验证接口**

  ```bash
  cd /Users/kk/go/src/SEAS
  go run ./cmd/seas/...
  ```

  调用接口验证：
  ```bash
  curl "http://localhost:8000/seas/api/v1/exams/1/analysis/rating-distribution?scope=all_subjects&excellent_threshold=85&good_threshold=76&medium_threshold=68&pass_threshold=60&low_score_threshold=40"
  ```

  确认响应包含 `medium` 和 `lowScore` 字段，且 `config` 返回完整的5个阈值。

- [ ] **Step 3: 搜索遗留的四率引用**

  在前端项目中搜索可能遗漏的旧四率引用：
  ```bash
  cd /Users/kk/go/src/seas-frontend
  grep -r "excellent_threshold\|good_threshold\|pass_threshold" src/ --include="*.ts" --include="*.tsx" | grep -v "medium_threshold\|low_score_threshold"
  ```

  在后端项目中搜索：
  ```bash
  cd /Users/kk/go/src/SEAS
  grep -r "excellentThreshold\|goodThreshold\|passThreshold" internal/ --include="*.go" | grep -v "mediumThreshold\|lowScoreThreshold"
  ```

  如有遗漏引用，逐一修复。

- [ ] **Step 4: 检查 AI 分析系统引用**

  读取 `internal/server/ai_analysis.go`，检查 AI 分析提示词中是否引用了旧四率的字段名（如 `fail`、`合格分数线` 等），如有则同步更新。

  ```bash
  grep -n "rating\|四率\|优秀\|良好\|合格\|低分" /Users/kk/go/src/SEAS/internal/server/ai_analysis.go
  ```

- [ ] **Step 5: Final commit**

  如有任何清理改动，提交：
  ```bash
  git add .
  git commit -m "chore: 一分四率遗留代码清理"
  ```

---

## 自检清单

- [ ] **Spec coverage:** 所有设计文档中的要求都有对应任务实现
- [ ] **Placeholder scan:** 计划中没有 TBD、TODO、"implement later" 等占位符
- [ ] **Type consistency:** 前后端类型字段名一致（excellent_threshold/good_threshold/medium_threshold/pass_threshold/low_score_threshold）
- [ ] **File paths:** 所有文件路径准确无误
- [ ] **Commit granularity:** 每个 task 独立可提交，变更范围清晰
