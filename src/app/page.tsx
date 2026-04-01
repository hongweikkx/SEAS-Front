'use client'

import ExamList from '@/components/exam/ExamList'

export default function Home() {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur-sm md:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">考试列表</h2>
        </div>
      </div>
      <ExamList />
    </section>
  )
}
