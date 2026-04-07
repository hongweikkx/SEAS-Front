# SEAS Frontend

**SEAS 智能教学系统前端应用**

基于 Next.js 构建的现代化 Web 应用，为 SEAS (Smart-Edu Agentic System) 提供可视化界面，支持成绩分析、数据可视化与 AI 智能对话功能。

## 🎯 核心功能

### 1. 考试管理
- 考试列表展示与筛选
- 考试详情查看
- 按日期排序与检索

### 2. 成绩分析
- **学科维度分析**：各科平均分、最高分、最低分、难度系数统计
- **班级维度分析**：班级整体表现、标准差、分数分布
- **四率分析**：优秀率、良好率、及格率、不及格率可视化图表

### 3. AI 智能对话
- 基于 LLM 的自然语言查询
- 支持流式响应
- 上下文感知对话
- 针对教育场景优化的提示词工程

### 4. 数据可视化
- 交互式图表展示（基于 Chart.js）
- 响应式布局设计
- 支持明暗主题切换

## 🏗️ 技术架构

### 前端框架
- **Next.js 16.2.1**：React 全栈框架，支持 App Router
- **React 19.2.4**：最新版本 React
- **TypeScript 5**：类型安全

### UI 组件库
- **shadcn/ui**：基于 Radix UI 的无样式组件库
- **Tailwind CSS 4**：原子化 CSS 框架
- **Lucide React**：图标库
- **next-themes**：主题切换支持

### 状态管理
- **Zustand**：轻量级状态管理
- **TanStack Query**：服务端状态管理与缓存
- **React Hook Form + Zod**：表单处理与验证

### 数据可视化
- **Chart.js + react-chartjs-2**：图表渲染
- **自定义图表组件**：学科汇总、班级分析、四率分布

### 网络请求
- **Axios**：HTTP 客户端
- **原生 Fetch API**：流式响应支持

### 工具库
- **date-fns**：日期处理
- **class-variance-authority**：样式变体管理

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── exams/[id]/        # 考试详情页面
│   ├── layout.tsx         # 根布局
│   ├── page.tsx           # 首页
│   └── providers.tsx      # 全局 Provider
├── components/            # React 组件
│   ├── analysis/          # 成绩分析组件
│   ├── chat/              # 聊天相关组件
│   ├── exam/              # 考试相关组件
│   ├── layout/            # 布局组件
│   └── ui/                # 基础 UI 组件 (shadcn/ui)
├── hooks/                 # 自定义 Hooks
├── services/              # API 服务层
├── store/                 # 状态管理
├── types/                 # TypeScript 类型定义
└── utils/                 # 工具函数
```

## 🚀 快速开始

### 环境要求
- Node.js 20+
- npm / yarn / pnpm

### 安装依赖
```bash
npm install
```

### 环境配置
创建 `.env.local` 文件：
```bash
# 后端 API 地址
NEXT_PUBLIC_API_URL=http://localhost:8000

# 聊天 API 地址（可选，默认为 NEXT_PUBLIC_API_URL + /chat）
NEXT_PUBLIC_CHAT_API_URL=http://localhost:8000/chat
```

### 启动开发服务器
```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本
```bash
npm run build
npm start
```

## 🔗 后端集成

本前端应用与 [SEAS Backend](../SEAS/) 紧密集成：

- **数据 API**：通过 `NEXT_PUBLIC_API_URL` 连接后端 MCP Server
- **聊天服务**：支持流式对话，调用后端 Agent 能力
- **类型安全**：前后端使用一致的 TypeScript 类型定义

## 🎨 设计特性

- **响应式设计**：适配桌面端和移动端
- **暗色模式**：支持系统主题切换
- **加载状态**：Skeleton 占位符优化体验
- **错误处理**：统一的错误提示机制
- **无障碍访问**：基于 Radix UI 的 ARIA 支持

## 📝 开发规范

- 使用 TypeScript 严格模式
- 组件命名采用 PascalCase
- 遵循 ESLint 配置规范
- Git 提交使用约定式提交规范

## 🔄 状态同步

前端通过以下方式保持数据同步：
- TanStack Query 自动缓存与失效
- Zustand 管理客户端分析状态
- WebSocket / SSE 支持实时更新（规划中）

## 📄 License

MIT

---

**相关项目**
- [SEAS Backend](https://github.com/hongweikkx/SEAS) - 后端服务
