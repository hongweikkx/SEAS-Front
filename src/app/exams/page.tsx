'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import ExamList from '@/components/exam/ExamList'

export default function ExamsPage() {
  const [keyword, setKeyword] = useState('')

  return (
    <div className="space-y-6">
      {/* 搜索框 */}
      <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-card/60 px-4 py-2.5 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="搜索考试名称..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
      </div>

      {/* 考试卡片列表 */}
      <ExamList keyword={keyword} />
    </div>
  )
}
