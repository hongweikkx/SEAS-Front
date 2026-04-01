'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import SubjectTabs from '@/components/exam/SubjectTabs'
import SubjectSummary from '@/components/analysis/SubjectSummary'
import ClassSummary from '@/components/analysis/ClassSummary'
import RatingChart from '@/components/analysis/RatingChart'
import React, { use, useEffect } from 'react'

interface PageProps {
  params: {
    id: string
  }
}

export default function ExamDetailPage({ params }: PageProps) {
  const { selectedExamId, setSelectedExamId } = useAnalysisStore()
  const { id: examId } = use(params as any) as { id: string }

  useEffect(() => {
    setSelectedExamId(examId)
  }, [examId, setSelectedExamId])

  return (
    <div className="w-full space-y-6">
      <SubjectTabs examId={examId} />

      <SubjectSummary examId={examId} />

      <ClassSummary examId={examId} />

      <RatingChart examId={examId} />
    </div>
  )
}
