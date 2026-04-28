# AI 智能分析接口实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现后端 `POST /ai/analysis` 接口和前端真实 API 调用，替换现有 Mock。

**Architecture:** 后端一个通用 HTTP handler，根据 `view` 参数调用已有 `AnalysisService` 方法获取数据，组装 prompt 后单次调用 LLM，解析返回文本中的 `[[...]]` 链接标记，输出 `segments` JSON。

**Tech Stack:** Go + eino (ark) + Kratos (wire) | TypeScript + React + Zustand

---

## 文件结构

### 后端（`../seas`）

**新建：**
- `internal/server/ai_analysis.go` — AI 分析 handler，含路由处理、数据获取、LLM 调用、链接解析
- `internal/server/ai_analysis_test.go` — 单元测试（prompt 组装、链接解析）

**修改：**
- `internal/server/server.go` — wire provider set 删除 chat/tool，添加 `NewAIAnalysisHandler`
- `internal/server/http.go` — 删除 `/chat` 路由和 `chatHandler` 参数，添加 `/ai/analysis`
- `cmd/seas/wire.go` — 无需修改（LLM config 仍通过 wire 注入）
- `cmd/seas/wire_gen.go` — 重新生成

**删除（先执行）：**
- `internal/server/chat.go`
- `internal/server/tool_bridge.go`
- `internal/server/a2ui.go`
- `internal/server/chat_timing.go`
- `internal/server/chat_timing_test.go`

### 前端（当前目录）

**新建：**
- `src/services/aiAnalysis.ts` — AI 分析 service

**修改：**
- `src/store/analysisStore.ts` — `generateAIAnalysis` 替换 mock 为真实 API 调用

---

## Task 1: 删除后端 chat/tool 相关无用代码

**说明：** 按用户要求，先删除再写新代码。

**Files:**
- Delete: `../seas/internal/server/chat.go`
- Delete: `../seas/internal/server/tool_bridge.go`
- Delete: `../seas/internal/server/a2ui.go`
- Delete: `../seas/internal/server/chat_timing.go`
- Delete: `../seas/internal/server/chat_timing_test.go`

- [ ] **Step 1: 删除 5 个文件**

```bash
cd ../seas
rm internal/server/chat.go
rm internal/server/tool_bridge.go
rm internal/server/a2ui.go
rm internal/server/chat_timing.go
rm internal/server/chat_timing_test.go
```

- [ ] **Step 2: 修改 `internal/server/server.go`**

删除 chat 和 tool bridge 的 provider：

```go
var ProviderSet = wire.NewSet(NewGRPCServer, NewHTTPServer)
```

- [ ] **Step 3: 修改 `internal/server/http.go`**

删除 `chatHandler` 参数和 `/chat` 路由：

```go
// 修改函数签名
func NewHTTPServer(c *conf.Server, analysis *service.AnalysisService, tp trace.TracerProvider, logger log.Logger) *httptransport.Server {
    // ... 保持 opts 不变 ...
    srv := httptransport.NewServer(opts...)
    v1.RegisterAnalysisHTTPServer(srv, analysis)
    // 删除：srv.Handle("/chat", chatHandler)
    srv.Handle("/metrics", promhttp.Handler())
    return srv
}
```

- [ ] **Step 4: 重新生成 wire**

```bash
cd ../seas
go generate ./cmd/seas/...
```

Expected: `wire_gen.go` 更新，`chatHandler` 和 `analysisToolBridge` 相关代码消失。

- [ ] **Step 5: 编译验证**

```bash
cd ../seas
go build ./cmd/seas/...
```

Expected: 编译成功。

- [ ] **Step 6: Commit**

```bash
cd ../seas
git add -A
git commit -m "chore: 删除废弃的 chat/tool 相关代码"
```

---

## Task 2: 实现后端 AI 分析 handler（核心）

**Files:**
- Create: `../seas/internal/server/ai_analysis.go`
- Create: `../seas/internal/server/ai_analysis_test.go`
- Modify: `../seas/internal/server/server.go`
- Modify: `../seas/internal/server/http.go`
- Modify: `../seas/cmd/seas/wire_gen.go`

### Part A: AI 分析 handler

- [ ] **Step 1: 创建 `ai_analysis.go`**

