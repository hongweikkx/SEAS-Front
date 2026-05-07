'use client'

import { useSingleQuestionClassCompare, useSingleQuestionSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
import QuestionCombobox from '@/components/analysis/QuestionCombobox'

interface SingleQuestionClassCompareProps {
  examId: string
}

export default function SingleQuestionClassCompare({ examId }: SingleQuestionClassCompareProps) {
  const {
    selectedSubjectId,
    drillDownParams,
    setDrillDownParam,
    setCurrentView,
    pushDrillDown,
    updateLastDrillDownLabel,
  } = useAnalysisStore()

  const { data: questionSummary } = useSingleQuestionSummary(examId, selectedSubjectId ?? undefined)
  const questionId = drillDownParams.questionId

  // 推断默认题号(侧边栏直接进入时可能缺失)
  const allQuestions = questionSummary?.questions || []
  const effectiveQuestionId = questionId || allQuestions[0]?.questionId
  const currentQuestion = allQuestions.find((q) => q.questionId === effectiveQuestionId)

  const { data, isLoading } = useSingleQuestionClassCompare(
    examId,
    selectedSubjectId ?? undefined,
    effectiveQuestionId
  )

  const handleQuestionChange = (newQuestionId: string, newQuestionNumber: string) => {
    setDrillDownParam('questionId', newQuestionId)
    updateLastDrillDownLabel(`试题班级对比 第${newQuestionNumber}题`)
  }

  const handleClassClick = (classId: number) => {
    const cid = classId === 0 ? 'all' : String(classId)
    setDrillDownParam('classId', cid)
    pushDrillDown({
      view: 'single-question-detail',
      label: `学生得分详情 第${currentQuestion?.questionNumber ?? ''}题`,
      params: {
        questionId: effectiveQuestionId,
        classId: cid,
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
            试题班级对比
          </h2>
        </div>
        <AIAnalysisTrigger view="single-question-class-compare" examId={examId} />
      </div>

      <QuestionCombobox
        questions={allQuestions.map((q) => ({ questionId: q.questionId, questionNumber: q.questionNumber }))}
        currentQuestionId={effectiveQuestionId}
        onChange={handleQuestionChange}
      />

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-4 text-left font-medium text-muted-foreground whitespace-nowrap">班级</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">参与人数</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">班级均分</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">得分率</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">与年级差距</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">班级排名</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">最高分</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">最低分</th>
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">标准差</th>
              </tr>
            </thead>
            <tbody>
              {data && (
                <>
                  {/* 全年级行 */}
                  <tr className="border-b border-border/60 bg-muted/20">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleClassClick(data.overall.classId)}
                        className="font-semibold text-foreground hover:text-primary hover:underline transition-colors"
                      >
                        全年级
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{data.overall.participants}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(data.overall.avgScore)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(data.overall.scoreRate)}%</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">—</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">—</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(data.overall.highestScore)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(data.overall.lowestScore)}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(data.overall.stdDev)}</td>
                  </tr>
                  {/* 班级行 */}
                  {data.classes.map((cls) => (
                    <tr
                      key={cls.classId}
                      className="border-b border-border/40 transition-colors hover:bg-muted/20"
                    >
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          onClick={() => handleClassClick(cls.classId)}
                          className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                        >
                          {cls.className}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">{cls.participants}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(cls.avgScore)}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(cls.scoreRate)}%</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {cls.scoreDiff === 0 ? (
                          '—'
                        ) : (
                          <span className={cn(cls.scoreDiff > 0 ? 'text-emerald-600' : 'text-red-600')}>
                            {cls.scoreDiff > 0 ? '+' : ''}{formatNumber(cls.scoreDiff)} {cls.scoreDiff > 0 ? '▲' : '▼'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        {cls.classRank !== null ? `${cls.classRank}/${cls.totalClasses}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(cls.highestScore)}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(cls.lowestScore)}</td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">{formatNumber(cls.stdDev)}</td>
                    </tr>
                  ))}
                </>
              )}
              {(!data || data.classes.length === 0) && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <AIAnalysisPanel view="single-question-class-compare" examId={examId} />
    </div>
  )
}
