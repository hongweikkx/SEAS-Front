'use client'

import { useSubjectSummary, useClassSummary } from '@/hooks/useAnalysis'
import { useClassSubjectSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { sortByClassName, sortBySubjectName, sortBySubjectItemName } from '@/utils/sort'
import { Loader2, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { downloadWorkbook, sanitizeFilename } from '@/lib/export-utils'
import * as XLSX from 'xlsx'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'
import { useTableSort } from '@/hooks/useTableSort'
import { SortableHeader } from '@/components/ui/sortable-header'

interface SubjectSummaryProps {
  examId: string
}

function getPerformanceTag(difficulty: number) {
  if (difficulty >= 0.75) return { label: '领先', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (difficulty >= 0.65) return { label: '稳步', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  if (difficulty >= 0.55) return { label: '持平', className: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: '预警', className: 'bg-red-50 text-red-700 border-red-200' }
}

export default function SubjectSummary({ examId }: SubjectSummaryProps) {
  const {
    selectedScope,
    selectedSubjectId,
    selectedSubjectName,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
    setCurrentView,
    setDrillDownParam,
    pushDrillDown,
    drillDownParams,
  } = useAnalysisStore()

  const classId = drillDownParams.classId ? Number(drillDownParams.classId) : undefined

  const { data, isLoading } = useSubjectSummary(examId, selectedScope, selectedSubjectId ?? undefined)
  const { data: classSummaryData } = useClassSummary(examId, 'all_subjects')
  const sortedClassDetails = classSummaryData?.classDetails ? sortByClassName(classSummaryData.classDetails) : []
  const { data: classSubjectData, isLoading: classSubjectLoading } = useClassSubjectSummary(examId, classId)

  const {
    sortState: gradeSortState,
    toggleSort: gradeToggleSort,
    sortedData: gradeSortedData,
  } = useTableSort({
    defaultSort: { column: 'name', direction: 'asc' },
  })

  const {
    sortState: classSortState,
    toggleSort: classToggleSort,
    sortedData: classSortedData,
  } = useTableSort({
    defaultSort: { column: 'subjectName', direction: 'asc' },
  })

  const handleSubjectClick = (subjectId: string, subjectName: string) => {
    setSelectedScope('single_subject')
    setSelectedSubjectId(subjectId)
    setSelectedSubjectName(subjectName)
    setDrillDownParam('subjectId', subjectId)
    pushDrillDown({
      view: 'single-class-summary',
      label: `全科学科情况汇总${subjectName}`,
      params: { subjectId },
    })
    setCurrentView('single-class-summary')
  }

  const handleClassSubjectClick = (subjectId: string, subjectName: string) => {
    setSelectedScope('single_subject')
    setSelectedSubjectId(subjectId)
    setSelectedSubjectName(subjectName)
    setDrillDownParam('subjectId', subjectId)
    pushDrillDown({
      view: 'single-question-summary',
      label: `全科学科情况汇总${subjectName}`,
      params: { subjectId, classId: String(classId) },
    })
    setCurrentView('single-question-summary')
  }

  const handleExport = () => {
    const rows = []

    if (!classId && data?.subjects) {
      // 全年级模式
      const sortedSubjects = sortBySubjectName(data.subjects)
      sortedSubjects.forEach((subject) => {
        rows.push({
          学科: subject.name,
          参考人数: subject.studentCount,
          满分: subject.fullScore,
          平均分: subject.avgScore,
          最高分: subject.highestScore,
          最低分: subject.lowestScore,
          难度: subject.difficulty,
          标准差: subject.stdDev,
          区分度: subject.discrimination,
        })
      })
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '学科情况汇总')
      const examName = data.examName || '考试'
      const subjectName = selectedSubjectName || '全科'
      downloadWorkbook(wb, `${sanitizeFilename(examName)}-${sanitizeFilename(subjectName)}-学科情况汇总.xlsx`)
    } else if (classId && classSubjectData?.subjects) {
      // 班级模式
      const sortedSubjects = sortBySubjectItemName(classSubjectData.subjects)
      sortedSubjects.forEach((subject) => {
        rows.push({
          学科: subject.subjectName,
          参考人数: subject.studentCount,
          满分: subject.fullScore,
          班级均分: subject.classAvgScore,
          年级均分: subject.gradeAvgScore,
          分差: subject.scoreDiff,
          班级最高: subject.classHighest,
          班级最低: subject.classLowest,
          难度: subject.difficulty,
          标准差: subject.stdDev,
          区分度: subject.discrimination,
          班级排名: `${subject.classRank}/${subject.totalClasses}`,
        })
      })
      const ws = XLSX.utils.json_to_sheet(rows)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '班级学科汇总')
      const examName = classSubjectData.examName || '考试'
      const subjectName = selectedSubjectName || '全科'
      const className = classSubjectData.className || ''
      downloadWorkbook(wb, `${sanitizeFilename(examName)}-${sanitizeFilename(subjectName)}-学科情况汇总-${sanitizeFilename(className)}.xlsx`)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">学科情况汇总</h2>
        </div>
        <div className="flex items-center gap-2">
          <AIAnalysisTrigger view="subject-summary" examId={examId} />
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExport}
            disabled={(!classId && !data) || (classId && !classSubjectData)}
            className="h-8 w-8 p-0"
            title="导出Excel"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 班级筛选器 */}
      {classSummaryData?.classDetails && classSummaryData.classDetails.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">筛选班级：</span>
          <button
            onClick={() => setDrillDownParam('classId', undefined)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              !classId
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            全年级
          </button>
          {sortedClassDetails.map((cls) => (
            <button
              key={cls.classId}
              onClick={() => setDrillDownParam('classId', String(cls.classId))}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                String(classId) === String(cls.classId)
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              {cls.className}
            </button>
          ))}
        </div>
      )}

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* 全年级模式 */}
        {!classId && (
          <>
            {isLoading && !data ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <SortableHeader columnKey="name" label="学科" align="center" sortState={gradeSortState} onSort={gradeToggleSort} className="py-3 px-5" />
                    <th className="py-3 px-5 text-center font-medium text-muted-foreground">参考人数</th>
                    <th className="py-3 px-5 text-center font-medium text-muted-foreground">满分</th>
                    <SortableHeader columnKey="avgScore" label="平均分" align="center" sortState={gradeSortState} onSort={gradeToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="highestScore" label="最高分" align="center" sortState={gradeSortState} onSort={gradeToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="lowestScore" label="最低分" align="center" sortState={gradeSortState} onSort={gradeToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="difficulty" label="难度" align="center" sortState={gradeSortState} onSort={gradeToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="stdDev" label="标准差" align="center" sortState={gradeSortState} onSort={gradeToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="discrimination" label="区分度" align="center" sortState={gradeSortState} onSort={gradeToggleSort} className="py-3 px-5" />
                  </tr>
                </thead>
                <tbody>
                  {(data?.subjects ? gradeSortedData(sortBySubjectName(data.subjects)) : []).map((subject) => (
                    <tr key={subject.id} className="border-b border-border/40 transition-colors hover:bg-muted/20">
                      <td className="py-3 px-5">
                        {selectedScope === 'all_subjects' ? (
                          <button
                            onClick={() => handleSubjectClick(subject.id, subject.name)}
                            className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                          >
                            {subject.name}
                          </button>
                        ) : (
                          <span className="font-medium text-foreground">{subject.name}</span>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">{subject.studentCount}</td>
                      <td className="py-3 px-5 text-center">{formatNumber(subject.fullScore)}</td>
                      <td className="py-3 px-5 text-center font-medium">{formatNumber(subject.avgScore)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.highestScore)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.lowestScore)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.difficulty)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.stdDev)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.discrimination)}</td>
                    </tr>
                  ))}
                  {(!data?.subjects || data.subjects.length === 0) && (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-sm text-muted-foreground">
                        暂无学科数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </>
        )}

        {/* 班级模式 */}
        {classId && (
          <>
            {classSubjectLoading && !classSubjectData ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <SortableHeader columnKey="subjectName" label="学科" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                    <th className="py-3 px-5 text-center font-medium text-muted-foreground">参考人数</th>
                    <th className="py-3 px-5 text-center font-medium text-muted-foreground">满分</th>
                    <SortableHeader columnKey="classAvgScore" label="班级均分" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="gradeAvgScore" label="年级均分" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="scoreDiff" label="分差" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="classHighest" label="班级最高" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="classLowest" label="班级最低" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="difficulty" label="难度" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="stdDev" label="标准差" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="discrimination" label="区分度" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                    <SortableHeader columnKey="classRank" label="班级排名" align="center" sortState={classSortState} onSort={classToggleSort} className="py-3 px-5" />
                  </tr>
                </thead>
                <tbody>
                  {classSubjectData?.overall && (
                    <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                      <td className="py-3 px-5">{classSubjectData.overall.subjectName}</td>
                      <td className="py-3 px-5 text-center">{classSubjectData.overall.studentCount}</td>
                      <td className="py-3 px-5 text-center">{formatNumber(classSubjectData.overall.fullScore)}</td>
                      <td className="py-3 px-5 text-center">{formatNumber(classSubjectData.overall.classAvgScore)}</td>
                      <td className="py-3 px-5 text-center">{formatNumber(classSubjectData.overall.gradeAvgScore)}</td>
                      <td className={cn(
                        'py-3 px-5 text-center',
                        (classSubjectData.overall.scoreDiff || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {(classSubjectData.overall.scoreDiff || 0) >= 0 ? '+' : ''}{formatNumber(classSubjectData.overall.scoreDiff)}
                      </td>
                      <td className="py-3 px-5 text-center">{formatNumber(classSubjectData.overall.classHighest)}</td>
                      <td className="py-3 px-5 text-center">{formatNumber(classSubjectData.overall.classLowest)}</td>
                      <td className="py-3 px-5 text-center">{formatNumber(classSubjectData.overall.difficulty)}</td>
                      <td className="py-3 px-5 text-center">{formatNumber(classSubjectData.overall.stdDev)}</td>
                      <td className="py-3 px-5 text-center">{formatNumber(classSubjectData.overall.discrimination)}</td>
                      <td className="py-3 px-5 text-center">{classSubjectData.overall.classRank}/{classSubjectData.overall.totalClasses}</td>
                    </tr>
                  )}
                  {(classSubjectData?.subjects ? classSortedData(sortBySubjectItemName(classSubjectData.subjects)) : []).map((subject) => (
                    <tr
                      key={subject.subjectId}
                      className="border-b border-border/40 transition-colors hover:bg-muted/20"
                    >
                      <td className="py-3 px-5">
                        {subject.subjectId === 'overall' ? (
                          <span className="font-medium">{subject.subjectName}</span>
                        ) : (
                          <button
                            onClick={() => handleClassSubjectClick(subject.subjectId, subject.subjectName)}
                            className="font-medium text-primary hover:text-primary/80 hover:underline transition-colors"
                          >
                            {subject.subjectName}
                          </button>
                        )}
                      </td>
                      <td className="py-3 px-5 text-center">{subject.studentCount}</td>
                      <td className="py-3 px-5 text-center">{formatNumber(subject.fullScore)}</td>
                      <td className="py-3 px-5 text-center font-medium">{formatNumber(subject.classAvgScore)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.gradeAvgScore)}</td>
                      <td className={cn(
                        'py-3 px-5 text-center font-medium',
                        subject.scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {subject.scoreDiff >= 0 ? '+' : ''}{formatNumber(subject.scoreDiff)}
                      </td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.classHighest)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.classLowest)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.difficulty)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.stdDev)}</td>
                      <td className="py-3 px-5 text-center text-muted-foreground">{formatNumber(subject.discrimination)}</td>
                      <td className="py-3 px-5 text-center">{subject.classRank}/{subject.totalClasses}</td>
                    </tr>
                  ))}
                  {(!classSubjectData?.subjects || classSubjectData.subjects.length === 0) && (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
      <AIAnalysisPanel view="subject-summary" examId={examId} />
    </div>
  )
}
