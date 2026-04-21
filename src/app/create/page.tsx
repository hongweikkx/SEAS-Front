'use client'

import { useState } from 'react'
import { FileUploadZone } from '@/components/create/FileUploadZone'
import { CreateProgress } from '@/components/create/CreateProgress'
import { FieldMapping } from '@/components/create/FieldMapping'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'

export default function CreatePage() {
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [hasFile, setHasFile] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const handleFileSelect = () => {
    setHasFile(true)
  }

  const handleStartMapping = () => {
    if (!hasFile) return
    setStep(2)
  }

  const handleConfirmMapping = () => {
    setStep(3)
    setIsAnalyzing(true)
    // 模拟分析过程
    setTimeout(() => {
      setIsAnalyzing(false)
    }, 3000)
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      {/* 页面标题 */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-foreground">新建成绩分析</h2>
        <p className="mt-1 text-sm text-muted-foreground">三步完成成绩数据导入与分析</p>
      </div>

      {/* 进度指示器 */}
      <CreateProgress currentStep={step} />

      {/* 步骤内容 */}
      <div className="space-y-6">
        {step === 1 && (
          <div className="space-y-4">
            <FileUploadZone onFileSelect={handleFileSelect} />
            {hasFile && (
              <div className="flex justify-end">
                <Button onClick={handleStartMapping}>下一步：字段校准</Button>
              </div>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <FieldMapping onConfirm={handleConfirmMapping} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col items-center justify-center gap-4 py-12">
            {isAnalyzing ? (
              <>
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">AI 正在分析成绩数据...</p>
                  <p className="mt-1 text-sm text-muted-foreground">请稍候，正在生成多维分析报告</p>
                </div>
              </>
            ) : (
              <>
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                  <CheckCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-medium text-foreground">分析完成！</p>
                  <p className="mt-1 text-sm text-muted-foreground">您的成绩分析报告已生成</p>
                </div>
                <Button asChild>
                  <a href="/">返回首页查看</a>
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
