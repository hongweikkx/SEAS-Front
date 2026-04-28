# AI 智能分析接口设计

## 概述

为 SEAS 智能学业分析系统的 8 个分析视图提供 AI 智能分析功能。后端基于已有数据生成一段带可点击链接的分析文本，用户点击链接可跳转到对应下钻视图。

**核心约束**：后端获取数据时使用与前端展示相同的 service 方法，确保数据一致性。

## 接口定义

### POST /ai/analysis

**请求体**：

```json
{
  "view": "class-summary",
  "examId": "123",
  "params": {
    "classId": "1",
    "subjectId": "math",
    "questionId": "q12"
  }
}
```

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| view | string | 是 | 8个视图之一 |
| examId | string | 是 | 考试ID |
| params | object | 否 | 视情况而定，含 classId/subjectId/questionId |

**响应体**：

```json
{
  "segments": [
    { "type": "text", "content": "本次考试整体表现平稳，" },
    { "type": "link", "content": "高三1班", "link": { "label": "高三1班", "targetView": "single-class-summary", "params": { "classId": "1" } } },
    { "type": "text", "content": "平均分领先，建议关注两极分化。" }
  ],
  "generatedAt": 1714291200000
}
```

## 后端数据流

```
POST /ai/analysis
    │
    ▼
┌─────────────┐     view + examId + params
│ AI Analysis │ ───────────────────────────►
│   Handler   │
└──────┬──────┘
       │
       ▼  根据 view 调用对应的 service 方法（复用已有方法）
┌─────────────────────────────────────────┐
│  class-summary    → s.GetClassSummary() │
│  subject-summary  → s.GetSubjectSummary()│
│  rating-analysis  → s.GetRatingDistribution()│
│  class-subject-summary → s.GetClassSubjectSummary()│
│  single-class-summary  → s.GetSingleClassSummary()│
│  single-class-question → s.GetSingleClassQuestions()│
│  single-question-summary → s.GetSingleQuestionSummary()│
│  single-question-detail  → s.GetSingleQuestionDetail()│
└─────────────────────────────────────────┘
       │
       ▼  将 protobuf 数据序列化为 prompt context
┌─────────────┐
│ Prompt 组装  │  view 对应的 prompt 模板 + 数据
└──────┬──────┘
       │
       ▼  单次 LLM 调用（复用现有的 ark 配置）
┌─────────────┐
│  LLM 生成   │
└──────┬──────┘
       │
       ▼  解析 [[...]] 标记，分割为 segments
┌─────────────┐
│ Segments 组装│  {text, link} 数组
└──────┬──────┘
       │
       ▼
   JSON 响应
```

## Prompt 模板策略

每个视图一个 prompt 模板，包含三部分：
1. **角色定义** + **分析要求**
2. **数据占位符**（运行时替换为 JSON 数据）
3. **链接生成规则**

### 示例：class-summary

```
你是一位学业数据分析专家。请基于以下班级汇总数据生成一段简要分析（80-120字）。

【数据】
考试名称：{examName}
参与人数：{totalParticipants}
年级概览：平均分 {overallAvg}，最高分 {overallHighest}，最低分 {overallLowest}
各班明细：
{classDetailsJson}

【分析要求】
1. 指出表现突出和需要关注的班级
2. 从教学管理角度给出1-2条具体建议
3. 语气专业、简洁

【链接规则】
当你提到具体班级名称时，请使用以下格式包裹：
[[班级名称|single-class-summary|{"classId":"班级ID"}]]

只输出分析文本，不要加标题、不要加总结。
```

### 链接解析

LLM 输出中可能包含 `[[显示文字|目标视图|{"param":"value"}]]` 格式的标记。

后端用正则解析并分割为 `text` / `link` segment：

```go
pattern := `\[\[([^|]+)\|([^|]+)\|\{([^}]+)\}\]\]`
```

**Fallback**：如果 LLM 未按格式输出（或没生成任何链接），整条文本作为一个 `text` segment 返回，不报错。

### 8 个视图的链接映射

| 视图 | 可能生成的链接目标 |
|------|------------------|
| class-summary | single-class-summary |
| subject-summary | single-class-summary |
| rating-analysis | subject-summary, single-class-summary |
| class-subject-summary | single-class-question |
| single-class-summary | single-class-question |
| single-class-question | single-question-summary |
| single-question-summary | single-question-detail |
| single-question-detail | （通常无下钻）|

## 前端改动

### 1. 新增 aiAnalysisService

```typescript
// src/services/aiAnalysis.ts
export const aiAnalysisService = {
  generate: (view: AnalysisView, examId: string, params?: Record<string, string>) =>
    apiClient.post('/ai/analysis', { view, examId, params }),
}
```

### 2. 替换 store 中的 mock 调用

```typescript
// src/store/analysisStore.ts:147-163
// 从 mock 改为真实 API 调用
const result = await aiAnalysisService.generate(view, examId, params)
```

### 3. 类型无需改动

`AIAnalysisResult`、`AILink` 已和后端设计完全对齐。

## 后端清理清单（实现时先执行）

实现新代码前，先删除以下不再使用的文件和引用：

| 文件 | 操作 | 说明 |
|------|------|------|
| `internal/server/chat.go` | 删除 | ChatHandler、SSE 流式聊天 |
| `internal/server/tool_bridge.go` | 删除 | AnalysisToolBridge、eino 工具 |
| `internal/server/a2ui.go` | 删除 | A2UI 消息类型和 SSE 辅助函数 |
| `internal/server/chat_timing.go` | 删除 | 聊天计时中间件 |
| `internal/server/chat_timing_test.go` | 删除 | 聊天计时测试 |
| `internal/server/server.go` | 修改 | wire.NewSet 删除 NewChatHandler、NewAnalysisToolBridge |
| `internal/server/http.go` | 修改 | 删除 chatHandler 参数和 `/chat` 路由 |
| `cmd/seas/wire.go` | 修改 | 删除 chat 相关 provider |
| `cmd/seas/wire_gen.go` | 重新生成 | `go generate ./...` |

**注意**：LLM 初始化逻辑（`ark.NewChatModel`）需要从 `chat.go` 中提取到新文件，供新的 AI 分析 handler 复用。

## 后端新代码结构

```
internal/server/
├── ai_analysis.go          // 新：AI 分析 handler
├── llm_client.go           // 新：提取的 LLM 创建逻辑
├── http.go                 // 改：注册 /ai/analysis，移除 /chat
├── server.go               // 改：wire provider
└── ...（删除 chat.go 等）
```

## 错误处理

| 场景 | 处理方式 |
|------|---------|
| service 查询失败 | 返回 500，error message 透传 |
| LLM 调用失败 | 返回 503，提示"智能分析服务暂时不可用" |
| LLM 输出格式错误 | fallback 为纯文本 segment，不报错 |
| LLM 输出超长 | prompt 中限制字数，超限截断 |

## 缓存策略

- **前端**：store 已有按 view 的 `aiAnalysisResults` 缓存（zustand persist），切换视图不重复请求
- **后端**：不缓存。LLM 调用成本不高，且每次分析可能因数据变化而不同。如需可加 Redis。
