'use client'

import { useAnalysisStore } from '@/store/analysisStore'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BreadcrumbNavProps {
  examId: string
}

export default function BreadcrumbNav({ examId }: BreadcrumbNavProps) {
  const {
    selectedScope,
    selectedSubjectName,
    drillDownPath,
    setSelectedScope,
    setSelectedSubjectId,
    setSelectedSubjectName,
    setCurrentView,
    setDrillDownParam,
    popDrillDownTo,
  } = useAnalysisStore()

  const buildBreadcrumbItems = () => {
    const items: Array<{ label: string; view?: string; isActive?: boolean; onClick?: () => void }> = []

    // 根节点：全科分析 或 学科名
    if (selectedScope === 'all_subjects') {
      items.push({
        label: '全科分析',
        view: 'class-summary',
        onClick: () => {
          setSelectedScope('all_subjects')
          setSelectedSubjectId(null)
          setSelectedSubjectName(null)
          setCurrentView('class-summary')
          setDrillDownParam('classId', undefined)
          popDrillDownTo('class-summary')
        },
      })
    } else {
      items.push({
        label: selectedSubjectName || '单科分析',
        view: 'single-class-summary',
        onClick: () => {
          setCurrentView('single-class-summary')
          setDrillDownParam('classId', undefined)
          setDrillDownParam('questionId', undefined)
          popDrillDownTo('single-class-summary')
        },
      })
    }

    // 中间节点：从 drillDownPath 生成
    drillDownPath.forEach((node, index) => {
      const isLast = index === drillDownPath.length - 1
      items.push({
        label: node.label,
        isActive: isLast,
        onClick: isLast
          ? undefined
          : () => {
              setCurrentView(node.view)
              // 回退参数到该节点状态
              if (node.params) {
                Object.entries(node.params).forEach(([key, value]) => {
                  setDrillDownParam(key as 'classId' | 'subjectId' | 'questionId', value)
                })
              }
              popDrillDownTo(node.view)
            },
      })
    })

    return items
  }

  const items = buildBreadcrumbItems()

  if (items.length <= 1) return null

  return (
    <nav className="flex items-center gap-1.5 text-sm">
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" />
          )}
          {item.isActive || !item.onClick ? (
            <span className={cn('font-medium', item.isActive ? 'text-foreground' : 'text-muted-foreground')}>
              {item.label}
            </span>
          ) : (
            <button
              onClick={item.onClick}
              className="text-primary hover:text-primary/80 hover:underline transition-colors"
            >
              {item.label}
            </button>
          )}
        </div>
      ))}
    </nav>
  )
}
