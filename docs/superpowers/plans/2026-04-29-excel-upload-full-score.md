# 成绩上传支持满分配置 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 上传成绩后在前端识别结果页展示各科满分（默认 100），允许用户确认或修改，然后将真实满分保存到后端 `exam_subjects` 表，替代当前硬编码的 100。

**Architecture:** 新增独立 `PUT /exams/{id}/subjects/full-scores` 接口保存满分配置；前端串行调用（先保存满分，再导入文件）；后端分析接口大部分已读取 `exam_subjects.full_score`，仅需修复导入硬编码和学科列表接口的硬编码。

**Tech Stack:** Next.js 16 + React 19 + TypeScript（前端），Go + Kratos + GORM + Protobuf（后端）

---

## 文件变更总览

### 后端（`/Users/kk/go/src/SEAS`）
| 文件 | 操作 | 说明 |
|------|------|------|
| `api/seas/v1/exam_import.proto` | 修改 | 新增 `UpdateSubjectFullScores` RPC 和消息 |
| `internal/biz/subject.go` | 修改 | 新增 `UpdateExamSubjectFullScore` 接口方法 |
| `internal/data/subject.go` | 修改 | 实现 `UpdateExamSubjectFullScore`；`CreateExamSubjects` 改为「不存在才创建」 |
| `internal/biz/exam_import.go` | 修改 | 新增 `UpdateSubjectFullScores` 业务方法 |
| `internal/service/exam_import.go` | 修改 | 新增 `UpdateSubjectFullScores` gRPC handler |
| `internal/server/http.go` | 修改 | 注册新的 PUT 路由 |
| `internal/service/analysis.go` | 修改 | `ListSubjectsByExam` 使用真实满分替代硬编码 100 |

### 前端（`/Users/kk/go/src/seas-frontend`）
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/lib/excel-parser.ts` | 修改 | 新增 `subjectFullScores` 字段 |
| `src/services/examImport.ts` | 修改 | 新增 `updateSubjectFullScores` API |
| `src/app/create/page.tsx` | 修改 | 新增满分确认 UI，调整 `handleGenerate` 为串行调用 |

---

## Task 1: 后端 Proto 定义与代码生成

**Files:**
- Modify: `/Users/kk/go/src/SEAS/api/seas/v1/exam_import.proto`
- Generated: `/Users/kk/go/src/SEAS/api/seas/v1/exam_import.pb.go`
- Generated: `/Users/kk/go/src/SEAS/api/seas/v1/exam_import_grpc.pb.go`

**前置检查：**
确认当前 proto 文件末尾在 `ImportScoresReply` 之后结束，没有后续内容。

- [ ] **Step 1: 修改 exam_import.proto，新增 RPC 和消息**

在 `service ExamImport` 的 `ImportScores` RPC 之后新增：

```protobuf
  // 更新考试各学科满分
  rpc UpdateSubjectFullScores (UpdateSubjectFullScoresRequest) returns (UpdateSubjectFullScoresReply) {
    option (google.api.http) = {
      put: "/seas/api/v1/exams/{exam_id}/subjects/full-scores"
      body: "*"
    };
  }
```

在文件末尾（`ImportScoresReply` 消息之后）新增：

```protobuf
message UpdateSubjectFullScoresRequest {
  string exam_id = 1;
  map<string, double> full_scores = 2;
}

message UpdateSubjectFullScoresReply {}
```

- [ ] **Step 2: 生成 Go 代码**

在后端项目目录执行：

```bash
cd /Users/kk/go/src/SEAS
make generate
```

或如果没有 make 命令，直接执行 protoc：

```bash
cd /Users/kk/go/src/SEAS
protoc --proto_path=./api \
  --proto_path=./third_party \
  --go_out=paths=source_relative:./api \
  --go-grpc_out=paths=source_relative:./api \
  --go-http_out=paths=source_relative:./api \
  api/seas/v1/exam_import.proto
