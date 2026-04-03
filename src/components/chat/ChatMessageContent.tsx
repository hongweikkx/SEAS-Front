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
import type { A2UIComponent, A2UISurfaceView } from '@/types'

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

function readRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>
  }
  return {}
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

function asString(value: unknown) {
  if (typeof value === 'string') {
    return value
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value)
  }
  return ''
}

function renderInlineMarkdown(text: string) {
  const tokens = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|\[[^\]]+\]\([^)]+\))/g)

  return tokens.map((token, index) => {
    if (!token) {
      return null
    }

    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={index} className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-foreground">
          {token.slice(1, -1)}
        </code>
      )
    }

    if (token.startsWith('**') && token.endsWith('**')) {
      return (
        <strong key={index} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      )
    }

    if ((token.startsWith('*') && token.endsWith('*')) || (token.startsWith('_') && token.endsWith('_'))) {
      return (
        <em key={index} className="italic text-foreground">
          {token.slice(1, -1)}
        </em>
      )
    }

    const linkMatch = token.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      return (
        <a
          key={index}
          href={linkMatch[2]}
          target="_blank"
          rel="noreferrer"
          className="text-primary underline decoration-primary/40 underline-offset-2"
        >
          {linkMatch[1]}
        </a>
      )
    }

    return <Fragment key={index}>{token}</Fragment>
  })
}

