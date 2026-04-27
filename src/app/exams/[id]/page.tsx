'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import SubjectSummary from '@/components/analysis/SubjectSummary'
import ClassSummary from '@/components/analysis/ClassSummary'
import RatingChart from '@/components/analysis/RatingChart'
import SingleClassSummary from '@/components/analysis/SingleClassSummary'
import SingleClassQuestion from '@/components/analysis/SingleClassQuestion'
import SingleQuestionSummary from '@/components/analysis/SingleQuestionSummary'
import SingleQuestionDetail from '@/components/analysis/SingleQuestionDetail'
import BreadcrumbNav from '@/components/analysis/BreadcrumbNav'
import { use, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Download, Share2 } from 'lucide-react'
import { useSubjects } from '@/hooks/useAnalysis'
import { cn } from '@/lib/utils'
import type { AnalysisView } from '@/types'

interface PageProps {
  params: Promise<{
    id: string
  }>
}

const viewComponentMap: Record<AnalysisView, React.ComponentType<{ examId: string }>> = {
  'class-summary': ClassSummary,
  'subject-summary': SubjectSummary,
  'rating-analysis': RatingChart,
  'single-class-summary': SingleClassSummary,
  'single-class-question': SingleClassQuestion,
  'single-question-summary': SingleQuestionSummary,
  'single-question-detail': SingleQuestionDetail,
}

export default function ExamDetailPage({ params }: PageProps) {
  const {
    setSelectedExamId,
    currentView,
    setCurrentView,
    selectedScope,
    selectedSubjectId,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
    drillDownParams,
    resetDrillDown,
  } = useAnalysisStore()
  const { id: examId } = use(params)
  const { data: subjectsData } = useSubjects(examId, 1, 100)

  useEffect(() => {
    setSelectedExamId(examId)
  }, [examId, setSelectedExamId])

  // Sync URL query param to store state on mount (intentionally run once)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const url = new URL(window.location.href)
    const viewParam = url.searchParams.get('view') as AnalysisView | null

    if (viewParam && viewParam !== currentView) {
      setCurrentView(viewParam)
    }

    const classId = url.searchParams.get('classId')
    const subjectId = url.searchParams.get('subjectId')
    const qId = url.searchParams.get('qId')

    if (classId) useAnalysisStore.getState().setDrillDownParam('classId', classId)
    if (subjectId) {
      useAnalysisStore.getState().setDrillDownParam('subjectId', subjectId)
      useAnalysisStore.getState().setSelectedSubjectId(subjectId)
      useAnalysisStore.getState().setSelectedScope('single_subject')
    }
    if (qId) useAnalysisStore.getState().setDrillDownParam('questionId', qId)
  }, [])

  // Sync store state to URL when it changes
  useEffect(() => {
    const url = new URL(window.location.href)
    url.searchParams.set('view', currentView)

    if (drillDownParams.classId) {
      url.searchParams.set('classId', drillDownParams.classId)
    } else {
      url.searchParams.delete('classId')
    }

    if (drillDownParams.subjectId) {
      url.searchParams.set('subjectId', drillDownParams.subjectId)
    } else {
      url.searchParams.delete('subjectId')
    }

    if (drillDownParams.questionId) {
      url.searchParams.set('qId', drillDownParams.questionId)
    } else {
      url.searchParams.delete('qId')
    }

    window.history.replaceState({}, '', url.toString())
  }, [currentView, drillDownParams])

  const renderModule = () => {
    const Component = viewComponentMap[currentView] || ClassSummary
    return <Component examId={examId} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        {subjectsData?.subjects && subjectsData.subjects.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSelectedScope('all_subjects')
                setSelectedSubjectId(null)
                setSelectedSubjectName(null)
                setCurrentView('class-summary')
                resetDrillDown()
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
                  setCurrentView('single-class-summary')
                  resetDrillDown()
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

      <BreadcrumbNav />

      {renderModule()}
    </div>
  )
}
