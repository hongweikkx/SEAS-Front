import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const isDev = process.env.NODE_ENV === 'development'

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value
  const { pathname } = request.nextUrl
  const isLoginPage = pathname === '/login'

  // 开发环境未登录时自动注入 mock token，绕过微信登录
  if (isDev && !token) {
    const response = NextResponse.next()
    response.cookies.set('token', 'dev-mock-token', {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 天
    })
    return response
  }

  // 未登录且访问非登录页 -> 重定向到登录页
  if (!token && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 已登录且访问登录页 -> 重定向到首页
  if (token && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
}
