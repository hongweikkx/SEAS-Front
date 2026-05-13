'use client'

import { useState, useCallback } from 'react'

export type SortDirection = 'asc' | 'desc' | null

export interface SortState {
  column: string | null
  direction: SortDirection
}

export interface UseTableSortOptions {
  defaultSort?: { column: string; direction: 'asc' | 'desc' }
}

export function useTableSort(options?: UseTableSortOptions) {
  const [sortState, setSortState] = useState<SortState>({
    column: options?.defaultSort?.column ?? null,
    direction: options?.defaultSort?.direction ?? null,
  })

  const toggleSort = useCallback((column: string) => {
    setSortState((prev) => {
      if (prev.column !== column) {
        return { column, direction: 'asc' as const }
      }
      if (prev.direction === 'asc') {
        return { column, direction: 'desc' as const }
      }
      return { column: null, direction: null }
    })
  }, [])

  const sortedData = useCallback(
    <T,>(
      data: T[],
      getValue?: (item: T, column: string) => number | string | null | undefined
    ): T[] => {
      if (!sortState.column || !sortState.direction) return data

      return [...data].sort((a, b) => {
        const valA = getValue
          ? getValue(a, sortState.column!)
          : (a as Record<string, unknown>)[sortState.column!] as number | string | null | undefined
        const valB = getValue
          ? getValue(b, sortState.column!)
          : (b as Record<string, unknown>)[sortState.column!] as number | string | null | undefined

        if (valA == null && valB == null) return 0
        if (valA == null) return 1
        if (valB == null) return -1

        let result = 0
        if (typeof valA === 'number' && typeof valB === 'number') {
          result = valA - valB
        } else {
          result = String(valA).localeCompare(String(valB), 'zh-CN', { numeric: true })
        }

        return sortState.direction === 'asc' ? result : -result
      })
    },
    [sortState]
  )

  return { sortState, toggleSort, sortedData }
}
