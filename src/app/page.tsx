'use client'

import ExamList from '@/components/exam/ExamList'

export default function Home() {
  return (
    <div className="flex w-full flex-col">
      <div className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm md:p-5">
        <ExamList />
      </div>
    </div>
  )
}
