import { X, Check } from "lucide-react";

const comparisons = [
  {
    before: "手动录入成绩到表格，耗时易错",
    after: "Excel 一键导入，自动识别结构",
  },
  {
    before: "算平均分、排名、优秀率算到眼花",
    after: "13 项指标自动计算，图表秒出",
  },
  {
    before: "写评语、做分析报告写到半夜",
    after: "AI 一键生成诊断文本，可直接使用",
  },
];

export function PainPoints() {
  return (
    <section className="py-20 px-6">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground">告别繁琐，专注教学</h2>
          <p className="mt-3 text-lg text-muted-foreground">
            教师的时间应该花在学生身上，而不是表格里
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {comparisons.map((item, index) => (
            <div
              key={index}
              className="grid gap-4 rounded-xl border border-border/60 bg-card p-5 md:grid-cols-2 md:items-center md:gap-8 md:p-6"
            >
              {/* Before */}
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <p className="line-through text-muted-foreground">{item.before}</p>
              </div>

              {/* After */}
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                  <Check className="h-5 w-5 text-emerald-600" />
                </div>
                <p className="font-medium text-foreground">{item.after}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
