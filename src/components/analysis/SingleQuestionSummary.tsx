'use client'

import { useSingleQuestionSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { sortByClassName } from '@/utils/sort'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'

interface SingleQuestionSummaryProps {
  examId: string
}


export default function SingleQuestionSummary({ examId }: SingleQuestionSummaryProps) {
  const { selectedSubjectId, drillDownParams, setDrillDownParam } = useAnalysisStore()
  const { data, isLoading } = useSingleQuestionSummary(examId, selectedSubjectId ?? undefined)
  const selectedClassId = drillDownParams.classId ?? 'all'

  const {
    setCurrentView,
    pushDrillDown,
  } = useAnalysisStore()

  const handleQuestionClick = (questionId: string, questionNumber: string) => {
    setDrillDownParam('questionId', questionId)
    pushDrillDown({
      view: 'single-question-class-compare',
      label: `试题班级对比 第${questionNumber}题`,
      params: {
        questionId,
        subjectId: selectedSubjectId || '',
      },
    })
    setCurrentView('single-question-class-compare')
  }

  // 从数据中提取班级列表
  const classList = data?.questions[0]?.classBreakdown ?? []
  const sortedClassList = sortByClassName(classList)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">试题分析</h2>
        </div>
        <AIAnalysisTrigger view="single-question-summary" examId={examId} />
      </div>

      {/* 班级刷选项 */}
      {classList.length > 0 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setDrillDownParam('classId', undefined)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              selectedClassId === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            全年级
          </button>
          {sortedClassList.map((cls) => (
            <button
              key={cls.classId}
              onClick={() => setDrillDownParam('classId', String(cls.classId))}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                selectedClassId === String(cls.classId)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {cls.className}
            </button>
          ))}
        </div>
      )}

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">题号</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">参考人数</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">满分</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">
                  {selectedClassId === 'all' ? '年级均分' : '班级均分'}
                </th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">最高分</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">最低分</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">得分率</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">难度</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">标准差</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">区分度</th>
              </tr>
            </thead>
            <tbody>
              {data?.questions
                .slice()
                .sort((a, b) => a.questionNumber.localeCompare(b.questionNumber, undefined, { numeric: true }))
                .map((q) => {
                const classBreakdown = selectedClassId === 'all'
                  ? null
                  : q.classBreakdown.find((c) => String(c.classId) === selectedClassId)
                const avgScore = classBreakdown?.avgScore ?? q.gradeAvgScore
                const participants = classBreakdown?.participants ?? q.participants
                const scoreRate = classBreakdown
                  ? parseFloat(((classBreakdown.avgScore / q.fullScore) * 100).toFixed(2))
                  : q.scoreRate
                const stdDev = classBreakdown?.stdDev ?? q.stdDev
                return (
                  <tr
                    key={q.questionId}
                    className="border-b border-border/40 transition-colors hover:bg-muted/20"
                  >
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleQuestionClick(q.questionId, q.questionNumber)}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        {q.questionNumber}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{participants}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{q.fullScore}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(avgScore)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(q.highestScore)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(q.lowestScore)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(scoreRate)}%</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(scoreRate)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(stdDev)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(q.discrimination)}</td>
                  </tr>
                )
              })}
              {(!data?.questions || data.questions.length === 0) && (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <AIAnalysisPanel view="single-question-summary" examId={examId} />
    </div>
  )
}