```

验证 `api/seas/v1/exam_import.pb.go` 和 `exam_import_grpc.pb.go` 已更新，包含新生成的 `UpdateSubjectFullScores` 相关类型和 handler。

- [ ] **Step 3: Commit**

```bash
cd /Users/kk/go/src/SEAS
git add api/seas/v1/exam_import.proto api/seas/v1/exam_import.pb.go api/seas/v1/exam_import_grpc.pb.go api/seas/v1/exam_import_http.pb.go
git commit -m "feat(proto): 新增 UpdateSubjectFullScores 接口"
```

---

## Task 2: 后端数据层 — SubjectRepo 扩展

**Files:**
- Modify: `/Users/kk/go/src/SEAS/internal/biz/subject.go`
- Modify: `/Users/kk/go/src/SEAS/internal/data/subject.go`

- [ ] **Step 1: 新增 UpdateExamSubjectFullScore 接口方法**

在 `internal/biz/subject.go` 的 `SubjectRepo` 接口中，在 `CreateExamSubjects` 方法之后新增：

```go
	// UpdateExamSubjectFullScore 更新考试中某学科的满分（不存在则创建）
	UpdateExamSubjectFullScore(ctx context.Context, examID, subjectID int64, fullScore float64) error
```

- [ ] **Step 2: 实现 UpdateExamSubjectFullScore**

在 `internal/data/subject.go` 的 `GetFullScoreByExamSubject` 方法之后新增：

```go
// UpdateExamSubjectFullScore 更新考试中某学科的满分（不存在则创建）
func (r *subjectRepo) UpdateExamSubjectFullScore(ctx context.Context, examID, subjectID int64, fullScore float64) error {
	var count int64
	err := r.data.db.WithContext(ctx).Model(&biz.ExamSubject{}).
		Where("exam_id = ? AND subject_id = ?", examID, subjectID).
		Count(&count).Error
	if err != nil {
		log.Context(ctx).Errorf("subjectRepo.UpdateExamSubjectFullScore count err: %+v", err)
		return err
	}

	if count > 0 {
		// 更新现有记录
		return r.data.db.WithContext(ctx).Model(&biz.ExamSubject{}).
			Where("exam_id = ? AND subject_id = ?", examID, subjectID).
			Update("full_score", fullScore).Error
	}

	// 创建新记录
	return r.data.db.WithContext(ctx).Create(&biz.ExamSubject{
		ExamID:    examID,
		SubjectID: subjectID,
		FullScore: fullScore,
	}).Error
}
```

- [ ] **Step 3: 修改 CreateExamSubjects 为「不存在才创建」**

将 `internal/data/subject.go` 中的 `CreateExamSubjects` 方法替换为：

```go
// CreateExamSubjects 批量创建考试-学科关联记录（已存在则跳过）
func (r *subjectRepo) CreateExamSubjects(ctx context.Context, examID int64, subjectIDs []int64, fullScore float64) error {
	if len(subjectIDs) == 0 {
		return nil
	}

	records := make([]biz.ExamSubject, 0, len(subjectIDs))
	for _, sid := range subjectIDs {
		var count int64
		r.data.db.WithContext(ctx).Model(&biz.ExamSubject{}).
			Where("exam_id = ? AND subject_id = ?", examID, sid).
			Count(&count)
		if count == 0 {
			records = append(records, biz.ExamSubject{
				ExamID:    examID,
				SubjectID: sid,
				FullScore: fullScore,
			})
		}
	}

	if len(records) > 0 {
		return r.data.db.WithContext(ctx).Create(&records).Error
	}
	return nil
}
```

- [ ] **Step 4: 编译验证**

```bash
cd /Users/kk/go/src/SEAS
go build ./...
```

Expected: 编译成功，无错误。

- [ ] **Step 5: Commit**

```bash
cd /Users/kk/go/src/SEAS
git add internal/biz/subject.go internal/data/subject.go
git commit -m "feat(subject): 新增 UpdateExamSubjectFullScore，CreateExamSubjects 改为不存在才创建"
```

---

## Task 3: 后端业务层 — ExamImportUseCase 新增方法

**Files:**
- Modify: `/Users/kk/go/src/SEAS/internal/biz/exam_import.go`

- [ ] **Step 1: 新增 UpdateSubjectFullScores 方法**

在 `internal/biz/exam_import.go` 的 `CreateExam` 方法之后新增：

```go
// UpdateSubjectFullScores 更新考试各学科满分
func (uc *ExamImportUseCase) UpdateSubjectFullScores(ctx context.Context, examID int64, fullScores map[string]float64) error {
	for subjName, score := range fullScores {
		subj, err := uc.subjectRepo.FindOrCreateByName(ctx, subjName)
		if err != nil {
			return fmt.Errorf("find or create subject '%s' failed: %w", subjName, err)
		}
		err = uc.subjectRepo.UpdateExamSubjectFullScore(ctx, examID, subj.ID, score)
		if err != nil {
			return fmt.Errorf("update full score for '%s' failed: %w", subjName, err)
		}
	}
	return nil
}
```

- [ ] **Step 2: 编译验证**

```bash
cd /Users/kk/go/src/SEAS
go build ./...
```

Expected: 编译成功，无错误。

- [ ] **Step 3: Commit**

```bash
cd /Users/kk/go/src/SEAS
git add internal/biz/exam_import.go
git commit -m "feat(exam_import): 新增 UpdateSubjectFullScores 业务方法"
```

---

## Task 4: 后端 Service 层与 HTTP 路由

**Files:**
- Modify: `/Users/kk/go/src/SEAS/internal/service/exam_import.go`
- Modify: `/Users/kk/go/src/SEAS/internal/server/http.go`

- [ ] **Step 1: 新增 UpdateSubjectFullScores gRPC handler**

在 `internal/service/exam_import.go` 的 `ImportScoresFromMultipart` 方法之后新增：

```go
// UpdateSubjectFullScores 更新考试各学科满分
func (s *ExamImportService) UpdateSubjectFullScores(ctx context.Context, req *pb.UpdateSubjectFullScoresRequest) (*pb.UpdateSubjectFullScoresReply, error) {
	examID, err := strconv.ParseInt(req.GetExamId(), 10, 64)
	if err != nil {
		return nil, err
	}

	fullScores := make(map[string]float64, len(req.GetFullScores()))
	for k, v := range req.GetFullScores() {
		fullScores[k] = v
	}

	if err := s.importUC.UpdateSubjectFullScores(ctx, examID, fullScores); err != nil {
		return nil, err
	}

	return &pb.UpdateSubjectFullScoresReply{}, nil
}
```

- [ ] **Step 2: 注册 HTTP 路由**

`internal/server/http.go` 中已有 `v1.RegisterExamImportHTTPServer(srv, examImport)`，protobuf 生成的 HTTP 路由会自动包含新的 PUT 路由，**无需手动添加**。但需要确认 CORS 允许的 Methods 包含 PUT。

当前代码第 37-39 行：

```go
gorilla.AllowedMethods([]string{"GET", "POST", "DELETE", "OPTIONS"})
```

缺少 `PUT`，需要添加：

```go
gorilla.AllowedMethods([]string{"GET", "POST", "PUT", "DELETE", "OPTIONS"})
```

- [ ] **Step 3: 编译验证**

```bash
cd /Users/kk/go/src/SEAS
go build ./...
```

Expected: 编译成功，无错误。

- [ ] **Step 4: Commit**

```bash
cd /Users/kk/go/src/SEAS
git add internal/service/exam_import.go internal/server/http.go
git commit -m "feat(exam_import): 实现 UpdateSubjectFullScores gRPC handler，CORS 增加 PUT"
```

---

## Task 5: 后端分析接口修正

**Files:**
- Modify: `/Users/kk/go/src/SEAS/internal/service/analysis.go`

- [ ] **Step 1: ListSubjectsByExam 使用真实满分**

将 `internal/service/analysis.go` 中 `ListSubjectsByExam` 方法的第 88-96 行：

```go
	reply.Subjects = make([]*pb.SubjectBasicInfo, len(subjects))
	for i, subject := range subjects {
		// 暂时使用默认满分，后续需要从 exam_subjects 表获取
		reply.Subjects[i] = &pb.SubjectBasicInfo{
			Id:        strconv.FormatInt(subject.ID, 10),
			Name:      subject.Name,
			FullScore: 100, // 默认值
		}
	}
