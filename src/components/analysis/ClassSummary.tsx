'use client'

import { useClassSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { AnalysisModuleCard } from './AnalysisModuleCard'
import { formatNumber, getDifficultyColor } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface ClassSummaryProps {
  examId: string
}

export default function ClassSummary({ examId }: ClassSummaryProps) {
  const { selectedScope, selectedSubjectId, classSummaryConfig, setClassSummaryConfig } =
    useAnalysisStore()
  const { data, isLoading } = useClassSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  const configPanel = (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id="show-deviation"
          checked={classSummaryConfig.showDeviation}
          onCheckedChange={(v) => setClassSummaryConfig({ showDeviation: v })}
        />
        <Label htmlFor="show-deviation" className="text-sm">显示离均差</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="show-stddev"
          checked={classSummaryConfig.showStdDev}
          onCheckedChange={(v) => setClassSummaryConfig({ showStdDev: v })}
        />
        <Label htmlFor="show-stddev" className="text-sm">显示标准差</Label>
      </div>
    </div>
  )

  return (
    <AnalysisModuleCard
      title="班级情况汇总"
      subtitle="各班级的成绩分布与差异分析"
      configPanel={configPanel}
      variant="cyan"
      isLoading={isLoading}
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
                <th className="py-2 text-right font-medium text-foreground">人数</th>
                <th className="py-2 text-right font-medium text-foreground">平均分</th>
                <th className="py-2 text-right font-medium text-foreground">最高分</th>
                <th className="py-2 text-right font-medium text-foreground">最低分</th>
                {classSummaryConfig.showDeviation && (
                  <th className="py-2 text-right font-medium text-foreground">离均差</th>
                )}
                <th className="py-2 text-right font-medium text-foreground">难度</th>
                {classSummaryConfig.showStdDev && (
                  <th className="py-2 text-right font-medium text-foreground">标准差</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data?.overallGrade && (
                <tr className="border-b border-border bg-primary/10 font-semibold">
                  <td className="py-2">{data.overallGrade.className}</td>
                  <td className="text-right">{data.overallGrade.totalStudents}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.avgScore)}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.highestScore)}</td>
                  <td className="text-right">{formatNumber(data.overallGrade.lowestScore)}</td>
                  {classSummaryConfig.showDeviation && (
                    <td className="text-right text-muted-foreground">
                      {formatNumber(data.overallGrade.scoreDeviation)}
                    </td>
                  )}
                  <td className={`text-right ${getDifficultyColor(data.overallGrade.difficulty)}`}>
                    {formatNumber(data.overallGrade.difficulty)}%
                  </td>
                  {classSummaryConfig.showStdDev && (
                    <td className="text-right">{formatNumber(data.overallGrade.stdDev)}</td>
                  )}
                </tr>
              )}
              {data?.classDetails.map((cls) => (
                <tr key={cls.classId} className="border-b border-border transition-colors hover:bg-muted/50">
                  <td className="py-2">{cls.className}</td>
                  <td className="text-right">{cls.totalStudents}</td>
                  <td className="text-right">{formatNumber(cls.avgScore)}</td>
                  <td className="text-right">{formatNumber(cls.highestScore)}</td>
                  <td className="text-right">{formatNumber(cls.lowestScore)}</td>
                  {classSummaryConfig.showDeviation && (
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
                  )}
                  <td className={`text-right ${getDifficultyColor(cls.difficulty)}`}>
                    {formatNumber(cls.difficulty)}%
                  </td>
                  {classSummaryConfig.showStdDev && (
                    <td className="text-right">{formatNumber(cls.stdDev)}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </AnalysisModuleCard>
  )
}
