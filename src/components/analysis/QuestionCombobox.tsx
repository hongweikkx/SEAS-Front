'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface QuestionComboboxProps {
  questions: Array<{ questionId: string; questionNumber: string }>
  currentQuestionId: string | undefined
  onChange: (questionId: string, questionNumber: string) => void
}

export default function QuestionCombobox({
  questions,
  currentQuestionId,
  onChange,
}: QuestionComboboxProps) {
  const [open, setOpen] = useState(false)
  const [invalid, setInvalid] = useState(false)

  if (!questions || questions.length === 0) return null

  const currentIndex = questions.findIndex((q) => q.questionId === currentQuestionId)
  const effectiveIndex = currentIndex >= 0 ? currentIndex : 0
  const currentQuestion = questions[effectiveIndex]

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLInputElement
      const trimmed = target.value.trim()
      if (!trimmed) {
        setOpen(false)
        return
      }
      const matched = questions.find((q) => q.questionNumber === trimmed)
      if (matched) {
        onChange(matched.questionId, matched.questionNumber)
        setInvalid(false)
        setOpen(false)
      }
    }
  }

  const handleSelect = (questionId: string, questionNumber: string) => {
    onChange(questionId, questionNumber)
    setOpen(false)
    setInvalid(false)
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-muted-foreground">题目:</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              'h-8 min-w-[80px] px-3 flex items-center justify-between gap-2 rounded-md text-sm font-medium transition-all border',
              invalid
                ? 'border-red-400 bg-red-50 text-red-700'
                : 'border-border bg-muted text-foreground hover:bg-muted/80'
            )}
          >
            <span>{currentQuestion?.questionNumber ?? ''}</span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              className={cn('transition-transform', open && 'rotate-180')}
            >
              <path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[160px] p-0" align="start">
          <Command>
            <CommandInput
              placeholder="输入题号..."
              onKeyDown={handleInputKeyDown}
            />
            <CommandList>
              <CommandEmpty>未找到该题号</CommandEmpty>
              <CommandGroup>
                {questions.map((q) => (
                  <CommandItem
                    key={q.questionId}
                    value={q.questionNumber}
                    onSelect={() => handleSelect(q.questionId, q.questionNumber)}
                    className={cn(
                      'cursor-pointer',
                      currentQuestionId === q.questionId && 'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    {q.questionNumber}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
