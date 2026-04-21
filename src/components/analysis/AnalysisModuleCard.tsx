'use client'

import { ReactNode, useState } from 'react'
import { Settings2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

interface AnalysisModuleCardProps {
  title: string
  subtitle?: string
  children: ReactNode
  configPanel?: ReactNode
  className?: string
  variant?: 'default' | 'cyan' | 'purple'
  isLoading?: boolean
}

export function AnalysisModuleCard({
  title,
  subtitle,
  children,
  configPanel,
  className,
  variant = 'default',
  isLoading,
}: AnalysisModuleCardProps) {
  const [showConfig, setShowConfig] = useState(false)

  const variantStyles = {
    default: 'border-primary/10 bg-card-blue shadow-card-blue',
    cyan: 'border-cyan-200/60 bg-card-cyan shadow-card-cyan',
    purple: 'border-violet-200/60 bg-card-purple shadow-card-purple',
  }

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border',
        variantStyles[variant],
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-border/40 px-5 py-4">
        <div>
          <h3 className="text-base font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>}
        </div>
        {configPanel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowConfig(!showConfig)}
            className={cn(
              'h-8 w-8 rounded-lg p-0',
              showConfig && 'bg-primary/10 text-primary'
            )}
          >
            {showConfig ? <X className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {configPanel && showConfig && (
        <div className="border-b border-border/40 bg-muted/30 px-5 py-4">
          {configPanel}
        </div>
      )}

      <div className="relative px-5 py-4">
        {isLoading && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-b-2xl bg-background/50">
            <div className="flex h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {children}
      </div>
    </div>
  )
}
