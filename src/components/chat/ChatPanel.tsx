'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import { Bot, Loader2, MessageSquareDashed, SendHorizontal, User2, Wrench } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { chatService } from '@/services/chat'
import { cn } from '@/lib/utils'
import { ChatMessageContent } from '@/components/chat/ChatMessageContent'
import type { ChatHistoryMessage, ChatContentBlock, ChatResponse, ChatToolCall } from '@/types'

type ComposerMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  blocks?: ChatContentBlock[]
  toolCalls?: ChatToolCall[]
  error?: boolean
}

const quickPrompts = [
  '最近有哪些考试？',
  '帮我比较最近一次考试的班级表现',
  '列出某场考试涉及的学科',
]

export default function ChatPanel({ className }: { className?: string }) {
  const [messages, setMessages] = useState<ComposerMessage[]>([])
  const [input, setInput] = useState('')
  const [isPending, setIsPending] = useState(false)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages, isPending])

  const history = useMemo<ChatHistoryMessage[]>(
    () =>
      messages
        .filter((message) => !message.error)
        .map((message) => ({
          role: message.role,
          content: message.content,
        })),
    [messages]
  )

  async function submitMessage(messageText: string) {
    const content = messageText.trim()
    if (!content || isPending) {
      return
    }

    const userMessage: ComposerMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
    }

    const requestHistory = history.filter((message) => message.content.trim().length > 0)
    setMessages((current) => [...current, userMessage])
    setInput('')
    setIsPending(true)

    try {
      const response = await chatService.sendMessage({
        message: content,
        history: requestHistory,
      })

      appendAssistantResponse(response)
    } catch (error) {
      const description = error instanceof Error ? error.message : '聊天请求失败'
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          content: description,
          error: true,
        },
      ])
    } finally {
      setIsPending(false)
    }
  }

  function appendAssistantResponse(response: ChatResponse) {
    setMessages((current) => [
      ...current,
      {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: response.answer,
        blocks: response.blocks,
        toolCalls: response.toolCalls,
      },
    ])
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void submitMessage(input)
  }

  return (
    <div className={cn('flex h-full min-h-[38rem] flex-col gap-4', className)}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <MessageSquareDashed className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold tracking-tight text-foreground">分析助手</h3>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border/60 bg-background/70 shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="rounded-3xl border border-border/60 bg-card/70 p-4 shadow-sm">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-foreground">
                <Bot className="h-4 w-4 text-primary" />
                <span>示例问题</span>
              </div>
              <div className="space-y-2">
                {quickPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="block w-full rounded-2xl px-0 py-1.5 text-left text-sm leading-6 text-muted-foreground transition hover:text-foreground"
                    onClick={() => void submitMessage(prompt)}
                    disabled={isPending}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {messages.map((message) => (
            <div
              key={message.id}
              className={cn('flex w-full', message.role === 'user' ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[90%] rounded-2xl px-4 py-3 md:max-w-[82%]',
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : message.error
                      ? 'border border-destructive/30 bg-destructive/5 text-destructive'
                      : 'border border-border/70 bg-card/80'
                )}
              >
                <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                  {message.role === 'user' ? (
                    <>
                      <User2 className="h-3.5 w-3.5" />
                      <span>你</span>
                    </>
                  ) : (
                    <>
                      <Bot className="h-3.5 w-3.5" />
                      <span>SEAS 助手</span>
                    </>
                  )}
                </div>
                <ChatMessageContent content={message.content} blocks={message.blocks} />
                {message.toolCalls?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {message.toolCalls.map((toolCall, index) => (
                      <div
                        key={`${message.id}-${toolCall.name}-${index}`}
                        className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-muted/50 px-3 py-1 text-xs text-muted-foreground"
                      >
                        <Wrench className="h-3 w-3" />
                        <span>{toolCall.name}</span>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {isPending ? (
            <div className="flex justify-start">
              <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在调用后端聊天接口…
              </div>
            </div>
          ) : null}
          <div ref={scrollAnchorRef} />
        </div>

        <form onSubmit={handleSubmit} className="border-t border-border/60 bg-background/80 p-4">
          <label className="mb-2 block text-sm font-medium text-foreground">输入你的分析问题</label>
          <div className="flex flex-col gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="例如：帮我找出最近一次考试并概括各班平均分差异"
              className="min-h-28 w-full resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              disabled={isPending}
            />
            <div className="flex justify-end">
              <Button type="submit" size="lg" className="rounded-full px-5" disabled={isPending || input.trim().length === 0}>
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
                发送
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
