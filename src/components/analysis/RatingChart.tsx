'use client'

import { useQueryClient } from '@tanstack/react-query'
import { ratingDistributionQueryKey, useRatingDistribution } from '@/hooks/useAnalysis'
import { analysisService } from '@/services/analysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatNumber } from '@/utils/format'
import { sortByClassName } from '@/utils/sort'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import AIAnalysisTrigger from '@/components/ai/AIAnalysisTrigger'
import AIAnalysisPanel from '@/components/ai/AIAnalysisPanel'

interface RatingChartProps {
  examId: string
}

export default function RatingChart({ examId }: RatingChartProps) {
  const queryClient = useQueryClient()
  const { selectedScope, selectedSubjectId, ratingConfig, setRatingConfig } = useAnalysisStore()
  const [draftConfig, setDraftConfig] = useState(ratingConfig)
  const { data, isLoading, isFetching } = useRatingDistribution(
    examId,
    selectedScope,
    ratingConfig,
    selectedSubjectId ?? undefined
  )
  const canQuery = !!examId && (selectedScope !== 'single_subject' || !!selectedSubjectId)
  const sortedClassDetails = data?.classDetails ? sortByClassName(data.classDetails) : []

  useEffect(() => {
    setDraftConfig(ratingConfig)
  }, [ratingConfig])

  const handleRatingConfigChange = (
    key: 'excellent_threshold' | 'good_threshold' | 'medium_threshold' | 'pass_threshold' | 'low_score_threshold',
    value: string
  ) => {
    const nextValue = Number(value)
    if (Number.isNaN(nextValue)) return
    setDraftConfig({ ...draftConfig, [key]: nextValue })
  }

  const handleQuery = () => {
    const next = { ...draftConfig }
    setRatingConfig(next)
    if (!canQuery) return
    void queryClient.fetchQuery({
      queryKey: ratingDistributionQueryKey(examId, selectedScope, next, selectedSubjectId ?? undefined),
      queryFn: () => analysisService.getRatingDistribution(examId, selectedScope, next, selectedSubjectId ?? undefined),
      staleTime: 5 * 60 * 1000,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">四率分析</h2>
        </div>
        <AIAnalysisTrigger view="rating-analysis" examId={examId} />
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* 配置面板 */}
        <div className="border-b border-border/40 bg-muted/30 px-5 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground whitespace-nowrap">优秀：得分率 ≥</span>
              <Input type="number" value={draftConfig.excellent_threshold} onChange={(e) => handleRatingConfigChange('excellent_threshold', e.target.value)} className="w-16 h-8 text-sm" min={0} max={100} />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground whitespace-nowrap">良好：得分率 ≥</span>
              <Input type="number" value={draftConfig.good_threshold} onChange={(e) => handleRatingConfigChange('good_threshold', e.target.value)} className="w-16 h-8 text-sm" min={0} max={100} />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground whitespace-nowrap">中等：得分率 ≥</span>
              <Input type="number" value={draftConfig.medium_threshold} onChange={(e) => handleRatingConfigChange('medium_threshold', e.target.value)} className="w-16 h-8 text-sm" min={0} max={100} />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground whitespace-nowrap">及格：得分率 ≥</span>
              <Input type="number" value={draftConfig.pass_threshold} onChange={(e) => handleRatingConfigChange('pass_threshold', e.target.value)} className="w-16 h-8 text-sm" min={0} max={100} />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-muted-foreground whitespace-nowrap">低分：得分率 &lt;</span>
              <Input type="number" value={draftConfig.low_score_threshold} onChange={(e) => handleRatingConfigChange('low_score_threshold', e.target.value)} className="w-16 h-8 text-sm" min={0} max={100} />
              <span className="text-sm text-muted-foreground">%</span>
            </div>
            <Button type="button" size="sm" onClick={handleQuery} disabled={!canQuery} aria-busy={isFetching}>
              {isFetching ? (
                <><Loader2 className="mr-1 size-3.5 animate-spin" />查询中</>
              ) : (
                '查询'
              )}
            </Button>
          </div>
        </div>

        {isLoading && !data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60 bg-muted/30">
                  <th className="py-2.5 px-3 text-left font-medium text-muted-foreground">班级</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">总人数</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">均分</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">优秀人数</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">优秀占比</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">良好人数</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">良好占比</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">中等人数</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">中等占比</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">及格人数</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">及格占比</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">低分人数</th>
                  <th className="py-2.5 px-3 text-right font-medium text-muted-foreground">低分占比</th>
                </tr>
              </thead>
              <tbody>
                {data?.overallGrade && (
                  <tr className="border-b border-border/40 bg-primary/5 font-semibold">
                    <td className="py-2.5 px-3">{data.overallGrade.className}</td>
                    <td className="py-2.5 px-3 text-right">{data.overallGrade.totalStudents}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                    <td className="py-2.5 px-3 text-right">{data.overallGrade.excellent.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(data.overallGrade.excellent.percentage)}%</td>
                    <td className="py-2.5 px-3 text-right">{data.overallGrade.good.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(data.overallGrade.good.percentage)}%</td>
                    <td className="py-2.5 px-3 text-right">{data.overallGrade.medium.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(data.overallGrade.medium.percentage)}%</td>
                    <td className="py-2.5 px-3 text-right">{data.overallGrade.pass.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(data.overallGrade.pass.percentage)}%</td>
                    <td className="py-2.5 px-3 text-right">{data.overallGrade.lowScore.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(data.overallGrade.lowScore.percentage)}%</td>
                  </tr>
                )}
                {sortedClassDetails.map((cls) => (
                  <tr key={cls.classId} className="border-b border-border/40 transition-colors hover:bg-muted/20">
                    <td className="py-2.5 px-3">{cls.className}</td>
                    <td className="py-2.5 px-3 text-right">{cls.totalStudents}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(cls.avgScore)}</td>
                    <td className="py-2.5 px-3 text-right">{cls.excellent.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(cls.excellent.percentage)}%</td>
                    <td className="py-2.5 px-3 text-right">{cls.good.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(cls.good.percentage)}%</td>
                    <td className="py-2.5 px-3 text-right">{cls.medium.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(cls.medium.percentage)}%</td>
                    <td className="py-2.5 px-3 text-right">{cls.pass.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(cls.pass.percentage)}%</td>
                    <td className="py-2.5 px-3 text-right">{cls.lowScore.count}</td>
                    <td className="py-2.5 px-3 text-right">{formatNumber(cls.lowScore.percentage)}%</td>
                  </tr>
                ))}
                {(!data?.classDetails || data.classDetails.length === 0) && (
                  <tr>
                    <td colSpan={13} className="py-8 text-center text-sm text-muted-foreground">
                      暂无数据
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <AIAnalysisPanel view="rating-analysis" examId={examId} />
    </div>
  )
}
