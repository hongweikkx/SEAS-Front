'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Calendar, Trash2, Users } from 'lucide-react'
import type { Exam } from '@/types'
import { formatDate } from '@/utils/format'
import { ExamTypeBadge } from './ExamTypeBadge'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

interface ExamCardProps {
  exam: Exam
  onDelete?: (examId: string) => void
  isDeleting?: boolean
}

export function ExamCard({ exam, onDelete, isDeleting }: ExamCardProps) {
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    onDelete?.(exam.id)
    setOpen(false)
  }

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-5 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md">
      <Link href={`/exams/${exam.id}`} className="flex flex-col gap-3">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h3 className="truncate text-base font-semibold text-foreground">{exam.name}</h3>
              <ExamTypeBadge name={exam.name} />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{formatDate(exam.examDate)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            <span>{exam.studentCount ?? '--'} 人</span>
          </div>
        </div>
      </Link>

      {/* 删除按钮 */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            onClick={handleTriggerClick}
            disabled={isDeleting}
            className="absolute top-4 right-4 rounded-lg p-1.5 text-muted-foreground/60 opacity-0 transition-all hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100 disabled:opacity-50"
            title="删除分析"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除「{exam.name}」吗？删除后将无法恢复，该考试的所有成绩数据也会被一并删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