```go
package server

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/cloudwego/eino-ext/components/model/ark"
	einomodel "github.com/cloudwego/eino/components/model"
	"github.com/cloudwego/eino/schema"
	"github.com/go-kratos/kratos/v2/log"

	"seas/internal/conf"
	"seas/internal/service"
)

// 链接标记正则：[[显示文字|目标视图|{"param":"value"}]]
var linkPattern = regexp.MustCompile(`(?s)\[\[(.+?)\|(.+?)\|\{(.+?)\}\]\]`)

type AIAnalysisRequest struct {
	View   string            `json:"view"`
	ExamID string            `json:"examId"`
	Params map[string]string `json:"params,omitempty"`
}

type AILink struct {
	Label      string            `json:"label"`
	TargetView string            `json:"targetView"`
	Params     map[string]string `json:"params,omitempty"`
}

type AISegment struct {
	Type    string  `json:"type"` // "text" or "link"
	Content string  `json:"content"`
	Link    *AILink `json:"link,omitempty"`
}

type AIAnalysisResponse struct {
	Segments    []AISegment `json:"segments"`
	GeneratedAt int64       `json:"generatedAt"`
}

type AIAnalysisHandler struct {
	analysis *service.AnalysisService
	llmConf  *conf.LLM
	logger   *log.Helper

	modelOnce sync.Once
	model     einomodel.ChatModel
	modelErr  error
}

func NewAIAnalysisHandler(analysis *service.AnalysisService, llm *conf.LLM, logger log.Logger) *AIAnalysisHandler {
	return &AIAnalysisHandler{
		analysis: analysis,
		llmConf:  llm,
		logger:   log.NewHelper(logger),
	}
}

func (h *AIAnalysisHandler) chatModel() (einomodel.ChatModel, error) {
	h.modelOnce.Do(func() {
		if h.llmConf == nil {
			h.modelErr = fmt.Errorf("llm config is missing")
			return
		}
		model := strings.TrimSpace(h.llmConf.GetModel())
		apiKey := strings.TrimSpace(h.llmConf.GetApiKey())
		if model == "" || apiKey == "" {
			h.modelErr = fmt.Errorf("llm config requires model and api_key")
			return
		}
		var temp float32
		if t := h.llmConf.GetTemperature(); t != 0 {
			temp = float32(t)
		} else {
			temp = 0.2
		}
		h.model, h.modelErr = ark.NewChatModel(context.Background(), &ark.ChatModelConfig{
			BaseURL:     strings.TrimSpace(h.llmConf.GetApiBase()),
			Region:      strings.TrimSpace(h.llmConf.GetRegion()),
			APIKey:      apiKey,
			AccessKey:   strings.TrimSpace(h.llmConf.GetAccessKey()),
			SecretKey:   strings.TrimSpace(h.llmConf.GetSecretKey()),
			Model:       model,
			Temperature: &temp,
		})
	})
	return h.model, h.modelErr
}

func (h *AIAnalysisHandler) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	if r.Method == http.MethodOptions {
		w.WriteHeader(http.StatusNoContent)
		return
	}
	if r.Method != http.MethodPost {
		writeJSON(w, http.StatusMethodNotAllowed, map[string]string{"error": "method not allowed"})
		return
	}

	var req AIAnalysisRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid request body"})
		return
	}
	if strings.TrimSpace(req.View) == "" || strings.TrimSpace(req.ExamID) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "view and examId are required"})
		return
	}

	result, err := h.generateAnalysis(r.Context(), req)
	if err != nil {
		h.logger.Errorf("ai analysis failed: %v", err)
		writeJSON(w, http.StatusServiceUnavailable, map[string]string{"error": "智能分析服务暂时不可用"})
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	_ = json.NewEncoder(w).Encode(result)
}

func (h *AIAnalysisHandler) generateAnalysis(ctx context.Context, req AIAnalysisRequest) (*AIAnalysisResponse, error) {
	prompt, err := h.buildPrompt(ctx, req)
	if err != nil {
		return nil, fmt.Errorf("build prompt: %w", err)
	}

	chatModel, err := h.chatModel()
	if err != nil {
		return nil, fmt.Errorf("init chat model: %w", err)
	}

	msg, err := chatModel.Generate(ctx, []*schema.Message{
		schema.SystemMessage(prompt),
	})
	if err != nil {
		return nil, fmt.Errorf("llm generate: %w", err)
	}

	segments := parseSegments(msg.Content)
	return &AIAnalysisResponse{
		Segments:    segments,
		GeneratedAt: time.Now().UnixMilli(),
	}, nil
}
```

- [ ] **Step 2: 添加 prompt 模板和 buildPrompt 方法到 `ai_analysis.go`**

在文件末尾追加（在 `generateAnalysis` 之后）：

