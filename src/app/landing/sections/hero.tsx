import { ArrowDown, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";

export function Hero() {
  return (
    <section className="relative flex min-h-[80vh] flex-col items-center justify-center px-6 pt-14 text-center">
      {/* 背景装饰 */}
      <div className="absolute -top-40 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 flex flex-col items-center gap-6">
        {/* 徽章 */}
        <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span>Smart-Edu Analysis System</span>
        </div>

        {/* 标题 */}
        <h1 className="text-4xl font-bold leading-tight tracking-tight text-foreground md:text-6xl">
          让成绩分析
          <br />
          <span className="text-primary">从 3 小时变成 3 分钟</span>
        </h1>

        {/* 副标题 */}
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          SEAS 智能学业分析系统 —— 专为教师打造的成绩分析平台。Excel 一键导入，AI
          自动解读，多维度图表即刻生成。
        </p>

        {/* CTA 按钮 */}
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Button asChild size="lg">
            <a href="#workflow">免费使用</a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <a href="#features">
              了解功能
              <ArrowDown className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </div>
    </section>
  );
}
