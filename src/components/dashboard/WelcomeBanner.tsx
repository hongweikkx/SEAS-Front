'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'

// 根据当前小时返回时段问候(不含称呼)
function getGreeting(hour: number) {
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export function WelcomeBanner() {
  // SSR 和客户端首次渲染都用固定值，避免 hydration mismatch
  const [greeting, setGreeting] = useState('你好')

  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()))
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex flex-wrap items-baseline gap-x-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          <span>{greeting}!</span>
          <span>老师</span>
        </h1>
        <p className="mt-2 text-sm text-muted-foreground md:text-base max-w-2xl">
          考试成绩多维度分析,搭配 AI 智能分析,可以帮助您看清班级、学科与学生的真实表现。
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Button asChild className="rounded-lg gap-2">
          <Link href="/create">
            <Sparkles className="h-4 w-4" />
            快速开始新分析
          </Link>
        </Button>
      </div>
    </div>
  )
}
