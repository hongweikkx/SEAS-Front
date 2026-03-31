'use client'

import { useRatingDistribution } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatNumber, getGradeLevelColor } from '@/utils/format'
import { Loader2 } from 'lucide-react'

interface RatingChartProps {
  examId: string
}

export default function RatingChart({ examId }: RatingChartProps) {
  const { selectedScope, selectedSubjectId, ratingConfig } = useAnalysisStore()
  const { data, isLoading } = useRatingDistribution(
    examId,
    selectedScope,
    ratingConfig,
    selectedSubjectId ?? undefined
  )

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>四率分析</CardTitle>
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
        <CardTitle>四率分析</CardTitle>
        <div className="text-sm text-gray-500 mt-2">
          优秀: ≥{data?.config.excellent_threshold} | 
          良好: {data?.config.good_threshold}-{data?.config.excellent_threshold} | 
          合格: {data?.config.pass_threshold}-{data?.config.good_threshold} | 
          低分: &lt;{data?.config.pass_threshold}
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">班级</th>
                <th className="text-right py-2">平均分</th>
                <th className="text-right py-2">优秀</th>
                <th className="text-right py-2">良好</th>
                <th className="text-right py-2">合格</th>
                <th className="text-right py-2">低分</th>
              </tr>
            </thead>
            <tbody>
              {/* 全年级汇总 */}
              {data?.overallGrade && (
                <tr className="border-b bg-blue-50 font-semibold">
                  <td className="py-2">{data.overallGrade.className}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                  <td className="text-right">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                      {data.overallGrade.excellent.count} ({formatNumber(data.overallGrade.excellent.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      {data.overallGrade.good.count} ({formatNumber(data.overallGrade.good.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      {data.overallGrade.pass.count} ({formatNumber(data.overallGrade.pass.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                      {data.overallGrade.fail.count} ({formatNumber(data.overallGrade.fail.percentage)}%)
                    </span>
                  </td>
                </tr>
              )}

              {/* 各班级详情 */}
              {data?.classDetails.map((cls) => (
                <tr key={cls.classId} className="border-b hover:bg-gray-50">
                  <td className="py-2">{cls.className}</td>
                  <td className="text-right">{formatNumber(cls.avgScore)}</td>
                  <td className="text-right">
                    <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {cls.excellent.count} ({formatNumber(cls.excellent.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                      {cls.good.count} ({formatNumber(cls.good.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs">
                      {cls.pass.count} ({formatNumber(cls.pass.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs">
                      {cls.fail.count} ({formatNumber(cls.fail.percentage)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}

