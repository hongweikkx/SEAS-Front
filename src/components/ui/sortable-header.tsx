import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { SortState } from '@/hooks/useTableSort'

interface SortableHeaderProps {
  columnKey: string
  label: string
  align?: 'left' | 'right' | 'center'
  sortable?: boolean
  sortState: SortState
  onSort: (columnKey: string) => void
  className?: string
  rowSpan?: number
  colSpan?: number
}

export function SortableHeader({
  columnKey,
  label,
  align = 'left',
  sortable = true,
  sortState,
  onSort,
  className,
  rowSpan,
  colSpan,
}: SortableHeaderProps) {
  const isActive = sortState.column === columnKey
  const direction = sortState.direction

  const alignClass = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
  }[align]

  return (
    <th
      rowSpan={rowSpan}
      colSpan={colSpan}
      className={cn(
        'group/th font-medium text-muted-foreground whitespace-nowrap',
        alignClass,
        sortable && 'cursor-pointer select-none',
        isActive && 'bg-muted/50',
        className
      )}
      onClick={() => sortable && onSort(columnKey)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortable && (
          <span
            className={cn(
              'inline-flex w-3.5 h-3.5 items-center justify-center transition-opacity',
              isActive ? 'opacity-100' : 'opacity-0 group-hover/th:opacity-100'
            )}
          >
            {isActive ? (
              direction === 'asc' ? (
                <ArrowUp className="h-3.5 w-3.5 text-primary" />
              ) : (
                <ArrowDown className="h-3.5 w-3.5 text-primary" />
              )
            ) : (
              <ChevronsUpDown className="h-3.5 w-3.5 text-muted-foreground/40" />
            )}
          </span>
        )}
      </span>
    </th>
  )
}
