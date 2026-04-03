'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import {
  buildChatContext,
  chatContextHint,
  chatContextTitle,
} from '@/utils/chatContext'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Bot, Layers3, Sparkles, X } from 'lucide-react'

interface AnalysisContextBannerProps {
  compact?: boolean
  className?: string
}

export function AnalysisContextBanner({ compact = false, className }: AnalysisContextBannerProps) {
  const {
    selectedExamId,
    selectedExamName,
    selectedSubjectId,
    selectedSubjectName,
    selectedScope,
    ratingConfig,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
  } = useAnalysisStore()

  const context = buildChatContext({
    selectedExamId,
    selectedExamName,
    selectedSubjectId,
    selectedSubjectName,
    selectedScope,
    ratingConfig,
  })

  const hasExam = Boolean(selectedExamId)

  return (
    <div
      className={cn(
        'rounded-3xl border border-border/60 bg-gradient-to-br from-card/95 via-card/85 to-muted/20 shadow-sm',
        compact ? 'p-4' : 'p-5 md:p-6',
        className
      )}
    >
      <div className={cn('flex items-start justify-between gap-4', compact && 'flex-col')}>
        <div className="min-w-0">
          <div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5" />
            自然语言上下文
          </div>
          <h2 className={cn('truncate font-semibold tracking-tight text-foreground', compact ? 'text-base' : 'text-lg md:text-xl')}>
            {chatContextTitle(context)}
          </h2>
          <p className={cn('mt-1 text-muted-foreground', compact ? 'text-xs leading-5' : 'text-sm leading-6')}>
            {chatContextHint(context)}
          </p>
        </div>

        {context.scope === 'single_subject' ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              setSelectedScope('all_subjects')
              setSelectedSubjectId(null)
              setSelectedSubjectName(null)
            }}
          >
            <X className="h-3.5 w-3.5" />
            回到全科
          </Button>
        ) : (
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground">
            <Bot className="h-3.5 w-3.5" />
            {hasExam ? '当前是全科模式' : '当前是考试列表模式'}
          </div>
        )}
      </div>

      <div className={cn('mt-4 flex flex-wrap gap-2 text-xs', compact && 'mt-3')}>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
          <Layers3 className="h-3.5 w-3.5" />
          {context.scope === 'exam_list' ? '考试列表' : context.scope === 'single_subject' ? '单科' : '全科'}
        </span>
        {context.examName ? (
          <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-foreground">
            {context.examName}
          </span>
        ) : null}
        {context.subjectName ? (
          <span className="rounded-full border border-border/70 bg-background/80 px-3 py-1.5 text-foreground">
            {context.subjectName}
          </span>
        ) : null}
      </div>
    </div>
  )
}