```

替换为：

```go
	reply.Subjects = make([]*pb.SubjectBasicInfo, len(subjects))
	for i, subject := range subjects {
		fullScore, err := s.examAnalysisUC.GetFullScoreByExamSubject(ctx, parseInt64(req.GetExamId()), subject.ID)
		if err != nil {
			log.Context(ctx).Errorf("GetFullScoreByExamSubject failed for subject %d: %v", subject.ID, err)
			fullScore = 100 // fallback
		}
		reply.Subjects[i] = &pb.SubjectBasicInfo{
			Id:        strconv.FormatInt(subject.ID, 10),
			Name:      subject.Name,
			FullScore: fullScore,
		}
	}
```

但 `ExamAnalysisUseCase` 没有 `GetFullScoreByExamSubject` 方法。需要在 `exam_analysis.go` 中新增一个代理方法，或者直接调用 `subjectRepo`。

更简单的方式：在 `AnalysisService` 中直接使用注入的 `subjectRepo`。但 `AnalysisService` 当前没有注入 `subjectRepo`。

查看 `NewAnalysisService`：

```go
func NewAnalysisService(analysisUC *biz.AnalysisUseCase, examAnalysisUC *biz.ExamAnalysisUseCase) *AnalysisService
```

`ExamAnalysisUseCase` 内部有 `subjectRepo`。需要在 `exam_analysis.go` 中新增一个方法：

在 `internal/biz/exam_analysis.go` 的 `ListSubjectsByExam` 之后新增：

```go
// GetSubjectFullScore 获取考试中某学科的满分
func (uc *ExamAnalysisUseCase) GetSubjectFullScore(ctx context.Context, examID, subjectID int64) (float64, error) {
	return uc.subjectRepo.GetFullScoreByExamSubject(ctx, examID, subjectID)
}
```

然后 `analysis.go` 中使用：

```go
		fullScore, err := s.examAnalysisUC.GetSubjectFullScore(ctx, parseInt64(req.GetExamId()), subject.ID)
