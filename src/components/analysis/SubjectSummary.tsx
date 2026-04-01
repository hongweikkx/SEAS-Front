'use client'

import { useSubjectSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, getDifficultyColor, getDifficultyLevel } from '@/utils/format'
import { Loader2 } from 'lucide-react'

interface SubjectSummaryProps {
  examId: string
}

export default function SubjectSummary({ examId }: SubjectSummaryProps) {
  const { selectedScope, selectedSubjectId } = useAnalysisStore()
  const { data, isLoading } = useSubjectSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>学科情况汇总</CardTitle>
        </CardHeader>
        <CardContent className="flex h-40 items-center justify-center" role="status" aria-label="加载中">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>学科情况汇总</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-foreground">学科</th>
                <th className="py-2 text-right font-medium text-foreground">平均分</th>
                <th className="py-2 text-right font-medium text-foreground">最高分</th>
                <th className="py-2 text-right font-medium text-foreground">最低分</th>
                <th className="py-2 text-right font-medium text-foreground">难度</th>
                <th className="py-2 text-right font-medium text-foreground">参考人数</th>
              </tr>
            </thead>
            <tbody>
              {data?.subjects.map((subject) => (
                <tr key={subject.id} className="border-b border-border transition-colors hover:bg-muted/50">
                  <td className="py-2">{subject.name}</td>
                  <td className="text-right">{formatNumber(subject.avgScore)}</td>
                  <td className="text-right">{formatNumber(subject.highestScore)}</td>
                  <td className="text-right">{formatNumber(subject.lowestScore)}</td>
                  <td className={`text-right ${getDifficultyColor(subject.difficulty)}`}>
                    <span className="font-semibold">{formatNumber(subject.difficulty)}%</span>
                    <span className="text-xs ml-1">({getDifficultyLevel(subject.difficulty)})</span>
                  </td>
                  <td className="text-right">{subject.studentCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

