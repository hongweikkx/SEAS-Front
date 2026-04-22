'use client'

import { Search } from 'lucide-react'
import ExamList from '@/components/exam/ExamList'

export default function ExamsPage() {
  return (
    <div className="space-y-6">
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
