'use client'

import { useExams } from '@/hooks/useAnalysis'
import { formatDate } from '@/utils/format'
import Link from 'next/link'
import { ChevronRight, Loader2 } from 'lucide-react'

export default function ExamList() {
  const { data, isLoading, error } = useExams(1, 20)

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center" role="status" aria-label="加载中">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-destructive/30 bg-destructive/5">
        <p className="text-destructive">加载失败，请检查后端服务是否运行</p>
      </div>
    )
  }

  if (!data?.exams.length) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-border/70 bg-muted/20 text-sm text-muted-foreground">
        暂无可分析的考试数据
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {data?.exams.map((exam) => (
        <Link
          href={`/exams/${exam.id}`}
          key={exam.id}
          className="group rounded-xl border border-border/70 bg-card/70 px-4 py-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md dark:bg-card/40"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="truncate text-base font-medium text-foreground md:text-lg">{exam.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{formatDate(exam.examDate)}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
          </div>
        </Link>
      ))}
    </div>
  )
}

