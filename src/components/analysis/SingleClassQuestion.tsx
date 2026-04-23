'use client'

interface SingleClassQuestionProps {
  examId: string
}

export default function SingleClassQuestion({ examId }: SingleClassQuestionProps) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
      <p className="text-sm text-muted-foreground">开发中...</p>
    </div>
  )
}
