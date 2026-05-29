import apiClient from './api'

export interface LoginRequestResponse {
  code: string
  qrUrl: string
  expireSeconds: number
}

export interface LoginStatus {
  status: 'waiting' | 'success' | 'expired'
  token?: string
}

function setCookie(name: string, value: string, days = 7) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`
}

function removeCookie(name: string) {
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`
}

/**
 * 请求生成登录验证码
 */
export async function requestLoginCode(): Promise<LoginRequestResponse> {
  return apiClient.post('/auth/login-request', {}) as Promise<LoginRequestResponse>
}

/**
 * 建立 SSE 连接监听登录状态
 */
export function createLoginSSE(
  code: string,
  onStatus: (status: LoginStatus) => void,
  onError?: () => void
): EventSource {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || ''
  const sseUrl = `${apiUrl}/auth/login-sse?code=${code}`

  const es = new EventSource(sseUrl)

  es.addEventListener('status', (event) => {
    try {
      const data = JSON.parse(event.data) as LoginStatus
      onStatus(data)
      if (data.status === 'success' || data.status === 'expired') {
        es.close()
      }
    } catch {
      onError?.()
    }
  })

  es.addEventListener('error', () => {
    onError?.()
  })

  return es
}

/**
 * 登出
 */
export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout', {})
  localStorage.removeItem('token')
  removeCookie('token')
}

/**
 * 获取存储的 token（优先从 cookie 读取，兼容 localStorage）
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )token=([^;]+)'))
  if (match) return decodeURIComponent(match[2])
  return localStorage.getItem('token')
}

/**
 * 设置 token（同时写入 localStorage 和 cookie，供 middleware 读取）
 */
export function setToken(token: string): void {
  localStorage.setItem('token', token)
  setCookie('token', token)
}

/**
 * 检查是否已登录
 */
export function isLoggedIn(): boolean {
  return !!getToken()
}
