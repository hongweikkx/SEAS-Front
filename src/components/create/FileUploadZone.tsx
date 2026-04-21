'use client'

import { useCallback, useState } from 'react'
import { Upload, FileSpreadsheet, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface FileUploadZoneProps {
  onFileSelect?: (file: File) => void
}

export function FileUploadZone({ onFileSelect }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

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
      const file = e.dataTransfer.files[0]
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv'))) {
        setSelectedFile(file)
        onFileSelect?.(file)
      }
    },
    [onFileSelect]
  )

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) {
        setSelectedFile(file)
        onFileSelect?.(file)
      }
    },
    [onFileSelect]
  )

  const clearFile = () => {
    setSelectedFile(null)
  }

  if (selectedFile) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-card-blue p-6 shadow-card-blue">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <button
            onClick={clearFile}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        'relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-12 transition-all',
        isDragging
          ? 'border-primary bg-primary/5 shadow-card-blue'
          : 'border-border/60 bg-card/60 hover:border-primary/40 hover:bg-card-blue'
      )}
    >
      <input
        type="file"
        accept=".xlsx,.csv"
        onChange={handleFileInput}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
        <Upload className="h-8 w-8 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-base font-medium text-foreground">拖拽文件到此处上传</p>
        <p className="mt-1 text-sm text-muted-foreground">或点击选择文件</p>
        <p className="mt-2 text-xs text-muted-foreground/70">支持 .xlsx 和 .csv 格式</p>
      </div>
    </div>
  )
}
