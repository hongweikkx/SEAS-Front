'use client'

import { Check, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

const mockFields = [
  { source: '姓名', target: 'student_name', matched: true },
  { source: '语文', target: 'chinese_score', matched: true },
  { source: '数学', target: 'math_score', matched: true },
  { source: '英语', target: 'english_score', matched: true },
  { source: '班级', target: 'class_name', matched: true },
  { source: '总分', target: null, matched: false },
]

interface FieldMappingProps {
  onConfirm?: () => void
}

export function FieldMapping({ onConfirm }: FieldMappingProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border/60 bg-card/60 p-4">
        <h3 className="text-sm font-medium text-foreground">字段映射确认</h3>
        <p className="mt-1 text-xs text-muted-foreground">请确认以下字段映射是否正确</p>

        <div className="mt-4 space-y-2">
          {mockFields.map((field) => (
            <div
              key={field.source}
              className="flex items-center justify-between rounded-lg border border-border/40 px-3 py-2"
            >
              <div className="flex items-center gap-2">
                {field.matched ? (
                  <Check className="h-4 w-4 text-emerald-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-amber-500" />
                )}
                <span className="text-sm text-foreground">{field.source}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">→</span>
                <span className="text-sm font-medium text-primary">
                  {field.target ?? '未匹配'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={onConfirm}>确认并开始分析</Button>
      </div>
    </div>
  )
}
