'use client'

import { useState, useEffect, useRef, Fragment } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useScoreSegment } from '@/hooks/useAnalysis'
import { analysisService } from '@/services/analysis'
import { useAnalysisStore } from '@/store/analysisStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatNumber } from '@/utils/format'
import { sortByClassName } from '@/utils/sort'
import { useTableSort } from '@/hooks/useTableSort'
import { SortableHeader } from '@/components/ui/sortable-header'
import { Loader2, Plus, Trash2, Download } from 'lucide-react'
import { downloadWorkbook, sanitizeFilename } from '@/lib/export-utils'
import * as XLSX from 'xlsx'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import type { SegmentConfig, ClassScoreSegment } from '@/types'

interface ScoreSegmentProps {
  examId: string
}

// 全科默认分段（总分通常在 0-1000+ 范围，步长 50）
const DEFAULT_ALL_SUBJECTS_RULES: SegmentConfig[] = [
  { start: 0, end: 1000, step: 50 },
]

// 单科默认分段（单科满分通常 100/150 分）
const DEFAULT_SINGLE_SUBJECT_RULES: SegmentConfig[] = [
  { start: 0, end: 60, step: 10 },
  { start: 60, end: 100, step: 5 },
]

export default function ScoreSegment({ examId }: ScoreSegmentProps) {
  const queryClient = useQueryClient()
  const { selectedScope, selectedSubjectId, selectedSubjectName } = useAnalysisStore()

  const defaultRules =
    selectedScope === 'all_subjects'
      ? DEFAULT_ALL_SUBJECTS_RULES
      : DEFAULT_SINGLE_SUBJECT_RULES

  const [rules, setRules] = useState<SegmentConfig[]>(defaultRules)
  const [queryRules, setQueryRules] = useState<SegmentConfig[]>(defaultRules)

  // 切换全科/单科时重置分段规则
  const prevScope = useRef(selectedScope)
  useEffect(() => {
    if (prevScope.current !== selectedScope) {
      prevScope.current = selectedScope
      const newRules =
        selectedScope === 'all_subjects'
          ? DEFAULT_ALL_SUBJECTS_RULES
          : DEFAULT_SINGLE_SUBJECT_RULES
      setRules(newRules)
      setQueryRules(newRules)
    }
  }, [selectedScope])

  const { data, isLoading, isFetching } = useScoreSegment(
    examId,
    selectedScope,
    queryRules,
    selectedSubjectId ?? undefined
  )

  const canQuery =
    !!examId &&
    rules.length > 0 &&
    rules.every((r) => r.end > r.start && r.step > 0) &&
    (selectedScope !== 'single_subject' || !!selectedSubjectId)

  const { sortState, toggleSort, sortedData } = useTableSort({
    defaultSort: { column: 'className', direction: 'asc' },
  })

  const getSegmentValue = (item: NonNullable<typeof data>['classDetails'][0], column: string) => {
    if (column === 'className') return item.className
    if (column === 'totalStudents') return item.totalStudents
    if (column.startsWith('seg-')) {
      const parts = column.split('-')
      const field = parts[parts.length - 1]
      const label = parts.slice(1, parts.length - 1).join('-')
      const seg = item.segments.find((s) => s.label === label)
      if (!seg) return 0
      if (field === 'count') return seg.count
      if (field === 'pct') {
        return item.totalStudents > 0 ? (seg.count / item.totalStudents) * 100 : 0
      }
      if (field === 'contrib') {
        const gradeSeg = data?.overallGrade?.segments.find((s) => s.label === label)
        return gradeSeg && gradeSeg.count > 0 ? (seg.count / gradeSeg.count) * 100 : 0
      }
    }
    return undefined
  }

  const sortedClassDetailsResult = data?.classDetails
    ? sortedData(sortByClassName(data.classDetails), getSegmentValue)
    : []

  const allClasses = data?.overallGrade
    ? [data.overallGrade, ...sortedClassDetailsResult]
    : sortedClassDetailsResult

  const handleAddRule = () => {
    setRules((prev) => [...prev, { start: 0, end: 100, step: 10 }])
  }

  const handleRemoveRule = (index: number) => {
    setRules((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRuleChange = (
    index: number,
    key: keyof SegmentConfig,
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
        'scoreSegment',
        examId,
        selectedScope,
        rules,
        selectedSubjectId ?? undefined,
      ],
      queryFn: () =>
        analysisService.getScoreSegment(
          examId,
          selectedScope,
          rules,
          selectedSubjectId ?? undefined
        ),
      staleTime: 5 * 60 * 1000,
    })
  }

  // 计算班内占比和年级贡献
  const getClassPercentage = (count: number, total: number) =>
    total > 0 ? (count / total) * 100 : 0

  const getGradeContribution = (classCount: number, gradeCount: number) =>
    gradeCount > 0 ? (classCount / gradeCount) * 100 : 0

  // 图表数据准备
  const structureChartData = sortedClassDetailsResult.map((cls) => {
    const row: Record<string, number | string> = {
      name: cls.className,
      total: cls.totalStudents,
    }
    cls.segments.forEach((seg) => {
      row[seg.label] = getClassPercentage(seg.count, cls.totalStudents)
      row[`${seg.label}_count`] = seg.count
    })
    return row
  })

  const contributionChartData = data?.overallGrade?.segments.map((seg) => {
    const row: Record<string, number | string> = {
      label: seg.label,
      min: seg.min,
      max: seg.max,
    }
    sortedClassDetailsResult.forEach((cls) => {
      const s = cls.segments.find((s) => s.label === seg.label)
      row[cls.className] = s?.count ?? 0
    })
    return row
  })

  const segmentLabels = data?.overallGrade?.segments.map((s) => s.label) ?? []

  const handleExport = () => {
    if (!data) return

    const allClasses = data.overallGrade
      ? [data.overallGrade, ...sortedClassDetailsResult]
      : sortedClassDetailsResult

    const rows = allClasses.map((cls) => {
      const row: Record<string, number | string> = {
        班级: cls.className,
        总人数: cls.totalStudents,
      }
      cls.segments.forEach((seg) => {
        const gradeSeg = data.overallGrade?.segments.find((s) => s.label === seg.label)
        const classPct = cls.totalStudents > 0 ? (seg.count / cls.totalStudents) * 100 : 0
        const gradeContrib = gradeSeg && gradeSeg.count > 0 ? (seg.count / gradeSeg.count) * 100 : 0
        const isOverall = cls.classId === data.overallGrade?.classId
        row[`${seg.label}分-人数`] = seg.count
        row[`${seg.label}分-班内占比`] = `${classPct.toFixed(2)}%`
        row[`${seg.label}分-年级贡献`] = isOverall ? '—' : `${gradeContrib.toFixed(2)}%`
      })
      return row
    })

    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, '分数段分析')
    const examName = data.examName || '考试'
    const subjectName = selectedSubjectName || '全科'
    downloadWorkbook(wb, `${sanitizeFilename(examName)}-${sanitizeFilename(subjectName)}-分数段分析.xlsx`)
  }

  // 为分数段分配语义化颜色：低分偏红→高分偏紫
  // 跨越完整色谱(0-300°)并让相邻段在饱和度/亮度上交替,
  // 即使分段很多(默认 20 段)也能清晰区分,避免大量颜色聚集在绿色区间
  const getSegmentColor = (label: string): string => {
    const allSegments = data?.overallGrade?.segments ?? []
    const sorted = [...allSegments].sort((a, b) => a.min - b.min)
    const index = sorted.findIndex((s) => s.label === label)
    const total = sorted.length
    if (total <= 0 || index < 0) return 'hsl(0, 0%, 60%)'
    const ratio = total > 1 ? index / (total - 1) : 0
    const hue = ratio * 300 // 0=红 → 300=紫,避开循环回到红
    const saturation = index % 2 === 0 ? 78 : 58
    const lightness = index % 2 === 0 ? 50 : 66
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }

  // 为每个班级生成颜色
  const classColors = [
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-5 w-1 rounded-full bg-primary" />
          <h2 className="text-lg font-semibold text-foreground">分数段分析</h2>
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
            <div className="text-sm font-medium text-muted-foreground">
              分数段规则配置
            </div>
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
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-muted-foreground">步长</span>
                  <Input
                    type="number"
                    value={rule.step}
                    onChange={(e) =>
                      handleRuleChange(index, 'step', e.target.value)
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
                    <SortableHeader rowSpan={2} columnKey="className" label="班级" align="center" sortState={sortState} onSort={toggleSort} className="py-2.5 px-3" />
                    <SortableHeader rowSpan={2} columnKey="totalStudents" label="总人数" align="center" sortState={sortState} onSort={toggleSort} sortable={false} className="py-2.5 px-3" />
                    {segmentLabels.map((label) => (
                      <th
                        key={label}
                        colSpan={3}
                        className="py-2.5 px-3 text-center font-medium text-muted-foreground border-l border-border/40"
                      >
                        {label}分
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-border/60 bg-muted/20">
                    {segmentLabels.map((label) => (
                      <Fragment key={label}>
                        <SortableHeader columnKey={`seg-${label}-count`} label="人数" align="center" sortState={sortState} onSort={toggleSort} className="py-1 px-3 text-xs border-l border-border/40" />
                        <SortableHeader columnKey={`seg-${label}-pct`} label="班内占比" align="center" sortState={sortState} onSort={toggleSort} className="py-1 px-3 text-xs" />
                        <SortableHeader columnKey={`seg-${label}-contrib`} label="年级贡献" align="center" sortState={sortState} onSort={toggleSort} className="py-1 px-3 text-xs" />
                      </Fragment>
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
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          {cls.totalStudents}
                        </td>
                        {cls.segments.map((seg) => {
                          const gradeSeg = data?.overallGrade?.segments.find(
                            (s) => s.label === seg.label
                          )
                          const classPct = getClassPercentage(
                            seg.count,
                            cls.totalStudents
                          )
                          const gradeContrib = getGradeContribution(
                            seg.count,
                            gradeSeg?.count ?? 0
                          )
                          return (
                            <Fragment key={seg.label}>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap border-l border-border/40">
                                {seg.count}
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {formatNumber(classPct)}%
                              </td>
                              <td className="py-2.5 px-3 text-center whitespace-nowrap">
                                {isOverall
                                  ? '-'
                                  : `${formatNumber(gradeContrib)}%`}
                              </td>
                            </Fragment>
                          )
                        })}
                      </tr>
                    )
                  })}
                  {allClasses.length === 0 && (
                    <tr>
                      <td
                        colSpan={2 + segmentLabels.length * 3}
                        className="py-8 text-center text-sm text-muted-foreground"
                      >
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* 图表区域 */}
            {sortedClassDetailsResult.length > 0 && segmentLabels.length > 0 && (
              <div className="border-t border-border/40 px-5 py-6 space-y-8">
                {/* 班级内部分数占比图 — 纵向百分比堆叠柱状图 */}
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-4">
                    班级内部分数占比图
                  </h3>
                  <div className="h-80 min-w-0 w-full">
                    <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={0}>
                      <BarChart
                        data={structureChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="name" />
                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(v) => `${v}%`}
                        />
                        <Tooltip
                          formatter={(value, _name, props) => {
                            const pct =
                              typeof value === 'number' ? value : Number(value) || 0
                            const label = props?.dataKey as string
                            const rawCount = props?.payload?.[`${label}_count`]
                            const count =
                              typeof rawCount === 'number' ? rawCount : Number(rawCount) || 0
                            return `${count}人 (${formatNumber(pct)}%)`
                          }}
                        />
                        <Legend itemSorter={null} />
                        {segmentLabels.map((label, i) => (
                          <Bar
                            key={label}
                            dataKey={label}
                            name={`${label}分`}
                            stackId="a"
                            fill={getSegmentColor(label)}
                          />
                        ))}
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 分数段贡献图 — 堆叠面积图 */}
                <div>
                  <h3 className="text-base font-semibold text-foreground mb-4">
                    分数段贡献分布图
                  </h3>
                  <div className="h-80 min-w-0 w-full">
                    <ResponsiveContainer width="100%" height={320} minWidth={0} minHeight={0}>
                      <AreaChart
                        data={contributionChartData}
                        margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                        <XAxis dataKey="label" />
                        <YAxis />
                        <Tooltip
                          formatter={(value, name, props) => {
                            const dataKey = props?.dataKey as string
                            const rawCount = props?.payload?.[dataKey]
                            const count =
                              typeof rawCount === 'number'
                                ? rawCount
                                : Number(rawCount) || 0
                            const segmentLabel = props?.payload?.label as string
                            const total =
                              data?.overallGrade?.segments.find(
                                (s) => s.label === segmentLabel
                              )?.count ?? 0
                            const pct = total > 0 ? (count / total) * 100 : 0
                            return `${count}人 (${formatNumber(pct)}%)`
                          }}
                        />
                        <Legend itemSorter={null} />
                        {sortedClassDetailsResult.map((cls, i) => (
                          <Area
                            key={cls.classId}
                            type="monotone"
                            dataKey={cls.className}
                            name={cls.className}
                            stackId="1"
                            stroke={classColors[i % classColors.length]}
                            fill={classColors[i % classColors.length]}
                            fillOpacity={0.6}
                          />
                        ))}
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
