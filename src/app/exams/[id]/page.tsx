'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import { AnalysisNav } from '@/components/analysis/AnalysisNav'
import SubjectSummary from '@/components/analysis/SubjectSummary'
import ClassSummary from '@/components/analysis/ClassSummary'
import RatingChart from '@/components/analysis/RatingChart'
import { CriticalStudents } from '@/components/analysis/CriticalStudents'
import { ScoreFluctuation } from '@/components/analysis/ScoreFluctuation'
import { use, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

export default function ExamDetailPage({ params }: PageProps) {
  const { setSelectedExamId, activeAnalysisModule, selectedScope } = useAnalysisStore()
  const { id: examId } = use(params)

  useEffect(() => {
    setSelectedExamId(examId)
  }, [examId, setSelectedExamId])

  const renderModule = () => {
    switch (activeAnalysisModule) {
      case 'subject-summary':
        return <SubjectSummary examId={examId} />
      case 'class-summary':
        return <ClassSummary examId={examId} />
      case 'rating-analysis':
        return <RatingChart examId={examId} />
      case 'critical-students':
        return <CriticalStudents examId={examId} />
      case 'score-fluctuation':
        return <ScoreFluctuation examId={examId} />
      default:
        return <SubjectSummary examId={examId} />
    }
  }

  const showDefaultModules = selectedScope === 'all_subjects'
    ? activeAnalysisModule === 'subject-summary'
    : activeAnalysisModule === 'class-summary'

  return (
    <div className="flex gap-6">
      <aside className="sticky top-24 h-fit w-56 shrink-0 space-y-4">
        <AnalysisNav examId={examId} />
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">分析报告</h2>
            <p className="text-sm text-muted-foreground">基于当前配置生成的多维分析</p>
          </div>
          <Button variant="outline" className="gap-2 rounded-xl">
            <Download className="h-4 w-4" />
            下载整体分析报告
          </Button>
        </div>

        {renderModule()}

        {showDefaultModules && (
          <>
            {selectedScope === 'all_subjects' && activeAnalysisModule === 'subject-summary' && (
              <>
                <ClassSummary examId={examId} />
                <RatingChart examId={examId} />
              </>
            )}
            {selectedScope === 'single_subject' && activeAnalysisModule === 'class-summary' && (
              <>
                <RatingChart examId={examId} />
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
