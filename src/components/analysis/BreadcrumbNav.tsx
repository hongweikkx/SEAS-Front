'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function BreadcrumbNav() {
  const {
    drillDownPath,
    setCurrentView,
    setDrillDownParam,
    popDrillDownTo,
  } = useAnalysisStore()

  // 没有下钻记录时不显示
  if (drillDownPath.length === 0) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      <span className="text-muted-foreground text-xs font-medium mr-1">分析链:</span>
      {drillDownPath.map((node, index) => (
        <div key={`${node.view}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
          <button
            onClick={() => {
              setCurrentView(node.view)
              if (node.params) {
                Object.entries(node.params).forEach(([key, value]) => {
                  setDrillDownParam(key as 'classId' | 'subjectId' | 'questionId', value)
                })
              }
              popDrillDownTo(node.view)
            }}
            className="text-primary hover:text-primary/80 hover:underline transition-colors"
          >
            {node.label}
          </button>
        </div>
      ))}
    </nav>
  )
}
