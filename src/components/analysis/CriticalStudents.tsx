'use client'

import { AlertTriangle } from 'lucide-react'
import { AnalysisModuleCard } from './AnalysisModuleCard'

interface CriticalStudentsProps {
  examId: string
}

export function CriticalStudents({ examId }: CriticalStudentsProps) {
  return (
    <AnalysisModuleCard
      title="临界生分析"
      subtitle="识别处于关键分数段的学生群体"
      variant="purple"
    >
      <div className="flex h-48 flex-col items-center justify-center gap-3 text-muted-foreground">
        <AlertTriangle className="h-10 w-10 opacity-30" />
        <p className="text-sm">临界生分析功能开发中</p>
        <p className="text-xs opacity-60">将展示各分数段临界学生的详细名单与分析</p>
      </div>
    </AnalysisModuleCard>
  )
}
