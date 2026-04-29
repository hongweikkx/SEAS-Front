'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { FileUploadZone } from '@/components/create/FileUploadZone'
import { Button } from '@/components/ui/button'
import { Zap, CheckCircle, AlertTriangle } from 'lucide-react'
import { downloadSimpleTemplate, downloadFullTemplate } from '@/lib/templates'
import { parseExamExcel, type ParseResult } from '@/lib/excel-parser'
import { createExam, importScores, updateSubjectFullScores } from '@/services/examImport'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export default function CreatePage() {
  const router = useRouter()
  const [file, setFile] = useState<File | null>(null)
  const [parseResult, setParseResult] = useState<ParseResult | null>(null)
  const [parseError, setParseError] = useState<string | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [subjectFullScores, setSubjectFullScores] = useState<Record<string, number>>({})

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setFile(selectedFile)
    setParseError(null)
    setParseResult(null)

    if (!selectedFile.name.endsWith('.xlsx')) {
      setParseError('请上传 Excel (.xlsx) 格式文件')
      return
    }

    if (selectedFile.size > 20 * 1024 * 1024) {
      setParseError('文件过大，请压缩后重新上传（最大 20MB）')
      return
    }

    setIsParsing(true)
    try {
      const arrayBuffer = await selectedFile.arrayBuffer()
      const result = parseExamExcel(arrayBuffer)
      setParseResult(result)
      setSubjectFullScores({ ...result.subjectFullScores })
    } catch (err) {
      setParseError(err instanceof Error ? err.message : '解析失败，请检查文件格式')
    } finally {
      setIsParsing(false)
    }
  }, [])

  const handleClear = useCallback(() => {
    setFile(null)
    setParseResult(null)
    setParseError(null)
    setSubjectFullScores({})
  }, [])

  const handleGenerate = useCallback(async () => {
    if (!file || !parseResult) return

    setIsUploading(true)
    try {
      // 1. 创建考试
      const today = new Date().toISOString().split('T')[0]
      const examName = file.name.replace(/\.xlsx$/i, '')
      const exam = await createExam({ name: examName, examDate: today })

      // 2. 保存满分配置（必须先成功）
      await updateSubjectFullScores(exam.examId, { fullScores: subjectFullScores })

      // 3. 上传成绩文件
      await importScores(exam.examId, file)

      // 4. 跳转到分析页
      router.push(`/exams/${exam.examId}`)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : '上传失败，请稍后重试')
      setIsUploading(false)
    }
  }, [file, parseResult, subjectFullScores, router])

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* 主上传区 */}
      <FileUploadZone
        onFileSelect={handleFileSelect}
        onClear={handleClear}
        file={file}
        isParsing={isParsing}
        parseError={parseError}
      />

      {/* 识别结果 + 满分确认 */}
      {parseResult && (
        <div className="rounded-xl border border-green-200 bg-green-50/50 p-5 dark:border-green-900 dark:bg-green-950/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">
                识别成功
              </h3>
            </div>
            <span className={cn(
              'text-xs px-2 py-0.5 rounded-full font-medium',
              parseResult.mode === 'full'
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
            )}>
              {parseResult.mode === 'full' ? '完整模式' : '简单模式'}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            学生人数：<span className="font-medium text-foreground">{parseResult.students.length} 人</span>
          </p>

          {/* 满分编辑 — 表格样式 */}
          <div className="pt-4 border-t border-green-200/60 dark:border-green-900/40">
            <div className="inline-block rounded-lg border border-green-200 dark:border-green-900 overflow-hidden">
              <div
                className="grid"
                style={{ gridTemplateColumns: `80px repeat(${parseResult.subjects.length + 1}, minmax(72px, 1fr))` }}
              >
                {/* 表头行 */}
                <div className="bg-green-100/60 dark:bg-green-950/30 text-center text-xs text-muted-foreground py-2 px-2"></div>
                {parseResult.subjects.map((subject) => (
                  <div key={`h-${subject}`} className="bg-green-100/60 dark:bg-green-950/30 text-center text-xs font-medium text-foreground py-2 px-1 border-l border-green-200/60 dark:border-green-900/40">
                    {subject}
                  </div>
                ))}
                <div className="bg-green-100/60 dark:bg-green-950/30 text-center text-xs font-medium text-foreground py-2 px-1 border-l border-green-200/60 dark:border-green-900/40">全科</div>

                {/* 数据行：满分 */}
                <div className="bg-green-50/30 dark:bg-green-950/10 text-center text-xs text-muted-foreground py-2 px-2 border-t border-green-200/60 dark:border-green-900/40">满分：</div>
                {parseResult.subjects.map((subject) => (
                  <div key={`v-${subject}`} className="flex items-center justify-center border-l border-t border-green-200/60 dark:border-green-900/40 py-1.5 px-1">
                    <Input
                      type="number"
                      min={1}
                      value={subjectFullScores[subject] ?? 100}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value)
                        if (!isNaN(val) && val > 0) {
                          setSubjectFullScores((prev) => ({ ...prev, [subject]: val }))
                        }
                      }}
                      className="h-7 w-14 text-sm text-center bg-white dark:bg-background px-1"
                    />
                  </div>
                ))}
                <div className="flex items-center justify-center border-l border-t border-green-200/60 dark:border-green-900/40 py-1.5 px-1">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    {parseResult.subjects.reduce((sum, s) => sum + (subjectFullScores[s] ?? 100), 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {parseResult.warnings.length > 0 && (
            <div className="mt-3 space-y-1">
              {parseResult.warnings.map((w, i) => (
                <p key={i} className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {w}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 生成按钮 */}
      {parseResult && (
        <div className="flex justify-end">
          <Button
            className="rounded-lg gap-2"
            onClick={handleGenerate}
            disabled={isUploading}
          >
            <Zap className="h-4 w-4" />
            {isUploading ? '上传中...' : '生成分析'}
          </Button>
        </div>
      )}

      {/* 格式说明 */}
      <div>
        <p className="text-sm font-semibold text-foreground mb-3">
          我们支持的成绩表格式：
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TemplateCard
            mode="简单模式"
            sheets="1 个 Sheet"
            description="只需学生姓名、班级和各科总分，3 分钟填完"
            previewSheet="总成绩"
            previewHeaders={['姓名', '班级', '语文', '数学', '英语']}
            previewRows={[
              ['张三', '一班', '85', '92', '78'],
              ['李四', '二班', '90', '88', '95'],
            ]}
            onDownload={downloadSimpleTemplate}
            capability="生成：学科汇总、班级汇总、四率分析"
            capabilityColor="green"
          />
          <TemplateCard
            mode="完整模式"
            sheets="多 Sheet"
            description="总成绩 + 各科答题明细，支持题目级下钻"
            previewSheet="语文"
            previewHeaders={['姓名', '班级', '题1', '题2', '总分']}
            previewRows={[
              ['张三', '一班', '5', '8', '85'],
              ['李四', '二班', '7', '6', '88'],
            ]}
            extraSheets={['总成绩', '数学']}
            onDownload={downloadFullTemplate}
            capability="额外支持：每题得分分布、错题分析、知识点诊断"
            capabilityColor="blue"
          />
        </div>
      </div>

      {/* 底部提示 */}
      <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex items-start gap-3 dark:border-amber-900 dark:bg-amber-950/20">
        <span className="text-base">💡</span>
        <div>
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            不用担心格式不对
          </p>
          <p className="text-xs text-amber-700/80 dark:text-amber-400/80 mt-0.5">
            系统会自动识别你的表格结构。即使只上传了「简单模式」的成绩表，之后也可以随时到具体科目页面补充上传题目明细。
          </p>
        </div>
      </div>
    </div>
  )
}

// ============ 子组件 ============

interface TemplateCardProps {
  mode: string
  sheets: string
  description: string
  previewSheet: string
  previewHeaders: string[]
  previewRows: string[][]
  extraSheets?: string[]
  onDownload: () => void
  capability: string
  capabilityColor: 'green' | 'blue'
}

function TemplateCard({
  mode,
  sheets,
  description,
  previewSheet,
  previewHeaders,
  previewRows,
  extraSheets,
  onDownload,
  capability,
  capabilityColor,
}: TemplateCardProps) {
  return (
    <div className="rounded-xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={cn(
          'text-[11px] px-1.5 py-0.5 rounded font-semibold',
          mode === '简单模式'
            ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
        )}>
          {mode}
        </span>
        <span className="text-xs text-muted-foreground">{sheets}</span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{description}</p>

      {/* Excel 预览 */}
      <div className="border border-border/80 rounded-md overflow-hidden text-[10px] font-mono">
        <div className="bg-[#217346] text-white px-2.5 py-1 flex items-center gap-1.5">
          <span>📊</span>
          <span className="font-medium">成绩表.xlsx</span>
        </div>
        <div className="bg-muted/40 px-2 py-0.5 flex gap-0.5 border-b border-border/60">
          {mode === '简单模式' ? (
            <span className="bg-white dark:bg-background px-2 py-0.5 rounded-t text-[9px] text-foreground border border-border/60 border-b-0">
              总成绩
            </span>
          ) : (
            <>
              <span className="px-2 py-0.5 text-[9px] text-muted-foreground">总成绩</span>
              <span className="bg-white dark:bg-background px-2 py-0.5 rounded-t text-[9px] text-foreground border border-border/60 border-b-0">
                {previewSheet}
              </span>
              {extraSheets?.filter(s => s !== previewSheet && s !== '总成绩').map(s => (
                <span key={s} className="px-2 py-0.5 text-[9px] text-muted-foreground">{s}</span>
              ))}
              <span className="px-1 py-0.5 text-[9px] text-muted-foreground">+</span>
            </>
          )}
        </div>
        <div className="p-1.5 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-border/50 px-1.5 py-0.5 bg-muted/50 text-muted-foreground w-5"></th>
                {previewHeaders.map((h, i) => (
                  <th
                    key={i}
                    className="border border-border/50 px-1.5 py-0.5 bg-muted/50 text-[9px] font-semibold text-foreground"
                  >
                    {String.fromCharCode(65 + i)}
                  </th>
                ))}
              </tr>
              <tr>
                <td className="border border-border/50 px-1 py-0.5 bg-muted/30 text-[9px] text-muted-foreground text-center">1</td>
                {previewHeaders.map((h, i) => (
                  <td
                    key={i}
                    className="border border-border/50 px-1.5 py-0.5 bg-blue-50/50 dark:bg-blue-950/20 text-[9px] font-semibold text-foreground"
                  >
                    {h}
                  </td>
                ))}
              </tr>
            </thead>
            <tbody>
              {previewRows.map((row, ri) => (
                <tr key={ri}>
                  <td className="border border-border/50 px-1 py-0.5 bg-muted/30 text-[9px] text-muted-foreground text-center">
                    {ri + 2}
                  </td>
                  {row.map((cell, ci) => (
                    <td
                      key={ci}
                      className={cn(
                        'border border-border/50 px-1.5 py-0.5 text-[9px] text-foreground',
                        ci >= 2 && 'text-right'
                      )}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button
        onClick={onDownload}
        className="mt-3 w-full flex items-center justify-center gap-1.5 rounded-md border border-border/60 bg-background px-3 py-2 text-xs text-foreground transition-colors hover:bg-muted"
      >
        <span>📥</span>
        <span>下载{mode}模板</span>
      </button>

      <div className={cn(
        'mt-2 rounded-md px-2.5 py-1.5 text-[11px]',
        capabilityColor === 'green'
          ? 'bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400'
          : 'bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400'
      )}>
        ✅ {capability}
      </div>
    </div>
  )
}
