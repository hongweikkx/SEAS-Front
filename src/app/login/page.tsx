'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { GraduationCap, RefreshCw, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  requestLoginCode,
  createLoginSSE,
  setToken,
  type LoginStatus,
} from '@/services/auth'

export default function LoginPage() {
  const [code, setCode] = useState<string>('')
  const [qrUrl, setQrUrl] = useState<string>('')
  const [countdown, setCountdown] = useState<number>(300)
  const [loginStatus, setLoginStatus] = useState<LoginStatus['status']>('waiting')
  const [error, setError] = useState<string>('')
  const esRef = useRef<EventSource | null>(null)

  const startLogin = useCallback(async () => {
    setError('')
    setLoginStatus('waiting')
    setCountdown(300)

    // 关闭之前的 SSE
    if (esRef.current) {
      esRef.current.close()
    }

    try {
      const resp = await requestLoginCode()
      setCode(resp.code)
      setQrUrl(resp.qrUrl)

      // 建立 SSE 连接
      const es = createLoginSSE(
        resp.code,
        (status) => {
          setLoginStatus(status.status)
          if (status.status === 'success' && status.token) {
            setToken(status.token)
            // 延迟跳转，让用户看到成功提示
            setTimeout(() => {
              window.location.href = '/'
            }, 800)
          }
        },
        () => {
          setError('连接失败，请刷新重试')
        }
      )
      esRef.current = es
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取验证码失败')
    }
  }, [])

  // 倒计时
  useEffect(() => {
    if (loginStatus !== 'waiting' || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [loginStatus, countdown])

  // 页面加载时自动开始
  const didStartRef = useRef(false)
  useEffect(() => {
    if (didStartRef.current) return
    didStartRef.current = true
    queueMicrotask(() => startLogin())
    return () => {
      if (esRef.current) {
        esRef.current.close()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      {/* 顶部品牌栏 */}
      <div className="flex h-16 items-center px-8">
        <div className="flex items-center gap-2.5 text-sm">
          <GraduationCap className="h-[18px] w-[18px] text-primary" />
          <span className="font-bold text-foreground">SEAS</span>
          <span className="text-border">|</span>
          <span className="text-muted-foreground">智能学业分析系统</span>
        </div>
      </div>

      {/* 中央登录卡片 */}
      <div className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8 shadow-sm">
          <div className="flex flex-col items-center text-center">
            {/* 图标 */}
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
              <GraduationCap className="h-6 w-6 text-primary" />
            </div>

            <h2 className="text-xl font-semibold text-foreground">欢迎回来</h2>
            <p className="mt-1 text-sm text-muted-foreground">微信扫码关注，回复验证码登录</p>

            {/* 状态显示 */}
            {loginStatus === 'waiting' && (
              <>
                {/* 二维码区域 */}
                <div className="mt-6 flex h-48 w-48 items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/30 overflow-hidden">
                  {qrUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qrUrl} alt="公众号二维码" className="h-full w-full object-contain" />
                  ) : (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  )}
                </div>

                {/* 验证码显示 */}
                {code && (
                  <div className="mt-4">
                    <p className="text-xs text-muted-foreground mb-1">请在公众号回复以下验证码</p>
                    <div className="text-3xl font-bold tracking-[0.3em] text-primary font-mono">
                      {code}
                    </div>
                  </div>
                )}

                {/* 倒计时 */}
                {countdown > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    有效期剩余 {formatTime(countdown)}
                  </p>
                )}
                {countdown === 0 && (
                  <p className="mt-2 text-xs text-destructive">验证码已过期</p>
                )}
              </>
            )}

            {loginStatus === 'success' && (
              <div className="mt-8 flex flex-col items-center gap-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-foreground">登录成功</p>
                <p className="text-xs text-muted-foreground">正在跳转...</p>
              </div>
            )}

            {loginStatus === 'expired' && (
              <div className="mt-8">
                <p className="text-sm text-destructive">验证码已过期</p>
              </div>
            )}

            {/* 错误提示 */}
            {error && (
              <p className="mt-3 text-xs text-destructive">{error}</p>
            )}

            {/* 刷新按钮 */}
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-lg gap-2"
              onClick={startLogin}
              disabled={loginStatus === 'success'}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              {code ? '刷新验证码' : '重新获取'}
            </Button>
          </div>
        </div>
      </div>

      {/* 底部版权 */}
      <div className="flex h-14 items-center justify-between px-8 text-xs text-muted-foreground">
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