function MarkdownText({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, '\n').split('\n')
  const nodes: React.ReactNode[] = []

  let paragraph: string[] = []
  let listItems: { ordered: boolean; items: string[] } | null = null
  let codeLines: string[] | null = null
  let codeLang = ''

  const flushParagraph = () => {
    if (paragraph.length === 0) {
      return
    }
    nodes.push(
      <p key={`p-${nodes.length}`} className="whitespace-pre-wrap break-words text-[13px] leading-5 text-foreground">
        {renderInlineMarkdown(paragraph.join(' '))}
      </p>
    )
    paragraph = []
  }

  const flushList = () => {
    if (!listItems || listItems.items.length === 0) {
      listItems = null
      return
    }

    const Tag = listItems.ordered ? 'ol' : 'ul'
    nodes.push(
      <Tag
        key={`list-${nodes.length}`}
        className={cn(
          'space-y-1 text-[13px] leading-5 text-foreground',
          listItems.ordered ? 'list-decimal pl-5' : 'list-disc pl-5'
        )}
      >
        {listItems.items.map((item, index) => (
          <li key={index}>{renderInlineMarkdown(item)}</li>
        ))}
      </Tag>
    )
    listItems = null
  }

  const flushCode = () => {
    if (!codeLines) {
      return
    }
    nodes.push(
      <pre key={`code-${nodes.length}`} className="overflow-x-auto rounded-2xl bg-muted px-4 py-3 text-[12px] leading-5 text-foreground">
        <code className="font-mono">
          {codeLang ? <span className="mb-2 block text-[11px] uppercase tracking-wide text-muted-foreground">{codeLang}</span> : null}
          {codeLines.join('\n')}
        </code>
      </pre>
    )
    codeLines = null
    codeLang = ''
  }

  for (const rawLine of lines) {
    const line = rawLine.trimEnd()
    const fence = line.match(/^```(\w+)?\s*$/)

    if (fence) {
      if (codeLines) {
        flushCode()
      } else {
        flushParagraph()
        flushList()
        codeLines = []
        codeLang = fence[1] ?? ''
      }
      continue
    }

    if (codeLines) {
      codeLines.push(rawLine)
      continue
    }

    if (!line.trim()) {
      flushParagraph()
      flushList()
      continue
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/)
    if (heading) {
      flushParagraph()
      flushList()
      const level = heading[1].length
      const headingClassName = cn(
        'font-semibold tracking-tight text-foreground',
        level === 1 && 'text-xl',
        level === 2 && 'text-lg',
        level >= 3 && 'text-base'
      )
      nodes.push(
        level === 1 ? (
          <h1 key={`h-${nodes.length}`} className={headingClassName}>
            {renderInlineMarkdown(heading[2])}
          </h1>
        ) : level === 2 ? (
          <h2 key={`h-${nodes.length}`} className={headingClassName}>
            {renderInlineMarkdown(heading[2])}
          </h2>
        ) : level === 3 ? (
          <h3 key={`h-${nodes.length}`} className={headingClassName}>
            {renderInlineMarkdown(heading[2])}
          </h3>
        ) : level === 4 ? (
          <h4 key={`h-${nodes.length}`} className={headingClassName}>
            {renderInlineMarkdown(heading[2])}
          </h4>
        ) : level === 5 ? (
          <h5 key={`h-${nodes.length}`} className={headingClassName}>
            {renderInlineMarkdown(heading[2])}
          </h5>
        ) : (
          <h6 key={`h-${nodes.length}`} className={headingClassName}>
            {renderInlineMarkdown(heading[2])}
          </h6>
        )
      )
      continue
    }

    const quote = line.match(/^>\s+(.*)$/)
    if (quote) {
      flushParagraph()
      flushList()
      nodes.push(
        <blockquote
          key={`q-${nodes.length}`}
          className="border-l-2 border-primary/40 pl-4 text-[13px] leading-5 text-muted-foreground"
        >
          {renderInlineMarkdown(quote[1])}
        </blockquote>
      )
      continue
    }

    const unordered = line.match(/^[-*+]\s+(.*)$/)
    if (unordered) {
      flushParagraph()
      if (!listItems || listItems.ordered) {
        flushList()
        listItems = { ordered: false, items: [] }
      }
      listItems.items.push(unordered[1])
      continue
    }

    const ordered = line.match(/^\d+\.\s+(.*)$/)
    if (ordered) {
      flushParagraph()
      if (!listItems || !listItems.ordered) {
        flushList()
        listItems = { ordered: true, items: [] }
      }
      listItems.items.push(ordered[1])
      continue
    }

    flushList()
    paragraph.push(line)
  }

  flushParagraph()
  flushList()
  flushCode()

  return nodes.length > 0 ? nodes : [renderInlineMarkdown(content)]
}

function resolveText(component: A2UIComponent, data: Record<string, unknown>) {
  const props = readRecord(component.props)
  const dataKey = asString(props.dataKey)
  if (dataKey && data[dataKey] !== undefined && data[dataKey] !== null) {
    return asString(data[dataKey])
  }

  return asString(props.content ?? props.text ?? props.title)
}

function renderRows(value: unknown) {
  return readArray(value).map((row) => readRecord(row))
}

function TableNode({ component }: { component: A2UIComponent }) {
  const props = readRecord(component.props)
  const columns = readArray(props.columns).map((column, index) => {
    const item = readRecord(column)
    return {
      key: asString(item.key) || `column-${index}`,
      label: asString(item.label) || `列 ${index + 1}`,
      align: item.align === 'right' || item.align === 'center' ? item.align : 'left',
    }
  })
  const rows = renderRows(props.rows)

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="text-sm font-medium text-foreground">{asString(props.title) || '表格'}</div>
        {asString(props.description) ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{asString(props.description)}</p>
        ) : null}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border-separate border-spacing-0 text-xs md:text-sm">
          <thead>
            <tr className="bg-muted/40">
              {columns.map((column) => (
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
            {rows.map((row, rowIndex) => (
              <tr key={`${asString(props.title) || 'table'}-${rowIndex}`} className="odd:bg-background even:bg-muted/20">
                {columns.map((column) => (
                  <td
                    key={column.key}
                    className={cn(
                      'whitespace-nowrap border-b border-border/40 px-4 py-2 text-muted-foreground',
                      column.align === 'right' && 'text-right',
                      column.align === 'center' && 'text-center'
                    )}
                  >
                    {asString(row[column.key]) || '—'}
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

function buildChartData(component: A2UIComponent) {
  const props = readRecord(component.props)
  const labels = readArray(props.labels).map(asString)
  const chartType = props.chartType === 'line' || props.chartType === 'pie' ? props.chartType : 'bar'

  return {
    chartType,
    labels,
    datasets: readArray(props.datasets).map((dataset, index) => {
      const item = readRecord(dataset)
      const paletteColor = chartPalette[index % chartPalette.length]
      return {
        label: asString(item.label) || '数据',
        data: readArray(item.data).map((value) => Number(value)).filter((value) => Number.isFinite(value)),
        backgroundColor:
          item.backgroundColor ??
          (chartType === 'pie'
            ? labels.map((_, labelIndex) => chartPalette[labelIndex % chartPalette.length])
            : paletteColor),
        borderColor: item.borderColor ?? paletteColor,
        borderWidth: chartType === 'pie' ? 1 : 2,
        fill: typeof item.fill === 'boolean' ? item.fill : chartType === 'line',
        tension: chartType === 'line' ? 0.35 : 0,
      }
    }),
  }
}

function ChartNode({ component }: { component: A2UIComponent }) {
  const data = useMemo(() => buildChartData(component), [component])
  const options = useMemo<ChartOptions<'bar' | 'line' | 'pie'>>(() => {
    const base = {
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

    if (data.chartType === 'pie') {
      return base
    }

    return {
      ...base,
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
  }, [data.chartType])

  const chartNode =
    data.chartType === 'line' ? (
      <Line data={data as ChartData<'line', number[], string>} options={options as ChartOptions<'line'>} />
    ) : data.chartType === 'pie' ? (
      <Pie data={data as ChartData<'pie', number[], string>} options={options as ChartOptions<'pie'>} />
    ) : (
      <Bar data={data as ChartData<'bar', number[], string>} options={options as ChartOptions<'bar'>} />
    )

  const props = readRecord(component.props)

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-background/70">
      <div className="border-b border-border/60 px-4 py-3">
        <div className="text-sm font-medium text-foreground">{asString(props.title) || '图表'}</div>
        {asString(props.description) ? (
          <p className="mt-1 text-xs leading-5 text-muted-foreground">{asString(props.description)}</p>
        ) : null}
      </div>
      <div className={cn('px-4 py-4', data.chartType === 'pie' ? 'h-72' : 'h-80')}>{chartNode}</div>
    </div>
  )
}

function renderNode(
  componentId: string,
  components: Record<string, A2UIComponent>,
  data: Record<string, unknown>
): React.ReactNode {
  const component = components[componentId]
  if (!component) {
    return null
  }

  const props = readRecord(component.props)
  const children = (component.children ?? []).map((childId) => renderNode(childId, components, data)).filter(Boolean)
  const title = asString(props.title)
  const description = asString(props.description)

  if (component.type === 'text') {
    const text = resolveText(component, data)
    if (text.trim().length === 0 && !title && !description) {
      return null
    }

    return (
      <div className="space-y-1">
        {title ? <div className="text-sm font-medium text-foreground">{title}</div> : null}
        {description ? <div className="text-xs leading-5 text-muted-foreground">{description}</div> : null}
        {text.trim().length > 0 ? <div className="space-y-2">{<MarkdownText content={text} />}</div> : null}
      </div>
    )
  }

  if (component.type === 'table') {
    return <TableNode component={component} />
  }

  if (component.type === 'chart') {
    return <ChartNode component={component} />
  }

  const containerClass =
    component.type === 'row'
      ? 'flex flex-row flex-wrap gap-3'
      : component.type === 'column'
        ? 'flex flex-col gap-3'
        : 'space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4'

  if (children.length === 0 && !title && !description && component.type !== 'card') {
    return null
  }

  return (
    <div className={containerClass}>
      {title || description ? (
        <div className="space-y-1">
          {title ? <div className="text-sm font-medium text-foreground">{title}</div> : null}
          {description ? <div className="text-xs leading-5 text-muted-foreground">{description}</div> : null}
        </div>
      ) : null}
      {children.length > 0 ? <div className={component.type === 'row' ? 'contents' : 'space-y-3'}>{children}</div> : null}
    </div>
  )
}

export function ChatMessageContent({ surface }: { surface: A2UISurfaceView }) {
  return <div className="space-y-3">{renderNode(surface.rootComponentId, surface.components, surface.data)}</div>
}
