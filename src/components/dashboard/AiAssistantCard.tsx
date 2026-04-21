'use client'

import { MessageSquareHeart, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import ChatPanel from '@/components/chat/ChatPanel'

export function AiAssistantCard() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-violet-200 bg-card-purple p-6 shadow-card-purple md:p-8">
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-violet-200/20 blur-xl" />
      <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-violet-300/0 via-violet-400/30 to-cyan-300/0" />

      <div className="relative flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-lg font-semibold text-foreground">AI 智能助手</h3>
          </div>
          <p className="mt-2 text-muted-foreground">
            想聊聊这届学生吗？让 AI 帮您发现成绩背后的故事。
          </p>
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-violet-100/50 px-3 py-2 text-xs text-violet-800 dark:bg-violet-900/20 dark:text-violet-300">
            <span className="inline-flex h-2 w-2 animate-pulse rounded-full bg-violet-500" />
            AI 分析结果仅供参考，请结合实际情况判断
          </div>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button className="shrink-0 rounded-xl bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-500">
              <MessageSquareHeart className="mr-2 h-4 w-4" />
              开始对话
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>AI 分析助手</SheetTitle>
            </SheetHeader>
            <div className="mt-4 h-[calc(100%-3rem)]">
              <ChatPanel className="h-full rounded-xl border border-border/60" />
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  )
}
