'use client'

import { useState } from 'react'
import { useAnalysisStore } from '@/store/analysisStore'
import type { AnalysisView } from '@/types'
import { Button } from '@/components/ui/button'
import { X, ChevronDown, ChevronUp, BrainCircuit } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AIAnalysisPanelProps {
  view: AnalysisView
}

export default function AIAnalysisPanel({ view }: AIAnalysisPanelProps) {
  const { aiAnalysisResults, clearAIAnalysis, executeAILink } = useAnalysisStore()
  const [expanded, setExpanded] = useState(true)
  const result = aiAnalysisResults[view]

  if (!result) return null

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50/50 dark:bg-blue-950/20">
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">AI 智能分析</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-7 w-7 rounded-lg p-0 text-blue-600 dark:text-blue-400"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => clearAIAnalysis(view)}
            className="h-7 w-7 rounded-lg p-0 text-blue-600 dark:text-blue-400"
            title="清除分析"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed text-blue-800 dark:text-blue-200">
            {result.segments.map((segment, index) => {
              if (segment.type === 'text') {
                return <span key={index}>{segment.content}</span>
              }

              return (
                <button
                  key={index}
                  onClick={() => executeAILink(segment.link)}
                  className={cn(
                    'inline cursor-pointer font-medium transition-colors',
                    'text-blue-700 hover:text-blue-500 dark:text-blue-300 dark:hover:text-blue-200'
                  )}
                  title={`查看${segment.link.label}`}
                >
                  {segment.content}
                </button>
              )
            })}
          </p>
        </div>
      )}
    </div>
  )
}