```

- [ ] **Step 2: 新增 GetSubjectFullScore 代理方法**

在 `internal/biz/exam_analysis.go` 中新增：

```go
// GetSubjectFullScore 获取考试中某学科的满分
func (uc *ExamAnalysisUseCase) GetSubjectFullScore(ctx context.Context, examID, subjectID int64) (float64, error) {
	return uc.subjectRepo.GetFullScoreByExamSubject(ctx, examID, subjectID)
}
```

- [ ] **Step 3: 修改 ListSubjectsByExam 使用真实满分**

将 `internal/service/analysis.go` 中的循环替换为：

```go
	reply.Subjects = make([]*pb.SubjectBasicInfo, len(subjects))
	for i, subject := range subjects {
		fullScore, err := s.examAnalysisUC.GetSubjectFullScore(ctx, parseInt64(req.GetExamId()), subject.ID)
		if err != nil {
			log.Context(ctx).Errorf("GetSubjectFullScore failed for subject %d: %v", subject.ID, err)
			fullScore = 100 // fallback
		}
		reply.Subjects[i] = &pb.SubjectBasicInfo{
			Id:        strconv.FormatInt(subject.ID, 10),
			Name:      subject.Name,
			FullScore: fullScore,
		}
	}
```

- [ ] **Step 4: 编译验证**

```bash
cd /Users/kk/go/src/SEAS
go build ./...
```

Expected: 编译成功，无错误。

- [ ] **Step 5: Commit**

```bash
cd /Users/kk/go/src/SEAS
git add internal/biz/exam_analysis.go internal/service/analysis.go
git commit -m "feat(analysis): ListSubjectsByExam 使用 exam_subjects 真实满分"
```

---

## Task 6: 前端 Excel 解析扩展满分字段

**Files:**
- Modify: `/Users/kk/go/src/seas-frontend/src/lib/excel-parser.ts`

- [ ] **Step 1: ParseResult 接口新增 subjectFullScores**

在 `ParseResult` 接口中新增字段：

```typescript
export interface ParseResult {
  mode: 'simple' | 'full'
  summarySheet: string
  subjects: string[]
  students: ParsedStudent[]
  subjectDetails: ParsedSubjectDetail[]
  warnings: string[]
  // 新增：各科默认满分
  subjectFullScores: Record<string, number>
}
```

- [ ] **Step 2: parseExamExcel 填充默认满分**

在 `parseExamExcel` 函数中，在解析完 `subjectCols` 之后（约第 79 行），为 `result.subjectFullScores` 填充默认值：

找到这段代码：

```typescript
  if (subjectCols.length === 0) {
    throw new Error('未识别到学科成绩列，请检查表头格式')
  }
