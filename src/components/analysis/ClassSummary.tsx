'use client'

import { useClassSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ClassSummaryProps {
  examId: string
}

export default function ClassSummary({ examId }: ClassSummaryProps) {
  const { selectedScope, selectedSubjectId } = useAnalysisStore()
  const { data, isLoading } = useClassSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="h-5 w-1 rounded-full bg-primary" />
        <h2 className="text-lg font-semibold text-foreground">班级情况汇总</h2>
      </div>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {data?.classDetails.map((cls, index) => {
            const passRate = cls.difficulty ?? 0
            return (
              <div key={cls.classId} className="rounded-xl border border-border/60 bg-card p-5">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">{cls.className}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {index % 3 === 0 ? '实验班' : index % 3 === 1 ? '平行班' : '特色班'} / 班主任：{' '}
                      {['李建华', '王晓红', '陈明', '张丽', '刘强', '赵敏'][index % 6]}
                    </p>
                  </div>
                  <div className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium',
                    index % 3 === 0 ? 'bg-blue-100 text-blue-600' :
                    index % 3 === 1 ? 'bg-purple-100 text-purple-600' :
                    'bg-emerald-100 text-emerald-600'
                  )}>
                    {index + 1}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">平均分</span>
                    <span className="text-lg font-bold text-foreground">{formatNumber(cls.avgScore)}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">离均差</span>
                    <span className={cn(
                      'text-sm font-medium',
                      cls.scoreDeviation >= 0 ? 'text-emerald-600' : 'text-red-600'
                    )}>
                      {cls.scoreDeviation >= 0 ? '+' : ''}{formatNumber(cls.scoreDeviation)}
                    </span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm text-muted-foreground">达标率</span>
                      <span className="text-sm font-medium text-foreground">{formatNumber(passRate)}%</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          passRate >= 90 ? 'bg-emerald-500' :
                          passRate >= 80 ? 'bg-blue-500' :
                          passRate >= 70 ? 'bg-amber-500' : 'bg-red-500'
                        )}
                        style={{ width: `${Math.min(passRate, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          {(!data?.classDetails || data.classDetails.length === 0) && (
            <div className="col-span-3 py-8 text-center text-sm text-muted-foreground rounded-xl border border-border/60 bg-card">
              暂无班级数据
            </div>
          )}
        </div>
      )}
    </div>
  )
}
