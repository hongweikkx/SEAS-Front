# 成绩上传支持满分配置 — 设计文档

## 背景

当前系统上传成绩 Excel 后，后端在 `exam_import.go:146` 处将各科满分**硬编码为 100**：

```go
uc.subjectRepo.CreateExamSubjects(ctx, examID, subjectIDs, 100)
```

这导致：
- 满分非 100 的考试（如语文 150、英语 120）分析结果失真
- 四率分析、难度系数等全部基于错误的满分计算
- `analysis.go` 中有明确 TODO："暂时使用默认满分，后续需要从 exam_subjects 表获取"

## 目标

上传成绩后，在前端识别结果页展示各科满分（默认 100），允许用户确认或修改，然后将真实满分保存到后端，后续分析基于真实满分计算。

## 非目标

- 四率比例（优秀/良好/合格阈值）的配置不在上传流程中处理，延后到四率分析页面
- 不支持在 Excel 模板中填写满分（本次迭代仅支持前端界面配置）

---

## 数据流

```
用户上传 Excel
    ↓
前端 parseExamExcel() 解析 → 得到学科列表、学生数、模式
    ↓
识别结果页展示：学科列表 + 各科满分输入框（默认100）+ 总分（自动汇总，只读）
    ↓
用户修改满分，点击「生成分析」
    ↓
① PUT /exams/{id}/subjects/full-scores  保存满分配置
    ↓（成功后才执行下一步）
② POST /exams/{id}/scores/import        上传文件导入
    ↓
跳转到 /exams/{id}
```

**调用顺序为串行**：先保存满分配置，成功后上传文件。避免文件已导入但满分配置失败的数据不一致。

---

## 前端设计

### 1. 类型扩展

```typescript
// src/lib/excel-parser.ts
export interface ParseResult {
  mode: 'simple' | 'full'
  summarySheet: string
  subjects: string[]
  students: ParsedStudent[]
  subjectDetails: ParsedSubjectDetail[]
  warnings: string[]
  // 新增
  subjectFullScores: Record<string, number>
}
```

`parseExamExcel()` 解析完成后，为每个学科填充默认满分 100。

### 2. 识别结果页新增满分确认区域

在现有「识别成功」卡片下方新增可编辑表格：

| 学科 | 满分 |
|------|------|
| 语文 | [ 150 ] |
| 数学 | [ 150 ] |
| 英语 | [ 120 ] |

- 每科一个 `<Input type="number">`，默认 100
- 输入时实时校验：满分必须 > 0，且 ≥ 该科最高成绩
- 底部显示：「总分满分：420（各学科满分之和，自动计算）」

### 3. API 服务新增

```typescript
// src/services/examImport.ts
export interface SubjectFullScoresRequest {
  fullScores: Record<string, number>
}

export async function updateSubjectFullScores(
  examId: string,
  data: SubjectFullScoresRequest
): Promise<void> {
  return apiClient.put(`/exams/${examId}/subjects/full-scores`, data)
}
```

### 4. 页面调用逻辑调整

`handleGenerate` 流程改为串行：
1. 创建考试（现有逻辑）
2. 调用 `updateSubjectFullScores()` 保存满分
3. 成功后调用 `importScores()` 上传文件
4. 成功后 `router.push()`

任一环节失败则中断，展示错误信息。

---

## 后端设计

### 1. Proto 新增接口

在 `api/seas/v1/exam_import.proto` 中新增：

```protobuf
rpc UpdateSubjectFullScores (UpdateSubjectFullScoresRequest) returns (UpdateSubjectFullScoresReply) {
  option (google.api.http) = {
    put: "/seas/api/v1/exams/{exam_id}/subjects/full-scores"
    body: "*"
  };
}

message UpdateSubjectFullScoresRequest {
  string exam_id = 1;
  map<string, double> full_scores = 2;
}

message UpdateSubjectFullScoresReply {}
```

### 2. 业务逻辑层

新增 `ExamImportUseCase.UpdateSubjectFullScores()`：

