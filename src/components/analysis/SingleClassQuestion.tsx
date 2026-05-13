'use client'

import { useSingleClassQuestion } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { useTableSort } from '@/hooks/useTableSort'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Loader2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { downloadWorkbook, sanitizeFilename } from '@/lib/export-utils'
import * as XLSX from 'xlsx'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'

interface SingleClassQuestionProps {
  examId: string
}

import { getDifficultyLevel, getDifficultyColor } from '@/utils/format'

export default function SingleClassQuestion({ examId }: SingleClassQuestionProps) {
  const { selectedSubjectId, drillDownParams } = useAnalysisStore()
  const classId = drillDownParams.classId ? Number(drillDownParams.classId) : undefined
  const { data, isLoading } = useSingleClassQuestion(
    examId,
    selectedSubjectId ?? undefined,
    classId
  )

  const { sortState, toggleSort, sortedData } = useTableSort({
    defaultSort: { column: 'questionNumber', direction: 'asc' },
  })

  const {
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const displayQuestions = data?.questions
    ? sortedData(
        [...data.questions].sort((a, b) =>
          a.questionNumber.localeCompare(b.questionNumber, undefined, { numeric: true })
        )
      )
    : []

  const handleQuestionClick = (questionId: string, questionNumber: string) => {
    setDrillDownParam('questionId', questionId)
    pushDrillDown({
      view: 'single-question-detail',
      label: `单科班级题目 ${questionNumber}`,
      params: {
        questionId,
        classId: String(classId),
        subjectId: selectedSubjectId || '',
      },
    })
    setCurrentView('single-question-detail')
  }

  const handleExport = () => {
    if (!data?.questions) return

    const rows = data.questions
      .slice()
      .sort((a, b) => a.questionNumber.localeCompare(b.questionNumber, undefined, { numeric: true }))
      .map((q) => ({
        题号: q.questionNumber,
        题型: q.questionType,
        分值: q.fullScore,
        班级均分: q.classAvgScore,
        得分率: `${q.scoreRate}%`,
        年级均分: q.gradeAvgScore,
        难度: q.difficulty,
      }))

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '题目分析')
    const examName = data.examName || '考试'
    const subjectName = data.subjectName || '全科'
    downloadWorkbook(wb, `${sanitizeFilename(examName)}-${sanitizeFilename(subjectName)}-题目分析.xlsx`)
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
        <div className="flex items-center gap-2">
          <AIAnalysisTrigger view="single-class-question" examId={examId} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={!data}
            className="h-8 w-8 p-0"
            title="导出Excel"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
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
                <SortableHeader columnKey="questionNumber" label="题号" align="left" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">分值</th>
                <SortableHeader columnKey="classAvgScore" label="班级均分" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <SortableHeader columnKey="scoreRate" label="得分率" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <SortableHeader columnKey="gradeAvgScore" label="年级均分" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <SortableHeader columnKey="difficulty" label="难度" align="center" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
              </tr>
            </thead>
            <tbody>
              {displayQuestions.map((q) => (
                <tr
                  key={q.questionId}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td className="py-3 px-5">
                    <button
                      onClick={() => handleQuestionClick(q.questionId, q.questionNumber)}
                      className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                    >
                      {q.questionNumber}
                    </button>
                  </td>
                  <td className="py-3 px-5 text-right">{q.fullScore}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(q.classAvgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(q.scoreRate)}%</td>
                  <td className="py-3 px-5 text-right">{formatNumber(q.gradeAvgScore)}</td>
                  <td className="py-3 px-5 text-center">
                    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium', getDifficultyColor(q.difficulty))}>
                      {getDifficultyLevel(q.difficulty)}
                    </span>
                  </td>
                </tr>
              ))}
              {(!data?.questions || data.questions.length === 0) && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
                    暂无数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
      <AIAnalysisPanel view="single-class-question" examId={examId} />
    </div>
  )
}
