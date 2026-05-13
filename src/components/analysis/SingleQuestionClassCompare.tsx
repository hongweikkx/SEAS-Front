'use client'

import { useSingleQuestionClassCompare, useSingleQuestionSummary } from '@/hooks/useDrilldown'
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
import QuestionCombobox from '@/components/analysis/QuestionCombobox'

interface SingleQuestionClassCompareProps {
  examId: string
}

export default function SingleQuestionClassCompare({ examId }: SingleQuestionClassCompareProps) {
  const {
    selectedSubjectId,
    selectedSubjectName,
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

  const { sortState, toggleSort, sortedData } = useTableSort({
    defaultSort: { column: 'className', direction: 'asc' },
  })

  const sortedClasses = data?.classes ? sortedData(data.classes) : []

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

  const handleExport = () => {
    if (!data) return

    const rows = []
    rows.push({
      班级: '全年级',
      参与人数: data.overall.participants,
      班级均分: data.overall.avgScore,
      得分率: `${data.overall.scoreRate}%`,
      与年级差距: '—',
      班级排名: '—',
      最高分: data.overall.highestScore,
      最低分: data.overall.lowestScore,
      标准差: data.overall.stdDev,
    })
    data.classes.forEach((cls) => {
      rows.push({
        班级: cls.className,
        参与人数: cls.participants,
        班级均分: cls.avgScore,
        得分率: `${cls.scoreRate}%`,
        与年级差距: cls.scoreDiff,
        班级排名: cls.classRank !== null ? `${cls.classRank}/${cls.totalClasses}` : '—',
        最高分: cls.highestScore,
        最低分: cls.lowestScore,
        标准差: cls.stdDev,
      })
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '试题班级对比')
    const examName = data.examName || '考试'
    const subjectName = selectedSubjectName || '全科'
    const questionLabel = data.questionNumber ? `-第${data.questionNumber}题` : ''
    downloadWorkbook(wb, `${sanitizeFilename(examName)}-${sanitizeFilename(subjectName)}-试题班级对比${questionLabel}.xlsx`)
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
        <div className="flex items-center gap-2">
          <AIAnalysisTrigger view="single-question-class-compare" examId={examId} />
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
                <SortableHeader columnKey="className" label="班级" align="left" sortState={sortState} onSort={toggleSort} className="py-3 px-4" />
                <th className="py-3 px-4 text-right font-medium text-muted-foreground whitespace-nowrap">参与人数</th>
                <SortableHeader columnKey="avgScore" label="班级均分" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-4" />
                <SortableHeader columnKey="scoreRate" label="得分率" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-4" />
                <SortableHeader columnKey="scoreDiff" label="与年级差距" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-4" />
                <SortableHeader columnKey="classRank" label="班级排名" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-4" />
                <SortableHeader columnKey="highestScore" label="最高分" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-4" />
                <SortableHeader columnKey="lowestScore" label="最低分" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-4" />
                <SortableHeader columnKey="stdDev" label="标准差" align="right" sortState={sortState} onSort={toggleSort} className="py-3 px-4" />
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
                  {sortedClasses.map((cls) => (
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
