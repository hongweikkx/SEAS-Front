import { Upload, BarChart3, FileText, ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "导入成绩",
    description: "上传 Excel 成绩表，系统自动识别学生、班级和学科信息",
  },
  {
    number: "02",
    icon: BarChart3,
    title: "查看分析",
    description: "多维图表即刻生成，支持从学科到题目的层层下钻",
  },
  {
    number: "03",
    icon: FileText,
    title: "获取报告",
    description: "AI 自动生成学业诊断，可直接用于家长会或教学总结",
  },
];

export function Workflow() {
  return (
    <section id="workflow" className="py-20 px-6">
      <div className="mx-auto max-w-5xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground">三步上手</h2>
          <p className="text-muted-foreground">无需培训，导入即用</p>
        </div>

        {/* Steps grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="relative flex flex-col items-center text-center"
            >
              {/* Arrow between steps (desktop only, not on last) */}
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-8 hidden -translate-x-1/2 md:block">
                  <ArrowRight className="h-6 w-6 text-muted-foreground/40" />
                </div>
              )}

              {/* Icon container */}
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-border/60 bg-card shadow-sm">
                <step.icon className="h-7 w-7 text-primary" />
              </div>

              {/* Step number */}
              <div className="mb-2 text-xs font-semibold text-primary">
                {step.number}
              </div>

              {/* Title */}
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {step.title}
              </h3>

              {/* Description */}
              <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
