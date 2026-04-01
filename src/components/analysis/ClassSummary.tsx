'use client'

import { useClassSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, getDifficultyColor } from '@/utils/format'
import { Loader2 } from 'lucide-react'

interface ClassSummaryProps {
  examId: string
}

export default function ClassSummary({ examId }: ClassSummaryProps) {
  const { selectedScope, selectedSubjectId } = useAnalysisStore()
  const { data, isLoading } = useClassSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>班级情况汇总</CardTitle>
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
        <CardTitle>班级情况汇总</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-foreground">班级</th>
                <th className="py-2 text-right font-medium text-foreground">人数</th>
                <th className="py-2 text-right font-medium text-foreground">平均分</th>
                <th className="py-2 text-right font-medium text-foreground">最高分</th>
                <th className="py-2 text-right font-medium text-foreground">最低分</th>
                <th className="py-2 text-right font-medium text-foreground">离均差</th>
                <th className="py-2 text-right font-medium text-foreground">难度</th>
                <th className="py-2 text-right font-medium text-foreground">标准差</th>
              </tr>
            </thead>
            <tbody>
              {/* 全年级汇总 */}
              {data?.overallGrade && (
                <tr className="border-b border-border bg-primary/10 font-semibold">
                  <td className="py-2">{data.overallGrade.className}</td>
                  <td className="text-right">{data.overallGrade.totalStudents}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.highestScore)}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.lowestScore)}</td>
                  <td className="text-right text-muted-foreground">
                    {formatNumber(data.overallGrade.scoreDeviation)}
                  </td>
                  <td className={`text-right ${getDifficultyColor(data.overallGrade.difficulty)}`}>
                    {formatNumber(data.overallGrade.difficulty)}%
                  </td>
                  <td className="text-right">{formatNumber(data.overallGrade.stdDev)}</td>
                </tr>
              )}

              {/* 各班级详情 */}
              {data?.classDetails.map((cls) => (
                <tr key={cls.classId} className="border-b border-border transition-colors hover:bg-muted/50">
                  <td className="py-2">{cls.className}</td>
                  <td className="text-right">{cls.totalStudents}</td>
                  <td className="text-right">{formatNumber(cls.avgScore)}</td>
                  <td className="text-right">{formatNumber(cls.highestScore)}</td>
                  <td className="text-right">{formatNumber(cls.lowestScore)}</td>
                  <td className="text-right">
                    <span
                      className={
                        cls.scoreDeviation >= 0
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-destructive'
                      }
                    >
                      {formatNumber(cls.scoreDeviation)}
                    </span>
                  </td>
                  <td className={`text-right ${getDifficultyColor(cls.difficulty)}`}>
                    {formatNumber(cls.difficulty)}%
                  </td>
                  <td className="text-right">{formatNumber(cls.stdDev)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

