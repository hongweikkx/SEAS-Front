import { Upload, BarChart3, Bot, PieChart } from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
  iconColor: string;
}

function FeatureCard({ icon, title, description, gradient, iconColor }: FeatureCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl border border-border/60 bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-sm">
      {/* 背景渐变光斑 */}
      <div
        className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${gradient} opacity-60 blur-2xl transition-opacity group-hover:opacity-100`}
      />
      {/* 图标 */}
      <div
        className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br ${gradient}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      {/* 标题 */}
      <h3 className="mb-2 text-base font-semibold text-foreground">{title}</h3>
      {/* 描述 */}
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

const features = [
  {
    icon: <Upload className="h-5 w-5" />,
    title: "Excel 一键导入",
    description:
      "支持总分/小题分两种模式，自动创建学生、班级、学科关联，告别手动录入。",
    gradient: "from-blue-500/10 to-cyan-500/10",
    iconColor: "text-blue-500",
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "五维下钻分析",
    description:
      "从考试 → 学科 → 班级 → 题目 → 学生，层层定位教学薄弱点，精准施策。",
    gradient: "from-emerald-500/10 to-teal-500/10",
    iconColor: "text-emerald-500",
  },
  {
    icon: <Bot className="h-5 w-5" />,
    title: "AI 智能诊断",
    description:
      "基于实时数据生成学业诊断报告，内联链接可直接跳转查看详情，评语不用愁。",
    gradient: "from-violet-500/10 to-purple-500/10",
    iconColor: "text-violet-500",
  },
  {
    icon: <PieChart className="h-5 w-5" />,
    title: "图表自动生成",
    description:
      "优秀率、良好率、及格率、分数段分布等可视化图表，汇报展示直接可用。",
    gradient: "from-amber-500/10 to-orange-500/10",
    iconColor: "text-amber-500",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        {/* 标题区 */}
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">核心功能</h2>
          <p className="mt-3 text-base text-muted-foreground">
            覆盖成绩分析全流程，让数据为教学服务
          </p>
        </div>
        {/* 功能卡片网格 */}
        <div className="grid gap-5 sm:grid-cols-2">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
