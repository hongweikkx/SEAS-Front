'use client'

import { Search } from 'lucide-react'
import ExamList from '@/components/exam/ExamList'
import { NewAnalysisCTA } from '@/components/dashboard/NewAnalysisCTA'

export default function ExamsPage() {
  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">分析列表</h2>
          <p className="text-sm text-muted-foreground">管理您的所有成绩分析</p>
        </div>
        <NewAnalysisCTA variant="compact" />
      </div>

      {/* 搜索占位 */}
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 text-muted-foreground">
        <Search className="h-4 w-4" />
        <span className="text-sm">搜索考试名称...</span>
      </div>

      {/* 考试卡片列表 */}
      <ExamList />
    </div>
  )
}
