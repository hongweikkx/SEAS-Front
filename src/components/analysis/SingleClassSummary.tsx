'use client'

import { useSingleClassSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { sortByClassName } from '@/utils/sort'
import { Loader2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { downloadWorkbook, sanitizeFilename } from '@/lib/export-utils'
import * as XLSX from 'xlsx'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
import { useTableSort } from '@/hooks/useTableSort'
import { SortableHeader } from '@/components/ui/sortable-header'

interface SingleClassSummaryProps {
  examId: string
}

export default function SingleClassSummary({ examId }: SingleClassSummaryProps) {
  const { selectedSubjectId, selectedSubjectName } = useAnalysisStore()
  const { data, isLoading } = useSingleClassSummary(examId, selectedSubjectId ?? undefined)
  const { sortState, toggleSort, sortedData } = useTableSort({
    defaultSort: { column: 'className', direction: 'asc' },
  })

  const sortedClasses = data?.classes
    ? sortedData(sortByClassName(data.classes))
    : []

  const handleExport = () => {
    if (!data) return

    const rows = []
    if (data.overall) {
      rows.push({
        班级: data.overall.className,
        参考人数: data.overall.totalStudents,
        满分: data.overall.fullScore,
        平均分: data.overall.avgScore,
        最高分: data.overall.highestScore,
        最低分: data.overall.lowestScore,
        离均差: '—',
        难度: data.overall.difficulty,
        标准差: data.overall.stdDev,
        区分度: data.overall.discrimination,
      })
    }
    sortedClasses.forEach((cls) => {
      rows.push({
        班级: cls.className,
        参考人数: cls.totalStudents,
        满分: cls.fullScore,
        平均分: cls.avgScore,
        最高分: cls.highestScore,
        最低分: cls.lowestScore,
        离均差: cls.scoreDeviation,
        难度: cls.difficulty,
        标准差: cls.stdDev,
        区分度: cls.discrimination,
      })
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '班级情况汇总')
    const examName = data.examName || '考试'
    const subjectName = data.subjectName || selectedSubjectName || '全科'
    downloadWorkbook(wb, `${sanitizeFilename(examName)}-${sanitizeFilename(subjectName)}-班级情况汇总.xlsx`)
  }

  const {
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
  } = useAnalysisStore()

  const handleClassClick = (classId: number, className: string) => {
    setDrillDownParam('classId', String(classId))
    pushDrillDown({
      view: 'single-class-question',
      label: `班级情况汇总${className}`,
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
            班级情况汇总
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <AIAnalysisTrigger view="single-class-summary" examId={examId} />
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
                <SortableHeader columnKey="className" label="班级" align="center" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <th className="py-3 px-5 text-center font-medium text-muted-foreground">参考人数</th>
                <th className="py-3 px-5 text-center font-medium text-muted-foreground">满分</th>
                <SortableHeader columnKey="avgScore" label="平均分" align="center" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <SortableHeader columnKey="highestScore" label="最高分" align="center" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <SortableHeader columnKey="lowestScore" label="最低分" align="center" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <SortableHeader columnKey="scoreDeviation" label="离均差" align="center" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <SortableHeader columnKey="difficulty" label="难度" align="center" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <SortableHeader columnKey="stdDev" label="标准差" align="center" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
                <SortableHeader columnKey="discrimination" label="区分度" align="center" sortState={sortState} onSort={toggleSort} className="py-3 px-5" />
              </tr>
            </thead>
            <tbody>
              {data?.overall && (
                <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                  <td className="py-3 px-5">{data.overall.className}</td>
                  <td className="py-3 px-5 text-center">{data.overall.totalStudents}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(data.overall.fullScore)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(data.overall.avgScore)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(data.overall.highestScore)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(data.overall.lowestScore)}</td>
                  <td className="py-3 px-5 text-center">—</td>
                  <td className="py-3 px-5 text-center">{formatNumber(data.overall.difficulty)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(data.overall.stdDev)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(data.overall.discrimination)}</td>
                </tr>
              )}
              {sortedClasses.map((cls) => (
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
                  <td className="py-3 px-5 text-center">{cls.totalStudents}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(cls.fullScore)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(cls.avgScore)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(cls.highestScore)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(cls.lowestScore)}</td>
                  <td className={cn(
                    'py-3 px-5 text-center font-medium',
                    cls.scoreDeviation >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {cls.scoreDeviation >= 0 ? '+' : ''}{formatNumber(cls.scoreDeviation)}
                  </td>
                  <td className="py-3 px-5 text-center">{formatNumber(cls.difficulty)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(cls.stdDev)}</td>
                  <td className="py-3 px-5 text-center">{formatNumber(cls.discrimination)}</td>
                </tr>
              ))}
              {(!data?.classes || data.classes.length === 0) && (
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
      <AIAnalysisPanel view="single-class-summary" examId={examId} />
    </div>
  )
}
