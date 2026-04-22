'use client'

import Link from 'next/link'
import { Sparkles, Play } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function WelcomeBanner() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          欢迎回来，智库专家
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base max-w-2xl">
          基于认知画布系统，您可以快速启动多维度的学业评估，发掘学生潜能并生成前瞻性建议。
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild className="rounded-lg gap-2">
          <Link href="/create">
            <Sparkles className="h-4 w-4" />
            快速开始新分析
          </Link>
        </Button>
        <Button variant="outline" className="rounded-lg gap-2">
          <Play className="h-4 w-4" />
          查看演示视频
        </Button>
      </div>
    </div>
  )
}
