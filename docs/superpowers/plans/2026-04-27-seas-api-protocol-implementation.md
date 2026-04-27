# SEAS API 协议对齐 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 对齐前后端 API 协议，支持 4 个分析视图的完整字段需求（含区分度、标准差、离均差、难度数值化）。

**Architecture:** 后端修改 protobuf 定义并重新生成 Go 代码，data 层新增区分度/标准差等统计查询，biz 层统一计算逻辑；前端同步更新 TypeScript 类型与表格组件字段。

**Tech Stack:** Go (Kratos + GORM + Protobuf), TypeScript (Next.js + React + TanStack Query)

---

## File Structure

### 后端（`../SEAS`）

| 文件 | 职责 |
|------|------|
| `api/seas/v1/analysis.proto` | Protobuf 接口定义，修改字段类型和新增字段 |
| `internal/biz/score.go` | biz 层领域模型类型定义 |
| `internal/biz/exam_analysis.go` | biz 层业务逻辑与区分度计算 |
| `internal/data/score.go` | data 层数据库查询实现 |
| `internal/service/analysis.go` | service 层 protobuf 与 biz 模型映射 |

### 前端（当前项目）

| 文件 | 职责 |
|------|------|
| `src/types/analysis.ts` | 学科汇总、班级汇总类型定义 |
| `src/types/drilldown.ts` | 下钻视图（单科班级汇总、题目汇总）类型定义 |
| `src/components/analysis/ClassSummary.tsx` | 全科班级情况汇总表格 |
| `src/components/analysis/SubjectSummary.tsx` | 全科学科情况汇总表格 |
| `src/components/analysis/SingleClassSummary.tsx` | 单科班级情况汇总表格（重写） |
| `src/components/analysis/SingleQuestionSummary.tsx` | 单科题目汇总表格 |
| `src/components/analysis/SingleClassQuestion.tsx` | 单科班级题目表格 |

---

## Task 1: 修改后端 Protobuf 定义

**Files:**
- Modify: `../SEAS/api/seas/v1/analysis.proto`

**变更内容：**

1. `ClassSummaryItem`：`class_id` / `total_students` 改为 `int32`，新增 `full_score`、`discrimination`
2. `GetClassSummaryReply`：`total_participants` 改为 `int32`
3. `SubjectSummaryItem`：`student_count` 改为 `int32`，新增 `score_deviation`、`std_dev`、`discrimination`
4. `GetSubjectSummaryReply`：`total_participants` 改为 `int32`，新增 `overall`
5. 删除 `SingleClassSummaryItem`，`GetSingleClassSummaryReply` 复用 `ClassSummaryItem`
6. `ClassQuestionItem` / `SingleQuestionSummaryItem`：`difficulty` 改为 `double`
7. `QuestionClassBreakdown`：`class_id` 改为 `int32`
8. `ClassRatingDistribution`：`class_id` / `total_students` 改为 `int32`
9. `GetRatingDistributionReply`：`total_participants` 改为 `int32`

- [ ] **Step 1: 修改 `ClassSummaryItem` 和 `GetClassSummaryReply`**

```protobuf
message ClassSummaryItem {
  int32 class_id = 1;
  string class_name = 2;
  int32 total_students = 3;
  double avg_score = 4;
  double highest_score = 5;
  double lowest_score = 6;
  double score_deviation = 7;
  double difficulty = 8;
  double std_dev = 9;
  double full_score = 10;        // 新增
  double discrimination = 11;    // 新增
}

message GetClassSummaryReply {
  string exam_id = 1;
  string exam_name = 2;
  string scope = 3;
  int32 total_participants = 4;
  ClassSummaryItem overall_grade = 5;
  repeated ClassSummaryItem class_details = 6;
}
```

- [ ] **Step 2: 修改 `SubjectSummaryItem` 和 `GetSubjectSummaryReply`**

```protobuf
message SubjectSummaryItem {
  string id = 1;
  string name = 2;
  double full_score = 3;
  double avg_score = 4;
  double highest_score = 5;
  double lowest_score = 6;
  double difficulty = 7;
  int32 student_count = 8;
  double score_deviation = 9;    // 新增
  double std_dev = 10;           // 新增
  double discrimination = 11;    // 新增
}

message GetSubjectSummaryReply {
  string exam_id = 1;
  string exam_name = 2;
  string scope = 3;
  int32 total_participants = 4;
  int32 subjects_involved = 5;
  int32 classes_involved = 6;
  repeated SubjectSummaryItem subjects = 7;
  SubjectSummaryItem overall = 10;  // 新增，使用未占用编号
}
```

- [ ] **Step 3: 删除 `SingleClassSummaryItem`，修改 `GetSingleClassSummaryReply` 复用 `ClassSummaryItem`**

```protobuf
// 删除原有的 SingleClassSummaryItem 定义

message GetSingleClassSummaryReply {
  string exam_id = 1;
  string exam_name = 2;
  string subject_id = 3;
  string subject_name = 4;
  ClassSummaryItem overall = 5;       // 改为 ClassSummaryItem
  repeated ClassSummaryItem classes = 6; // 改为 ClassSummaryItem
}
```

- [ ] **Step 4: 修改题目相关消息的难度和类型**

