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
        <CardContent className="flex items-center justify-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">班级</th>
                <th className="text-right py-2">人数</th>
                <th className="text-right py-2">平均分</th>
                <th className="text-right py-2">最高分</th>
                <th className="text-right py-2">最低分</th>
                <th className="text-right py-2">离均差</th>
                <th className="text-right py-2">难度</th>
                <th className="text-right py-2">标准差</th>
              </tr>
            </thead>
            <tbody>
              {/* 全年级汇总 */}
              {data?.overallGrade && (
                <tr className="border-b bg-blue-50 font-semibold">
                  <td className="py-2">{data.overallGrade.className}</td>
                  <td className="text-right">{data.overallGrade.totalStudents}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.highestScore)}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.lowestScore)}</td>
                  <td className="text-right text-gray-500">
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
                <tr key={cls.classId} className="border-b hover:bg-gray-50">
                  <td className="py-2">{cls.className}</td>
                  <td className="text-right">{cls.totalStudents}</td>
                  <td className="text-right">{formatNumber(cls.avgScore)}</td>
                  <td className="text-right">{formatNumber(cls.highestScore)}</td>
                  <td className="text-right">{formatNumber(cls.lowestScore)}</td>
                  <td className="text-right">
                    <span className={cls.scoreDeviation >= 0 ? 'text-green-600' : 'text-red-600'}>
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