```go
func (h *AIAnalysisHandler) buildPrompt(ctx context.Context, req AIAnalysisRequest) (string, error) {
	examID := parseInt64(req.ExamID)

	switch req.View {
	case "class-summary":
		return h.buildClassSummaryPrompt(ctx, examID, req.Params)
	case "subject-summary":
		return h.buildSubjectSummaryPrompt(ctx, examID, req.Params)
	case "rating-analysis":
		return h.buildRatingAnalysisPrompt(ctx, examID, req.Params)
	case "class-subject-summary":
		return h.buildClassSubjectSummaryPrompt(ctx, examID, req.Params)
	case "single-class-summary":
		return h.buildSingleClassSummaryPrompt(ctx, examID, req.Params)
	case "single-class-question":
		return h.buildSingleClassQuestionPrompt(ctx, examID, req.Params)
	case "single-question-summary":
		return h.buildSingleQuestionSummaryPrompt(ctx, examID, req.Params)
	case "single-question-detail":
		return h.buildSingleQuestionDetailPrompt(ctx, examID, req.Params)
	default:
		return "", fmt.Errorf("unsupported view: %s", req.View)
	}
}
```

- [ ] **Step 3: 添加 class-summary 的 prompt 实现**

```go
func (h *AIAnalysisHandler) buildClassSummaryPrompt(ctx context.Context, examID int64, params map[string]string) (string, error) {
	reply, err := h.analysis.GetClassSummary(ctx, &v1.GetClassSummaryRequest{
		ExamId: strconv.FormatInt(examID, 10),
		Scope:  "all_subjects",
	})
	if err != nil {
		return "", err
	}

	var b strings.Builder
	fmt.Fprintf(&b, "你是一位学业数据分析专家。请基于以下班级汇总数据生成一段简要分析（80-120字）。\n\n")
	fmt.Fprintf(&b, "【数据】\n")
	fmt.Fprintf(&b, "考试名称：%s\n", reply.GetExamName())
	fmt.Fprintf(&b, "参与人数：%d\n", reply.GetTotalParticipants())
	if overall := reply.GetOverallGrade(); overall != nil {
		fmt.Fprintf(&b, "年级概览：平均分 %.2f，最高分 %.2f，最低分 %.2f，标准差 %.2f\n",
			overall.GetAvgScore(), overall.GetHighestScore(), overall.GetLowestScore(), overall.GetStdDev())
	}
	fmt.Fprintf(&b, "各班明细：\n")
	for _, class := range reply.GetClassDetails() {
		fmt.Fprintf(&b, "  %s：%d人，均分%.2f，最高%.2f，最低%.2f，标准差%.2f\n",
			class.GetClassName(), class.GetTotalStudents(), class.GetAvgScore(),
			class.GetHighestScore(), class.GetLowestScore(), class.GetStdDev())
	}
	fmt.Fprintf(&b, "\n【分析要求】\n")
	fmt.Fprintf(&b, "1. 指出表现突出和需要关注的班级\n")
	fmt.Fprintf(&b, "2. 从教学管理角度给出1-2条具体建议\n")
	fmt.Fprintf(&b, "3. 语气专业、简洁\n")
	fmt.Fprintf(&b, "\n【链接规则】\n")
	fmt.Fprintf(&b, "当你提到具体班级名称时，请使用以下格式包裹：\n")
	fmt.Fprintf(&b, "[[班级名称|single-class-summary|{\"classId\":\"班级ID\"}]]\n")
	fmt.Fprintf(&b, "\n只输出分析文本，不要加标题、不要加总结。")
	return b.String(), nil
}
```

> **注意**：其余 7 个视图的 prompt 方法与此结构类似，调用对应的 `analysis.GetXxx` 方法，格式化数据，组装 prompt。实现时参照 class-summary 的模式逐个添加。

- [ ] **Step 4: 添加链接解析函数**

```go
func parseSegments(content string) []AISegment {
	if content == "" {
		return []AISegment{{Type: "text", Content: "暂无分析数据。"}}
	}

	var segments []AISegment
	lastIndex := 0

	matches := linkPattern.FindAllStringIndex(content, -1)
	for _, match := range matches {
		start, end := match[0], match[1]
		if start > lastIndex {
			segments = append(segments, AISegment{
				Type:    "text",
				Content: strings.TrimSpace(content[lastIndex:start]),
			})
		}

		groups := linkPattern.FindStringSubmatch(content[start:end])
		if len(groups) == 4 {
			var params map[string]string
			_ = json.Unmarshal([]byte("{"+groups[3]+"}"), &params)
			segments = append(segments, AISegment{
				Type:    "link",
				Content: strings.TrimSpace(groups[1]),
				Link: &AILink{
					Label:      strings.TrimSpace(groups[1]),
					TargetView: strings.TrimSpace(groups[2]),
					Params:     params,
				},
			})
		}
		lastIndex = end
	}

	if lastIndex < len(content) {
		remaining := strings.TrimSpace(content[lastIndex:])
		if remaining != "" {
			segments = append(segments, AISegment{
				Type:    "text",
				Content: remaining,
			})
		}
	}

	if len(segments) == 0 {
		return []AISegment{{Type: "text", Content: content}}
	}
	return segments
}
```