```go
func (uc *ExamImportUseCase) UpdateSubjectFullScores(
    ctx context.Context,
    examID int64,
    fullScores map[string]float64,
) error {
    for subjName, score := range fullScores {
        subj, err := uc.subjectRepo.FindOrCreateByName(ctx, subjName)
        if err != nil {
            return fmt.Errorf("find subject '%s' failed: %w", subjName, err)
        }
        err = uc.subjectRepo.UpdateExamSubjectFullScore(ctx, examID, subj.ID, score)
        if err != nil {
            return fmt.Errorf("update full score for '%s' failed: %w", subjName, err)
        }
    }
    return nil
}
```

### 3. 数据层

`SubjectRepo` 接口新增方法：

```go
UpdateExamSubjectFullScore(ctx context.Context, examID, subjectID int64, fullScore float64) error
```

实现使用 `UPDATE exam_subjects SET full_score = ? WHERE exam_id = ? AND subject_id = ?`。

如果记录不存在（导入接口尚未创建），则先创建：

```go
result := db.Where("exam_id = ? AND subject_id = ?", examID, subjectID).Updates(...)
if result.RowsAffected == 0 {
    // 插入新记录
    return db.Create(&biz.ExamSubject{...}).Error
}
```

### 4. 导入流程衔接

导入接口 `ImportScoresFromExcel` 中的 `CreateExamSubjects` **保持原样，但语义改为「不存在才创建」**：

```go
// 先检查是否已存在，不存在才插入
for _, sid := range subjectIDs {
    var count int64
    db.Model(&biz.ExamSubject{}).Where("exam_id = ? AND subject_id = ?", examID, sid).Count(&count)
    if count == 0 {
        records = append(records, biz.ExamSubject{ExamID: examID, SubjectID: sid, FullScore: fullScore})
    }
}
if len(records) > 0 {
    return db.Create(&records).Error
}
return nil
```

原因：
- 前端串行调用先保存满分配置，再导入文件
- 配置接口可能已创建 `exam_subjects` 记录（Upsert 语义）
- 导入时若记录已存在则跳过，避免主键冲突
- 改动最小，无数据不一致风险

### 5. 分析接口修正

`internal/service/analysis.go` 中：

- 移除硬编码的默认满分 100
- 改为调用 `subjectRepo.GetFullScoreByExamSubject()` 读取 `exam_subjects.full_score`
- 若读取失败（记录不存在），fallback 到 100（兼容旧数据）
- 难度、得分率、四率分布等全部基于真实满分计算

### 6. HTTP 路由

在 `internal/server/http.go` 注册新的 PUT 路由，绑定到 `ExamImportService.UpdateSubjectFullScores` 的 gRPC 方法。

---

## 错误处理

| 场景 | 前端行为 | 后端行为 |
|------|----------|----------|
| 满分 ≤ 0 | 输入框标红，提示「满分必须大于 0」 | — |
| 满分 < 该科最高成绩 | 输入框标红，提示「满分不能低于最高成绩 XX 分」 | — |
| 保存满分配置失败 | 展示错误，停止后续导入 | 返回 400/500 及错误信息 |
| 满分配置成功但导入失败 | 展示导入错误，保留满分配置 | 返回导入错误详情 |

---

## 边界情况

1. **用户不修改默认满分**：所有学科满分保持 100，行为与当前一致，向下兼容。
2. **Excel 中无「总成绩」sheet**：使用第一个 sheet 作为总成绩，满分配置仍正常工作。
3. **导入后修改满分**：当前不支持。如需支持，需触发重新计算所有分析指标，超出本次范围。
4. **旧数据（无 exam_subjects 记录）**：分析接口 fallback 到 100，不影响已有考试。

---

## 文件变更清单

### 前端
- `src/lib/excel-parser.ts` — 新增 `subjectFullScores`
- `src/services/examImport.ts` — 新增 `updateSubjectFullScores`
- `src/app/create/page.tsx` — 新增满分确认 UI，调整 `handleGenerate` 串行逻辑

### 后端
- `api/seas/v1/exam_import.proto` — 新增 RPC 和消息类型
- `internal/biz/exam_import.go` — 新增 `UpdateSubjectFullScores`
- `internal/biz/subject.go` — 新增 `UpdateExamSubjectFullScore` 接口方法
- `internal/data/subject.go` — 实现 `UpdateExamSubjectFullScore`
- `internal/service/exam_import.go` — 新增 gRPC handler
- `internal/server/http.go` — 注册新路由
- `internal/service/analysis.go` — 使用真实满分替代硬编码
