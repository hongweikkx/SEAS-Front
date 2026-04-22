'use client'

import { useState } from 'react'
import { FileUploadZone } from '@/components/create/FileUploadZone'
import { Button } from '@/components/ui/button'
import { Zap, FileDown, HelpCircle } from 'lucide-react'

export default function CreatePage() {
  const [hasFile, setHasFile] = useState(false)

  return (
    <div className="flex gap-8"
    >
      {/* 左侧主内容 */}
      <div className="flex-1 min-w-0"
      >
        <FileUploadZone onFileSelect={() => setHasFile(true)} />

        {hasFile && (
          <div className="mt-6 flex justify-end"
          >
            <Button className="rounded-lg gap-2"
            >
              <Zap className="h-4 w-4" />
              生成分析
            </Button>
          </div>
        )}
      </div>

      {/* 右侧辅助卡片 */}
      <div className="w-72 shrink-0 space-y-4"
      >
        {/* 准备好了吗？ */}
        <div className="rounded-xl bg-primary p-5 text-primary-foreground"
        >
          <h3 className="text-base font-semibold mb-2"
          >准备好了吗？</h3>
          <p className="text-sm opacity-90 leading-relaxed mb-4"
          >
            AI 引擎将自动识别报表中的成绩数据、老师评语以及学科分布，并生成可视化报告。
          </p>
          <Button
            variant="secondary"
            className="w-full rounded-lg gap-2 bg-white text-primary hover:bg-white/90"
          >
            <Zap className="h-4 w-4" />
            生成分析
          </Button>
        </div>

        {/* 辅助工具 */}
        <div className="rounded-xl border border-border/60 bg-card p-5"
        >
          <h3 className="text-sm font-semibold text-foreground mb-3"
          >辅助工具</h3>
          <div className="space-y-2"
          >
            <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2"
              >
                <FileDown className="h-4 w-4 text-muted-foreground" />
                下载模板报表
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
            <button className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm text-foreground transition-colors hover:bg-muted"
            >
              <span className="flex items-center gap-2"
              >
                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                查看上传指南
              </span>
              <span className="text-muted-foreground">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
