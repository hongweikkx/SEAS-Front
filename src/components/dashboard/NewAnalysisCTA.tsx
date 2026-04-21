'use client'

import Link from 'next/link'
import { Plus, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'

interface NewAnalysisCTAProps {
  variant?: 'large' | 'compact'
  className?: string
}

export function NewAnalysisCTA({ variant = 'large', className }: NewAnalysisCTAProps) {
  if (variant === 'compact') {
    return (
      <Link
        href="/create"
        className={cn(
          'flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:scale-[1.02] hover:shadow-primary/40 active:scale-[0.98]',
          className
        )}
      >
        <Plus className="h-4 w-4" />
        新建成绩分析
      </Link>
    )
  }

  return (
    <Link
      href="/create"
      className={cn(
        'group relative flex flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-primary/20 bg-card-blue p-8 text-center shadow-card-blue transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-primary/20 md:p-12',
        className
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-cyan-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-110">
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <div className="relative">
        <h3 className="text-xl font-bold text-foreground">新建成绩分析</h3>
        <p className="mt-1 text-sm text-muted-foreground">上传成绩文件，AI 自动生成分析报告</p>
      </div>
      <div className="relative mt-2 inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all group-hover:shadow-primary/40">
        <Plus className="h-4 w-4" />
        立即开始
      </div>
    </Link>
  )
}