```

在其后添加：

```typescript
  // 初始化各科默认满分为 100
  result.subjectFullScores = {}
  for (const { name: subjectName } of subjectCols) {
    result.subjectFullScores[subjectName] = 100
  }
```

- [ ] **Step 3: 编译验证**

```bash
cd /Users/kk/go/src/seas-frontend
npm run lint
```

Expected: lint 通过，无 TypeScript 错误。

- [ ] **Step 4: Commit**

```bash
cd /Users/kk/go/src/seas-frontend
git add src/lib/excel-parser.ts
git commit -m "feat(excel-parser): 新增 subjectFullScores 字段，默认满分 100"
```

---

## Task 7: 前端 API 服务新增满分配置接口

**Files:**
- Modify: `/Users/kk/go/src/seas-frontend/src/services/examImport.ts`

- [ ] **Step 1: 新增类型和 API 函数**

在 `examImport.ts` 的 `ImportScoresResponse` 接口之后新增：

```typescript
export interface SubjectFullScoresRequest {
  fullScores: Record<string, number>
}
```

在文件末尾（`importScores` 函数之后）新增：

```typescript
export async function updateSubjectFullScores(
  examId: string,
  data: SubjectFullScoresRequest
): Promise<void> {
  return apiClient.put(`/exams/${examId}/subjects/full-scores`, data)
}
```

- [ ] **Step 2: 编译验证**

```bash
cd /Users/kk/go/src/seas-frontend
npm run lint
```

Expected: lint 通过，无错误。

- [ ] **Step 3: Commit**

```bash
cd /Users/kk/go/src/seas-frontend
git add src/services/examImport.ts
git commit -m "feat(api): 新增 updateSubjectFullScores 接口"
```

---

## Task 8: 前端页面 — 满分确认 UI 与串行调用

**Files:**
- Modify: `/Users/kk/go/src/seas-frontend/src/app/create/page.tsx`

- [ ] **Step 1: 导入新增 API 和组件**

将现有的 import 语句：

```typescript
import { createExam, importScores } from '@/services/examImport'
```

替换为：

```typescript
import { createExam, importScores, updateSubjectFullScores } from '@/services/examImport'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
```

- [ ] **Step 2: 新增满分状态**

在 `CreatePage` 组件中，在现有 state 之后新增：

```typescript
  const [subjectFullScores, setSubjectFullScores] = useState<Record<string, number>>({})
```

- [ ] **Step 3: handleFileSelect 中初始化满分状态**

在 `handleFileSelect` 的 `setParseResult(result)` 之后添加：

```typescript
      setParseResult(result)
      setSubjectFullScores({ ...result.subjectFullScores })
```

在 `handleClear` 中添加：

```typescript
  const handleClear = useCallback(() => {
    setFile(null)
    setParseResult(null)
    setParseError(null)
    setSubjectFullScores({})
  }, [])
```

- [ ] **Step 4: handleGenerate 改为串行调用**

将 `handleGenerate` 替换为：

```typescript
  const handleGenerate = useCallback(async () => {
    if (!file || !parseResult) return

    setIsUploading(true)
    try {
      // 1. 创建考试
      const today = new Date().toISOString().split('T')[0]
      const examName = file.name.replace(/\.xlsx$/i, '')
      const exam = await createExam({ name: examName, examDate: today })

      // 2. 保存满分配置（必须先成功）
      await updateSubjectFullScores(exam.examId, { fullScores: subjectFullScores })

      // 3. 上传成绩文件
      await importScores(exam.examId, file)

      // 4. 跳转到分析页
      router.push(`/exams/${exam.examId}`)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : '上传失败，请稍后重试')
      setIsUploading(false)
    }
  }, [file, parseResult, subjectFullScores, router])
```

- [ ] **Step 5: 新增满分确认 UI**

在「识别成功」卡片（`{parseResult && (...)}` 区域）的 `warnings` 展示之后、`{parseResult && (...生成按钮)}` 之前，插入满分确认区域：

找到这段代码的位置（大约在第 125 行 `</div>` 结束识别成功卡片）：

```tsx
          </div>
        </div>
      )}
