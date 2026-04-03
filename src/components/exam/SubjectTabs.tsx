'use client'

import { useSubjects } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

interface SubjectTabsProps {
  examId: string
}

export default function SubjectTabs({ examId }: SubjectTabsProps) {
  const { data, isLoading } = useSubjects(examId, 1, 100)
  const {
    selectedScope,
    selectedSubjectId,
    setSelectedSubjectId,
    setSelectedSubjectName,
    setSelectedScope,
  } = useAnalysisStore()

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {/* 全科按钮 */}
        <Button
          variant={selectedScope === 'all_subjects' ? 'default' : 'outline'}
          onClick={() => {
            setSelectedScope('all_subjects')
            setSelectedSubjectId(null)
            setSelectedSubjectName(null)
          }}
        >
          全科
        </Button>

        {/* 各科按钮 */}
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
        ) : (
          data?.subjects.map((subject) => (
            <Button
              key={subject.id}
              variant={
                selectedScope === 'single_subject' && selectedSubjectId === subject.id
                  ? 'default'
                  : 'outline'
              }
              onClick={() => {
                setSelectedScope('single_subject')
                setSelectedSubjectId(subject.id)
                setSelectedSubjectName(subject.name)
              }}
            >
              {subject.name}
            </Button>
          ))
        )}
      </div>
    </div>
  )
}
