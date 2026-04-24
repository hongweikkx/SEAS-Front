'use client'

import { useSubjectSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { formatNumber } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'

interface SubjectSummaryProps {
  examId: string
}

const subjectIcons: Record<string, { label: string; bg: string; text: string }> = {
  '语文': { label: '文', bg: 'bg-red-100', text: 'text-red-600' },
  '数学': { label: '数', bg: 'bg-blue-100', text: 'text-blue-600' },
  '英语': { label: '外', bg: 'bg-purple-100', text: 'text-purple-600' },
  '理综': { label: '理', bg: 'bg-emerald-100', text: 'text-emerald-600' },
  '文综': { label: '文', bg: 'bg-orange-100', text: 'text-orange-600' },
}

function getSubjectIcon(name: string) {
  for (const key of Object.keys(subjectIcons)) {
    if (name.includes(key)) return subjectIcons[key]
  }
  return { label: name.slice(0, 1), bg: 'bg-gray-100', text: 'text-gray-600' }
}

function getPerformanceTag(difficulty: number) {
  if (difficulty >= 0.75) return { label: '领先', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  if (difficulty >= 0.65) return { label: '稳步', className: 'bg-blue-50 text-blue-700 border-blue-200' }
  if (difficulty >= 0.55) return { label: '持平', className: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: '预警', className: 'bg-red-50 text-red-700 border-red-200' }
}

export default function SubjectSummary({ examId }: SubjectSummaryProps) {
  const { selectedScope, selectedSubjectId } = useAnalysisStore()
  const { data, isLoading } = useSubjectSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">学科情况汇总</h2>
        </div>
        <AIAnalysisTrigger view="subject-summary" examId={examId} />
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {isLoading && !data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 px-5 text-left font-medium text-muted-foreground">学科</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">平均分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">最高分</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">难度系数</th>
                <th className="py-3 px-5 text-right font-medium text-muted-foreground">学科表现</th>
              </tr>
            </thead>
            <tbody>
              {data?.subjects.map((subject) => {
                const icon = getSubjectIcon(subject.name)
                const perf = getPerformanceTag(subject.difficulty)
                return (
                  <tr key={subject.id} className="border-b border-border/40 transition-colors hover:bg-muted/20">
                    <td className="py-3 px-5">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium ${icon.bg} ${icon.text}`}>
                          {icon.label}
                        </div>
                        <span className="font-medium text-foreground">{subject.name}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-right font-medium">{formatNumber(subject.avgScore)}</td>
                    <td className="py-3 px-5 text-right text-muted-foreground">{formatNumber(subject.highestScore)}</td>
                    <td className="py-3 px-5 text-right text-muted-foreground">{formatNumber(subject.difficulty / 100)}</td>
                    <td className="py-3 px-5 text-right">
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${perf.className}`}>
                        {perf.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {(!data?.subjects || data.subjects.length === 0) && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                    暂无学科数据
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
      <AIAnalysisPanel view="subject-summary" />
    </div>
  )
}
