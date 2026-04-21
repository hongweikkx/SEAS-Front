'use client'

import { useSubjects } from '@/hooks/useAnalysis'
import { useAnalysisStore, type AnalysisModule } from '@/store/analysisStore'
import { Separator } from '@/components/ui/separator'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AnalysisNavProps {
  examId: string
}

const allSubjectModules: { key: AnalysisModule; label: string }[] = [
  { key: 'subject-summary', label: '学科情况汇总' },
  { key: 'class-summary', label: '班级情况汇总' },
  { key: 'rating-analysis', label: '全科四率分析' },
]

const singleSubjectModules: { key: AnalysisModule; label: string }[] = [
  { key: 'class-summary', label: '班级情况汇总' },
  { key: 'rating-analysis', label: '单科四率分析' },
  { key: 'critical-students', label: '临界生分析' },
  { key: 'score-fluctuation', label: '成绩波动' },
]

export function AnalysisNav({ examId }: AnalysisNavProps) {
  const { data, isLoading } = useSubjects(examId, 1, 100)
  const {
    selectedScope,
    selectedSubjectId,
    activeAnalysisModule,
    setSelectedSubjectId,
    setSelectedSubjectName,
    setSelectedScope,
    setActiveAnalysisModule,
  } = useAnalysisStore()

  const modules = selectedScope === 'all_subjects' ? allSubjectModules : singleSubjectModules

  const handleSelectAll = () => {
    setSelectedScope('all_subjects')
    setSelectedSubjectId(null)
    setSelectedSubjectName(null)
    setActiveAnalysisModule('subject-summary')
  }

  const handleSelectSubject = (id: string, name: string) => {
    setSelectedScope('single_subject')
    setSelectedSubjectId(id)
    setSelectedSubjectName(name)
    setActiveAnalysisModule('class-summary')
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          分析视角
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={handleSelectAll}
            className={cn(
              'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
              selectedScope === 'all_subjects'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
            )}
          >
            全科
          </button>

          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}

          {data?.subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => handleSelectSubject(subject.id, subject.name)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                selectedScope === 'single_subject' && selectedSubjectId === subject.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {subject.name}
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border/60" />

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          分析维度
        </p>
        <div className="flex flex-wrap gap-1.5">
          {modules.map((module) => (
            <button
              key={module.key}
              onClick={() => setActiveAnalysisModule(module.key)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-sm font-medium transition-all',
                activeAnalysisModule === module.key
                  ? 'bg-[#1E3A8A] text-white shadow-sm dark:bg-[#1E3A8A]/90'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              )}
            >
              {module.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