> **注意**：需要导入 `v1 "seas/api/seas/v1"` 包到 `ai_analysis.go` 中。

- [ ] **Step 5: 注册 handler 到 HTTP 路由**

修改 `internal/server/http.go`：

```go
func NewHTTPServer(c *conf.Server, analysis *service.AnalysisService, aiAnalysis *AIAnalysisHandler, tp trace.TracerProvider, logger log.Logger) *httptransport.Server {
    // ... opts 不变 ...
    srv := httptransport.NewServer(opts...)
    v1.RegisterAnalysisHTTPServer(srv, analysis)
    srv.Handle("/ai/analysis", aiAnalysis)
    srv.Handle("/metrics", promhttp.Handler())
    return srv
}
```

修改 `internal/server/server.go`：

```go
var ProviderSet = wire.NewSet(NewGRPCServer, NewHTTPServer, NewAIAnalysisHandler)
```

- [ ] **Step 6: 重新生成 wire**

```bash
cd ../seas
go generate ./cmd/seas/...
```

- [ ] **Step 7: 编译验证**

```bash
cd ../seas
go build ./cmd/seas/...
```

Expected: 编译成功。

- [ ] **Step 8: Commit**

```bash
cd ../seas
git add -A
git commit -m "feat: 实现 AI 智能分析接口"
```

---

## Task 3: 实现前端 AI 分析 Service

**Files:**
- Create: `src/services/aiAnalysis.ts`
- Modify: `src/store/analysisStore.ts`

- [ ] **Step 1: 创建 `src/services/aiAnalysis.ts`**

```typescript
import apiClient from './api'
import type { AnalysisView, AIAnalysisResult } from '@/types'

export const aiAnalysisService = {
  generate: (
    view: AnalysisView,
    examId: string,
    params?: Record<string, string>
  ): Promise<AIAnalysisResult> =>
    apiClient.post('/ai/analysis', { view, examId, params }),
}
```

- [ ] **Step 2: 修改 `src/store/analysisStore.ts`**

替换 `generateAIAnalysis` 方法中的 mock 调用：

```typescript
// 找到 generateAIAnalysis 方法，替换内部实现
generateAIAnalysis: async (view, examId, params) => {
  set((state) => ({
    aiAnalysisLoading: { ...state.aiAnalysisLoading, [view]: true },
  }))
  try {
    const { aiAnalysisService } = await import('@/services/aiAnalysis')
    const result = await aiAnalysisService.generate(view, examId, params)
    set((state) => ({
      aiAnalysisResults: { ...state.aiAnalysisResults, [view]: result },
    }))
  } catch (err) {
    console.error('AI analysis failed:', err)
    // 失败时保留旧结果或设置空结果
    set((state) => ({
      aiAnalysisResults: {
        ...state.aiAnalysisResults,
        [view]: {
          segments: [{ type: 'text' as const, content: '智能分析服务暂时不可用，请稍后重试。' }],
          generatedAt: Date.now(),
        },
      },
    }))
  } finally {
    set((state) => ({
      aiAnalysisLoading: { ...state.aiAnalysisLoading, [view]: false },
    }))
  }
},
```

- [ ] **Step 3: 验证 TypeScript 编译**

```bash
npx tsc --noEmit
```

Expected: 无类型错误。

- [ ] **Step 4: Commit**

```bash
git add src/services/aiAnalysis.ts src/store/analysisStore.ts
git commit -m "feat: 前端 AI 分析接入真实后端接口"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] 接口定义（POST /ai/analysis，JSON 请求/响应）→ Task 2
- [x] 后端数据流（8 个视图 → service 方法 → prompt → LLM → segments）→ Task 2
- [x] Prompt 模板策略 → Task 2（Step 3 及后续）
- [x] 链接解析（`[[...]]` 正则）→ Task 2（Step 4）
- [x] 前端改动（service + store）→ Task 3
- [x] 后端清理清单（先删 chat/tool）→ Task 1
- [x] 错误处理 → Task 2（handler 中已覆盖）

**Placeholder scan:**
- [x] 无 TBD/TODO
- [x] 所有步骤含实际代码
- [x] 无 "similar to Task N"

**Type consistency:**
- [x] `AIAnalysisRequest` / `AIAnalysisResponse` 与 spec 一致
- [x] `AISegment` / `AILink` 与前端 `AIAnalysisResult` / `AILink` 结构对齐