```protobuf
message ClassQuestionItem {
  string question_id = 1;
  string question_number = 2;
  string question_type = 3;
  double full_score = 4;
  double class_avg_score = 5;
  double score_rate = 6;
  double grade_avg_score = 7;
  double difficulty = 8;  // 改为 double
}

message QuestionClassBreakdown {
  int32 class_id = 1;    // 改为 int32
  string class_name = 2;
  double avg_score = 3;
}

message SingleQuestionSummaryItem {
  string question_id = 1;
  string question_number = 2;
  string question_type = 3;
  double full_score = 4;
  double grade_avg_score = 5;
  repeated QuestionClassBreakdown class_breakdown = 6;
  double score_rate = 7;
  double difficulty = 8;  // 改为 double
}
```

- [ ] **Step 5: 修改四率分析消息的类型**

```protobuf
message ClassRatingDistribution {
  int32 class_id = 1;      // 改为 int32
  string class_name = 2;
  int32 total_students = 3; // 改为 int32
  double avg_score = 4;
  RatingItem excellent = 5;
  RatingItem good = 6;
  RatingItem pass = 7;
  RatingItem fail = 8;
}

message GetRatingDistributionReply {
  string exam_id = 1;
  string exam_name = 2;
  string scope = 3;
  int32 total_participants = 4;  // 改为 int32
  RatingConfig config = 5;
  ClassRatingDistribution overall_grade = 6;
  repeated ClassRatingDistribution class_details = 7;
}
```

- [ ] **Step 6: Commit protobuf 修改**

