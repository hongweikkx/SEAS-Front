'use client'

import { Sparkles } from 'lucide-react'

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export function WelcomeBanner() {
  const greeting = getGreeting()

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/10 bg-card-blue p-6 shadow-card-blue md:p-8">
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-primary/5 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          <span>智能教学助手已就绪</span>
        </div>
        <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground md:text-3xl">
          老师，{greeting}。今天需要处理新的成绩数据吗？
        </h2>
        <p className="mt-2 text-muted-foreground">
          SEAS 将帮助您快速分析学生成绩，发现教学中的关键洞察。
        </p>
      </div>
    </div>
  )
}
