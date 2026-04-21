'use client'

import { BarChart3, TrendingUp, Users, CheckCircle } from 'lucide-react'
import { useExams } from '@/hooks/useAnalysis'
import Link from 'next/link'
import { formatDate } from '@/utils/format'

export function QuickStats() {
  const { data, isLoading } = useExams(1, 1)
  const latestExam = data?.exams[0]

  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
    )
  }

  if (!latestExam) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card/60 p-6 text-center text-muted-foreground">
        <BarChart3 className="mx-auto h-8 w-8 opacity-50" />
        <p className="mt-2">暂无分析数据，新建一个分析开始吧</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">最近一次分析</h3>
        <Link
          href={`/exams/${latestExam.id}`}
          className="text-sm font-medium text-primary hover:underline"
        >
          查看详情
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-cyan-200/60 bg-card-cyan p-5 shadow-card-cyan">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
              <CheckCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">及格率</p>
              <p className="text-2xl font-bold text-foreground">--</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-primary/10 bg-card-blue p-5 shadow-card-blue">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <TrendingUp className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">平均分波动</p>
              <p className="text-2xl font-bold text-foreground">--</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-200/60 bg-emerald-50/50 p-5 shadow-[0_4px_20px_-4px_rgba(16,185,129,0.2)]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">参与人数</p>
              <p className="text-2xl font-bold text-foreground">--</p>
            </div>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {latestExam.name} · {formatDate(latestExam.examDate)}
      </p>
    </div>
  )
}
