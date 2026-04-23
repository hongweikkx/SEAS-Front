'use client'

interface SingleQuestionSummaryProps {
  examId: string
}

export default function SingleQuestionSummary({ examId }: SingleQuestionSummaryProps) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl border border-border/60 bg-card">
      <p className="text-sm text-muted-foreground">开发中...</p>
    </div>
  )
}
