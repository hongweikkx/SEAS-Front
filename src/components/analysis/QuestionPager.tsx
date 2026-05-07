'use client'

import { cn } from '@/lib/utils'

interface QuestionPagerProps {
  questions: Array<{ questionId: string; questionNumber: string }>
  currentQuestionId: string | undefined
  onChange: (questionId: string, questionNumber: string) => void
}

export default function QuestionPager({ questions, currentQuestionId, onChange }: QuestionPagerProps) {
  if (!questions || questions.length === 0) return null

  const currentIndex = questions.findIndex((q) => q.questionId === currentQuestionId)
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0

  // 显示窗口:当前题前后各5题,最多11个
  const windowSize = 5
  let start = Math.max(0, effectiveIndex - windowSize)
  let end = Math.min(questions.length, effectiveIndex + windowSize + 1)

  if (end - start < 11) {
    if (start === 0) {
      end = Math.min(questions.length, 11)
    } else if (end === questions.length) {
      start = Math.max(0, questions.length - 11)
    }
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <button
        onClick={() => {
          if (effectiveIndex > 0) {
            const q = questions[effectiveIndex - 1]
            onChange(q.questionId, q.questionNumber)
          }
        }}
        disabled={effectiveIndex <= 0}
        className={cn(
          'h-7 w-7 flex items-center justify-center rounded-md text-xs font-medium transition-all',
          effectiveIndex > 0
            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
            : 'bg-muted/40 text-muted-foreground/30 cursor-not-allowed'
        )}
      >
        ‹
      </button>
      {questions.slice(start, end).map((q) => (
        <button
          key={q.questionId}
          onClick={() => onChange(q.questionId, q.questionNumber)}
          className={cn(
            'h-7 min-w-7 px-1.5 flex items-center justify-center rounded-md text-xs font-medium transition-all',
            currentQuestionId === q.questionId
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {q.questionNumber}
        </button>
      ))}
      <button
        onClick={() => {
          if (effectiveIndex < questions.length - 1) {
            const q = questions[effectiveIndex + 1]
            onChange(q.questionId, q.questionNumber)
          }
        }}
        disabled={effectiveIndex >= questions.length - 1}
        className={cn(
          'h-7 w-7 flex items-center justify-center rounded-md text-xs font-medium transition-all',
          effectiveIndex < questions.length - 1
            ? 'bg-muted text-muted-foreground hover:bg-muted/80'
            : 'bg-muted/40 text-muted-foreground/30 cursor-not-allowed'
        )}
      >
        ›
      </button>
    </div>
  )
}
