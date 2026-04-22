'use client'

import { useCallback, useState } from 'react'
import { CloudUpload, FileSpreadsheet, X } from 'lucide-react'
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
      if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.csv') || file.name.endsWith('.pdf'))) {
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
      <div className="rounded-xl border border-primary/20 bg-primary/5 p-5"
      >
        <div className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"
            >
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground"
              >{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground"
              >
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
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
        'relative flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-16 transition-all',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border/60 bg-muted/30 hover:border-primary/40 hover:bg-muted/50'
      )}
    >
      <input
        type="file"
        accept=".xlsx,.csv,.pdf"
        onChange={handleFileInput}
        className="absolute inset-0 cursor-pointer opacity-0"
      />
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10"
      >
        <CloudUpload className="h-7 w-7 text-primary" />
      </div>
      <div className="text-center">
        <p className="text-base font-medium text-foreground"
        >点击或拖拽报表至此处</p>
        <p className="mt-1 text-xs text-muted-foreground"
        >
          支持 PDF, Excel (XLSX) 格式，单个文件最大 20MB
        </p>
      </div>
    </div>
  )
}
