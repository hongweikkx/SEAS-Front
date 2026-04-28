'use client'

import { useExams } from '@/hooks/useAnalysis'
import { Loader2, FileQuestion } from 'lucide-react'
import { ExamCard } from './ExamCard'

interface ExamListProps {
  keyword?: string
}

export default function ExamList({ keyword }: ExamListProps) {
  const { data, isLoading, error } = useExams(1, 20, keyword)

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center" role="status" aria-label="加载中">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/5">
        <p className="text-destructive">加载失败，请检查后端服务是否运行</p>
      </div>
    )
  }

  if (!data?.exams.length) {
    return (
      <div className="flex h-64 flex-col items-center justify-center rounded-2xl border border-border/60 bg-card/60 text-muted-foreground">
        <FileQuestion className="h-12 w-12 opacity-30" />
        <p className="mt-3 text-sm">暂无可分析的考试数据</p>
        <p className="mt-1 text-xs opacity-60">新建一个分析开始吧</p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data?.exams.map((exam) => (
        <ExamCard key={exam.id} exam={exam} />
      ))}
    </div>
  )
}
