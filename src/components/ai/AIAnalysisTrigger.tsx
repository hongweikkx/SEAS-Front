'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import type { AnalysisView } from '@/types'
import { Button } from '@/components/ui/button'
import { Loader2, Sparkles, RotateCw } from 'lucide-react'

interface AIAnalysisTriggerProps {
  view: AnalysisView
  examId: string
}

export default function AIAnalysisTrigger({ view, examId }: AIAnalysisTriggerProps) {
  const { aiAnalysisResults, aiAnalysisLoading, generateAIAnalysis, drillDownParams } =
    useAnalysisStore()
  const result = aiAnalysisResults[view]
  const isGenerating = aiAnalysisLoading[view]

  const handleClick = () => {
    generateAIAnalysis(view, examId, drillDownParams)
  }

  if (isGenerating) {
    return (
      <Button variant="outline" size="sm" disabled className="rounded-lg gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        分析中...
      </Button>
    )
  }

  if (result) {
    return (
      <Button variant="outline" size="sm" onClick={handleClick} className="rounded-lg gap-2">
        <RotateCw className="h-4 w-4" />
        重新分析
      </Button>
    )
  }

  return (
    <Button variant="outline" size="sm" onClick={handleClick} className="rounded-lg gap-2">
      <Sparkles className="h-4 w-4" />
      智能分析
    </Button>
  )
}
