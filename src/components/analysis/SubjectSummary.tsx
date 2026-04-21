'use client'

import { useSubjectSummary } from '@/hooks/useAnalysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { AnalysisModuleCard } from './AnalysisModuleCard'
import { formatNumber, getDifficultyColor, getDifficultyLevel } from '@/utils/format'
import { Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface SubjectSummaryProps {
  examId: string
}

export default function SubjectSummary({ examId }: SubjectSummaryProps) {
  const { selectedScope, selectedSubjectId, subjectSummaryConfig, setSubjectSummaryConfig } =
    useAnalysisStore()
  const { data, isLoading } = useSubjectSummary(examId, selectedScope, selectedSubjectId ?? undefined)

  const configPanel = (
    <div className="flex flex-wrap gap-4">
      <div className="flex items-center gap-2">
        <Switch
          id="show-difficulty"
          checked={subjectSummaryConfig.showDifficulty}
          onCheckedChange={(v) => setSubjectSummaryConfig({ showDifficulty: v })}
        />
        <Label htmlFor="show-difficulty" className="text-sm">显示难度</Label>
      </div>
      <div className="flex items-center gap-2">
        <Switch
          id="show-count"
          checked={subjectSummaryConfig.showStudentCount}
          onCheckedChange={(v) => setSubjectSummaryConfig({ showStudentCount: v })}
        />
        <Label htmlFor="show-count" className="text-sm">显示人数</Label>
      </div>
    </div>
  )

  return (
    <AnalysisModuleCard
      title="学科情况汇总"
      subtitle="各学科的平均水平与难度对比"
      configPanel={configPanel}
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
                <th className="py-2 text-left font-medium text-foreground">学科</th>
                <th className="py-2 text-right font-medium text-foreground">平均分</th>
                <th className="py-2 text-right font-medium text-foreground">最高分</th>
                <th className="py-2 text-right font-medium text-foreground">最低分</th>
                {subjectSummaryConfig.showDifficulty && (
                  <th className="py-2 text-right font-medium text-foreground">难度</th>
                )}
                {subjectSummaryConfig.showStudentCount && (
                  <th className="py-2 text-right font-medium text-foreground">参考人数</th>
                )}
              </tr>
            </thead>
            <tbody>
              {data?.subjects.map((subject) => (
                <tr key={subject.id} className="border-b border-border transition-colors hover:bg-muted/50">
                  <td className="py-2">{subject.name}</td>
                  <td className="text-right">{formatNumber(subject.avgScore)}</td>
                  <td className="text-right">{formatNumber(subject.highestScore)}</td>
                  <td className="text-right">{formatNumber(subject.lowestScore)}</td>
                  {subjectSummaryConfig.showDifficulty && (
                    <td className={`text-right ${getDifficultyColor(subject.difficulty)}`}>
                      <span className="font-semibold">{formatNumber(subject.difficulty)}%</span>
                      <span className="ml-1 text-xs">({getDifficultyLevel(subject.difficulty)})</span>
                    </td>
                  )}
                  {subjectSummaryConfig.showStudentCount && (
                    <td className="text-right">{subject.studentCount}</td>
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