```

在其后添加：

```tsx
      {/* 满分确认 */}
      {parseResult && (
        <div className="rounded-xl border border-border/60 bg-card p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            确认各科满分
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {parseResult.subjects.map((subject) => (
              <div key={subject} className="space-y-1.5">
                <Label htmlFor={`fullscore-${subject}`} className="text-xs text-muted-foreground">
                  {subject}
                </Label>
                <Input
                  id={`fullscore-${subject}`}
                  type="number"
                  min={1}
                  value={subjectFullScores[subject] ?? 100}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value)
                    if (!isNaN(val) && val > 0) {
                      setSubjectFullScores((prev) => ({ ...prev, [subject]: val }))
                    }
                  }}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-border/40">
            <p className="text-sm text-muted-foreground">
              总分满分：
              <span className="font-semibold text-foreground">
                {parseResult.subjects.reduce((sum, s) => sum + (subjectFullScores[s] ?? 100), 0)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">（自动计算）</span>
            </p>
          </div>
        </div>
      )}
```

- [ ] **Step 6: 编译验证**

```bash
cd /Users/kk/go/src/seas-frontend
npm run lint
```

Expected: lint 通过，无 TypeScript 错误。

- [ ] **Step 7: Commit**

```bash
cd /Users/kk/go/src/seas-frontend
git add src/app/create/page.tsx
git commit -m "feat(create): 新增满分确认 UI，串行调用保存满分后导入"
```

---

## Task 9: 联调验证

- [ ] **Step 1: 启动后端服务**

```bash
cd /Users/kk/go/src/SEAS
go run ./cmd/seas/... &
```

Expected: 后端启动成功，监听 `:8000`。

- [ ] **Step 2: 启动前端开发服务器**

```bash
cd /Users/kk/go/src/seas-frontend
npm run dev &
```

Expected: 前端启动成功，监听 `:3000`。

- [ ] **Step 3: 准备测试 Excel**

准备一个简单模式的测试 Excel，包含：
- Sheet 名：`总成绩`
- 表头：姓名、班级、语文、数学、英语
- 2-3 行学生数据，成绩范围 0-150

- [ ] **Step 4: 浏览器验证满分配置流程**

1. 打开 `http://localhost:3000/create`
2. 上传测试 Excel
3. 验证识别结果页展示：
   - 学科列表正确
   - 各科满分输入框默认显示 100
   - 底部显示「总分满分：300（自动计算）」
4. 修改某科满分为 150，验证总分自动更新
5. 点击「生成分析」
6. 验证成功跳转到 `/exams/{id}`

- [ ] **Step 5: 验证后端数据**

```bash
sqlite3 /Users/kk/go/src/SEAS/data/seas.db "SELECT * FROM exam_subjects WHERE exam_id = (SELECT MAX(id) FROM exams);"
```

Expected: `full_score` 列显示用户设置的值（如 150、100 等），不是 100。

- [ ] **Step 6: 验证学科列表接口返回真实满分**

```bash
curl -s "http://localhost:8000/seas/api/v1/exams/$(sqlite3 /Users/kk/go/src/SEAS/data/seas.db 'SELECT MAX(id) FROM exams')/subjects" | jq
```

Expected: `subjects` 数组中每个学科的 `full_score` 等于用户设置的值。

- [ ] **Step 7: Commit（如有额外修复）**

如果联调中发现并修复了问题，单独 commit：

```bash
cd /Users/kk/go/src/seas-frontend
git add -A
git commit -m "fix: 联调修复"

cd /Users/kk/go/src/SEAS
git add -A
git commit -m "fix: 联调修复"
```

---

## Self-Review Checklist

| Spec 要求 | 对应 Task | 状态 |
|-----------|-----------|------|
| 新增 `PUT /exams/{id}/subjects/full-scores` 接口 | Task 1-4 | ✅ |
| `CreateExamSubjects` 改为「不存在才创建」 | Task 2 | ✅ |
| 分析接口使用真实满分 | Task 5 | ✅ |
| 前端 `ParseResult` 扩展 `subjectFullScores` | Task 6 | ✅ |
| 前端新增 `updateSubjectFullScores` API | Task 7 | ✅ |
| 前端识别结果页新增满分确认 UI | Task 8 | ✅ |
| 串行调用（先保存满分，再导入文件） | Task 8 | ✅ |
| 总分自动计算展示 | Task 8 | ✅ |
| 联调验证 | Task 9 | ✅ |

**无占位符**：所有 step 均包含完整代码和验证命令。
