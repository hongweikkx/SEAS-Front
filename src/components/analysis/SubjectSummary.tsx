'use client'

import { useSubjectSummary, useClassSummary } from '@/hooks/useAnalysis'
import { useClassSubjectSummary } from '@/hooks/useDrilldown'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'

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
  const { data: classSubjectData, isLoading: classSubjectLoading } = useClassSubjectSummary(examId, classId)

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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">学科情况汇总</h2>
        </div>
        <AIAnalysisTrigger view="subject-summary" examId={examId} />
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
          {classSummaryData.classDetails.map((cls) => (
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

      {classId && (
        <p className="text-xs text-muted-foreground">
          {classSubjectData?.className || '选中班级'}各学科成绩与全年级对比
        </p>
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
                    <th className="py-3 px-5 text-left font-medium text-muted-foreground">学科</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">参考人数</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">满分</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">平均分</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">最高分</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">最低分</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">离均差</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">难度</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">标准差</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">区分度</th>
                  </tr>
                </thead>
                <tbody>
                  {data?.overall && (
                    <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                      <td className="py-3 px-5">{data.overall.name}</td>
                      <td className="py-3 px-5 text-right">{data.overall.studentCount}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(data.overall.fullScore)}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(data.overall.avgScore)}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(data.overall.highestScore)}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(data.overall.lowestScore)}</td>
                      <td className="py-3 px-5 text-right">—</td>
                      <td className="py-3 px-5 text-right">{formatNumber(data.overall.difficulty)}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(data.overall.stdDev)}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(data.overall.discrimination)}</td>
                    </tr>
                  )}
                  {data?.subjects.map((subject) => (
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
                      <td className="py-3 px-5 text-right">{subject.studentCount}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(subject.fullScore)}</td>
                      <td className="py-3 px-5 text-right font-medium">{formatNumber(subject.avgScore)}</td>
                      <td className="py-3 px-5 text-right text-muted-foreground">{formatNumber(subject.highestScore)}</td>
                      <td className="py-3 px-5 text-right text-muted-foreground">{formatNumber(subject.lowestScore)}</td>
                      <td className={cn(
                        'py-3 px-5 text-right font-medium',
                        subject.scoreDeviation >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {subject.scoreDeviation >= 0 ? '+' : ''}{formatNumber(subject.scoreDeviation)}
                      </td>
                      <td className="py-3 px-5 text-right text-muted-foreground">{formatNumber(subject.difficulty)}</td>
                      <td className="py-3 px-5 text-right text-muted-foreground">{formatNumber(subject.stdDev)}</td>
                      <td className="py-3 px-5 text-right text-muted-foreground">{formatNumber(subject.discrimination)}</td>
                    </tr>
                  ))}
                  {(!data?.subjects || data.subjects.length === 0) && (
                    <tr>
                      <td colSpan={10} className="py-8 text-center text-sm text-muted-foreground">
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
                    <th className="py-3 px-5 text-left font-medium text-muted-foreground">学科</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级均分</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">年级均分</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">分差</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级最高</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级最低</th>
                    <th className="py-3 px-5 text-right font-medium text-muted-foreground">班级排名</th>
                  </tr>
                </thead>
                <tbody>
                  {classSubjectData?.overall && (
                    <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                      <td className="py-3 px-5">{classSubjectData.overall.subjectName}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(classSubjectData.overall.classAvgScore)}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(classSubjectData.overall.gradeAvgScore)}</td>
                      <td className={cn(
                        'py-3 px-5 text-right',
                        (classSubjectData.overall.scoreDiff || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {(classSubjectData.overall.scoreDiff || 0) >= 0 ? '+' : ''}{formatNumber(classSubjectData.overall.scoreDiff)}
                      </td>
                      <td className="py-3 px-5 text-right">{formatNumber(classSubjectData.overall.classHighest)}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(classSubjectData.overall.classLowest)}</td>
                      <td className="py-3 px-5 text-right">{classSubjectData.overall.classRank}/{classSubjectData.overall.totalClasses}</td>
                    </tr>
                  )}
                  {classSubjectData?.subjects.map((subject) => (
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
                      <td className="py-3 px-5 text-right">{formatNumber(subject.classAvgScore)}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(subject.gradeAvgScore)}</td>
                      <td className={cn(
                        'py-3 px-5 text-right font-medium',
                        subject.scoreDiff >= 0 ? 'text-emerald-600' : 'text-red-600'
                      )}>
                        {subject.scoreDiff >= 0 ? '+' : ''}{formatNumber(subject.scoreDiff)}
                      </td>
                      <td className="py-3 px-5 text-right">{formatNumber(subject.classHighest)}</td>
                      <td className="py-3 px-5 text-right">{formatNumber(subject.classLowest)}</td>
                      <td className="py-3 px-5 text-right">{subject.classRank}/{subject.totalClasses}</td>
                    </tr>
                  ))}
                  {(!classSubjectData?.subjects || classSubjectData.subjects.length === 0) && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-muted-foreground">
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
      <AIAnalysisPanel view="subject-summary" />
    </div>
  )
}
