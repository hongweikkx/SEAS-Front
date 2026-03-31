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
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">学科</th>
                <th className="text-right py-2">平均分</th>
                <th className="text-right py-2">最高分</th>
                <th className="text-right py-2">最低分</th>
                <th className="text-right py-2">难度</th>
                <th className="text-right py-2">参考人数</th>
              </tr>
            </thead>
            <tbody>
              {data?.subjects.map((subject) => (
                <tr key={subject.id} className="border-b hover:bg-gray-50">
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

