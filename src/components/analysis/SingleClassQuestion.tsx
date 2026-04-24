'use client'

import { useSingleClassQuestion } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'

interface SingleClassQuestionProps {
  examId: string
}

import { difficultyLabel } from '@/utils/format'

export default function SingleClassQuestion({ examId }: SingleClassQuestionProps) {
  const { selectedSubjectId, drillDownParams } = useAnalysisStore()
  const classId = drillDownParams.classId ? Number(drillDownParams.classId) : undefined
  const { data, isLoading } = useSingleClassQuestion(
    examId,
    selectedSubjectId ?? undefined,
    classId
  )

  const {
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const handleQuestionClick = (questionId: string, questionNumber: string) => {
    setDrillDownParam('questionId', questionId)
    pushDrillDown({
      view: 'single-question-detail',
      label: `第${questionNumber}题`,
      params: {
        questionId,
        classId: String(classId),
        subjectId: selectedSubjectId || '',
      },
    })
    setCurrentView('single-question-detail')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">
            {data?.className || '班级'} {data?.subjectName || '学科'} — 题目分析
          </h2>
        </div>
        <AIAnalysisTrigger view="single-class-question" examId={examId} />
      </div>
      <p className="text-xs text-muted-foreground">各题目得分情况与年级对比</p>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">题号</th>
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">题型</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">分值</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">得分率</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">年级均分</th>
                <th className="py-3 px-5 text-center font-medium text-muted-foreground">难度</th>
              </tr>
            </thead>
            <tbody>
              {data?.questions.map((q) => {
                const diff = difficultyLabel[q.difficulty] || difficultyLabel.medium
                return (
                  <tr
                    key={q.questionId}
                    className="border-b border-border/40 transition-colors hover:bg-muted/20"
                  >
                    <td className="py-3 px-5">
                      <button
                        onClick={() => handleQuestionClick(q.questionId, q.questionNumber)}
                        className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                      >
                        第{q.questionNumber}题
                      </button>
                    </td>
                    <td className="py-3 px-5">{q.questionType}</td>
                    <td className="py-3 px-5 text-right">{q.fullScore}</td>
                    <td className="py-3 px-5 text-right">{formatNumber(q.classAvgScore)}</td>
                    <td className="py-3 px-5 text-right">{formatNumber(q.scoreRate)}%</td>
                    <td className="py-3 px-5 text-right">{formatNumber(q.gradeAvgScore)}</td>
                    <td className="py-3 px-5 text-center">
                      <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', diff.className)}>
                        {diff.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {(!data?.questions || data.questions.length === 0) && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <AIAnalysisPanel view="single-class-question" />
    </div>
  )
}
