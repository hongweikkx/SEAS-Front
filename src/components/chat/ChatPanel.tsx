'use client'

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react'
import {
  BookOpen,
  Bot,
  Check,
  ChevronDown,
  GraduationCap,
  Loader2,
  MessageSquareDashed,
  SendHorizontal,
  User2,
  Wrench,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { ChatMessageContent } from '@/components/chat/ChatMessageContent'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { chatService } from '@/services/chat'
import { useAnalysisStore } from '@/store/analysisStore'
import { useExams, useSubjects } from '@/hooks/useAnalysis'
import { buildChatContext, chatQuickPrompts } from '@/utils/chatContext'
import type {
  A2UIMessage,
  A2UISurfaceView,
  ChatHistoryMessage,
  Exam,
  Subject,
} from '@/types'

type ConversationTurn = {
  id: string
  userContent: string
  assistantText: string
  assistantSurface?: A2UISurfaceView
}

function formatSelectionLabel(
  fallback: string,
  name: string | null | undefined,
  id: string | null | undefined
) {
  const trimmedName = name?.trim()
  if (trimmedName) {
    return trimmedName
  }

  if (id) {
    return `${fallback} ${id}`
  }

  return fallback
}

function createSurfaceView(surfaceId: string, rootComponentId: string, title?: string): A2UISurfaceView {
  return {
    surfaceId,
    rootComponentId,
    title,
    components: {},
    data: {},
    status: 'streaming',
  }
}

function createErrorSurface(surfaceId: string, message: string): A2UISurfaceView {
  const rootId = `${surfaceId}-error-root`
  const contentId = `${surfaceId}-error-content`

  return {
    surfaceId,
    rootComponentId: rootId,
    title: 'A2UI 渲染失败',
    components: {
      [rootId]: {
        id: rootId,
        type: 'card',
        props: {
          title: 'A2UI 渲染失败',
        },
        children: [contentId],
      },
      [contentId]: {
        id: contentId,
        type: 'text',
        props: {
          content: message,
        },
      },
    },
    data: {},
    status: 'error',
    error: message,
  }
}

function updateSurface(
  surface: A2UISurfaceView | undefined,
  message: A2UIMessage
): A2UISurfaceView | undefined {
  if (!surface) {
    if (message.beginRendering) {
      return createSurfaceView(
        message.beginRendering.surfaceId,
        message.beginRendering.rootComponentId,
        message.beginRendering.title
      )
    }
    return surface
  }

  let next = { ...surface }

  if (message.beginRendering) {
    next = {
      ...next,
      surfaceId: message.beginRendering.surfaceId,
      rootComponentId: message.beginRendering.rootComponentId,
      title: message.beginRendering.title ?? next.title,
      status: 'streaming',
    }
  }

  if (message.surfaceUpdate?.components?.length) {
    next = {
      ...next,
      components: {
        ...next.components,
        ...Object.fromEntries(message.surfaceUpdate.components.map((component) => [component.id, component])),
      },
    }
  }

  if (message.dataModelUpdate?.data) {
    next = {
      ...next,
      data: { ...next.data, ...message.dataModelUpdate.data },
    }
  }

  if (message.interruptRequest) {
    next = {
      ...next,
      status: 'interrupt',
      interruptRequest: message.interruptRequest,
    }
  }

  if (message.error) {
    next = {
      ...next,
      status: 'error',
      error: message.error.message,
    }
  }

  return next
}

async function readA2UIStream(
  response: Response,
  onMessage: (message: A2UIMessage) => void
) {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('响应缺少可读流')
  }

  const decoder = new TextDecoder()
  let buffer = ''

  const processBuffer = (input: string) => {
    const lines = input.split('\n')
    const remaining = lines.pop() ?? ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed.startsWith('data:')) {
        continue
      }

      const payload = trimmed.slice(5).trimStart()
      if (!payload) {
        continue
      }

      const message = JSON.parse(payload) as A2UIMessage
      onMessage(message)
    }

    return remaining
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }

    buffer += decoder.decode(value, { stream: true })
    buffer = processBuffer(buffer)
  }

  buffer += decoder.decode()
  if (buffer.trim().length > 0) {
    processBuffer(`${buffer}\n`)
  }
}

