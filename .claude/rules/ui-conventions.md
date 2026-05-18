# UI 组件约定

## 数据表格规范

### 对齐方式
- **所有表格列必须居中对齐**，不分列类型
- `SortableHeader` 默认使用 `align="center"`
- 普通 `th` 使用 `text-center`
- 单元格 `td` 使用 `text-center`

### 排序
- 所有数据表格必须支持列排序，使用 `useTableSort` + `SortableHeader` 组合
- 默认排序方向通常是 `asc`（升序），按名称类字段排序

### 表格样式
- 容器：`rounded-xl border border-border/60 bg-card overflow-hidden`
- 表头：`border-b border-border/60 bg-muted/30`，文字 `font-medium text-muted-foreground`
- 数据行：`border-b border-border/40 transition-colors hover:bg-muted/20`
- 单元格内边距：标准表格 `py-3 px-5`，宽表格 `py-2.5 px-3` 或 `py-3 px-4`
- 空状态：`colSpan={N} className="py-8 text-center text-sm text-muted-foreground"`，文案统一为"暂无数据"

### 汇总行
- 年级/总体汇总行使用 `bg-primary/5 font-semibold`
- 无值时显示 `—`（em dash）

### 数字显示
- 所有数值使用 `formatNumber()` 格式化，保留最多 2 位小数
- 百分比带 `%` 符号
- 离均差/分差为正时显示 `+` 前缀

### 颜色语义
| 场景 | 颜色 |
|------|------|
| 高于平均 / 正向 | `text-emerald-600` |
| 低于平均 / 负向 | `text-red-600` |
| 难度"简单" | `text-emerald-600` |
| 难度"困难" | `text-destructive` |

## 页面头部规范

每个分析模块采用统一的头部结构：
```tsx
<div className="flex items-center justify-between">
  <div className="flex items-center gap-2">
    <div className="h-5 w-1 rounded-full bg-primary" />
    <h2 className="text-lg font-semibold text-foreground">标题</h2>
  </div>
  <div className="flex items-center gap-2">
    <AIAnalysisTrigger view="xxx" examId={examId} />
    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="导出Excel">
      <Download className="h-4 w-4" />
    </Button>
  </div>
</div>
```

## 加载状态
- 表格区域加载：`flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card`
- 加载图标：`<Loader2 className="h-8 w-8 animate-spin text-primary" />`

## 筛选器/标签样式
```tsx
// 选中
'rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-primary text-primary-foreground'
// 未选中
'rounded-lg px-3 py-1.5 text-xs font-medium transition-all bg-muted text-muted-foreground hover:bg-muted/80'
```

## 下钻链接
- 可点击跳转的文本使用 `<button>` 包裹（不是 `<a>`）
- 样式：`font-medium text-primary hover:text-primary/80 hover:underline transition-colors`
- 全年级/汇总行使用 `font-semibold text-foreground hover:text-primary hover:underline`

## 删除确认
- 使用 `AlertDialog` 组件
- 取消按钮：`variant="outline"`
- 删除按钮：`bg-destructive text-destructive-foreground`
- 删除中状态显示"删除中..."

## 导出功能
- 每个数据表格都配备 Excel 导出
- 使用 `xlsx` + `downloadWorkbook`（`@/lib/export-utils`）
- 文件名格式：`{考试名}-{学科}-分析名称.xlsx`

## AI 分析面板
- 每个分析视图底部都包含 `<AIAnalysisPanel view="xxx" examId={examId} />`

## 表单/输入
- Input 高度统一为 `h-8`
- 小型数字输入框宽度 `w-16` 或 `w-20`

## 空列表状态
```tsx
<div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 text-muted-foreground">
  <FileQuestion className="h-12 w-12 opacity-30" />
  <p className="mt-3 text-sm">暂无xxx</p>
  <p className="mt-1 text-xs opacity-60">提示操作</p>
</div>
```

## 难度标签
- 使用圆角胶囊样式：`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium`
- 配合 `getDifficultyColor()` 和 `getDifficultyLevel()` 工具函数
