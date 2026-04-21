'use client'

import Link from 'next/link'
import { Calendar, ChevronRight, Users } from 'lucide-react'
import type { Exam } from '@/types'
import { formatDate } from '@/utils/format'
import { ExamTypeBadge } from './ExamTypeBadge'

interface ExamCardProps {
  exam: Exam
}

export function ExamCard({ exam }: ExamCardProps) {
  return (
    <Link
      href={`/exams/${exam.id}`}
      className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-base font-semibold text-foreground">{exam.name}</h3>
            <ExamTypeBadge name={exam.name} />
          </div>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate(exam.examDate)}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>-- 人</span>
        </div>
      </div>
    </Link>
  )
}
