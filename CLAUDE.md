# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

SEAS 智能学业分析系统前端，基于 Next.js 16 + React 19 + TypeScript 构建，为教师提供考试成绩分析、数据可视化与 AI 智能对话功能。

## 常用命令

```bash
# 安装依赖
npm install

# 启动开发服务器（http://localhost:3000）
npm run dev

# 生产构建
npm run build

# 启动生产服务
npm start

# 代码检查
npm run lint
```

> **注意**：当前项目中没有配置测试运行器。UI 变更需在 `npm run dev` 中手动验证，API 变更需对照 `.env.local` 中配置的后端确认行为。

## 环境配置

创建 `.env.local`：

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000/seas/api/v1
```

## 技术栈与架构

### 核心框架
- **Next.js 16** App Router（`src/app`）
- **React 19** + React Compiler（`next.config.ts` 中 `reactCompiler: true`）
- **TypeScript** 严格模式，`@/*` 路径别名映射到 `src/*`
- **Tailwind CSS 4** + `tw-animate-css`，使用 CSS 变量主题系统
- **shadcn/ui**（`radix-nova` 风格），组件在 `src/components/ui`

### 状态管理
- **Zustand**：`src/store/analysisStore.ts` 是分析页面的中央状态仓库，管理考试选择、学科范围（全科/单科）、当前视图、下钻路径（`drillDownPath`）和参数（`drillDownParams`）
- **TanStack Query**：服务端状态缓存，默认 `staleTime: 5 * 60 * 1000`，`retry: 1`

### 数据层
- **API 客户端**：`src/services/api.ts` 基于 Axios，拦截器直接返回 `response.data`
- **服务分层**：
  - `analysisService`（`src/services/analysis.ts`）：考试列表、学科列表、学科汇总、班级汇总、四率分析 —— 调用真实后端 API
  - `drilldownService`（`src/services/drilldown.ts`）：班级学科汇总、单科班级汇总、单科班级题目、单科题目汇总、单科班级题目详情 —— **当前使用 Mock 数据**，延迟 300ms 模拟网络

### 路由结构

| 路由 | 功能 |
|------|------|
| `/` | 首页（Dashboard） |
| `/exams` | 考试列表 |
| `/exams/[id]` | 考试详情分析页（核心页面） |
| `/create` | 新建分析（文件上传） |
| `/login` | 登录页（微信扫码占位） |

### 布局体系
- `src/app/layout.tsx` → `Providers` → `DashboardShell`
- `DashboardShell`（`src/components/layout/dashboard-shell.tsx`）：固定 160px 左侧边栏 + 顶部 Header（面包屑/通知/头像）+ 主内容区。所有非 `/login` 页面均由此包裹
- `AppSidebar`（`src/components/layout/app-sidebar.tsx`）：主导航（首页/分析列表/新建分析）+ 考试详情页动态显示「分析维度」二级菜单

### 分析详情页架构（核心）

`src/app/exams/[id]/page.tsx` 是系统最核心的页面，采用**视图路由模式**：

1. **视图映射**：`viewComponentMap` 将 `AnalysisView` 枚举映射到 8 个分析组件：
   - `class-summary` → 班级情况汇总
   - `subject-summary` → 学科情况汇总
   - `rating-analysis` → 四率分析
   - `class-subject-summary` → 班级学科汇总
   - `single-class-summary` → 单科班级汇总
   - `single-class-question` → 单科班级题目
   - `single-question-summary` → 单科题目汇总
   - `single-question-detail` → 单科班级题目详情

2. **双范围模式**：页面顶部有「全科/单科」切换按钮。`selectedScope` 为 `all_subjects` 时侧边栏显示全科维度，`single_subject` 时显示单科维度

3. **URL 状态同步**：
   - 页面加载时从 URL 查询参数（`view`、`classId`、`subjectId`、`qId`）恢复到 Zustand store
   - store 状态变化时通过 `window.history.replaceState` 同步回 URL
   - 这意味着刷新页面或分享链接可保持当前分析视图

4. **下钻导航**：`BreadcrumbNav` 组件读取 `drillDownPath` 生成分层面包屑，支持点击回退到任意层级。组件内部通过 `pushDrillDown`/`popDrillDownTo` 管理路径栈

### 组件与样式规范
- 组件文件使用 PascalCase（如 `ExamList.tsx`），hooks 和工具使用 camelCase
- shadcn/ui 组件通过 `npx shadcn add <component>` 安装，存放在 `src/components/ui`
- 样式优先使用 Tailwind CSS 变量（如 `bg-primary`、`text-muted-foreground`），避免硬编码 Slate/Gray
- 全局自定义学术风配色变量定义在 `src/app/globals.css`（`--academic-deep-blue`、`--academic-cyan` 等）

## 类型定义

类型集中放在 `src/types/`：
- `exam.ts`：考试、学科基础类型
- `analysis.ts`：学科汇总、班级汇总、四率分布类型
- `drilldown.ts`：5 个下钻视图（视图3~7）的响应类型

## 开发注意事项

- **Mock 数据**：`drilldownService` 中所有下钻接口返回随机生成的 Mock 数据。如果后端已就绪，需要将这些方法替换为真实的 `apiClient.get` 调用
- **React Compiler**：项目已启用 React Compiler，编写组件时不需要过度使用 `useMemo`/`useCallback`
- **登录页特殊处理**：`Providers` 中通过 `usePathname` 判断当前是否为 `/login`，登录页不包裹 `DashboardShell`
- **侧边栏分析维度菜单**：仅在路径匹配 `/exams/[^/]+` 时显示，由 `AppSidebar` 内部通过正则判断
