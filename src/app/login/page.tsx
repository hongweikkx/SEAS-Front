'use client'

import { useState } from 'react'
import { GraduationCap, Lock, Mail, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LoginPage() {
  const [mode, setMode] = useState<'password' | 'wechat'>('password')

  return (
    <div className="fixed inset-0 flex bg-background">
      {/* 左侧：意境图/功能介绍 */}
      <div className="relative hidden w-1/2 bg-[#1E3A8A] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(6,182,212,0.15),transparent_50%)]" />
        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold text-white">SEAS</span>
          </div>
        </div>
        <div className="relative space-y-6">
          <h1 className="text-4xl font-bold leading-tight text-white">
            智能成绩分析
            <br />
            让教学更高效
          </h1>
          <div className="space-y-4 text-white/70">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>AI 驱动的成绩诊断与洞察</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>多维度的班级与学科对比</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>自动化的临界生识别与追踪</span>
            </div>
          </div>
        </div>
        <div className="relative text-sm text-white/40">
          SEAS Student Evaluation & Analysis System
        </div>
      </div>

      {/* 右侧：登录表单 */}
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold text-foreground">欢迎回来</h2>
            <p className="mt-1 text-sm text-muted-foreground">登录您的 SEAS 账户</p>
          </div>

          {/* 切换按钮 */}
          <div className="flex rounded-xl bg-muted p-1">
            <button
              onClick={() => setMode('password')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'password'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                密码登录
              </span>
            </button>
            <button
              onClick={() => setMode('wechat')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all ${
                mode === 'wechat'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <span className="flex items-center justify-center gap-2">
                <MessageCircle className="h-4 w-4" />
                微信扫码
              </span>
            </button>
          </div>

          {/* 密码登录 */}
          {mode === 'password' && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">邮箱 / 用户名</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" placeholder="请输入邮箱或用户名" />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">密码</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input className="pl-10" type="password" placeholder="请输入密码" />
                </div>
              </div>
              <Button className="w-full rounded-xl">登录</Button>
            </div>
          )}

          {/* 微信扫码 */}
          {mode === 'wechat' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex h-48 w-48 items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-muted/50">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30" />
              </div>
              <p className="text-sm text-muted-foreground">请使用微信扫描二维码登录</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
