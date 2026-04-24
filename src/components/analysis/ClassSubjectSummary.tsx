'use client'

import { useEffect } from 'react'
import { useClassSubjectSummary } from '@/hooks/useDrilldown'
import { useClassSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'

interface ClassSubjectSummaryProps {
  examId: string
}

export default function ClassSubjectSummary({ examId }: ClassSubjectSummaryProps) {
  const {
    drillDownParams,
    setDrillDownParam,
    pushDrillDown,
    updateLastDrillDownLabel,
    drillDownPath,
  } = useAnalysisStore()

  const classId = drillDownParams.classId ? Number(drillDownParams.classId) : undefined

  // 获取班级列表用于筛选
  const { data: classSummaryData } = useClassSummary(examId, 'all_subjects')


  // 如果没有 classId，默认选择第一个班级
  useEffect(() => {
    if (!classId && classSummaryData?.classDetails && classSummaryData.classDetails.length > 0) {
      const firstClassId = String(classSummaryData.classDetails[0].classId)
      setDrillDownParam('classId', firstClassId)
    }
  }, [classId, classSummaryData, setDrillDownParam])

  const { data, isLoading } = useClassSubjectSummary(examId, classId)

  const {
    setCurrentView,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
  } = useAnalysisStore()

  // 切换班级时更新参数和面包屑
  const handleClassChange = (newClassId: number, newClassName: string) => {
    setDrillDownParam('classId', String(newClassId))
    // 如果有下钻路径，更新最后一个节点的标签
    if (drillDownPath.length > 0) {
      updateLastDrillDownLabel(newClassName)
    } else {
      // 如果没有下钻路径（直接从侧边栏进入），添加一个
      pushDrillDown({
        view: 'class-subject-summary',
        label: newClassName,
        params: { classId: String(newClassId) },
      })
    }
  }

  const handleSubjectClick = (subjectId: string, subjectName: string) => {
    setSelectedScope('single_subject')
    setSelectedSubjectId(subjectId)
    setSelectedSubjectName(subjectName)
    setDrillDownParam('subjectId', subjectId)
    pushDrillDown({
      view: 'single-class-question',
      label: subjectName,
      params: { subjectId, classId: String(classId) },
    })
    setCurrentView('single-class-question')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">班级学科汇总</h2>
        </div>
        <AIAnalysisTrigger view="class-subject-summary" examId={examId} />
      </div>

      {/* 班级筛选器 */}
      {classSummaryData?.classDetails && classSummaryData.classDetails.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">筛选班级：</span>
          {classSummaryData.classDetails.map((cls) => (
            <button
              key={cls.classId}
              onClick={() => handleClassChange(cls.classId, cls.className)}
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

      <p className="text-xs text-muted-foreground">
        {data?.className || '选中班级'}各学科成绩与全年级对比
      </p>

      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
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
              {data?.overall && (
                <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                  <td className="py-3 px-5">{data.overall.subjectName}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.classAvgScore)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.gradeAvgScore)}</td>
                  <td className={cn(
                    'py-3 px-5 text-right',
                    (data.overall.scoreDiff || 0) >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}>
                    {(data.overall.scoreDiff || 0) >= 0 ? '+' : ''}{formatNumber(data.overall.scoreDiff)}
                  </td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.classHighest)}</td>
                  <td className="py-3 px-5 text-right">{formatNumber(data.overall.classLowest)}</td>
                  <td className="py-3 px-5 text-right">{data.overall.classRank}/{data.overall.totalClasses}</td>
                </tr>
              )}
              {data?.subjects.map((subject) => (
                <tr
                  key={subject.subjectId}
                  className="border-b border-border/40 transition-colors hover:bg-muted/20"
                >
                  <td className="py-3 px-5">
                    {subject.subjectId === 'overall' ? (
                      <span className="font-medium">{subject.subjectName}</span>
                    ) : (
                      <button
                        onClick={() => handleSubjectClick(subject.subjectId, subject.subjectName)}
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
              {(!data?.subjects || data.subjects.length === 0) && (
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
      <AIAnalysisPanel view="class-subject-summary" />
    </div>
  )
}