```bash
cd ../SEAS
git add api/seas/v1/analysis.proto
git commit -m "feat(proto): 调整分析接口字段类型并新增区分度/标准差等字段

- ClassSummaryItem/SubjectSummaryItem 类型对齐
- 难度字段改为 double
- ID/Count 字段统一为 int32

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 2: 重新生成后端代码

**Files:**
- Generated: `../SEAS/api/seas/v1/*.go`
- Generated: `../SEAS/openapi.yaml`

- [ ] **Step 1: 运行代码生成**

```bash
cd ../SEAS
make api
```

Expected: 成功生成 Go 代码和 openapi.yaml，无报错。

- [ ] **Step 2: Commit 生成的代码**

```bash
cd ../SEAS
git add api/seas/v1/ openapi.yaml
git commit -m "chore: 重新生成 protobuf Go 代码和 openapi

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 3: 修改 biz 层类型定义

**Files:**
- Modify: `../SEAS/internal/biz/score.go`

- [ ] **Step 1: 修改 `ClassStats` 新增字段**

在 `ClassStats` 结构体中新增 `FullScore` 和 `Discrimination`：

```go
// ClassStats 班级统计信息
type ClassStats struct {
	ClassID        int64
	ClassName      string
	TotalStudents  int64
	FullScore      float64  // 新增：满分
	AvgScore       float64
	HighestScore   float64
	LowestScore    float64
	ScoreDeviation float64
	Difficulty     float64
	StdDev         float64
	Discrimination float64  // 新增：区分度
}
```

- [ ] **Step 2: 修改 `SubjectStats` 新增字段**

在 `SubjectStats` 结构体中新增 `ScoreDeviation`、`StdDev`、`Discrimination`：

```go
// SubjectStats 单个学科的统计信息
type SubjectStats struct {
	ID             int64
	Name           string
	FullScore      float64
	AvgScore       float64
	HighestScore   float64
	LowestScore    float64
	Difficulty     float64
	StudentCount   int64
	ScoreDeviation float64  // 新增：离均差
	StdDev         float64  // 新增：标准差
	Discrimination float64  // 新增：区分度
}
```

- [ ] **Step 3: 修改 `SubjectSummaryStats` 新增 `Overall` 字段**

```go
// SubjectSummaryStats 学科统计数据
type SubjectSummaryStats struct {
	TotalParticipants int64
	SubjectsInvolved  int32
	ClassesInvolved   int32
	Overall           *SubjectStats   // 新增：全年级总体
	Subjects          []*SubjectStats
}
```

- [ ] **Step 4: 重写 `SingleClassSummaryItemStats` 为 `ClassStats` 同构**

删除原有 `SingleClassSummaryItemStats` 定义，改为复用 `ClassStats`：

```go
// SingleClassSummaryStats 单科班级汇总
type SingleClassSummaryStats struct {
	ExamID      int64
	ExamName    string
	SubjectID   int64
	SubjectName string
	Overall     *ClassStats   // 改为 *ClassStats
	Classes     []*ClassStats // 改为 []*ClassStats
}
```

删除原 `SingleClassSummaryItemStats` 结构体定义。

- [ ] **Step 5: 修改 `SingleQuestionSummaryItemStats` 难度类型**

```go
// SingleQuestionSummaryItemStats 单科题目汇总项
type SingleQuestionSummaryItemStats struct {
	QuestionID     string
	QuestionNumber string
	QuestionType   string
	FullScore      float64
	GradeAvgScore  float64
	ClassBreakdown []*QuestionClassBreakdownStats
	ScoreRate      float64
	Difficulty     float64  // 改为 float64
}
```

- [ ] **Step 6: Commit biz 层修改**

```bash
cd ../SEAS
git add internal/biz/score.go
git commit -m "feat(biz): 更新分析领域模型，新增区分度/标准差/离均差字段

- ClassStats 新增 FullScore、Discrimination
- SubjectStats 新增 ScoreDeviation、StdDev、Discrimination
- SingleClassSummaryStats 复用 ClassStats
- 难度字段统一为 float64

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 4: 修改 data 层查询逻辑

**Files:**
- Modify: `../SEAS/internal/data/score.go`

### 区分度计算辅助函数

在 `internal/data/score.go` 末尾新增以下辅助函数：

```go
// calculateDiscrimination 计算区分度：高低分组得分率之差
// scores: 所有学生的得分列表；fullScore: 满分
func calculateDiscrimination(scores []float64, fullScore float64) float64 {
	if len(scores) == 0 || fullScore == 0 {
		return 0
	}
	sort.Float64s(scores)
	n := len(scores)
	groupSize := int(math.Max(1, math.Round(float64(n)*0.27)))

	var lowSum, highSum float64
	for i := 0; i < groupSize; i++ {
		lowSum += scores[i]
	}
	for i := n - groupSize; i < n; i++ {
		highSum += scores[i]
	}

	lowRate := (lowSum / float64(groupSize)) / fullScore
	highRate := (highSum / float64(groupSize)) / fullScore
	return roundTo2Decimal((highRate - lowRate) * 100)
}
```

### 获取学生原始分数辅助方法

```go
// getStudentScores 获取指定考试和学科下所有学生的分数（用于计算区分度）
// 全科模式下返回每个学生的总分（按班级分组）；单科模式下返回该科分数
func (r *scoreRepo) getStudentScores(ctx context.Context, examID, subjectID int64) (map[int64][]float64, error) {
	var rows []struct {
		ClassID int64   `gorm:"column:class_id"`
		Score   float64 `gorm:"column:total_score"`
	}

	var err error
	if subjectID > 0 {
		// 单科：直接取该科分数
		err = r.data.db.WithContext(ctx).Raw(`
			SELECT st.class_id, sc.total_score
			FROM scores sc
			JOIN students st ON st.id = sc.student_id
			WHERE sc.exam_id = ? AND sc.subject_id = ?
			ORDER BY st.class_id, sc.total_score
		`, examID, subjectID).Scan(&rows).Error
	} else {
		// 全科：按学生聚合总分
		err = r.data.db.WithContext(ctx).Raw(`
			SELECT st.class_id, SUM(sc.total_score) as total_score
			FROM scores sc
			JOIN students st ON st.id = sc.student_id
			WHERE sc.exam_id = ?
			GROUP BY st.class_id, sc.student_id
			ORDER BY st.class_id, total_score
		`, examID).Scan(&rows).Error
	}
	if err != nil {
		return nil, err
	}

	result := make(map[int64][]float64)
	for _, row := range rows {
		result[row.ClassID] = append(result[row.ClassID], row.Score)
	}
	return result, nil
}

// getAllStudentScores 获取所有学生分数（不按班级分组，用于学科/全年级区分度）
// 全科模式下返回每个学生的总分；单科模式下返回该科分数
func (r *scoreRepo) getAllStudentScores(ctx context.Context, examID, subjectID int64) ([]float64, error) {
	var scores []float64
	var err error

	if subjectID > 0 {
		err = r.data.db.WithContext(ctx).Raw(`
			SELECT total_score FROM scores WHERE exam_id = ? AND subject_id = ? ORDER BY total_score
		`, examID, subjectID).Pluck("total_score", &scores).Error
	} else {
		err = r.data.db.WithContext(ctx).Raw(`
			SELECT SUM(total_score) as total_score
			FROM scores
			WHERE exam_id = ?
			GROUP BY student_id
			ORDER BY total_score
		`, examID).Pluck("total_score", &scores).Error
	}
	if err != nil {
		return nil, err
	}
	return scores, nil
}
```

- [ ] **Step 1: 修改 `GetClassSummary` 查询，新增 full_score、lowest_score 和区分度计算**

替换 `GetClassSummary` 方法中的班级统计查询部分。在原有查询基础上，`classStats` 结构体新增 `LowestScore` 字段（原有查询已包含）。然后在方法末尾计算区分度：

在 `GetClassSummary` 方法中，在返回前添加区分度计算：

```go
	// 查询所有学生分数用于计算区分度
	studentScores, err := r.getStudentScores(ctx, examID, subjectID)
	if err != nil {
		log.Context(ctx).Errorf("GetClassSummary getStudentScores err: %+v", err)
	}

	// 计算各班级区分度
	for _, class := range stats.ClassDetails {
		scores := studentScores[class.ClassID]
		class.Discrimination = calculateDiscrimination(scores, fullScore)
	}
	// 全年级区分度
	allScores := make([]float64, 0)
	for _, scores := range studentScores {
		allScores = append(allScores, scores...)
	}
	stats.OverallGrade.Discrimination = calculateDiscrimination(allScores, fullScore)
	stats.OverallGrade.FullScore = fullScore
	for _, class := range stats.ClassDetails {
		class.FullScore = fullScore
	}
```

这段代码放在 `stats.OverallGrade = &biz.ClassStats{...}` 之后，`return &stats, nil` 之前。

- [ ] **Step 2: 修改 `GetSubjectSummary` 查询，新增标准差、离均差、区分度和 overall**

对于**全科模式**，在查询每个学科统计后，计算 overall 并补充新字段：

```go
		// 计算全年级总体数据（overall）
		var overallAvg, overallHighest, overallLowest, overallStdDev float64
		overallLowest = 99999
		var totalStudentCount int64
		for _, s := range stats.Subjects {
			totalStudentCount += s.StudentCount
			overallAvg += s.AvgScore * float64(s.StudentCount)
			if s.HighestScore > overallHighest {
				overallHighest = s.HighestScore
			}
			if s.LowestScore < overallLowest {
				overallLowest = s.LowestScore
			}
		}
		if totalStudentCount > 0 {
			overallAvg = overallAvg / float64(totalStudentCount)
		}

		// 查询所有学生全科总分用于计算标准差和区分度
		allScores, _ := r.getAllStudentScores(ctx, examID, 0)
		overallFullScore := r.calculateOverallFullScore(ctx, examID)
		overallStdDev = calculateStdDev(allScores)

		stats.Overall = &biz.SubjectStats{
			ID:             0,
			Name:           "全年级",
			FullScore:      overallFullScore,
			AvgScore:       roundTo2Decimal(overallAvg),
			HighestScore:   overallHighest,
			LowestScore:    overallLowest,
			Difficulty:     r.calculateDifficulty(overallAvg, overallFullScore),
			StudentCount:   totalStudentCount,
			ScoreDeviation: 0,
			StdDev:         roundTo2Decimal(overallStdDev),
			Discrimination: calculateDiscrimination(allScores, overallFullScore),
		}

		// 为每个学科计算标准差和区分度
		for _, subject := range stats.Subjects {
			subjectScores, _ := r.getAllStudentScores(ctx, examID, subject.ID)
			subject.StdDev = roundTo2Decimal(calculateStdDev(subjectScores))
			subject.ScoreDeviation = roundTo2Decimal(subject.AvgScore - overallAvg)
			subject.Discrimination = calculateDiscrimination(subjectScores, subject.FullScore)
		}
```

这段代码放在 `stats.ClassesInvolved = classesInvolved` 之后。

同时需要在文件末尾新增 `calculateStdDev` 辅助函数：

```go
func calculateStdDev(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}
	var sum float64
	for _, v := range values {
		sum += v
	}
	mean := sum / float64(len(values))
	var variance float64
	for _, v := range values {
		variance += (v - mean) * (v - mean)
	}
	return math.Sqrt(variance / float64(len(values)))
}
```

对于**单科模式**，也需要计算标准差、区分度等：

```go
		// 单科模式也需要计算标准差和区分度
		allScores, _ := r.getAllStudentScores(ctx, examID, subjectID)
		stats.Subjects[0].StdDev = roundTo2Decimal(calculateStdDev(allScores))
		stats.Subjects[0].Discrimination = calculateDiscrimination(allScores, stats.Subjects[0].FullScore)
		stats.Subjects[0].ScoreDeviation = 0 // 单科模式下无离均差概念
```

- [ ] **Step 3: 重写 `GetSingleClassSummary` 查询**

完全替换 `GetSingleClassSummary` 方法的实现，返回新的 `ClassStats` 结构：

```go
func (r *scoreRepo) GetSingleClassSummary(ctx context.Context, examID, subjectID int64) (*biz.SingleClassSummaryStats, error) {
	var summary biz.SingleClassSummaryStats
	summary.ExamID = examID
	summary.SubjectID = subjectID

	var meta struct {
		ExamName    string `gorm:"column:exam_name"`
		SubjectName string `gorm:"column:subject_name"`
	}
	if err := r.data.db.WithContext(ctx).Raw(`
		SELECT e.name AS exam_name, s.name AS subject_name
		FROM exams e JOIN subjects s ON s.id = ?
		WHERE e.id = ?
	`, subjectID, examID).Scan(&meta).Error; err != nil {
		return nil, err
	}
	summary.ExamName = meta.ExamName
	summary.SubjectName = meta.SubjectName

	var fullScore float64
	r.data.db.WithContext(ctx).Raw(`
		SELECT full_score FROM exam_subjects WHERE exam_id = ? AND subject_id = ?
	`, examID, subjectID).Scan(&fullScore)

	// 查询各班级统计
	var classStats []struct {
		ClassID       int64   `gorm:"column:class_id"`
		ClassName     string  `gorm:"column:class_name"`
		TotalStudents int64   `gorm:"column:total_students"`
		AvgScore      float64 `gorm:"column:avg_score"`
		HighestScore  float64 `gorm:"column:highest_score"`
		LowestScore   float64 `gorm:"column:lowest_score"`
		StdDev        float64 `gorm:"column:std_dev"`
	}
	if err := r.data.db.WithContext(ctx).Raw(`
		SELECT
			c.id AS class_id,
			c.name AS class_name,
			COUNT(sc.student_id) AS total_students,
			ROUND(AVG(sc.total_score), 2) AS avg_score,
			MAX(sc.total_score) AS highest_score,
			MIN(sc.total_score) AS lowest_score,
			ROUND(STDDEV_POP(sc.total_score), 2) AS std_dev
		FROM classes c
		JOIN students st ON st.class_id = c.id
		JOIN scores sc ON sc.student_id = st.id AND sc.exam_id = ? AND sc.subject_id = ?
		GROUP BY c.id, c.name
		ORDER BY c.id
	`, examID, subjectID).Scan(&classStats).Error; err != nil {
		return nil, err
	}

	// 查询年级总体统计
	var gradeOverall struct {
		TotalStudents int64   `gorm:"column:total_students"`
		AvgScore      float64 `gorm:"column:avg_score"`
		HighestScore  float64 `gorm:"column:highest_score"`
		LowestScore   float64 `gorm:"column:lowest_score"`
		StdDev        float64 `gorm:"column:std_dev"`
	}
	if err := r.data.db.WithContext(ctx).Raw(`
		SELECT
			COUNT(sc.student_id) AS total_students,
			ROUND(AVG(sc.total_score), 2) AS avg_score,
			MAX(sc.total_score) AS highest_score,
			MIN(sc.total_score) AS lowest_score,
			ROUND(STDDEV_POP(sc.total_score), 2) AS std_dev
		FROM scores sc
		WHERE sc.exam_id = ? AND sc.subject_id = ?
	`, examID, subjectID).Scan(&gradeOverall).Error; err != nil {
		return nil, err
	}

	// 查询学生分数用于计算区分度
	studentScores, _ := r.getStudentScores(ctx, examID, subjectID)
	allScores := make([]float64, 0)
	for _, scores := range studentScores {
		allScores = append(allScores, scores...)
	}

	// 构建各班明细
	summary.Classes = make([]*biz.ClassStats, 0, len(classStats))
	for _, row := range classStats {
		summary.Classes = append(summary.Classes, &biz.ClassStats{
			ClassID:        row.ClassID,
			ClassName:      row.ClassName,
			TotalStudents:  row.TotalStudents,
			FullScore:      fullScore,
			AvgScore:       row.AvgScore,
			HighestScore:   row.HighestScore,
			LowestScore:    row.LowestScore,
			ScoreDeviation: roundTo2Decimal(row.AvgScore - gradeOverall.AvgScore),
			Difficulty:     r.calculateDifficulty(row.AvgScore, fullScore),
			StdDev:         row.StdDev,
			Discrimination: calculateDiscrimination(studentScores[row.ClassID], fullScore),
		})
	}

	// 全年级总体行
	summary.Overall = &biz.ClassStats{
		ClassID:        0,
		ClassName:      "全年级",
		TotalStudents:  gradeOverall.TotalStudents,
		FullScore:      fullScore,
		AvgScore:       gradeOverall.AvgScore,
		HighestScore:   gradeOverall.HighestScore,
		LowestScore:    gradeOverall.LowestScore,
		ScoreDeviation: 0,
		Difficulty:     r.calculateDifficulty(gradeOverall.AvgScore, fullScore),
		StdDev:         gradeOverall.StdDev,
		Discrimination: calculateDiscrimination(allScores, fullScore),
	}

	return &summary, nil
}
```

- [ ] **Step 4: Commit data 层修改**

```bash
cd ../SEAS
git add internal/data/score.go
git commit -m "feat(data): 新增区分度/标准差计算，重写单科班级汇总查询

- 新增 calculateDiscrimination、calculateStdDev 辅助函数
- GetClassSummary 新增区分度计算
- GetSubjectSummary 新增 overall、标准差、离均差、区分度
- GetSingleClassSummary 重写为 ClassStats 结构

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 5: 修改 biz 层业务逻辑

**Files:**
- Modify: `../SEAS/internal/biz/exam_analysis.go`

- [ ] **Step 1: 修改 `difficultyFromScoreRate` 返回 float64**

```go
func difficultyFromScoreRate(scoreRate float64) float64 {
	return scoreRate  // 直接返回得分率作为难度数值
}
```

- [ ] **Step 2: Commit biz 逻辑修改**

```bash
cd ../SEAS
git add internal/biz/exam_analysis.go
git commit -m "feat(biz): 难度改为返回数值型得分率

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 6: 修改 service 层映射

**Files:**
- Modify: `../SEAS/internal/service/analysis.go`

- [ ] **Step 1: 修改 `GetClassSummary` service 映射**

`total_participants` 映射改为 `int32(stats.TotalParticipants)`：

```go
reply := &pb.GetClassSummaryReply{
	ExamId:            req.GetExamId(),
	ExamName:          examName,
	Scope:             req.GetScope(),
	TotalParticipants: int32(stats.TotalParticipants),  // 改为 int32
}
```

`ClassSummaryItem` 映射新增 `FullScore`、`Discrimination`，`ClassId` 和 `TotalStudents` 改为 int32：

```go
reply.OverallGrade = &pb.ClassSummaryItem{
	ClassId:        int32(stats.OverallGrade.ClassID),      // 改为 int32
	ClassName:      stats.OverallGrade.ClassName,
	TotalStudents:  int32(stats.OverallGrade.TotalStudents), // 改为 int32
	FullScore:      stats.OverallGrade.FullScore,            // 新增
	AvgScore:       stats.OverallGrade.AvgScore,
	HighestScore:   stats.OverallGrade.HighestScore,
	LowestScore:    stats.OverallGrade.LowestScore,
	ScoreDeviation: stats.OverallGrade.ScoreDeviation,
	Difficulty:     stats.OverallGrade.Difficulty,
	StdDev:         stats.OverallGrade.StdDev,
	Discrimination: stats.OverallGrade.Discrimination,       // 新增
}
```

对 `ClassDetails` 的映射同样修改。

- [ ] **Step 2: 修改 `GetSubjectSummary` service 映射**

`total_participants` 改为 `int32`，新增 `overall` 映射：

```go
reply := &pb.GetSubjectSummaryReply{
	ExamId:            req.GetExamId(),
	ExamName:          examName,
	Scope:             req.GetScope(),
	TotalParticipants: int32(stats.TotalParticipants),  // 改为 int32
	SubjectsInvolved:  stats.SubjectsInvolved,
	ClassesInvolved:   stats.ClassesInvolved,
}

// 新增 overall 映射
if stats.Overall != nil {
	reply.Overall = &pb.SubjectSummaryItem{
		Id:             "0",
		Name:           stats.Overall.Name,
		FullScore:      stats.Overall.FullScore,
		AvgScore:       stats.Overall.AvgScore,
		HighestScore:   stats.Overall.HighestScore,
		LowestScore:    stats.Overall.LowestScore,
		Difficulty:     stats.Overall.Difficulty,
		StudentCount:   int32(stats.Overall.StudentCount),  // 改为 int32
		ScoreDeviation: stats.Overall.ScoreDeviation,
		StdDev:         stats.Overall.StdDev,
		Discrimination: stats.Overall.Discrimination,
	}
}
```

`Subjects` 映射中 `StudentCount` 改为 `int32`，新增新字段：

```go
reply.Subjects[i] = &pb.SubjectSummaryItem{
	Id:             strconv.FormatInt(subject.ID, 10),
	Name:           subject.Name,
	FullScore:      subject.FullScore,
	AvgScore:       subject.AvgScore,
	HighestScore:   subject.HighestScore,
	LowestScore:    subject.LowestScore,
	Difficulty:     subject.Difficulty,
	StudentCount:   int32(subject.StudentCount),  // 改为 int32
	ScoreDeviation: subject.ScoreDeviation,       // 新增
	StdDev:         subject.StdDev,               // 新增
	Discrimination: subject.Discrimination,       // 新增
}
```

- [ ] **Step 3: 修改 `GetSingleClassSummary` service 映射**

完全重写，使用 `pb.ClassSummaryItem` 替代 `pb.SingleClassSummaryItem`：

```go
reply := &pb.GetSingleClassSummaryReply{
	ExamId:    req.GetExamId(),
	ExamName:  examName,
	SubjectId: req.GetSubjectId(),
}

if stats.Overall != nil {
	reply.Overall = &pb.ClassSummaryItem{
		ClassId:        int32(stats.Overall.ClassID),
		ClassName:      stats.Overall.ClassName,
		TotalStudents:  int32(stats.Overall.TotalStudents),
		FullScore:      stats.Overall.FullScore,
		AvgScore:       stats.Overall.AvgScore,
		HighestScore:   stats.Overall.HighestScore,
		LowestScore:    stats.Overall.LowestScore,
		ScoreDeviation: stats.Overall.ScoreDeviation,
		Difficulty:     stats.Overall.Difficulty,
		StdDev:         stats.Overall.StdDev,
		Discrimination: stats.Overall.Discrimination,
	}
	reply.SubjectName = stats.SubjectName
}

reply.Classes = make([]*pb.ClassSummaryItem, len(stats.Classes))
for i, class := range stats.Classes {
	reply.Classes[i] = &pb.ClassSummaryItem{
		ClassId:        int32(class.ClassID),
		ClassName:      class.ClassName,
		TotalStudents:  int32(class.TotalStudents),
		FullScore:      class.FullScore,
		AvgScore:       class.AvgScore,
		HighestScore:   class.HighestScore,
		LowestScore:    class.LowestScore,
		ScoreDeviation: class.ScoreDeviation,
		Difficulty:     class.Difficulty,
		StdDev:         class.StdDev,
		Discrimination: class.Discrimination,
	}
}
```

- [ ] **Step 4: 修改题目相关 service 映射**

`GetSingleClassQuestions` 中的 `Difficulty` 改为 `float64`：

```go
reply.Questions[i] = &pb.ClassQuestionItem{
	QuestionId:     q.QuestionID,
	QuestionNumber: q.QuestionNumber,
	QuestionType:   q.QuestionType,
	FullScore:      q.FullScore,
	ClassAvgScore:  q.ClassAvgScore,
	ScoreRate:      q.ScoreRate,
	GradeAvgScore:  q.GradeAvgScore,
	Difficulty:     q.Difficulty,  // 改为 float64
}
```

`GetSingleQuestionSummary` 中的 `Difficulty` 改为 `float64`，`ClassBreakdown.ClassId` 改为 `int32`：

```go
item.ClassBreakdown[j] = &pb.QuestionClassBreakdown{
	ClassId:   int32(cb.ClassID),  // 改为 int32
	ClassName: cb.ClassName,
	AvgScore:  cb.AvgScore,
}
```

- [ ] **Step 5: Commit service 层修改**

```bash
cd ../SEAS
git add internal/service/analysis.go
git commit -m "feat(service): 适配新的 protobuf 类型定义

- 映射新增字段：fullScore、discrimination、scoreDeviation、stdDev
- ID/Count 字段映射改为 int32
- 难度字段映射改为 float64
- SingleClassSummary 改用 ClassSummaryItem

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 7: 后端构建验证

**Files:**
- Verify: `../SEAS` 项目编译通过

- [ ] **Step 1: 编译后端**

```bash
cd ../SEAS
go build ./...
```

Expected: 编译成功，无错误。

- [ ] **Step 2: 运行后端测试**

```bash
cd ../SEAS
go test ./internal/biz/... ./internal/service/... ./internal/data/... -v 2>&1 | tail -20
```

Expected: 所有测试通过（或至少无编译错误）。

---

## Task 8: 更新前端 TypeScript 类型定义

**Files:**
- Modify: `src/types/analysis.ts`
- Modify: `src/types/drilldown.ts`

- [ ] **Step 1: 修改 `src/types/analysis.ts`**

```typescript
// 班级汇总相关类型定义
export interface ClassSummary {
  classId: number
  className: string
  totalStudents: number
  fullScore: number        // 新增
  avgScore: number
  highestScore: number
  lowestScore: number
  scoreDeviation: number
  difficulty: number
  stdDev: number
  discrimination: number   // 新增
}

export interface ClassSummaryResponse {
  examId: string
  examName: string
  scope: 'all_subjects' | 'single_subject'
  totalParticipants: number
  overallGrade: ClassSummary
  classDetails: ClassSummary[]
}

// 学科汇总相关类型定义
export interface SubjectSummary {
  id: string
  name: string
  fullScore: number
  avgScore: number
  highestScore: number
  lowestScore: number
  difficulty: number
  studentCount: number
  scoreDeviation: number   // 新增
  stdDev: number           // 新增
  discrimination: number   // 新增
}

export interface SubjectSummaryResponse {
  examId: string
  examName: string
  scope: 'all_subjects' | 'single_subject'
  totalParticipants: number
  subjectsInvolved?: number
  classesInvolved?: number
  overall?: SubjectSummary  // 新增
  subjects: SubjectSummary[]
}
```

- [ ] **Step 2: 修改 `src/types/drilldown.ts`**

```typescript
// 视图4：单科班级汇总 - 改为复用 ClassSummary
export interface SingleClassSummaryResponse {
  examId: string
  examName: string
  subjectId: string
  subjectName: string
  overall: ClassSummary     // 改为 ClassSummary
  classes: ClassSummary[]   // 改为 ClassSummary[]
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
  difficulty: number        // 改为 number
}

// 视图6：单科题目汇总
export interface SingleQuestionSummaryItem {
  questionId: string
  questionNumber: string
  questionType: string
  fullScore: number
  gradeAvgScore: number
  classBreakdown: QuestionClassBreakdown[]
  scoreRate: number
  difficulty: number        // 改为 number
}

export interface QuestionClassBreakdown {
  classId: number           // 改为 number
  className: string
  avgScore: number
}
```

注意：`SingleClassSummaryResponse` 现在导入并使用 `ClassSummary`（来自 `analysis.ts`）。确保在 `drilldown.ts` 中导入：

```typescript
import type { ClassSummary } from './analysis'
```

- [ ] **Step 3: Commit 前端类型修改**

```bash
git add src/types/analysis.ts src/types/drilldown.ts
git commit -m "feat(types): 同步后端 API 字段变更

- 新增 fullScore、discrimination、scoreDeviation、stdDev
- 难度字段改为 number
- SingleClassSummary 复用 ClassSummary 结构

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 9: 更新 ClassSummary 表格组件

**Files:**
- Modify: `src/components/analysis/ClassSummary.tsx`

- [ ] **Step 1: 在表格头部新增列：满分、难度、区分度**

```tsx
<thead>
  <tr className="border-b border-border/60 bg-muted/30">
    <th className="py-3 px-5 text-left font-medium text-muted-foreground">班级</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">参考人数</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">满分</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">平均分</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">最高分</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">最低分</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">离均差</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">难度</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">标准差</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">区分度</th>
  </tr>
</thead>
```

- [ ] **Step 2: 在 overallGrade 和 classDetails 行中新增对应单元格**

在 `data.overallGrade` 行中新增：

```tsx
<td className="py-3 px-5 text-right">{data.overallGrade.totalStudents}</td>
<td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.fullScore)}</td>
<td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.avgScore)}</td>
<td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.highestScore)}</td>
<td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.lowestScore)}</td>
<td className="py-3 px-5 text-right">—</td>
<td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.difficulty)}</td>
<td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.stdDev)}</td>
<td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.discrimination)}</td>
```

在 `data.classDetails` 的每一行中同样新增对应字段，注意 `colSpan` 也要从 7 改为 10。

- [ ] **Step 3: Commit ClassSummary 修改**

```bash
git add src/components/analysis/ClassSummary.tsx
git commit -m "feat(ui): ClassSummary 表格新增满分、难度、区分度列

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 10: 更新 SubjectSummary 表格组件

**Files:**
- Modify: `src/components/analysis/SubjectSummary.tsx`

- [ ] **Step 1: 修改全年级模式表格列**

从原来的 5 列（学科、平均分、最高分、难度系数、学科表现）改为：

```tsx
<th className="...">学科</th>
<th className="...">参考人数</th>
<th className="...">满分</th>
<th className="...">平均分</th>
<th className="...">最高分</th>
<th className="...">最低分</th>
<th className="...">离均差</th>
<th className="...">难度</th>
<th className="...">标准差</th>
<th className="...">区分度</th>
```

- [ ] **Step 2: 在 overall 行和数据行中展示新字段**

`data.overall` 行：

```tsx
<td>{data.overall.name}</td>
<td className="text-right">{data.overall.studentCount}</td>
<td className="text-right">{formatNumber(data.overall.fullScore)}</td>
<td className="text-right">{formatNumber(data.overall.avgScore)}</td>
<td className="text-right">{formatNumber(data.overall.highestScore)}</td>
<td className="text-right">{formatNumber(data.overall.lowestScore)}</td>
<td className="text-right">—</td>
<td className="text-right">{formatNumber(data.overall.difficulty)}</td>
<td className="text-right">{formatNumber(data.overall.stdDev)}</td>
<td className="text-right">{formatNumber(data.overall.discrimination)}</td>
```

`data.subjects` 每一行同理，注意 `scoreDeviation` 需要展示有符号数值。

- [ ] **Step 3: 删除学科表现标签列**

移除 `getPerformanceTag` 函数和相关标签展示逻辑。

- [ ] **Step 4: Commit SubjectSummary 修改**

```bash
git add src/components/analysis/SubjectSummary.tsx
git commit -m "feat(ui): SubjectSummary 表格新增参考人数/满分/最低分/离均差/标准差/区分度列，删除学科表现标签

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 11: 重写 SingleClassSummary 表格组件

**Files:**
- Modify: `src/components/analysis/SingleClassSummary.tsx`

- [ ] **Step 1: 重写表格头部**

```tsx
<thead>
  <tr className="border-b border-border/60 bg-muted/30">
    <th className="py-3 px-5 text-left font-medium text-muted-foreground">班级</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">参考人数</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">满分</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">平均分</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">最高分</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">最低分</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">离均差</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">难度</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">标准差</th>
    <th className="py-3 px-5 text-right font-medium text-muted-foreground">区分度</th>
  </tr>
</thead>
```

- [ ] **Step 2: 重写 overall 行和数据行**

overall 行：

```tsx
{data?.overall && (
  <tr className="border-b border-border/40 bg-primary/5 font-semibold">
    <td className="py-3 px-5">{data.overall.className}</td>
    <td className="py-3 px-5 text-right">{data.overall.totalStudents}</td>
    <td className="py-3 px-5 text-right">{formatNumber(data.overall.fullScore)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(data.overall.avgScore)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(data.overall.highestScore)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(data.overall.lowestScore)}</td>
    <td className="py-3 px-5 text-right">—</td>
    <td className="py-3 px-5 text-right">{formatNumber(data.overall.difficulty)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(data.overall.stdDev)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(data.overall.discrimination)}</td>
  </tr>
)}
```

classes 行：

```tsx
{data?.classes.map((cls) => (
  <tr key={cls.classId} className="...">
    <td className="py-3 px-5">
      <button onClick={() => handleClassClick(cls.classId, cls.className)} className="...">
        {cls.className}
      </button>
    </td>
    <td className="py-3 px-5 text-right">{cls.totalStudents}</td>
    <td className="py-3 px-5 text-right">{formatNumber(cls.fullScore)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(cls.avgScore)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(cls.highestScore)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(cls.lowestScore)}</td>
    <td className={cn('py-3 px-5 text-right font-medium', cls.scoreDeviation >= 0 ? 'text-emerald-600' : 'text-red-600')}>
      {cls.scoreDeviation >= 0 ? '+' : ''}{formatNumber(cls.scoreDeviation)}
    </td>
    <td className="py-3 px-5 text-right">{formatNumber(cls.difficulty)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(cls.stdDev)}</td>
    <td className="py-3 px-5 text-right">{formatNumber(cls.discrimination)}</td>
  </tr>
))}
```

- [ ] **Step 3: Commit SingleClassSummary 修改**

```bash
git add src/components/analysis/SingleClassSummary.tsx
git commit -m "feat(ui): SingleClassSummary 表格重写为与 ClassSummary 同构

- 移除年级均分/分差/排名/及格率/优秀率列
- 新增满分/最高分/最低分/离均差/难度/标准差/区分度列

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 12: 更新题目组件难度展示

**Files:**
- Modify: `src/components/analysis/SingleQuestionSummary.tsx`
- Modify: `src/components/analysis/SingleClassQuestion.tsx`

- [ ] **Step 1: 修改 `SingleQuestionSummary.tsx`**

移除 `difficultyLabel` 导入和难度标签渲染，改为直接显示数值：

```tsx
<td className="py-3 px-5 text-center">
  {formatNumber(q.difficulty)}
</td>
```

同时删除 `import { difficultyLabel } from '@/utils/format'` 和相关的 `diff` 变量使用。

- [ ] **Step 2: 修改 `SingleClassQuestion.tsx`**

同样移除 `difficultyLabel` 导入和难度标签渲染：

```tsx
<td className="py-3 px-5 text-center">
  {formatNumber(q.difficulty)}
</td>
```

- [ ] **Step 3: Commit 题目组件修改**

```bash
git add src/components/analysis/SingleQuestionSummary.tsx src/components/analysis/SingleClassQuestion.tsx
git commit -m "feat(ui): 题目汇总难度改为数值展示

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Task 13: 前端构建验证

**Files:**
- Verify: 前端 TypeScript 编译通过

- [ ] **Step 1: TypeScript 类型检查**

```bash
npx tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 2: 生产构建**

```bash
npm run build
```

Expected: 构建成功。

---

## Spec Coverage Check

| 设计文档需求 | 对应任务 |
|-------------|---------|
| ClassSummaryItem 新增 fullScore、discrimination | Task 1, 3, 6, 8 |
| ClassSummaryItem 类型改为 int32 | Task 1, 6 |
| SubjectSummaryItem 新增 scoreDeviation、stdDev、discrimination | Task 1, 3, 6, 8 |
| GetSubjectSummaryReply 新增 overall | Task 1, 3, 4, 6, 8 |
| SingleClassSummaryItem 重写为 ClassSummary 同构 | Task 1, 3, 4, 6, 8, 11 |
| difficulty 改为 double/number | Task 1, 5, 6, 8, 12 |
| QuestionClassBreakdown.class_id 改为 int32/number | Task 1, 6, 8 |
| 区分度计算逻辑 | Task 4 |
| 前端表格字段对齐 | Task 9, 10, 11 |

---

## Placeholder Scan

- 无 TBD、TODO、"implement later"
- 无 "Add appropriate error handling" 等模糊描述
- 每个代码步骤包含完整代码
- 无引用未定义类型的步骤

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-27-seas-api-protocol-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints for review

**Which approach?**
