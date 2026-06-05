'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { isLoggedIn } from '@/services/auth'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// 根据当前小时返回时段问候(不含称呼)
function getGreeting(hour: number) {
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
}

export function WelcomeBanner() {
  const router = useRouter()
  const [greeting, setGreeting] = useState('你好')
  const [loginDialogOpen, setLoginDialogOpen] = useState(false)

  useEffect(() => {
    setGreeting(getGreeting(new Date().getHours()))
  }, [])

  const handleCreateClick = () => {
    if (!isLoggedIn()) {
      setLoginDialogOpen(true)
      return
    }
    router.push('/create')
  }

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
        <Button className="rounded-lg gap-2" onClick={handleCreateClick}>
          <Sparkles className="h-4 w-4" />
          快速开始新分析
        </Button>
      </div>

      {/* 未登录提示对话框 */}
      <AlertDialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>需要登录</AlertDialogTitle>
            <AlertDialogDescription>
              创建新的成绩分析需要先登录。登录后即可上传成绩文件并生成分析报告。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => router.push('/login?redirect=/create')}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              去登录
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
