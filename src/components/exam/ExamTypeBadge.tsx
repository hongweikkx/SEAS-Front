'use client'

import { cn } from '@/lib/utils'
import { detectExamType, examTypeColors } from '@/utils/format'

interface ExamTypeBadgeProps {
  name: string
  className?: string
}

export function ExamTypeBadge({ name, className }: ExamTypeBadgeProps) {
  const type = detectExamType(name)
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium',
        examTypeColors[type],
        className
      )}
    >
      {type}
    </span>
  )
}
