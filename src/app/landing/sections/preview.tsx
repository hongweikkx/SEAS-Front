export function Preview() {
  const screenshots = [
    {
      title: "考试列表",
      description: "统一管理所有考试，支持按时间筛选与检索",
      placeholder: "考试列表界面",
    },
    {
      title: "学科汇总",
      description: "各科平均分、难度系数一目了然",
      placeholder: "学科汇总分析",
    },
    {
      title: "班级分析",
      description: "班级整体表现、标准差、分数分布",
      placeholder: "班级汇总表格",
    },
    {
      title: "四率分析",
      description: "优秀/良好/及格/低分率可视化图表",
      placeholder: "四率分析图表",
    },
    {
      title: "AI 对话",
      description: "自然语言查询，流式响应",
      placeholder: "AI 智能对话",
    },
    {
      title: "题目详情",
      description: "学生得分明细、班级排名对比",
      placeholder: "题目详情页面",
    },
  ];

  return (
    <section id="preview" className="py-20 px-6">
      <div className="mx-auto max-w-6xl">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            界面预览
          </h2>
          <p className="mt-3 text-base text-muted-foreground">
            简洁直观的设计，让数据清晰呈现
          </p>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {screenshots.map((item) => (
            <div
              key={item.title}
              className="group overflow-hidden rounded-xl border border-border/60 bg-card transition-all hover:border-primary/40 hover:shadow-sm"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-muted/50">
                <div className="flex h-full items-center justify-center">
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-12 w-12 rounded-lg border-2 border-dashed border-muted-foreground/30" />
                    <span className="text-xs text-muted-foreground">
                      {item.placeholder}
                    </span>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="p-4">
                <h3 className="text-sm font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {item.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          提示：实现后请将截图放入 public/landing/screenshots/ 目录并替换占位区域
        </p>
      </div>
    </section>
  );
}
