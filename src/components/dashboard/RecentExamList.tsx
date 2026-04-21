'use client'

import { Clock } from 'lucide-react'
import Link from 'next/link'
import { useExams } from '@/hooks/useAnalysis'
import { formatDate } from '@/utils/format'
import { ExamTypeBadge } from '@/components/exam/ExamTypeBadge'

export function RecentExamList() {
  const { data, isLoading } = useExams(1, 5)

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-foreground">最近分析</h3>
        <div className="h-40 animate-pulse rounded-2xl bg-muted/50" />
      </div>
    )
  }

  if (!data?.exams.length) {
    return null
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Clock className="h-5 w-5 text-muted-foreground" />
        <h3 className="text-lg font-semibold text-foreground">最近分析</h3>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {data.exams.slice(0, 4).map((exam) => (
          <Link
            href={`/exams/${exam.id}`}
            key={exam.id}
            className="group flex items-center justify-between rounded-xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="truncate text-sm font-medium text-foreground">{exam.name}</p>
                <ExamTypeBadge name={exam.name} />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{formatDate(exam.examDate)}</p>
            </div>
            <div className="shrink-0 text-xs text-muted-foreground">查看</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
