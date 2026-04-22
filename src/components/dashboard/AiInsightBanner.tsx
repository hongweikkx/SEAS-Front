'use client'

import { Atom } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AiInsightBanner() {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
          <Atom className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              <Atom className="h-3 w-3" />
              AI 智能洞察
            </span>
          </div>
          <h4 className="text-sm font-semibold text-foreground mb-1">
            系统发现：理科实验室参与度异常
          </h4>
          <p className="text-xs text-muted-foreground leading-relaxed">
            在最近的分析中，我们注意到高二(3)班的理科实验报告提交率下降了 15%，这可能与课程难度跨度或近期竞赛冲突有关。建议启动专项分析以验证原因。
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" className="rounded-lg">详情分析</Button>
          <Button size="sm" variant="outline" className="rounded-lg">忽略</Button>
        </div>
      </div>
    </div>
  )
}
