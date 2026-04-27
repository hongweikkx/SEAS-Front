'use client'

import { useClassSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'

interface ClassSummaryProps {
  examId: string
}

export default function ClassSummary({ examId }: ClassSummaryProps) {
  const { selectedScope, selectedSubjectId } = useAnalysisStore()
  const { data, isLoading } = useClassSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  const {
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const handleClassClick = (classId: number, className: string) => {
    setDrillDownParam('classId', String(classId))
    pushDrillDown({
      view: 'subject-summary',
      label: `全科班级情况汇总${className}`,
      params: { classId: String(classId) },
    })
    setCurrentView('subject-summary')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">班级情况汇总</h2>
        </div>
        <AIAnalysisTrigger view="class-summary" examId={examId} />
      </div>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">班级</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">人数</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">平均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">最高分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">最低分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">离均差</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">标准差</th>
              </tr>
            </thead>
            <tbody>
              {data?.overallGrade && (
                <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                  <td className="py-3 px-5">{data.overallGrade.className}</td>
                  <td className="py-3 px-5 text-right">{data.overallGrade.totalStudents}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.highestScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.lowestScore)}</td>
                  <td className="py-3 px-5 text-right">—</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overallGrade.stdDev)}</td>
                </tr>
              )}
              {data?.classDetails.map((cls) => (
                <tr
                  key={cls.classId}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td className="py-3 px-5">
                    <button
                      onClick={() => handleClassClick(cls.classId, cls.className)}
                      className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      {cls.className}
                    </button>
                  </td>
                  <td className="py-3 px-5 text-right">{cls.totalStudents}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.avgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.highestScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.lowestScore)}</td>
                  <td className={cn(
                    'py-3 px-5 text-right font-medium',
                    cls.scoreDeviation >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {cls.scoreDeviation >= 0 ? '+' : ''}{formatNumber(cls.scoreDeviation)}
                  </td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.stdDev)}</td>
                </tr>
              ))}
              {(!data?.classDetails || data.classDetails.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    暂无班级数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <AIAnalysisPanel view="class-summary" />
    </div>
  )
}
