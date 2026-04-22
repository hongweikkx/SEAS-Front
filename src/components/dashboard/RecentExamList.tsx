'use client'

import Link from 'next/link'
import { Loader2, FileQuestion } from 'lucide-react'
import { useExams } from '@/hooks/useAnalysis'
import { ExamCard } from '@/components/exam/ExamCard'

export function RecentExamList() {
  const { data, isLoading, error } = useExams(1, 3)

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">最近分析</h3>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-muted/50" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">最近分析</h3>
        </div>
        <div className="flex h-48 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5">
          <p className="text-destructive">加载失败，请检查后端服务是否运行</p>
        </div>
      </div>
    )
  }

  if (!data?.exams.length) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">最近分析</h3>
        </div>
        <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 text-muted-foreground">
          <FileQuestion className="h-12 w-12 opacity-30" />
          <p className="mt-3 text-sm">暂无可分析的考试数据</p>
          <p className="mt-1 text-xs opacity-60">新建一个分析开始吧</p>
        </div>
      </div>
    )
  }

  const exams = data.exams.slice(0, 3)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">最近分析</h3>
        <Link
          href="/exams"
          className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
        >
          查看全部
          <span>→</span>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {exams.map((exam) => (
          <ExamCard key={exam.id} exam={exam} />
        ))}
      </div>
    </div>
  )
}
