'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useRankSegment } from '@/hooks/useAnalysis'
import { analysisService } from '@/services/analysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatNumber } from '@/utils/format'
import { sortByClassName } from '@/utils/sort'
import { Loader2, Plus, Trash2, HelpCircle, Download } from 'lucide-react'
import { downloadWorkbook, sanitizeFilename } from '@/lib/export-utils'
import * as XLSX from 'xlsx'
import {
  Tooltip as UITooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import type { RankSegmentConfig } from '@/types'

interface RankSegmentProps {
  examId: string
}

const DEFAULT_RULES: RankSegmentConfig[] = [
  { start: 0, end: 10 },
  { start: 0, end: 30 },
  { start: 0, end: 60 },
  { start: 60, end: 100 },
]

// 班级颜色循环色板(与 ScoreSegment 一致)
const CLASS_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#f97316',
  '#84cc16',
  '#ec4899',
  '#6366f1',
]

export default function RankSegment({ examId }: RankSegmentProps) {
  const queryClient = useQueryClient()
  const { selectedScope, selectedSubjectId } = useAnalysisStore()
  const [rules, setRules] = useState<RankSegmentConfig[]>(DEFAULT_RULES)
  const [queryRules, setQueryRules] = useState<RankSegmentConfig[]>(DEFAULT_RULES)

  const { data, isLoading, isFetching } = useRankSegment(
    examId,
    selectedScope,
    queryRules,
    selectedSubjectId ?? undefined
  )

  const canQuery =
    !!examId &&
    rules.length > 0 &&
    rules.every((r) => r.end > r.start && r.start >= 0) &&
    (selectedScope !== 'single_subject' || !!selectedSubjectId)

  const sortedClassDetails = data?.classDetails
    ? sortByClassName(data.classDetails)
    : []

  const allClasses = data?.overallGrade
    ? [data.overallGrade, ...sortedClassDetails]
    : sortedClassDetails

  const segmentLabels = data?.overallGrade?.segments.map((s) => s.label) ?? []

  const handleExport = () => {
    if (!data) return

    const allClasses = data.overallGrade
      ? [data.overallGrade, ...sortedClassDetails]
      : sortedClassDetails

    const rows = allClasses.map((cls) => {
      const row: Record<string, number | string> = {
        班级: cls.className,
        总人数: cls.totalStudents,
      }
      cls.segments.forEach((seg) => {
        const gradeSeg = data.overallGrade?.segments.find((s) => s.label === seg.label)
        const contrib = gradeSeg && gradeSeg.count > 0 ? (seg.count / gradeSeg.count) * 100 : 0
        const isOverall = cls.classId === data.overallGrade?.classId
        row[`${seg.label}-人数`] = seg.count
        row[`${seg.label}-贡献度`] = isOverall ? '—' : `${contrib.toFixed(2)}%`
      })
      return row
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '名次段分析')
    const examName = data.examName || '考试'
    downloadWorkbook(wb, `${sanitizeFilename(examName)}-名次段分析.xlsx`)
  }

  const handleAddRule = () => {
    setRules((prev) => [...prev, { start: 0, end: 10 }])
  }

  const handleRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRuleChange = (
    index: number,
    key: keyof RankSegmentConfig,
    value: string
  ) => {
    const num = Number(value)
    if (Number.isNaN(num)) return
    setRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [key]: num } : r))
    )
  }

  const handleQuery = () => {
    if (!canQuery) return
    setQueryRules([...rules])
    void queryClient.fetchQuery({
      queryKey: [
        'rankSegment',
        examId,
        selectedScope,
        rules,
        selectedSubjectId ?? undefined,
      ],
      queryFn: () =>
        analysisService.getRankSegment(
          examId,
          selectedScope,
          rules,
          selectedSubjectId ?? undefined
        ),
      staleTime: 5 * 60 * 1000,
    })
  }

  // 贡献度 = 该班该段人数 / 全年级该段人数 * 100%
  const getContribution = (count: number, gradeCount: number) =>
    gradeCount > 0 ? (count / gradeCount) * 100 : 0

  // 堆叠柱状图数据: X=名次段, 每条记录的 className 列对应该班人数
  const chartData = segmentLabels.map((label) => {
    const gradeSeg = data?.overallGrade?.segments.find((s) => s.label === label)
    const row: Record<string, number | string> = {
      label,
      gradeTotal: gradeSeg?.count ?? 0,
    }
    sortedClassDetails.forEach((cls) => {
      const seg = cls.segments.find((s) => s.label === label)
      row[cls.className] = seg?.count ?? 0
    })
    return row
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">名次段分析</h2>
          <TooltipProvider delayDuration={100}>
            <UITooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground transition-colors ml-0.5">
                  <HelpCircle className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="start">
                <p>start=0 表示「前 end 名」</p>
                <p>start&gt;0 表示「第 start+1 ~ end 名」</p>
              </TooltipContent>
            </UITooltip>
          </TooltipProvider>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleExport}
          disabled={!data}
          className="h-8 w-8 p-0"
          title="导出Excel"
        >
          <Download className="h-4 w-4" />
        </Button>
      </div>

      <div className="rounded-xl border border-border/60 bg-card overflow-hidden">
        {/* 配置面板 */}
        <div className="border-b border-border/40 bg-muted/30 px-5 py-4">
          <div className="space-y-3">
            {rules.map((rule, index) => (
              <div key={index} className="flex items-end gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">起始</span>
                  <Input
                    type="number"
                    value={rule.start}
                    onChange={(e) =>
                      handleRuleChange(index, 'start', e.target.value)
                    }
                    className="w-20 h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">结束</span>
                  <Input
                    type="number"
                    value={rule.end}
                    onChange={(e) =>
                      handleRuleChange(index, 'end', e.target.value)
                    }
                    className="w-20 h-8 text-sm"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveRule(index)}
                  disabled={rules.length <= 1}
                  className="h-8 px-2 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddRule}
                className="h-8"
              >
                <Plus className="mr-1 size-3.5" />
                添加规则
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleQuery}
                disabled={!canQuery}
                aria-busy={isFetching}
                className="h-8"
              >
                {isFetching ? (
                  <>
                    <Loader2 className="mr-1 size-3.5 animate-spin" />
                    查询中
                  </>
                ) : (
                  '查询'
                )}
              </Button>
            </div>
          </div>
        </div>

        {isLoading && !data ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* 宽表 */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-muted/30">
                    <th rowSpan={2} className="py-2.5 px-3 text-left font-medium text-muted-foreground whitespace-nowrap">
                      班级
                    </th>
                    <th rowSpan={2} className="py-2.5 px-3 text-right font-medium text-muted-foreground whitespace-nowrap">
                      总人数
                    </th>
                    {segmentLabels.map((label) => (
                      <th
                        key={label}
                        colSpan={2}
                        className="py-2.5 px-3 text-center font-medium text-muted-foreground border-l border-border/40"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-border/60 bg-muted/20">
                    {segmentLabels.map((label) => (
                      <th
                        key={label}
                        colSpan={2}
                        className="border-l border-border/40"
                      >
                        <div className="flex">
                          <span className="flex-1 py-1 px-3 text-center text-xs text-muted-foreground">
                            人数
                          </span>
                          <span className="flex-1 py-1 px-3 text-center text-xs text-muted-foreground">
                            贡献度
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allClasses.map((cls, idx) => {
                    const isOverall = idx === 0 && data?.overallGrade
                    return (
                      <tr
                        key={cls.classId}
                        className={`border-b border-border/40 transition-colors hover:bg-muted/20 ${
                          isOverall ? 'bg-primary/5 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          {cls.className}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          {cls.totalStudents}
                        </td>
                        {cls.segments.map((seg) => {
                          const gradeSeg = data?.overallGrade?.segments.find(
                            (s) => s.label === seg.label
                          )
                          const contrib = getContribution(
                            seg.count,
                            gradeSeg?.count ?? 0
                          )
                          return (
                            <td
                              key={seg.label}
                              colSpan={2}
                              className="border-l border-border/40"
                            >
                              <div className="flex">
                                <span className="flex-1 py-2.5 px-3 text-center whitespace-nowrap">
                                  {seg.count}
                                </span>
                                <span className="flex-1 py-2.5 px-3 text-center whitespace-nowrap">
                                  {isOverall
                                    ? '-'
                                    : `${formatNumber(contrib)}%`}
                                </span>
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                  {allClasses.length === 0 && (
                    <tr>
                      <td
                        colSpan={2 + segmentLabels.length * 2}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 图表: 堆叠柱状图,X=名次段,Y=人数,按班级堆叠 */}
            {sortedClassDetails.length > 0 && segmentLabels.length > 0 && (
              <div className="border-t border-border/40 px-5 py-6">
                <h3 className="text-base font-semibold text-foreground mb-4">
                  名次段班级分布
                </h3>
                <div className="h-80 min-w-0 w-full">
                  <ResponsiveContainer
                    width="100%"
                    height={320}
                    minWidth={0}
                    minHeight={0}
                  >
                    <BarChart
                      data={chartData}
                      margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip
                        formatter={(value, _name, props) => {
                          const count =
                            typeof value === 'number'
                              ? value
                              : Number(value) || 0
                          const dataKey = props?.dataKey as string
                          const gradeTotal =
                            (props?.payload?.gradeTotal as number) ?? 0
                          const pct =
                            gradeTotal > 0 ? (count / gradeTotal) * 100 : 0
                          return [`${count}人 (${formatNumber(pct)}%)`, dataKey]
                        }}
                      />
                      <Legend itemSorter={null} />
                      {sortedClassDetails.map((cls, i) => (
                        <Bar
                          key={cls.classId}
                          dataKey={cls.className}
                          name={cls.className}
                          stackId="a"
                          fill={CLASS_COLORS[i % CLASS_COLORS.length]}
                        />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
