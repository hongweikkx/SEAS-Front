'use client'

import { useCallback, useState } from 'react'
import { CloudUpload, FileSpreadsheet, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadZoneProps {
  file: File | null
  isParsing: boolean
  parseError: string | null
  onFileSelect: (file: File) => void
  onClear: () => void
}

export function FileUploadZone({ file, isParsing, parseError, onFileSelect, onClear }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragging(false)
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile) {
        onFileSelect(droppedFile)
      }
    },
    [onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0]
      if (selectedFile) {
        onFileSelect(selectedFile)
      }
    },
    [onFileSelect]
  )

  return (
    <div className="space-y-3">
      {file ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                {isParsing ? (
                  <Loader2 className="h-5 w-5 text-primary animate-spin" />
                ) : (
                  <FileSpreadsheet className="h-5 w-5 text-primary" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{file.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                  {isParsing && ' · 正在识别...'}
                </p>
              </div>
            </div>
            <button
              onClick={onClear}
              disabled={isParsing}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            'relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-14 transition-all',
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-border/60 bg-muted/30 hover:border-primary/40 hover:bg-muted/50'
          )}
        >
          <input
            type="file"
            accept=".xlsx"
            onChange={handleFileInput}
            className="absolute inset-0 cursor-pointer opacity-0"
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <CloudUpload className="h-7 w-7 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-base font-medium text-foreground">点击或拖拽成绩表至此处</p>
            <p className="mt-1 text-xs text-muted-foreground">
              支持 Excel (.xlsx) 格式，单个文件最大 20MB
            </p>
          </div>
          <div className="flex justify-center gap-2 flex-wrap">
            <span className="bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400 text-[11px] px-2.5 py-1 rounded-full font-medium">
              ✅ 自动识别格式
            </span>
            <span className="bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400 text-[11px] px-2.5 py-1 rounded-full font-medium">
              ✅ 有明细就下钻，没有也不强求
            </span>
            <span className="bg-purple-50 text-purple-700 dark:bg-purple-950/30 dark:text-purple-400 text-[11px] px-2.5 py-1 rounded-full font-medium">
              ✅ 支持多 Sheet
            </span>
          </div>
        </div>
      )}

      {parseError && (
        <div className="rounded-lg border border-red-200 bg-red-50/50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
          {parseError}
        </div>
      )}
    </div>
  )
}
