'use client'

import { TrendingUp } from 'lucide-react'
import { AnalysisModuleCard } from './AnalysisModuleCard'

interface ScoreFluctuationProps {
  examId: string
}

export function ScoreFluctuation({ examId }: ScoreFluctuationProps) {
  return (
    <AnalysisModuleCard
      title="成绩波动"
      subtitle="分析学生成绩的稳定性与变化趋势"
      variant="cyan"
    >
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
        <TrendingUp className="h-10 w-10 opacity-30" />
        <p className="text-sm">成绩波动分析功能开发中</p>
        <p className="text-xs opacity-60">将展示学生成绩的历史波动趋势图</p>
      </div>
    </AnalysisModuleCard>
  )
}
