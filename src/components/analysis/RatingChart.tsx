'use client'

import { useQueryClient } from '@tanstack/react-query'
import { ratingDistributionQueryKey, useRatingDistribution } from '@/hooks/useAnalysis'
import { analysisService } from '@/services/analysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { AnalysisModuleCard } from './AnalysisModuleCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatNumber, ratingTierBadgeClass } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'

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

  useEffect(() => {
    setDraftConfig(ratingConfig)
  }, [ratingConfig])

  const handleRatingConfigChange = (
    key: 'excellent_threshold' | 'good_threshold' | 'pass_threshold',
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

  const configPanel = (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">优秀分数线</label>
        <Input
          type="number"
          value={draftConfig.excellent_threshold}
          onChange={(e) => handleRatingConfigChange('excellent_threshold', e.target.value)}
          min={0}
          max={100}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">良好分数线</label>
        <Input
          type="number"
          value={draftConfig.good_threshold}
          onChange={(e) => handleRatingConfigChange('good_threshold', e.target.value)}
          min={0}
          max={100}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-muted-foreground">合格分数线</label>
        <Input
          type="number"
          value={draftConfig.pass_threshold}
          onChange={(e) => handleRatingConfigChange('pass_threshold', e.target.value)}
          min={0}
          max={100}
        />
      </div>
      <div className="flex items-end gap-2 pb-0.5">
        <Button type="button" size="sm" onClick={handleQuery} disabled={!canQuery} aria-busy={isFetching}>
          {isFetching ? (
            <>
              <Loader2 className="mr-1 size-3.5 animate-spin" />
              查询中
            </>
          ) : (
            '应用'
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <AnalysisModuleCard
      title="四率分析"
      subtitle="优秀、良好、合格、低分四个等级的分布情况"
      configPanel={configPanel}
      variant="purple"
      isLoading={isLoading && !data}
    >
      {isLoading && !data ? (
        <div className="flex h-40 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs md:text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-foreground">班级</th>
                <th className="py-2 text-right font-medium text-foreground">平均分</th>
                <th className="py-2 text-right font-medium text-foreground">优秀</th>
                <th className="py-2 text-right font-medium text-foreground">良好</th>
                <th className="py-2 text-right font-medium text-foreground">合格</th>
                <th className="py-2 text-right font-medium text-foreground">低分</th>
              </tr>
            </thead>
            <tbody>
              {data?.overallGrade && (
                <tr className="border-b border-border bg-primary/10 font-semibold">
                  <td className="py-2">{data.overallGrade.className}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                  <td className="text-right">
                    <span className={ratingTierBadgeClass.excellent}>
                      {data.overallGrade.excellent.count} ({formatNumber(data.overallGrade.excellent.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={ratingTierBadgeClass.good}>
                      {data.overallGrade.good.count} ({formatNumber(data.overallGrade.good.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={ratingTierBadgeClass.pass}>
                      {data.overallGrade.pass.count} ({formatNumber(data.overallGrade.pass.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={ratingTierBadgeClass.fail}>
                      {data.overallGrade.fail.count} ({formatNumber(data.overallGrade.fail.percentage)}%)
                    </span>
                  </td>
                </tr>
              )}
              {data?.classDetails.map((cls) => (
                <tr key={cls.classId} className="border-b border-border transition-colors hover:bg-muted/50">
                  <td className="py-2">{cls.className}</td>
                  <td className="text-right">{formatNumber(cls.avgScore)}</td>
                  <td className="text-right">
                    <span className={`text-xs ${ratingTierBadgeClass.excellent}`}>
                      {cls.excellent.count} ({formatNumber(cls.excellent.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`text-xs ${ratingTierBadgeClass.good}`}>
                      {cls.good.count} ({formatNumber(cls.good.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`text-xs ${ratingTierBadgeClass.pass}`}>
                      {cls.pass.count} ({formatNumber(cls.pass.percentage)}%)
                    </span>
                  </td>
                  <td className="text-right">
                    <span className={`text-xs ${ratingTierBadgeClass.fail}`}>
                      {cls.fail.count} ({formatNumber(cls.fail.percentage)}%)
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalysisModuleCard>
  )
}
