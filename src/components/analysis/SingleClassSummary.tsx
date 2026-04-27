'use client'

import { useSingleClassSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'

interface SingleClassSummaryProps {
  examId: string
}

export default function SingleClassSummary({ examId }: SingleClassSummaryProps) {
  const { selectedSubjectId } = useAnalysisStore()
  const { data, isLoading } = useSingleClassSummary(examId, selectedSubjectId ?? undefined)

  const {
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const handleClassClick = (classId: number, className: string) => {
    setDrillDownParam('classId', String(classId))
    pushDrillDown({
      view: 'single-class-question',
      label: `(${data?.subjectName || '单科'})班级情况汇总${className}`,
      params: { classId: String(classId), subjectId: selectedSubjectId || '' },
    })
    setCurrentView('single-class-question')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            ({data?.subjectName || '单科'})班级情况汇总
          </h2>
        </div>
        <AIAnalysisTrigger view="single-class-summary" examId={examId} />
      </div>
      <p className="text-xs text-muted-foreground">各班级该学科成绩对比</p>

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
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">该科均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">年级均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">分差</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级排名</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">及格率</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">优秀率</th>
              </tr>
            </thead>
            <tbody>
              {data?.overall && (
                <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                  <td className="py-3 px-5">{data.overall.className}</td>
                  <td className="py-3 px-5 text-right">{data.overall.totalStudents}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.subjectAvgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.gradeAvgScore)}</td>
                  <td className="py-3 px-5 text-right">—</td>
                  <td className="py-3 px-5 text-right">—</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.passRate)}%</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.excellentRate)}%</td>
                </tr>
              )}
              {data?.classes.map((cls) => (
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
                  <td className="py-3 px-5 text-right">{formatNumber(cls.subjectAvgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.gradeAvgScore)}</td>
                  <td className={cn(
                    'py-3 px-5 text-right font-medium',
                    cls.scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {cls.scoreDiff >= 0 ? '+' : ''}{formatNumber(cls.scoreDiff)}
                  </td>
                  <td className="py-3 px-5 text-right">{cls.classRank}/{cls.totalClasses}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.passRate)}%</td>
                  <td className="py-3 px-5 text-right">{formatNumber(cls.excellentRate)}%</td>
                </tr>
              ))}
              {(!data?.classes || data.classes.length === 0) && (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <AIAnalysisPanel view="single-class-summary" />
    </div>
  )
}
