'use client'

import { Upload, Settings, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CreateProgressProps {
  currentStep: 1 | 2 | 3
}

const steps = [
  { label: '文件投喂', icon: Upload, description: '上传成绩文件' },
  { label: '字段校准', icon: Settings, description: '确认字段映射' },
  { label: 'AI 智能分析', icon: Sparkles, description: '生成分析报告' },
]

export function CreateProgress({ currentStep }: CreateProgressProps) {
  return (
    <div className="flex items-center justify-center gap-2 md:gap-4">
      {steps.map((step, index) => {
        const stepNum = index + 1
        const isActive = stepNum === currentStep
        const isCompleted = stepNum < currentStep
        const Icon = step.icon

        return (
          <div key={step.label} className="flex items-center gap-2 md:gap-4">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-xl transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : isCompleted
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                      : 'bg-muted text-muted-foreground'
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div className="text-center">
                <p
                  className={cn(
                    'text-xs font-medium',
                    isActive ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.label}
                </p>
              </div>
            </div>
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'h-px w-8 transition-colors md:w-16',
                  isCompleted ? 'bg-emerald-400' : 'bg-border'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
