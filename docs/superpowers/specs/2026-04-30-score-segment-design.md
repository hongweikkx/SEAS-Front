# 分数段分析功能设计文档

## 概述

新增「分数段分析」视图，从「班级内部结构」和「年级贡献分布」两个维度，按可配置的分数段区间分析各班成绩分布。

## 需求

- 支持全科和单科两种模式
- 分数段可配置（如 0-10分1分一段，10-100分10分一段）
- 表格：宽表结构，横轴为分数段，纵轴为班级，每个分数段下包含人数、班内占比、年级贡献三列
- 图表：纵向百分比堆叠柱状图（班级内部结构）+ 堆叠面积图（分数段贡献）

## 架构方案

**方案 A：前端配置规则，后端按规则聚合**
- 前端提供配置面板定义分段规则，展开为具体区间后传给后端
- 后端用 SQL 按区间聚合统计各班人数
- 前端计算班内占比和年级贡献，用 recharts 绘制图表

## 数据结构设计

### 前端配置规则
```typescript
interface SegmentRule {
  start: number   // 起始分数
  end: number     // 结束分数
  step: number    // 每段宽度
}
```

### 后端 Protobuf
```protobuf
message SegmentConfig {
  double start = 1;
  double end = 2;
  double step = 3;
}

message GetScoreSegmentRequest {
  string exam_id = 1;
  string scope = 2;
  string subject_id = 3;
  repeated SegmentConfig segments = 4;
}

message ScoreSegmentItem {
  string label = 1;
  double min = 2;
  double max = 3;
  int64 count = 4;
}

message ClassScoreSegment {
  int32 class_id = 1;
  string class_name = 2;
  int32 total_students = 3;
  repeated ScoreSegmentItem segments = 4;
}

message GetScoreSegmentReply {
  string exam_id = 1;
  string exam_name = 2;
  string scope = 3;
  int32 total_participants = 4;
  repeated SegmentConfig config = 5;
  ClassScoreSegment overall_grade = 6;
  repeated ClassScoreSegment class_details = 7;
}
```

## 后端实现

### API 接口
```protobuf
rpc GetScoreSegment (GetScoreSegmentRequest) returns (GetScoreSegmentReply) {
  option (google.api.http) = {
    get: "/seas/api/v1/exams/{exam_id}/analysis/score-segment"
  };
}
```

### 新增文件/方法
- `api/seas/v1/analysis.proto` - 新增 message 和 rpc
- `internal/service/analysis.go` - 新增 `GetScoreSegment` 方法
- `internal/biz/exam_analysis.go` - 新增 `GetScoreSegment` 方法
- `internal/biz/score.go` - `ScoreRepo` 接口新增 `GetScoreSegment` 方法
- `internal/data/score.go` - 实现 `GetScoreSegment`，用 SQL 按区间聚合

### SQL 策略
后端将前端传来的规则展开为具体区间，用 `CASE WHEN` 按区间统计各班人数：
```sql
SELECT 
  c.id as class_id, c.name as class_name, COUNT(DISTINCT st.id) as total_students,
  SUM(CASE WHEN score >= min1 AND score < max1 THEN 1 ELSE 0 END) as seg_0,
  SUM(CASE WHEN score >= min2 AND score < max2 THEN 1 ELSE 0 END) as seg_1,
  ...
FROM classes c
JOIN students st ON st.class_id = c.id
JOIN (SELECT student_id, SUM(total_score) as score FROM scores WHERE exam_id = ? GROUP BY student_id) s ON s.student_id = st.id
GROUP BY c.id, c.name
```

## 前端实现

### 新增/修改文件
| 文件 | 操作 | 说明 |
|------|------|------|
| `src/types/analysis.ts` | 修改 | `AnalysisView` 新增 `'score-segment'` |
| `src/services/analysis.ts` | 修改 | 新增 `getScoreSegment` 方法 |
| `src/hooks/useAnalysis.ts` | 修改 | 新增 `useScoreSegment` hook |
| `src/components/analysis/ScoreSegment.tsx` | 新增 | 主组件（配置面板 + 表格 + 图表） |
| `src/app/exams/[id]/page.tsx` | 修改 | `viewComponentMap` 注册新视图 |
| `src/components/layout/app-sidebar.tsx` | 修改 | 侧边栏新增「分数段分析」入口 |
| `package.json` | 修改 | 新增 `recharts` 依赖 |

### 组件结构
```
ScoreSegment
├── ScoreSegmentConfig（配置面板：规则列表 + 查询按钮）
├── ScoreSegmentTable（宽表：班级 × 分数段 × 人数/占比/贡献）
└── ScoreSegmentCharts
    ├── ClassStructureChart（纵向百分比堆叠柱状图）
    └── SegmentContributionChart（堆叠面积图）
```

### 计算逻辑
- 班内占比 = 该段人数 / 该班总人数 × 100%
- 年级贡献 = 该班该段人数 / 全年级该段总人数 × 100%

### 图表设计
- **班级内部结构图**：X=班级，Y=0-100%，纵向堆叠柱状图，每段不同颜色
- **分数段贡献图**：X=分数段（低到高），Y=人数，堆叠面积图展示各班分布

## 实现计划

1. 后端：Protobuf 定义 → 生成代码 → Service/Biz/Repo 实现
2. 前端：安装 recharts → 新增类型/服务/hook → 实现组件 → 注册路由和导航
