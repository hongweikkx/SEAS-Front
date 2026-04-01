'use client'

import { Fragment, useMemo } from 'react'
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Bar, Line, Pie } from 'react-chartjs-2'

import { cn } from '@/lib/utils'
import type { ChatChartBlock, ChatContentBlock, ChatTableBlock, ChatTableRow } from '@/types'

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  Filler,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Tooltip
)

const chartPalette = [
  'rgb(59, 130, 246)',
  'rgb(34, 197, 94)',
  'rgb(245, 158, 11)',
  'rgb(168, 85, 247)',
  'rgb(239, 68, 68)',
]

function formatTableCell(value: ChatTableRow[string]) {
  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'boolean') {
    return value ? '是' : '否'
  }

  return String(value)
}

function TableBlock({ block }: { block: ChatTableBlock }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="text-sm font-medium text-foreground">{block.title ?? '表格'}</div>
        {block.description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{block.description}</p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-xs md:text-sm">
          <thead>
            <tr className="bg-muted/40">
              {block.columns.map((column) => (
                <th
                  key={column.key}
                  className={cn(
                    'whitespace-nowrap border-b border-border/60 px-4 py-2 text-left font-medium text-foreground',
                    column.align === 'right' && 'text-right',
                    column.align === 'center' && 'text-center'
                  )}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rowIndex) => (
              <tr key={`${block.title ?? 'table'}-${rowIndex}`} className="odd:bg-background even:bg-muted/20">
                {block.columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'whitespace-nowrap border-b border-border/40 px-4 py-2 text-muted-foreground',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center'
                    )}
                  >
                    {formatTableCell(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function buildChartData(block: ChatChartBlock) {
  return {
    labels: block.labels,
    datasets: block.datasets.map((dataset, index) => {
      const paletteColor = chartPalette[index % chartPalette.length]
      return {
        label: dataset.label,
        data: dataset.data,
        backgroundColor:
          dataset.backgroundColor ??
          (block.chartType === 'pie'
            ? block.labels.map((_, labelIndex) => chartPalette[labelIndex % chartPalette.length])
            : paletteColor),
        borderColor: dataset.borderColor ?? paletteColor,
        borderWidth: block.chartType === 'pie' ? 1 : 2,
        fill: dataset.fill ?? block.chartType === 'line',
        tension: block.chartType === 'line' ? 0.35 : 0,
      }
    }),
  }
}

function ChartBlock({ block }: { block: ChatChartBlock }) {
  const data = useMemo(() => buildChartData(block), [block])

  const options = useMemo<ChartOptions<'bar' | 'line' | 'pie'>>(() => {
    const shared = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom' as const,
        },
        tooltip: {
          enabled: true,
        },
      },
    }

    if (block.chartType === 'pie') {
      return shared
    }

    return {
      ...shared,
      scales: {
        x: {
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(148, 163, 184, 0.12)',
          },
        },
      },
    }
  }, [block.chartType])

  const chartNode =
    block.chartType === 'line' ? (
      <Line data={data as ChartData<'line', number[], string>} options={options as ChartOptions<'line'>} />
    ) : block.chartType === 'pie' ? (
      <Pie data={data as ChartData<'pie', number[], string>} options={options as ChartOptions<'pie'>} />
    ) : (
      <Bar data={data as ChartData<'bar', number[], string>} options={options as ChartOptions<'bar'>} />
    )

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="text-sm font-medium text-foreground">{block.title ?? '图表'}</div>
        {block.description ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{block.description}</p>
        ) : null}
      </div>
      <div className={cn('px-4 py-4', block.chartType === 'pie' ? 'h-72' : 'h-80')}>
        {chartNode}
      </div>
    </div>
  )
}

export function ChatMessageContent({
  content,
  blocks,
}: {
  content: string
  blocks?: ChatContentBlock[]
}) {
  const hasBlocks = !!blocks?.length
  const visibleBlocks = blocks ?? []

  return (
    <div className="space-y-3">
      {content.trim().length > 0 ? (
        <p className="whitespace-pre-wrap break-words text-sm leading-6">{content}</p>
      ) : null}

      {hasBlocks ? (
        <div className="space-y-3">
          {visibleBlocks.map((block, index) => (
            <Fragment key={`${block.type}-${index}`}>
              {block.type === 'text' ? (
                <p className="whitespace-pre-wrap break-words text-sm leading-6 text-muted-foreground">
                  {block.content}
                </p>
              ) : null}
              {block.type === 'table' ? <TableBlock block={block} /> : null}
              {block.type === 'chart' ? <ChartBlock block={block} /> : null}
            </Fragment>
          ))}
        </div>
      ) : null}
    </div>
  )
}
