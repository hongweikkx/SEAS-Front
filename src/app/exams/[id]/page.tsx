'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import SubjectSummary from '@/components/analysis/SubjectSummary'
import ClassSummary from '@/components/analysis/ClassSummary'
import RatingChart from '@/components/analysis/RatingChart'
import { use, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'
import { useSubjects } from '@/hooks/useAnalysis'
import { cn } from '@/lib/utils'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function ExamDetailPage({ params }: PageProps) {
  const {
    setSelectedExamId,
    activeAnalysisModule,
    setActiveAnalysisModule,
    selectedScope,
    selectedSubjectId,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
  } = useAnalysisStore()
  const { id: examId } = use(params)
  const { data: subjectsData } = useSubjects(examId, 1, 100)

  useEffect(() => {
    setSelectedExamId(examId)
  }, [examId, setSelectedExamId])

  // 单科模式下自动切换到可用模块
  useEffect(() => {
    if (selectedScope === 'single_subject' && activeAnalysisModule === 'subject-summary') {
      setActiveAnalysisModule('class-summary')
    }
  }, [selectedScope, activeAnalysisModule, setActiveAnalysisModule])

  const renderModule = () => {
    switch (activeAnalysisModule) {
      case 'subject-summary':
        return <SubjectSummary examId={examId} />
      case 'class-summary':
        return <ClassSummary examId={examId} />
      case 'rating-analysis':
        return <RatingChart examId={examId} />
      default:
        return <SubjectSummary examId={examId} />
    }
  }

  return (
    <div className="space-y-6">
      {/* 学科筛选 + 操作按钮 */}
      <div className="flex items-center justify-between gap-4">
        {/* 学科筛选 */}
        {subjectsData?.subjects && subjectsData.subjects.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedScope('all_subjects')
                setSelectedSubjectId(null)
                setSelectedSubjectName(null)
              }}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                selectedScope === 'all_subjects'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              )}
            >
              全科
            </button>
            {subjectsData.subjects.map((subject) => (
              <button
                key={subject.id}
                onClick={() => {
                  setSelectedScope('single_subject')
                  setSelectedSubjectId(subject.id)
                  setSelectedSubjectName(subject.name)
                }}
                className={cn(
                  'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  selectedScope === 'single_subject' && selectedSubjectId === subject.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {subject.name}
              </button>
            ))}
          </div>
        )}

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="outline" size="sm" className="rounded-lg gap-2">
            <Download className="h-4 w-4" />
            PDF
          </Button>
          <Button size="sm" className="rounded-lg gap-2">
            <Share2 className="h-4 w-4" />
            共享报告
          </Button>
        </div>
      </div>

      {/* 分析内容 */}
      {renderModule()}
    </div>
  )
}
