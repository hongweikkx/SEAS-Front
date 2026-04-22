'use client'

import { useState } from 'react'
import { GraduationCap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  const [qrKey, setQrKey] = useState(0)

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* 顶部品牌栏 */}
      <div className="flex h-16 items-center px-8"
      >
        <div className="flex items-center gap-2.5 text-sm"
        >
          <GraduationCap className="h-[18px] w-[18px] text-primary" />
          <span className="font-bold text-foreground"
          >SEAS</span>
          <span className="text-border"
          >|</span>
          <span className="text-muted-foreground"
          >智能学业分析系统</span>
        </div>
      </div>

      {/* 中央登录卡片 */}
      <div className="flex flex-1 items-center justify-center px-6"
      >
        <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-sm"
        >
          <div className="flex flex-col items-center text-center"
          >
            {/* 图标 */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4"
            >
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>

            <h2 className="text-xl font-semibold text-foreground"
            >欢迎回来</h2>
            <p className="mt-1 text-sm text-muted-foreground"
            >驱动数据，成就卓越学业</p>

            {/* 二维码区域 */}
            <div className="mt-6 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/30"
            >
              <div className="text-center"
              >
                <div className="text-4xl mb-2">📱</div>
                <p className="text-xs text-muted-foreground">二维码加载中...</p>
              </div>
            </div>

            <p className="mt-4 text-sm font-medium text-foreground"
            >微信扫码安全登录</p>
            <p className="mt-0.5 text-xs text-muted-foreground"
            >请使用手机微信扫描上方二维码</p>

            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg gap-2"
              onClick={() => setQrKey((k) => k + 1)}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              刷新二维码
            </Button>
          </div>
        </div>
      </div>

      {/* 底部版权 */}
      <div className="flex h-14 items-center justify-between px-8 text-xs text-muted-foreground"
      >
        <span>© 2024 SEAS 智能学业分析系统</span>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-foreground transition-colors">帮助中心</a>
          <a href="#" className="hover:text-foreground transition-colors">隐私政策</a>
          <a href="#" className="hover:text-foreground transition-colors">服务条款</a>
        </div>
      </div>
    </div>
  )
}