export default function ChatPanel({ className }: { className?: string }) {
  const [turns, setTurns] = useState<ConversationTurn[]>([])
  const [input, setInput] = useState('')
  const [isPending, setIsPending] = useState(false)
  const scrollAnchorRef = useRef<HTMLDivElement | null>(null)
  const examsQuery = useExams(1, 200)
  const {
    selectedExamId,
    selectedExamName,
    selectedSubjectId,
    selectedSubjectName,
    selectedScope,
    ratingConfig,
    setSelectedExamId,
    setSelectedExamName,
    setSelectedSubjectId,
    setSelectedSubjectName,
    setSelectedScope,
  } = useAnalysisStore()
  const subjectsQuery = useSubjects(selectedExamId ?? '', 1, 200)

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [turns, isPending])

  const context = useMemo(
    () =>
      buildChatContext({
        selectedExamId,
        selectedExamName,
        selectedSubjectId,
        selectedSubjectName,
        selectedScope,
        ratingConfig,
      }),
    [
      ratingConfig,
      selectedExamId,
      selectedExamName,
      selectedScope,
      selectedSubjectId,
      selectedSubjectName,
    ]
  )

  const quickPrompts = useMemo(() => chatQuickPrompts(context), [context])
  const examOptions = examsQuery.data?.exams ?? []
  const subjectOptions = subjectsQuery.data?.subjects ?? []
  const currentExamName = formatSelectionLabel('考试', selectedExamName, selectedExamId)
  const currentSubjectName =
    selectedScope === 'single_subject'
      ? formatSelectionLabel('学科', selectedSubjectName, selectedSubjectId)
      : '全科'

  const history = useMemo<ChatHistoryMessage[]>(
    () =>
      turns.flatMap((turn) => {
        const items: ChatHistoryMessage[] = [
          {
            role: 'user',
            content: turn.userContent,
          },
        ]

        if (turn.assistantText.trim().length > 0) {
          items.push({
            role: 'assistant',
            content: turn.assistantText,
          })
        }

        return items
      }),
    [turns]
  )

  function updateTurn(turnId: string, updater: (turn: ConversationTurn) => ConversationTurn) {
    setTurns((current) => current.map((turn) => (turn.id === turnId ? updater(turn) : turn)))
  }

  function selectExam(exam: Exam) {
    setSelectedExamId(exam.id)
    setSelectedExamName(exam.name)
    setSelectedSubjectId(null)
    setSelectedSubjectName(null)
    setSelectedScope('all_subjects')
  }

  function selectSubject(subject: Subject | null) {
    if (!subject) {
      setSelectedSubjectId(null)
      setSelectedSubjectName(null)
      setSelectedScope('all_subjects')
      return
    }

    setSelectedSubjectId(subject.id)
    setSelectedSubjectName(subject.name)
    setSelectedScope('single_subject')
  }

  function handleA2UIMessage(turnId: string, message: A2UIMessage) {
    updateTurn(turnId, (turn) => {
      const next = { ...turn }
      next.assistantSurface = updateSurface(next.assistantSurface, message)

      if (message.dataModelUpdate?.data && 'assistant.content' in message.dataModelUpdate.data) {
        const value = message.dataModelUpdate.data['assistant.content']
        next.assistantText = typeof value === 'string' ? value : String(value ?? '')
      }

      if (message.error && next.assistantSurface) {
        next.assistantSurface = {
          ...next.assistantSurface,
          status: 'error',
          error: message.error.message,
        }
      }

      if (message.interruptRequest && next.assistantSurface) {
        next.assistantSurface = {
          ...next.assistantSurface,
          status: 'interrupt',
          interruptRequest: message.interruptRequest,
        }
      }

      return next
    })
  }

  async function submitMessage(messageText: string) {
    const content = messageText.trim()
    if (!content || isPending) {
      return
    }

    const turnId = `turn-${Date.now()}`
    const requestHistory = history.filter((message) => message.content.trim().length > 0)

    setTurns((current) => [
      ...current,
      {
        id: turnId,
        userContent: content,
        assistantText: '',
      },
    ])
    setInput('')
    setIsPending(true)

    try {
      const response = await chatService.streamMessage({
        message: content,
        history: requestHistory,
        context,
      })

      await readA2UIStream(response, (message) => {
        handleA2UIMessage(turnId, message)
      })

      updateTurn(turnId, (turn) => ({
        ...turn,
        assistantSurface: turn.assistantSurface
          ? {
              ...turn.assistantSurface,
              status: turn.assistantSurface.status === 'interrupt' || turn.assistantSurface.status === 'error'
                ? turn.assistantSurface.status
                : 'done',
            }
          : turn.assistantSurface,
      }))
    } catch (error) {
      const description = error instanceof Error ? error.message : '聊天请求失败'
      setTurns((current) =>
        current.map((turn) =>
          turn.id === turnId
            ? {
                ...turn,
                assistantSurface: turn.assistantSurface
                  ? {
                      ...turn.assistantSurface,
                      status: 'error',
                      error: description,
                    }
                  : createErrorSurface(`${turnId}-error`, description),
              }
            : turn
        )
      )
    } finally {
      setIsPending(false)
    }
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
          <div>
            <h3 className="text-base font-semibold tracking-tight text-foreground">分析助手</h3>
          </div>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-border/60 bg-background/70 shadow-sm">
        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          {turns.length === 0 ? (
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

          {turns.map((turn) => (
            <div key={turn.id} className="space-y-3">
              <div className="flex w-full justify-end">
                <div className="max-w-[92%] rounded-2xl bg-primary px-4 py-3 text-primary-foreground md:max-w-[88%]">
                  <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                    <User2 className="h-3.5 w-3.5" />
                    <span>你</span>
                  </div>
                  <p className="whitespace-pre-wrap break-words text-[13px] leading-5">{turn.userContent}</p>
                </div>
              </div>

              <div className="flex w-full justify-start">
                <div
                  className={cn(
                    'w-full max-w-[92%] rounded-2xl border px-4 py-3 md:max-w-[88%]',
                    turn.assistantSurface?.status === 'error'
                      ? 'border-destructive/30 bg-destructive/5 text-destructive'
                      : turn.assistantSurface?.status === 'interrupt'
                        ? 'border-amber-500/30 bg-amber-500/5'
                        : 'border-border/70 bg-card/80'
                  )}
                >
                  <div className="mb-2 flex items-center gap-2 text-xs opacity-80">
                    <Bot className="h-3.5 w-3.5" />
                    <span>SEAS 助手</span>
                  </div>
                  {turn.assistantSurface ? (
                    <div className="max-w-none">
                      <ChatMessageContent surface={turn.assistantSurface} />
                    </div>
                  ) : isPending ? (
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-border/70 bg-card px-4 py-3 text-[13px] text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      正在接收 A2UI 流…
                    </div>
                  ) : (
                    <div className="text-[13px] leading-5 text-muted-foreground">等待助手输出</div>
                  )}

                  {turn.assistantSurface?.interruptRequest ? (
                    <div className="mt-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 px-4 py-3">
                      <div className="mb-2 text-sm font-medium text-amber-700 dark:text-amber-300">
                        需要确认的操作
                      </div>
                      {turn.assistantSurface.interruptRequest.prompt ? (
                        <p className="text-sm leading-6 text-amber-700/90 dark:text-amber-200/90">
                          {turn.assistantSurface.interruptRequest.prompt}
                        </p>
                      ) : null}
                      {turn.assistantSurface.interruptRequest.contexts?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {turn.assistantSurface.interruptRequest.contexts.map((context, index) => (
                            <span
                              key={`${context.id ?? 'interrupt'}-${index}`}
                              className="inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-background/80 px-3 py-1 text-xs text-amber-700 dark:text-amber-200"
                            >
                              <Wrench className="h-3 w-3" />
                              <span>{context.name || context.id || 'interrupt'}</span>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
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
          <div className="mb-3 flex flex-wrap gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-dashed"
                  disabled={isPending}
                >
                  <BookOpen className="h-4 w-4" />
                  {currentExamName}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>选择考试</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {examsQuery.isLoading ? (
                  <DropdownMenuItem disabled>正在加载考试列表…</DropdownMenuItem>
                ) : examOptions.length > 0 ? (
                  examOptions.map((exam) => (
                    <DropdownMenuItem key={exam.id} onSelect={() => selectExam(exam)}>
                      <span className="flex-1 truncate">{exam.name}</span>
                      {selectedExamId === exam.id ? <Check className="h-4 w-4" /> : null}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>暂无考试数据</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-full border-dashed"
                  disabled={isPending || !selectedExamId}
                >
                  <GraduationCap className="h-4 w-4" />
                  {currentSubjectName}
                  <ChevronDown className="h-4 w-4 opacity-70" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>选择学科</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => selectSubject(null)}>
                  <span className="flex-1 truncate">全科</span>
                  {selectedScope === 'all_subjects' ? <Check className="h-4 w-4" /> : null}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {subjectsQuery.isLoading ? (
                  <DropdownMenuItem disabled>正在加载学科列表…</DropdownMenuItem>
                ) : subjectOptions.length > 0 ? (
                  subjectOptions.map((subject) => (
                    <DropdownMenuItem key={subject.id} onSelect={() => selectSubject(subject)}>
                      <span className="flex-1 truncate">{subject.name}</span>
                      {selectedScope === 'single_subject' && selectedSubjectId === subject.id ? (
                        <Check className="h-4 w-4" />
                      ) : null}
                    </DropdownMenuItem>
                  ))
                ) : (
                  <DropdownMenuItem disabled>请先选择考试</DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="flex items-end gap-3">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="例如：帮我找出最近一次考试并概括各班平均分差异"
              className="min-h-28 min-w-0 flex-1 resize-y rounded-2xl border border-input bg-background px-4 py-3 text-sm leading-6 outline-none transition focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40"
              disabled={isPending}
            />
            <Button
              type="submit"
              size="lg"
              className="shrink-0 rounded-full px-5"
              disabled={isPending || input.trim().length === 0}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <SendHorizontal className="h-4 w-4" />}
              发送
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
